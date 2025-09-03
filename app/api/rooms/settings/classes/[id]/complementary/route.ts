import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomClassId = parseInt(params.id);

    if (isNaN(roomClassId)) {
      return NextResponse.json(
        {
          error: "Invalid room class ID",
          success: false,
        },
        { status: 400 }
      );
    }

    const complementaryItems = await prisma.complementaryItem.findMany({
      where: {
        roomClassId: roomClassId,
      },
      orderBy: [{ isOptional: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      items: complementaryItems,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching complementary items:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch complementary items",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
