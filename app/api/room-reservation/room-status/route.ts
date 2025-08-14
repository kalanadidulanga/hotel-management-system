import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        floorList: {
          include: {
            floor: true,
          },
        },
        roomList: true,
        reservations: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        roomNumber: "asc",
      },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
