import chalk from "chalk";
import inquirer from "inquirer";

export interface SetupAnswers {
  projectName: string;
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

export async function askSetupQuestions(): Promise<SetupAnswers> {
  console.log(chalk.cyan("\n🚀 Welcome to Bklit Setup!\n"));
  console.log("Let's get you up and running in under 2 minutes.\n");

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "What would you like to name your project directory?",
      default: "bklit",
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return "Project name cannot be empty";
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
          return "Project name can only contain letters, numbers, hyphens, and underscores";
        }
        return true;
      },
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
    },
  ]);

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
