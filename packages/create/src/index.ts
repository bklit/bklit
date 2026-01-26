#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { execa } from "execa";
import ora from "ora";
import { checkDockerStatus, setupDockerServices } from "./docker.js";
import { generateEnvFile } from "./env.js";
import { generateDatabasePassword, generateSecrets } from "./generators.js";
import { type PackageManager, askSetupQuestions } from "./prompts.js";

const isWindows = process.platform === "win32";

// Helper to run workspace-specific commands
function getWorkspaceCommand(
  pm: PackageManager,
  workspace: string,
  script: string
): { cmd: string; args: string[] } {
  switch (pm) {
    case "pnpm":
      return { cmd: "pnpm", args: ["-F", workspace, script] };
    case "npm":
      return { cmd: "npm", args: ["run", script, "-w", workspace] };
    case "yarn":
      return { cmd: "yarn", args: ["workspace", workspace, script] };
    case "bun":
      return { cmd: "bun", args: ["run", "--filter", workspace, script] };
    default:
      return { cmd: pm, args: [workspace, script] };
  }
}

const program = new Command();

program
  .name("create")
  .description("Set up Bklit Analytics in under 2 minutes")
  .version("1.0.1")
  .argument("[project-name]", "Name of the project directory")
  .action(async (projectNameArg?: string) => {
    try {
      console.clear();
      console.log(chalk.cyan(`
  _______   ___   ___   __        ________  _________  
/_______/\\ /___/\\/__/\\ /_/\\      /_______/\\/________/\\ 
\\::: _  \\ \\\\::.\\  \\\\ \\ \\\\:\\ \\     \\__.::._\\/\\__.::.__\\/ 
 \\::(_)  \\/_\\:: \\/_) \\ \\\\:\\ \\       \\::\\ \\    \\::\\ \\   
  \\::  _  \\ \\\\:. __  ( ( \\:\\ \\____  _\\::\\ \\__  \\::\\ \\  
   \\::(_)  \\ \\\\: \\ )  \\ \\ \\:\\/___/\\/__\\::\\__/\\  \\::\\ \\ 
    \\_______\\/ \\__\\/\\__\\/  \\_____\\/\\________\\/   \\__\\/ 
`));
      console.log(chalk.gray("        Setup Wizard\n"));

      // Step 1: Ask user preferences (including project name)
      const answers = await askSetupQuestions(projectNameArg);

      // Step 2: Clone the repository
      const cloneSpinner = ora("Cloning Bklit repository...").start();
      try {
        await execa("git", [
          "clone",
          "https://github.com/bklit/bklit.git",
          answers.projectName,
        ]);
        process.chdir(answers.projectName);
        cloneSpinner.succeed(`Repository cloned to ${answers.projectName}`);
      } catch (error: any) {
        cloneSpinner.fail("Failed to clone repository");
        if (error.stderr?.includes("already exists")) {
          console.log(
            chalk.yellow(
              `\nDirectory '${answers.projectName}' already exists. Using existing directory.`
            )
          );
          try {
            process.chdir(answers.projectName);
          } catch {
            console.error(
              chalk.red(`Cannot access directory '${answers.projectName}'`)
            );
            process.exit(1);
          }
        } else {
          console.error(error.message);
          process.exit(1);
        }
      }

      // Step 3: Check prerequisites
      const spinner = ora("Checking prerequisites...").start();

      const nodeVersion = process.version;
      const majorVersion = Number.parseInt(
        nodeVersion.slice(1).split(".")[0],
        10
      );
      const minorVersion = Number.parseInt(
        nodeVersion.slice(1).split(".")[1],
        10
      );

      if (majorVersion < 22) {
        spinner.fail(`Node.js 22+ required (current: ${nodeVersion})`);
        process.exit(1);
      }

      if (majorVersion === 22 && minorVersion < 14) {
        spinner.warn(`Node.js 22.14+ recommended (current: ${nodeVersion})`);
      }

      if (answers.useDocker) {
        spinner.text = "Checking Docker status...";
        const dockerStatus = await checkDockerStatus();

        if (!dockerStatus.installed) {
          spinner.warn("Docker not installed - using manual database setup");
          console.log(
            chalk.gray("   Install Docker: https://docs.docker.com/get-docker/\n")
          );
          answers.useDocker = false;
        } else if (!dockerStatus.running) {
          spinner.warn("Docker is installed but not running");
          console.log(chalk.yellow("\n   Please start Docker Desktop and try again."));
          console.log(chalk.gray("   On macOS/Windows: Open Docker Desktop app"));
          console.log(chalk.gray("   On Linux: sudo systemctl start docker\n"));
          answers.useDocker = false;
        } else if (!dockerStatus.composeAvailable) {
          spinner.warn("Docker Compose not available - using manual database setup");
          answers.useDocker = false;
        }
      }

      spinner.succeed("Prerequisites checked");

      // Step 3: Generate secrets
      spinner.start("Generating secure secrets...");
      const secrets = generateSecrets();
      spinner.succeed("Secrets generated");

      // Step 4: Set up databases
      let databases: {
        postgresUrl: string;
        clickhouseUrl: string;
      };
      if (answers.useDocker) {
        const dbPassword = generateDatabasePassword();
        databases = await setupDockerServices(dbPassword);
      } else {
        spinner.info("Manual database setup - using default URLs");
        databases = {
          postgresUrl: "postgresql://postgres:postgres@localhost:5432/bklit",
          clickhouseUrl: "http://localhost:8123",
        };
      }

      // Step 5: Generate .env file
      spinner.start("Creating .env file...");
      await generateEnvFile({
        secrets,
        databases,
        oauth: answers.setupOAuth
          ? {
              githubClientId: answers.githubClientId,
              githubClientSecret: answers.githubClientSecret,
              googleClientId: answers.googleClientId,
              googleClientSecret: answers.googleClientSecret,
            }
          : undefined,
        billing: answers.setupBilling
          ? {
              polarAccessToken: answers.polarAccessToken,
              polarOrganizationId: answers.polarOrganizationId,
            }
          : undefined,
        email: answers.setupEmail
          ? {
              resendApiKey: answers.resendApiKey,
            }
          : undefined,
      });
      spinner.succeed(".env file created");

      // Step 6: Install dependencies
      const pm = answers.packageManager;
      spinner.start(`Installing dependencies with ${pm} (this may take a minute)...`);
      try {
        await execa(pm, ["install"], {
          stdio: "pipe",
          shell: isWindows,
        });
        spinner.succeed("Dependencies installed");
      } catch (error: any) {
        spinner.fail("Failed to install dependencies");
        console.log(chalk.red("\nError output:"));
        if (error.stderr) {
          console.log(error.stderr);
        }
        if (error.stdout) {
          console.log(error.stdout);
        }
        console.log(
          chalk.yellow(
            `\nTip: Make sure ${pm} is installed globally`
          )
        );
        throw error;
      }

      // Step 7: Generate Prisma client
      spinner.start("Generating Prisma client...");
      try {
        await execa("npx", ["prisma", "generate"], {
          stdio: "pipe",
          shell: isWindows,
        });
        spinner.succeed("Prisma client generated");
      } catch (error: any) {
        spinner.fail("Failed to generate Prisma client");
        console.log(chalk.red("\nError output:"));
        if (error.stderr) {
          console.log(error.stderr);
        }
        if (error.stdout) {
          console.log(error.stdout);
        }
        throw error;
      }

      // Step 8: Set up database schema
      if (answers.useDocker) {
        spinner.start("Setting up database schema...");
        try {
          await execa("npx", ["prisma", "db", "push"], {
            stdio: "pipe",
            shell: isWindows,
            env: { ...process.env, FORCE_COLOR: "0" },
          });
          spinner.succeed("Database schema ready");
        } catch (error: any) {
          spinner.fail("Database schema setup failed");
          console.log(chalk.red("\nError output:"));
          if (error.stderr) {
            console.log(error.stderr);
          }
          if (error.stdout) {
            console.log(error.stdout);
          }
          throw error;
        }

        spinner.start("Setting up ClickHouse tables...");
        try {
          const migrateCmd = getWorkspaceCommand(pm, "@bklit/analytics", "migrate");
          await execa(migrateCmd.cmd, migrateCmd.args, {
            stdio: "pipe",
            shell: isWindows,
            env: { ...process.env, FORCE_COLOR: "0" },
          });
          spinner.succeed("ClickHouse tables ready");
        } catch (error: any) {
          spinner.fail("ClickHouse setup failed");
          console.log(chalk.red("\nError output:"));
          if (error.stderr) {
            console.log(error.stderr);
          }
          if (error.stdout) {
            console.log(error.stdout);
          }
          throw error;
        }
      }

      // Step 9: Success!
      console.log(chalk.green.bold("\n✨ Setup complete!\n"));

      console.log(chalk.cyan("Your Bklit instance is ready!\n"));

      // Show important info about email/OAuth setup
      if (!answers.setupEmail) {
        console.log(chalk.yellow("📧 Email Configuration:"));
        console.log(
          chalk.white("   You skipped email setup. In development mode:")
        );
        console.log(
          chalk.cyan("   • Login OTP codes will appear in your terminal")
        );
        console.log(
          chalk.cyan("   • Welcome emails will be logged (not sent)")
        );
        console.log(
          chalk.gray(
            "   • Add RESEND_API_KEY to .env later to send real emails\n"
          )
        );
      }

      if (!(answers.setupOAuth || answers.setupEmail)) {
        console.log(chalk.yellow("🔐 Authentication:"));
        console.log(
          chalk.white(
            "   Email authentication is enabled (magic links via OTP)"
          )
        );
        console.log(chalk.cyan("   • OTP codes will display in your terminal"));
        console.log(
          chalk.gray("   • Add OAuth providers later for GitHub/Google login\n")
        );
      }

      if (!answers.setupBilling) {
        console.log(chalk.yellow("💳 Billing:"));
        console.log(
          chalk.white("   Billing is disabled (all users have free tier)")
        );
        console.log(
          chalk.gray(
            "   • Add Polar.sh credentials later to enable paid plans\n"
          )
        );
      }

      console.log(chalk.white.bold("Next steps:\n"));

      if (answers.runDev) {
        console.log(chalk.yellow("Starting development server...\n"));
        console.log(
          chalk.cyan("💡 IMPORTANT: Watch this terminal for login codes!\n")
        );
        const devCmd = pm === "npm" ? ["run", "dev"] : ["dev"];
        await execa(pm, devCmd, {
          stdio: "inherit",
          shell: isWindows,
        });
      } else {
        const devCommand = pm === "npm" ? `${pm} run dev` : `${pm} dev`;
        console.log(chalk.white("  1. Start development server:"));
        console.log(chalk.cyan(`     ${devCommand}\n`));
        console.log(chalk.white("  2. Open your browser:"));
        console.log(chalk.cyan("     http://localhost:3000\n"));
        console.log(chalk.white("  3. Create your first account!"));
        console.log(
          chalk.yellow("     💡 Watch your terminal for the OTP code\n")
        );
      }

      console.log(chalk.gray("Documentation: https://docs.bklit.com"));
      console.log(chalk.gray("Discord: https://discord.gg/9yyK8FwPcU\n"));
    } catch (error) {
      console.error(chalk.red("\n✗ Setup failed"));
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
