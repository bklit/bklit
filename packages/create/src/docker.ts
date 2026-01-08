import fs from "node:fs/promises";
import { execa } from "execa";
import ora from "ora";

export async function isDockerAvailable(): Promise<boolean> {
  try {
    await execa("docker", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

export async function isDockerComposeAvailable(): Promise<boolean> {
  try {
    await execa("docker", ["compose", "version"]);
    return true;
  } catch {
    return false;
  }
}

export async function setupDockerServices(dbPassword: string): Promise<{
  postgresUrl: string;
  clickhouseUrl: string;
}> {
  const spinner = ora("Starting Docker services...").start();

  try {
    // Generate docker-compose.yml
    const composeContent = generateDockerCompose(dbPassword);
    await fs.writeFile("docker-compose.yml", composeContent);

    // Stop and remove any existing containers and volumes
    try {
      await execa("docker", ["compose", "down", "-v"], { stdio: "ignore" });
    } catch {
      // Ignore errors if no existing containers
    }

    // Remove any containers with our names (in case from different compose file)
    try {
      await execa(
        "docker",
        ["rm", "-f", "bklit-postgres", "bklit-clickhouse"],
        { stdio: "ignore" }
      );
    } catch {
      // Ignore if containers don't exist
    }

    // Start fresh services
    try {
      await execa("docker", ["compose", "up", "-d"]);
    } catch (error: any) {
      // Show actual Docker error
      spinner.fail("Failed to start Docker services");
      if (error.stderr) {
        console.error("\nDocker error:");
        console.error(error.stderr);
      }
      throw new Error(
        "Docker compose failed. Try running: docker compose down -v && docker system prune -f"
      );
    }

    spinner.succeed("Docker services started");

    // Wait for services to be ready
    spinner.start("Waiting for PostgreSQL to be ready...");
    await waitForPostgres(dbPassword);
    // Give PostgreSQL a moment to fully initialize
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test actual connection with credentials
    await testPostgresConnection(dbPassword);
    spinner.succeed("PostgreSQL is ready");

    spinner.start("Waiting for ClickHouse to be ready (may take up to 60s)...");
    await waitForClickHouse();
    spinner.succeed("ClickHouse is ready");

    return {
      postgresUrl: `postgresql://bklit:${dbPassword}@localhost:5432/bklit`,
      clickhouseUrl: "http://localhost:8123",
    };
  } catch (error) {
    spinner.fail("Failed to start Docker services");
    throw error;
  }
}

function generateDockerCompose(dbPassword: string): string {
  return `
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: bklit-postgres
    environment:
      POSTGRES_USER: bklit
      POSTGRES_PASSWORD: ${dbPassword}
      POSTGRES_DB: bklit
    ports:
      - '5432:5432'
    volumes:
      - bklit-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U bklit']
      interval: 5s
      timeout: 5s
      retries: 5

  clickhouse:
    image: clickhouse/clickhouse-server:24-alpine
    container_name: bklit-clickhouse
    environment:
      CLICKHOUSE_DB: default
      CLICKHOUSE_USER: default
      CLICKHOUSE_PASSWORD: "local_dev_password"
    ports:
      - '8123:8123'
      - '9000:9000'
    volumes:
      - bklit-clickhouse-data:/var/lib/clickhouse
    healthcheck:
      test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:8123/ping']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  bklit-postgres-data:
  bklit-clickhouse-data:
`.trim();
}

async function waitForPostgres(
  _dbPassword: string,
  maxAttempts = 60
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await execa("docker", [
        "exec",
        "bklit-postgres",
        "pg_isready",
        "-U",
        "bklit",
      ]);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(
    "PostgreSQL did not become ready in time. Try: docker compose logs postgres"
  );
}

async function testPostgresConnection(dbPassword: string): Promise<void> {
  // Test actual connection with credentials
  try {
    await execa(
      "docker",
      [
        "exec",
        "bklit-postgres",
        "psql",
        "-U",
        "bklit",
        "-d",
        "bklit",
        "-c",
        "SELECT 1;",
      ],
      {
        env: { PGPASSWORD: dbPassword },
      }
    );
  } catch (_error) {
    throw new Error(
      "PostgreSQL connection test failed. Password might not be set correctly. Try: docker compose logs postgres"
    );
  }
}

async function waitForClickHouse(maxAttempts = 60): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Try HTTP ping directly from host (more reliable than docker exec)
      const fetch = (await import("node:http")).default;

      await new Promise<void>((resolve, reject) => {
        const req = fetch.get("http://localhost:8123/ping", (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Status: ${res.statusCode}`));
          }
        });
        req.on("error", reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });

      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(
    "ClickHouse did not become ready in time. Try: docker compose logs clickhouse"
  );
}
