import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; // adjust path if needed

export async function GET() {
  try {
    const items = await prisma.roomList.findMany({
     include:{
        complementaryItems : true,
        promocodes: true,


     }
    });

    const bookingSource = await prisma.bookingSource.findMany()


    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch room list" },
      { status: 500 }
    );
  }
}

