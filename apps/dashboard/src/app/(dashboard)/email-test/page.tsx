"use client";

import { Button } from "@bklit/ui/components/button";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { testSendEmail } from "@/actions/email-actions";

export default function EmailTestPage() {
  const [state, formAction] = useActionState(testSendEmail, {
    success: false,
    message: "",
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <>
      <h1>Email Test</h1>
      <form action={formAction}>
        <Button type="submit">Send Email</Button>
      </form>
    </>
  );
}
