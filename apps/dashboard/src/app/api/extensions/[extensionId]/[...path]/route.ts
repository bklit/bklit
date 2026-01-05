import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ extensionId: string; path: string[] }> },
) {
  try {
    const { extensionId, path } = await params;

    // Construct file path
    const filePath = join(
      process.cwd(),
      "../../packages/extensions",
      extensionId,
      ...path,
    );

    // Read file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const ext = path[path.length - 1]?.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
      gif: "image/gif",
      webp: "image/webp",
    };

    const contentType = contentTypes[ext || ""] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving extension asset:", error);
    return new NextResponse("Not Found", { status: 404 });
  }
}
