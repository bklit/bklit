"use server";

import { sendEmail } from "@bklit/email/client";
import { BklitNewProjectEmail } from "@bklit/email/emails/new-project";

interface EmailFormState {
  success: boolean;
  message: string;
  error?: string;
}

export async function testSendEmail(
  _prevState: EmailFormState,
  _formData: FormData,
): Promise<EmailFormState> {
  try {
    const result = await sendEmail({
      to: "mattsince87@gmail.com",
      from: "noreply@bklit.com",
      subject: "Bklit - New Project Created",
      react: BklitNewProjectEmail({ username: "Matt" }),
    });

    return {
      success: true,
      message: `Email sent successfully! ID: ${result.id}`,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      message: "Failed to send email",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
