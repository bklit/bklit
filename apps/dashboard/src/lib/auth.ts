import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/server";

export const authenticated = async (options?: { callbackUrl?: string }) => {
  const { callbackUrl } = options ?? {};

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect(
      callbackUrl
        ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/signin"
    );
  }

  return session;
};
