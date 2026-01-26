import chalk from "chalk";
import { execa } from "execa";
import inquirer from "inquirer";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

async function detectPackageManagers(): Promise<PackageManager[]> {
  const managers: PackageManager[] = [];
  const isWindows = process.platform === "win32";

  const checks: { name: PackageManager; cmd: string }[] = [
    { name: "pnpm", cmd: "pnpm" },
    { name: "npm", cmd: "npm" },
    { name: "yarn", cmd: "yarn" },
    { name: "bun", cmd: "bun" },
  ];

  for (const { name, cmd } of checks) {
    try {
      await execa(cmd, ["--version"], { shell: isWindows });
      managers.push(name);
    } catch {
      // Not installed
    }
  }

  return managers;
}

export interface SetupAnswers {
  projectName: string;
  packageManager: PackageManager;
  useDocker: boolean;
  setupBilling: boolean;
  setupOAuth: boolean;
  setupEmail: boolean;
  runDev: boolean;
  // OAuth fields
  useGitHub?: boolean;
  githubClientId?: string;
  githubClientSecret?: string;
  useGoogle?: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  // Billing fields
  polarAccessToken?: string;
  polarOrganizationId?: string;
  // Email fields
  resendApiKey?: string;
}

export async function askSetupQuestions(
  projectNameArg?: string
): Promise<SetupAnswers> {
  console.log(chalk.cyan("\n🚀 Welcome to Bklit Setup!\n"));
  console.log("Let's get you up and running in under 2 minutes.\n");

  // Detect available package managers
  const availableManagers = await detectPackageManagers();
  if (availableManagers.length === 0) {
    console.log(
      chalk.red(
        "No package manager found. Please install npm, pnpm, yarn, or bun."
      )
    );
    process.exit(1);
  }

  // Default to pnpm if available, otherwise first available
  const defaultManager = availableManagers.includes("pnpm")
    ? "pnpm"
    : availableManagers[0];

  // Validate project name if provided via argument
  const projectNameRegex = /^[a-zA-Z0-9-_]+$/;
  if (projectNameArg && !projectNameRegex.test(projectNameArg)) {
    console.log(
      chalk.red(
        "Project name can only contain letters, numbers, hyphens, and underscores"
      )
    );
    process.exit(1);
  }

  const questions = [];

  // Only ask for project name if not provided as argument
  if (!projectNameArg) {
    questions.push({
      type: "input",
      name: "projectName",
      message: "What would you like to name your project directory?",
      default: "bklit",
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return "Project name cannot be empty";
        }
        if (!projectNameRegex.test(input)) {
          return "Project name can only contain letters, numbers, hyphens, and underscores";
        }
        return true;
      },
    });
  }

  questions.push(
    {
      type: "list",
      name: "packageManager",
      message: "Which package manager would you like to use?",
      choices: availableManagers,
      default: defaultManager,
    },
    {
      type: "confirm",
      name: "useDocker",
      message: "Use Docker for databases? (Recommended for local development)",
      default: true,
    },
    {
      type: "confirm",
      name: "setupBilling",
      message: "Set up billing with Polar.sh? (Optional - can add later)",
      default: false,
    },
    {
      type: "confirm",
      name: "setupOAuth",
      message:
        "Set up OAuth providers (GitHub/Google)? (Optional - email auth works without)",
      default: false,
    },
    {
      type: "confirm",
      name: "setupEmail",
      message:
        "Set up email with Resend? (Optional - console logs work for development)",
      default: false,
    },
    {
      type: "confirm",
      name: "runDev",
      message: "Start development server after setup?",
      default: true,
    }
  );

  const promptAnswers = await inquirer.prompt(questions);

  // Merge with project name from argument if provided
  const answers: SetupAnswers = {
    ...promptAnswers,
    projectName: projectNameArg || promptAnswers.projectName,
  } as SetupAnswers;

  // If they want OAuth, ask for credentials
  if (answers.setupOAuth) {
    const oauthAnswers = await inquirer.prompt([
      {
        type: "confirm",
        name: "useGitHub",
        message: "Enable GitHub OAuth?",
        default: true,
      },
      {
        type: "input",
        name: "githubClientId",
        message: "GitHub Client ID:",
        when: (answers: any) => answers.useGitHub,
      },
      {
        type: "password",
        name: "githubClientSecret",
        message: "GitHub Client Secret:",
        when: (answers: any) => answers.useGitHub,
      },
      {
        type: "confirm",
        name: "useGoogle",
        message: "Enable Google OAuth?",
        default: false,
      },
      {
        type: "input",
        name: "googleClientId",
        message: "Google Client ID:",
        when: (answers: any) => answers.useGoogle,
      },
      {
        type: "password",
        name: "googleClientSecret",
        message: "Google Client Secret:",
        when: (answers: any) => answers.useGoogle,
      },
    ]);
    Object.assign(answers, oauthAnswers);
  }

  // If they want billing, ask for Polar credentials
  if (answers.setupBilling) {
    const billingAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "polarAccessToken",
        message: "Polar Access Token:",
      },
      {
        type: "input",
        name: "polarOrganizationId",
        message: "Polar Organization ID:",
      },
    ]);
    Object.assign(answers, billingAnswers);
  }

  // If they want email, ask for Resend
  if (answers.setupEmail) {
    const emailAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "resendApiKey",
        message: "Resend API Key:",
      },
    ]);
    Object.assign(answers, emailAnswers);
  }

  return answers as SetupAnswers;
}
