import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ assets: [] });
    }

    // For SQLite, we'll use contains without mode (it's case-insensitive by default in SQLite)
    // Or use raw SQL for better control
    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
            },
          },
          {
            assetId: {
              contains: query,
            },
          },
          {
            code: {
              contains: query,
            },
          },
          {
            description: {
              contains: query,
            },
          },
        ],
      },
      select: {
        id: true,
        assetId: true,
        name: true,
        type: true,
        quantity: true,
        unit: true,
        status: true,
        location: true,
        purchasePrice: true,
        maintenanceDate: true,
      },
      take: 10,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search assets" },
      { status: 500 }
    );
  }
}
