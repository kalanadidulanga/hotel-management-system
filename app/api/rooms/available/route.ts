import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomClassId = searchParams.get("roomClassId");
    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");

    if (!roomClassId || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          details: "roomClassId, checkInDate, and checkOutDate are required",
          success: false,
        },
        { status: 400 }
      );
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      return NextResponse.json(
        {
          error: "Invalid date range",
          details: "Check-out date must be after check-in date",
          success: false,
        },
        { status: 400 }
      );
    }

    // Find all rooms of the specified class
    const allRooms = await prisma.room.findMany({
      where: {
        roomClassId: parseInt(roomClassId),
        isActive: true,
      },
      include: {
        floor: {
          select: {
            id: true,
            name: true,
            floorNumber: true,
          },
        },
      },
    });

    // Find rooms that are already reserved during the requested period
    const reservedRooms = await prisma.reservation.findMany({
      where: {
        roomId: {
          in: allRooms.map((room) => room.id),
        },
        reservationStatus: {
          in: ["CONFIRMED", "CHECKED_IN"],
        },
        OR: [
          {
            AND: [
              { checkInDate: { lte: checkIn } },
              { checkOutDate: { gt: checkIn } },
            ],
          },
          {
            AND: [
              { checkInDate: { lt: checkOut } },
              { checkOutDate: { gte: checkOut } },
            ],
          },
          {
            AND: [
              { checkInDate: { gte: checkIn } },
              { checkOutDate: { lte: checkOut } },
            ],
          },
        ],
      },
      select: {
        roomId: true,
      },
    });

    const reservedRoomIds = new Set(reservedRooms.map((r) => r.roomId));

    // Filter out reserved rooms and rooms under maintenance
    const availableRooms = allRooms.filter(
      (room) =>
        !reservedRoomIds.has(room.id) &&
        room.status !== "MAINTENANCE" &&
        room.status !== "OUT_OF_ORDER"
    );

    return NextResponse.json({
      rooms: availableRooms,
      total: availableRooms.length,
      success: true,
      period: {
        checkInDate,
        checkOutDate,
        nights: Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch available rooms",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
