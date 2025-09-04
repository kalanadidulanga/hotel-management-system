import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");
    const roomClassId = searchParams.get("roomClassId");
    const guests = parseInt(searchParams.get("guests") || "1");
    const roomNumber = searchParams.get("roomNumber");
    const floor = searchParams.get("floor");
    const status = searchParams.get("status");

    // Build where conditions
    const whereConditions: any = {
      isActive: true,
    };

    // Filter by room class
    if (roomClassId) {
      whereConditions.roomClassId = parseInt(roomClassId);
    }

    // Filter by room number
    if (roomNumber && roomNumber.trim()) {
      whereConditions.roomNumber = {
        contains: roomNumber.trim(),
        mode: "insensitive",
      };
    }

    // Filter by floor
    if (floor && floor !== "all") {
      whereConditions.floor = {
        floorNumber: parseInt(floor),
      };
    }

    // Filter by status
    if (status && status !== "all") {
      whereConditions.status = status;
    }

    // Filter by guest capacity
    if (guests > 1) {
      whereConditions.roomClass = {
        maxOccupancy: {
          gte: guests,
        },
      };
    }

    // Get all rooms matching basic criteria
    let rooms = await prisma.room.findMany({
      where: whereConditions,
      include: {
        roomClass: {
          select: {
            id: true,
            name: true,
            description: true,
            ratePerNight: true,
            rateDayUse: true,
            maxOccupancy: true,
            standardOccupancy: true,
            amenities: true,
            specialFeatures: true,
          },
        },
        floor: {
          select: {
            name: true,
            floorNumber: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // Available first
        { roomNumber: "asc" },
      ],
    });

    // If date range is specified, check for conflicts
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      // Validate dates
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format", success: false },
          { status: 400 }
        );
      }

      if (checkOut <= checkIn) {
        return NextResponse.json(
          {
            error: "Check-out date must be after check-in date",
            success: false,
          },
          { status: 400 }
        );
      }

      // Get room IDs
      const roomIds = rooms.map((room) => room.id);

      if (roomIds.length > 0) {
        // Find conflicting reservations
        const conflictingReservations = await prisma.reservation.findMany({
          where: {
            roomId: { in: roomIds },
            reservationStatus: {
              in: ["CONFIRMED", "CHECKED_IN"],
            },
            OR: [
              {
                // New booking starts during existing booking
                AND: [
                  { checkInDate: { lte: checkIn } },
                  { checkOutDate: { gt: checkIn } },
                ],
              },
              {
                // New booking ends during existing booking
                AND: [
                  { checkInDate: { lt: checkOut } },
                  { checkOutDate: { gte: checkOut } },
                ],
              },
              {
                // New booking encompasses existing booking
                AND: [
                  { checkInDate: { gte: checkIn } },
                  { checkOutDate: { lte: checkOut } },
                ],
              },
            ],
          },
          select: { roomId: true },
        });

        const conflictingRoomIds = new Set(
          conflictingReservations.map((reservation) => reservation.roomId)
        );

        // Update room status based on availability
        rooms = rooms.map((room) => ({
          ...room,
          status: conflictingRoomIds.has(room.id) ? "OCCUPIED" : room.status,
        }));

        // If only available rooms are requested, filter them
        if (status === "AVAILABLE") {
          rooms = rooms.filter(
            (room) =>
              !conflictingRoomIds.has(room.id) && room.status === "AVAILABLE"
          );
        }
      }
    }

    // Calculate availability statistics
    const stats = {
      total: rooms.length,
      available: rooms.filter((room) => room.status === "AVAILABLE").length,
      occupied: rooms.filter((room) => room.status === "OCCUPIED").length,
      maintenance: rooms.filter((room) =>
        ["MAINTENANCE", "CLEANING", "OUT_OF_ORDER"].includes(room.status)
      ).length,
    };

    return NextResponse.json({
      rooms,
      stats,
      filters: {
        checkInDate,
        checkOutDate,
        roomClassId,
        guests,
        roomNumber,
        floor,
        status,
      },
      success: true,
    });
  } catch (error) {
    console.error("Room availability check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check room availability",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
