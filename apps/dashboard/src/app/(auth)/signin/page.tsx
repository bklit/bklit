"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { GitHubIcon } from "@bklit/ui/icons/github";
import { GoogleIcon } from "@bklit/ui/icons/google";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { authClient } from "@/auth/client";

function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-semibold tracking-tight text-2xl">
            Sign in
          </CardTitle>
          <CardDescription>
            Access your Bklit Analytics dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            onClick={() =>
              authClient.signIn.social({
                provider: "github",
                callbackURL: callbackUrl,
              })
            }
            size="lg"
            className="w-full gap-2"
          >
            <GitHubIcon className="size-5" />
            Sign in with GitHub
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
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
