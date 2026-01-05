#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { execa } from "execa";
import ora from "ora";
import {
  isDockerAvailable,
  isDockerComposeAvailable,
  setupDockerServices,
} from "./docker.js";
import { generateEnvFile } from "./env.js";
import { generateDatabasePassword, generateSecrets } from "./generators.js";
import { askSetupQuestions } from "./prompts.js";

const program = new Command();

program
  .name("create")
  .description("Set up Bklit Analytics in under 2 minutes")
  .version("1.0.1")
  .action(async () => {
    try {
      console.clear();
      console.log(chalk.cyan.bold("\n┌─────────────────────────────────┐"));
      console.log(chalk.cyan.bold("│  🎯 Bklit Setup Wizard          │"));
      console.log(chalk.cyan.bold("└─────────────────────────────────┘\n"));

      // Step 1: Ask user preferences (including project name)
      const answers = await askSetupQuestions();

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
              `\nDirectory '${answers.projectName}' already exists. Using existing directory.`,
            ),
          );
          try {
            process.chdir(answers.projectName);
          } catch {
            console.error(
              chalk.red(`Cannot access directory '${answers.projectName}'`),
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
        10,
      );
      const minorVersion = Number.parseInt(
        nodeVersion.slice(1).split(".")[1],
        10,
      );

      if (majorVersion < 22) {
        spinner.fail(`Node.js 22+ required (current: ${nodeVersion})`);
        process.exit(1);
      }

      if (majorVersion === 22 && minorVersion < 14) {
        spinner.warn(`Node.js 22.14+ recommended (current: ${nodeVersion})`);
      }

      const dockerAvailable = await isDockerAvailable();
      const dockerComposeAvailable = await isDockerComposeAvailable();

      if (answers.useDocker && (!dockerAvailable || !dockerComposeAvailable)) {
        spinner.warn("Docker not available - using manual database setup");
        answers.useDocker = false;
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
      spinner.start("Installing dependencies (this may take a minute)...");
      await execa("pnpm", ["install"], { stdio: "ignore" });
      spinner.succeed("Dependencies installed");

      // Step 7: Generate Prisma client
      spinner.start("Generating Prisma client...");
      await execa("pnpm", ["db:generate"], { stdio: "ignore" });
      spinner.succeed("Prisma client generated");

      // Step 8: Set up database schema
      if (answers.useDocker) {
        spinner.start("Setting up database schema...");
        try {
          await execa("pnpm", ["db:push"], {
            stdio: "pipe",
            env: { ...process.env, FORCE_COLOR: "0" },
          });
          spinner.succeed("Database schema ready");
        } catch (error: any) {
          spinner.fail("Database schema setup failed");
          console.log(chalk.red("\nError output:"));
          if (error.stderr) console.log(error.stderr);
          if (error.stdout) console.log(error.stdout);
          throw error;
        }

        spinner.start("Setting up ClickHouse tables...");
        try {
          await execa("pnpm", ["-F", "@bklit/analytics", "migrate"], {
            stdio: "pipe",
            env: { ...process.env, FORCE_COLOR: "0" },
          });
          spinner.succeed("ClickHouse tables ready");
        } catch (error: any) {
          spinner.fail("ClickHouse setup failed");
          console.log(chalk.red("\nError output:"));
          if (error.stderr) console.log(error.stderr);
          if (error.stdout) console.log(error.stdout);
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
          chalk.white("   You skipped email setup. In development mode:"),
        );
        console.log(
          chalk.cyan("   • Login OTP codes will appear in your terminal"),
        );
        console.log(
          chalk.cyan("   • Welcome emails will be logged (not sent)"),
        );
        console.log(
          chalk.gray(
            "   • Add RESEND_API_KEY to .env later to send real emails\n",
          ),
        );
      }

      if (!answers.setupOAuth && !answers.setupEmail) {
        console.log(chalk.yellow("🔐 Authentication:"));
        console.log(
          chalk.white(
            "   Email authentication is enabled (magic links via OTP)",
          ),
        );
        console.log(chalk.cyan("   • OTP codes will display in your terminal"));
        console.log(
          chalk.gray(
            "   • Add OAuth providers later for GitHub/Google login\n",
          ),
        );
      }

      if (!answers.setupBilling) {
        console.log(chalk.yellow("💳 Billing:"));
        console.log(
          chalk.white("   Billing is disabled (all users have free tier)"),
        );
        console.log(
          chalk.gray(
            "   • Add Polar.sh credentials later to enable paid plans\n",
          ),
        );
      }

      console.log(chalk.white.bold("Next steps:\n"));

      if (answers.runDev) {
        console.log(chalk.yellow("Starting development server...\n"));
        console.log(
          chalk.cyan("💡 IMPORTANT: Watch this terminal for login codes!\n"),
        );
        await execa("pnpm", ["dev"], { stdio: "inherit" });
      } else {
        console.log(chalk.white("  1. Start development server:"));
        console.log(chalk.cyan("     pnpm dev\n"));
        console.log(chalk.white("  2. Open your browser:"));
        console.log(chalk.cyan("     http://localhost:3000\n"));
        console.log(chalk.white("  3. Create your first account!"));
        console.log(
          chalk.yellow("     💡 Watch your terminal for the OTP code\n"),
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
