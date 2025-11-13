import type { ReactElement } from "react";
import { Resend } from "resend";
import { emailEnv } from "../env";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const env = emailEnv();
    const apiKey = env.RESEND_API_KEY;
    
    if (!apiKey || apiKey.trim() === "") {
      const error = new Error(
        "RESEND_API_KEY is not configured. Cannot create Resend client. Please set RESEND_API_KEY environment variable.",
      );
      console.error(error.message);
      // In production, throw error; in development, you might want to allow it
      // but we'll throw to prevent creating invalid client
      throw error;
    }
    
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return getResend()[prop as keyof Resend];
  },
});

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  react?: ReactElement;
}

export async function sendEmail(params: SendEmailParams) {
  const apiKey = emailEnv().RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured. Cannot send email.");
  }

  try {
    const result = await getResend().emails.send({
      from: params.from || "onboarding@resend.dev",
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      cc: params.cc,
      bcc: params.bcc,
      react: params.react,
    });

    if (result.error) {
      throw new Error(
        result.error.message ||
          "Failed to send email. Please check your domain verification in Resend.",
      );
    }

    return {
      success: true,
      id: result.data?.id,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to send email",
    );
  }
}
