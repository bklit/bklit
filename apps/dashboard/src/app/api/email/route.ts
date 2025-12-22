import { appRouter, createTRPCContext } from "@bklit/api";
import { NextResponse } from "next/server";

import { auth } from "@/auth/server";

export async function POST(request: Request) {
  const body = await request.json();

  // Create tRPC caller to use the email router
  const caller = appRouter.createCaller(
    await createTRPCContext({
      auth,
      headers: request.headers,
    })
  );

  // Call the tRPC email.send mutation
  const result = await caller.email.send(body);

  return NextResponse.json(result);
}
