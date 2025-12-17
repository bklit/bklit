"use client";

import { Button } from "@bklit/ui/components/button";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { GoogleIcon } from "@bklit/ui/icons/google";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { authClient } from "@/auth/client";

function LoginPage() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");
  const invited = searchParams.get("invited") === "true";

  // Build callback URL that preserves invitation parameters
  let callbackUrl = searchParams.get("callbackUrl") || "/";
  if (invited && invitationId) {
    const separator = callbackUrl.includes("?") ? "&" : "?";
    callbackUrl = `${callbackUrl}${separator}invited=true&invitationId=${encodeURIComponent(invitationId)}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-normal">
          Sign up to <span className="font-bold">Bklit</span>
        </h1>
        {invited && (
          <p className="text-sm text-muted-foreground mt-2">
            You've been invited to join a team on Bklit
          </p>
        )}
      </div>
      {invited && (
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-foreground">
            Sign in or create an account to view your invitation
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <Button
          onClick={() =>
            authClient.signIn.social({
              provider: "github",
              callbackURL: callbackUrl,
            })
          }
          size="lg"
          className="w-full gap-2"
          variant="mono"
        >
          <GitHubIcon className="size-5" />
          Continue with GitHub
        </Button>
        <Button
          onClick={() =>
            authClient.signIn.social({
              provider: "google",
              callbackURL: callbackUrl,
            })
          }
          variant="outline"
          size="lg"
          className="w-full gap-2"
        >
          <GoogleIcon className="size-5" />
          Continue with Google
        </Button>
      </div>
      <div className="text-center space-y-2">
        <p className="text-sm font-normal text-muted-foreground">
          By signing up, you agree to our{" "}
          <a
            href="https://bklit.com/terms"
            className="text-card-foreground hover:text-primary transition-all"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://bklit.com/privacy"
            className="text-card-foreground hover:text-primary transition-all"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          .
        </p>
        <p className="text-sm font-normal text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-card-foreground hover:text-primary transition-all"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
