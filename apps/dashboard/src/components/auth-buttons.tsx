"use client";

import { Button } from "@bklit/ui/components/button";
import { authClient } from "@/auth/client";
import { GitHubIcon } from "./icons/github";

export function SignInButton() {
  return (
    <Button
      onClick={() => authClient.signIn.social({ provider: "github" })}
      className="gap-2"
    >
      <GitHubIcon className="size-5" />
      Sign in with GitHub
    </Button>
  );
}

export function SignOutButton() {
  return (
    <Button variant="outline" onClick={() => authClient.signOut()}>
      Sign Out
    </Button>
  );
}
