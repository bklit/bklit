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
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const invited = searchParams.get("invited") === "true";

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-normal">
          Log in to <span className="font-bold">Bklit</span>
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
      <div className="text-center">
        <p className="text-sm font-normal text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-card-foreground hover:text-primary transition-all"
          >
            Sign up
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
