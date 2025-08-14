import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    // Validate input
    if (!query || query.length < 2) {
      return NextResponse.json(
        { message: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Search customers by name, phone, or email
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { phone: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        countryCode: true,
      },
      take: 10,
      orderBy: { firstName: "asc" },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("Error searching customers:", error);
    return NextResponse.json(
      { message: "Failed to search customers", error: error.message },
      { status: 500 }
    );
  }
}
