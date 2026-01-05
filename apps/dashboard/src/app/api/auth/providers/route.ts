import { NextResponse } from "next/server";
import { env } from "@/env";

export async function GET() {
  return NextResponse.json({
    github: !!(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET),
    google: !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
  });
}
