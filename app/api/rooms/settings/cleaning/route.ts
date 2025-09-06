import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all cleaning schedules and overdue rooms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const roomClassId = searchParams.get("roomClassId");
    const floorId = searchParams.get("floorId");

    // Build where conditions
    const whereConditions: any = {
      isActive: true,
    };

    if (roomClassId) {
      whereConditions.roomClassId = parseInt(roomClassId);
    }

    if (floorId) {
      whereConditions.floorId = parseInt(floorId);
    }

    const now = new Date();

    // Filter by cleaning status
    if (status === "overdue") {
      whereConditions.AND = [
        { nextCleaningDue: { not: null } },
        { nextCleaningDue: { lt: now } },
      ];
    } else if (status === "due_today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      whereConditions.AND = [
        { nextCleaningDue: { not: null } },
        { nextCleaningDue: { gte: startOfToday } },
        { nextCleaningDue: { lte: endOfToday } },
      ];
    } else if (status === "due_week") {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(23, 59, 59, 999);

      whereConditions.AND = [
        { nextCleaningDue: { not: null } },
        { nextCleaningDue: { gte: now } },
        { nextCleaningDue: { lte: nextWeek } },
      ];
    }

    // Fetch rooms with cleaning data
    const rooms = await prisma.room.findMany({
      where: whereConditions,
      include: {
        roomClass: {
          select: {
            id: true,
            name: true,
            cleaningFrequencyDays: true,
            cleaningDueNotification: true,
          },
        },
        floor: {
          select: {
            id: true,
            name: true,
            floorNumber: true,
          },
        },
      },
      orderBy: [{ nextCleaningDue: "asc" }, { roomNumber: "asc" }],
    });

    // Calculate comprehensive cleaning statistics
    const stats = await calculateCleaningStats();

    // Transform dates for JSON serialization
    const transformedRooms = rooms.map((room) => ({
      ...room,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
      lastCleaned: room.lastCleaned ? room.lastCleaned.toISOString() : null,
      nextCleaningDue: room.nextCleaningDue
        ? room.nextCleaningDue.toISOString()
        : null,
    }));

    return NextResponse.json({
      rooms: transformedRooms,
      stats,
      success: true,
      count: rooms.length,
    });
  } catch (error) {
    console.error("Cleaning schedule fetch error:", error);
    return NextResponse.json(
      {
        error:
          "Internal server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Update cleaning schedules (bulk update)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, action, cleaningDate, notes } = body;

    if (!roomId || !action) {
      return NextResponse.json(
        { error: "Room ID and action are required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) },
      include: {
        roomClass: {
          select: {
            cleaningFrequencyDays: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    let updateData: any = {};

    if (action === "mark_cleaned") {
      const now = cleaningDate ? new Date(cleaningDate) : new Date();
      const nextCleaningDate = new Date(now);
      nextCleaningDate.setDate(
        now.getDate() + room.roomClass.cleaningFrequencyDays
      );

      updateData = {
        lastCleaned: now,
        nextCleaningDue: nextCleaningDate,
        cleaningNotes: notes || null,
        status: "AVAILABLE", // Mark as available after cleaning
        updatedAt: new Date(),
      };
    } else if (action === "reschedule") {
      if (!cleaningDate) {
        return NextResponse.json(
          { error: "Cleaning date is required for rescheduling" },
          { status: 400 }
        );
      }
      updateData = {
        nextCleaningDue: new Date(cleaningDate),
        cleaningNotes: notes || room.cleaningNotes,
        updatedAt: new Date(),
      };
    }

    const updatedRoom = await prisma.room.update({
      where: { id: parseInt(roomId) },
      data: updateData,
      include: {
        roomClass: true,
        floor: true,
      },
    });

    return NextResponse.json({
      room: {
        ...updatedRoom,
        createdAt: updatedRoom.createdAt.toISOString(),
        updatedAt: updatedRoom.updatedAt.toISOString(),
        lastCleaned: updatedRoom.lastCleaned
          ? updatedRoom.lastCleaned.toISOString()
          : null,
        nextCleaningDue: updatedRoom.nextCleaningDue
          ? updatedRoom.nextCleaningDue.toISOString()
          : null,
      },
      message: `Room ${updatedRoom.roomNumber} cleaning schedule updated successfully`,
      success: true,
    });
  } catch (error) {
    console.error("Cleaning schedule update error:", error);
    return NextResponse.json(
      {
        error:
          "Internal server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to calculate cleaning statistics
async function calculateCleaningStats() {
  try {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const totalRooms = await prisma.room.count({
      where: { isActive: true },
    });

    const overdueRooms = await prisma.room.count({
      where: {
        isActive: true,
        AND: [
          { nextCleaningDue: { not: null } },
          { nextCleaningDue: { lt: now } },
        ],
      },
    });

    const dueTodayRooms = await prisma.room.count({
      where: {
        isActive: true,
        AND: [
          { nextCleaningDue: { not: null } },
          { nextCleaningDue: { gte: startOfToday } },
          { nextCleaningDue: { lte: endOfToday } },
        ],
      },
    });

    const dueThisWeekRooms = await prisma.room.count({
      where: {
        isActive: true,
        AND: [
          { nextCleaningDue: { not: null } },
          { nextCleaningDue: { gte: now } },
          { nextCleaningDue: { lte: nextWeek } },
        ],
      },
    });

    const cleaningRooms = await prisma.room.count({
      where: {
        isActive: true,
        status: "CLEANING",
      },
    });

    const upToDateRooms =
      totalRooms - overdueRooms - dueTodayRooms - dueThisWeekRooms;

    return {
      totalRooms,
      overdueRooms,
      dueTodayRooms,
      dueThisWeekRooms,
      cleaningRooms,
      upToDateRooms,
      complianceRate:
        totalRooms > 0
          ? Math.round(((totalRooms - overdueRooms) / totalRooms) * 100)
          : 0,
    };
  } catch (error) {
    console.error("Error calculating cleaning stats:", error);
    return {
      totalRooms: 0,
      overdueRooms: 0,
      dueTodayRooms: 0,
      dueThisWeekRooms: 0,
      cleaningRooms: 0,
      upToDateRooms: 0,
      complianceRate: 0,
    };
  }
}

// PUT - Update room class cleaning frequency (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomClassId, cleaningFrequencyDays, cleaningDueNotification } =
      body;

    if (!roomClassId || !cleaningFrequencyDays) {
      return NextResponse.json(
        { error: "Room class ID and cleaning frequency are required" },
        { status: 400 }
      );
    }

    if (cleaningFrequencyDays < 1 || cleaningFrequencyDays > 365) {
      return NextResponse.json(
        { error: "Cleaning frequency must be between 1 and 365 days" },
        { status: 400 }
      );
    }

    // Update room class cleaning settings
    const updatedRoomClass = await prisma.roomClass.update({
      where: { id: parseInt(roomClassId) },
      data: {
        cleaningFrequencyDays: parseInt(cleaningFrequencyDays),
        cleaningDueNotification:
          cleaningDueNotification !== undefined
            ? cleaningDueNotification
            : true,
        lastCleaningUpdate: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update all rooms of this class with new cleaning schedules
    const roomsToUpdate = await prisma.room.findMany({
      where: { roomClassId: parseInt(roomClassId) },
    });

    for (const room of roomsToUpdate) {
      if (room.lastCleaned) {
        const nextCleaningDate = new Date(room.lastCleaned);
        nextCleaningDate.setDate(
          nextCleaningDate.getDate() + parseInt(cleaningFrequencyDays)
        );

        await prisma.room.update({
          where: { id: room.id },
          data: {
            nextCleaningDue: nextCleaningDate,
            updatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      roomClass: updatedRoomClass,
      message: `Cleaning frequency updated for ${updatedRoomClass.name} and ${roomsToUpdate.length} associated rooms`,
      success: true,
    });
  } catch (error) {
    console.error("Cleaning frequency update error:", error);
    return NextResponse.json(
      {
        error:
          "Internal server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
