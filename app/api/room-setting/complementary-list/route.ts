
import { NextResponse } from "next/server";
import prisma from "@/lib/db"; // adjust path if needed

export async function GET() {
  try {
    const items = await prisma.complementaryItem.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    
    return NextResponse.json(
      { message: "Failed to fetch complementary items" },
      { status: 500 }
    );
  }
}
