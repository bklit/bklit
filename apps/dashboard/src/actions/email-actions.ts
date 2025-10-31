"use server";

import { api } from "@/trpc/server";

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
    const result = await api.email.send({
      to: "mattsince87@gmail.com",
      subject: "Bklit - Resend Test Email",
      html: "<p>This is a test email</p>",
      text: "This is a test email",
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
