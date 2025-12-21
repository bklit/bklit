import { getProProduct } from "@bklit/api";
import { NextResponse } from "next/server";

const CACHE_TTL = 10 * 60 * 1000;
let cachedData: Awaited<ReturnType<typeof getProProduct>> | null = null;
let cacheTime = 0;

export async function GET() {
  try {
    const now = Date.now();

    if (cachedData && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({
        product: cachedData,
        cached: true,
      });
    }

    const proProduct = await getProProduct();

    cachedData = proProduct;
    cacheTime = now;

    return NextResponse.json({
      product: proProduct,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to fetch Pro product:", error);

    if (cachedData) {
      return NextResponse.json({
        product: cachedData,
        cached: true,
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch Pro product" },
      { status: 500 },
    );
  }
}

import { auth } from "@/auth/server";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  cachedData = null;
  cacheTime = 0;
  return NextResponse.json({ message: "Cache cleared" });
}
}
