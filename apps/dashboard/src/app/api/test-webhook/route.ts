import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("🔥 TEST WEBHOOK RECEIVED:", body);

    return NextResponse.json({
      success: true,
      message: "Webhook received",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("🔥 TEST WEBHOOK ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({
    message: "Test webhook endpoint is working",
    timestamp: new Date().toISOString(),
  });
}
