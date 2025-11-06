import type { ReactElement } from "react";
import { Resend } from "resend";
import { emailEnv } from "../env";

const env = emailEnv();

export const resend = new Resend(env.RESEND_API_KEY);

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
  try {
    const result = await resend.emails.send({
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
