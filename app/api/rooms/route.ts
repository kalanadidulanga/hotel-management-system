import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// GET all rooms with advanced filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract filter parameters with proper null checks
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const roomClassId = searchParams.get("roomClassId")?.trim();
    const floorId = searchParams.get("floorId")?.trim();
    const hasBalcony = searchParams.get("hasBalcony")?.trim();
    const hasSeaView = searchParams.get("hasSeaView")?.trim();
    const hasKitchenette = searchParams.get("hasKitchenette")?.trim();
    const cleaningDue = searchParams.get("cleaningDue")?.trim();
    const isActive = searchParams.get("isActive")?.trim();

    // Build where conditions with proper type checking
    const whereConditions: any = {};

    // Text search on room number - Fixed: Removed 'mode' property
    if (search && search !== "") {
      whereConditions.roomNumber = {
        contains: search,
      };
    }

    // Status filter
    if (status && status !== "" && status !== "all") {
      whereConditions.status = status;
    }

    // Room class filter
    if (
      roomClassId &&
      roomClassId !== "" &&
      roomClassId !== "all" &&
      !isNaN(parseInt(roomClassId))
    ) {
      whereConditions.roomClassId = parseInt(roomClassId);
    }

    // Floor filter
    if (
      floorId &&
      floorId !== "" &&
      floorId !== "all" &&
      !isNaN(parseInt(floorId))
    ) {
      whereConditions.floorId = parseInt(floorId);
    }

    // Feature filters with proper boolean checks
    if (hasBalcony && hasBalcony !== "" && hasBalcony !== "any") {
      whereConditions.hasBalcony = hasBalcony === "true";
    }

    if (hasSeaView && hasSeaView !== "" && hasSeaView !== "any") {
      whereConditions.hasSeaView = hasSeaView === "true";
    }

    if (hasKitchenette && hasKitchenette !== "" && hasKitchenette !== "any") {
      whereConditions.hasKitchenette = hasKitchenette === "true";
    }

    // Active status filter
    if (isActive && isActive !== "" && isActive !== "any") {
      whereConditions.isActive = isActive === "true";
    }

    // Cleaning due filters - Fixed the AND condition conflict
    if (cleaningDue && cleaningDue !== "" && cleaningDue !== "any") {
      const now = new Date();

      // Initialize AND array if it doesn't exist
      if (!whereConditions.AND) {
        whereConditions.AND = [];
      }

      switch (cleaningDue) {
        case "overdue":
          whereConditions.AND.push(
            { nextCleaningDue: { not: null } },
            { nextCleaningDue: { lt: now } }
          );
          break;
        case "due_today":
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);

          whereConditions.AND.push(
            { nextCleaningDue: { not: null } },
            { nextCleaningDue: { gte: startOfToday } },
            { nextCleaningDue: { lte: endOfToday } }
          );
          break;
        case "due_week":
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          nextWeek.setHours(23, 59, 59, 999);

          whereConditions.AND.push(
            { nextCleaningDue: { not: null } },
            { nextCleaningDue: { gte: now } },
            { nextCleaningDue: { lte: nextWeek } }
          );
          break;
      }
    }

    // Fetch rooms with comprehensive related data
    const rooms = await prisma.room.findMany({
      where: whereConditions,
      include: {
        roomClass: {
          select: {
            id: true,
            name: true,
            ratePerNight: true,
            rateDayUse: true,
            hourlyRate: true,
            maxOccupancy: true,
            standardOccupancy: true,
            cleaningFrequencyDays: true,
            amenities: true,
            specialFeatures: true,
          },
        },
        floor: {
          select: {
            id: true,
            name: true,
            floorNumber: true,
            description: true,
          },
        },
        _count: {
          select: {
            reservations: true,
            facilities: true,
          },
        },
      },
      orderBy: [{ floor: { floorNumber: "asc" } }, { roomNumber: "asc" }],
    });

    // Calculate comprehensive statistics
    const stats = await calculateAdvancedRoomStats(whereConditions);

    // Transform dates for JSON serialization
    const transformedRooms = rooms.map((room) => ({
      ...room,
      createdAt: room.createdAt?.toISOString() || null,
      updatedAt: room.updatedAt?.toISOString() || null,
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
      filters: {
        search,
        status,
        roomClassId,
        floorId,
        hasBalcony,
        hasSeaView,
        hasKitchenette,
        cleaningDue,
        isActive,
      },
    });
  } catch (error) {
    console.error("Rooms fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch rooms",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to calculate comprehensive room statistics
async function calculateAdvancedRoomStats(whereConditions: any = {}) {
  try {
    // Get total counts by status
    const totalRooms = await prisma.room.count({ where: whereConditions });

    // Handle case where no rooms exist
    if (totalRooms === 0) {
      return {
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        maintenanceRooms: 0,
        cleaningRooms: 0,
        outOfOrderRooms: 0,
        roomsDueCleaning: 0,
        averageOccupancy: 0,
        inactiveRooms: 0,
      };
    }

    const statusCounts = await prisma.room.groupBy({
      by: ["status"],
      where: whereConditions,
      _count: {
        status: true,
      },
    });

    const activeCounts = await prisma.room.groupBy({
      by: ["isActive"],
      where: whereConditions,
      _count: {
        isActive: true,
      },
    });

    const stats = {
      totalRooms,
      availableRooms: 0,
      occupiedRooms: 0,
      maintenanceRooms: 0,
      cleaningRooms: 0,
      outOfOrderRooms: 0,
      roomsDueCleaning: 0,
      averageOccupancy: 0,
      inactiveRooms: 0,
    };

    // Map status counts
    statusCounts.forEach((item) => {
      switch (item.status) {
        case "AVAILABLE":
          stats.availableRooms = item._count.status;
          break;
        case "OCCUPIED":
          stats.occupiedRooms = item._count.status;
          break;
        case "MAINTENANCE":
          stats.maintenanceRooms = item._count.status;
          break;
        case "CLEANING":
          stats.cleaningRooms = item._count.status;
          break;
        case "OUT_OF_ORDER":
          stats.outOfOrderRooms = item._count.status;
          break;
      }
    });

    // Map active status counts
    activeCounts.forEach((item) => {
      if (!item.isActive) {
        stats.inactiveRooms = item._count.isActive;
      }
    });

    // Calculate rooms due for cleaning (including overdue) with separate query to avoid conflicts
    const now = new Date();
    const cleaningWhereConditions = {
      ...whereConditions,
      nextCleaningDue: {
        not: null,
        lte: now,
      },
    };

    // Remove AND conditions from main where clause for cleaning count
    const { AND, ...cleaningBaseConditions } = cleaningWhereConditions;

    const roomsDueCleaning = await prisma.room.count({
      where: cleaningBaseConditions,
    });
    stats.roomsDueCleaning = roomsDueCleaning;

    // Calculate occupancy rate
    if (totalRooms > 0) {
      stats.averageOccupancy = Math.round(
        (stats.occupiedRooms / totalRooms) * 100
      );
    }

    return stats;
  } catch (error) {
    console.error("Error calculating room stats:", error);
    return {
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      maintenanceRooms: 0,
      cleaningRooms: 0,
      outOfOrderRooms: 0,
      roomsDueCleaning: 0,
      averageOccupancy: 0,
      inactiveRooms: 0,
    };
  }
}

// POST - Create new room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      roomNumber,
      roomClassId,
      floorId,
      status = "AVAILABLE",
      hasBalcony = false,
      hasSeaView = false,
      hasKitchenette = false,
      specialNotes,
      cleaningNotes,
      isActive = true,
    } = body;

    // Validation
    if (!roomNumber || !roomClassId) {
      return NextResponse.json(
        {
          error: "Room number and room class are required",
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate room number format
    if (!/^[A-Za-z0-9-]+$/.test(roomNumber.trim())) {
      return NextResponse.json(
        {
          error: "Room number can only contain letters, numbers, and hyphens",
          success: false,
        },
        { status: 400 }
      );
    }

    // Parse and validate IDs
    const parsedRoomClassId = parseInt(roomClassId);
    if (isNaN(parsedRoomClassId)) {
      return NextResponse.json(
        {
          error: "Invalid room class ID",
          success: false,
        },
        { status: 400 }
      );
    }

    let parsedFloorId = null;
    if (floorId) {
      parsedFloorId = parseInt(floorId);
      if (isNaN(parsedFloorId)) {
        return NextResponse.json(
          {
            error: "Invalid floor ID",
            success: false,
          },
          { status: 400 }
        );
      }
    }

    // Check if room number already exists - Fixed: Removed 'mode' property
    const existingRoom = await prisma.room.findFirst({
      where: {
        roomNumber: roomNumber.trim(),
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        {
          error: `Room number "${roomNumber}" already exists`,
          success: false,
        },
        { status: 400 }
      );
    }

    // Verify room class exists
    const roomClass = await prisma.roomClass.findUnique({
      where: { id: parsedRoomClassId },
    });

    if (!roomClass) {
      return NextResponse.json(
        {
          error: "Selected room class does not exist",
          success: false,
        },
        { status: 400 }
      );
    }

    // Verify floor exists if provided
    if (parsedFloorId) {
      const floor = await prisma.floor.findUnique({
        where: { id: parsedFloorId },
      });

      if (!floor) {
        return NextResponse.json(
          {
            error: "Selected floor does not exist",
            success: false,
          },
          { status: 400 }
        );
      }
    }

    // Validate status
    const validStatuses = [
      "AVAILABLE",
      "OCCUPIED",
      "MAINTENANCE",
      "CLEANING",
      "OUT_OF_ORDER",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid room status",
          success: false,
        },
        { status: 400 }
      );
    }

    // Calculate initial cleaning schedule
    const now = new Date();
    const nextCleaningDate = new Date();
    nextCleaningDate.setDate(
      now.getDate() + (roomClass.cleaningFrequencyDays || 7)
    );

    // Create the room
    const newRoom = await prisma.room.create({
      data: {
        roomNumber: roomNumber.trim(),
        roomClassId: parsedRoomClassId,
        floorId: parsedFloorId,
        status,
        hasBalcony: Boolean(hasBalcony),
        hasSeaView: Boolean(hasSeaView),
        hasKitchenette: Boolean(hasKitchenette),
        specialNotes: specialNotes?.trim() || null,
        cleaningNotes: cleaningNotes?.trim() || null,
        isActive: Boolean(isActive),
        lastCleaned: status === "AVAILABLE" ? now : null,
        nextCleaningDue: status === "AVAILABLE" ? nextCleaningDate : null,
      },
      include: {
        roomClass: {
          select: {
            id: true,
            name: true,
            ratePerNight: true,
            rateDayUse: true,
            maxOccupancy: true,
            cleaningFrequencyDays: true,
          },
        },
        floor: {
          select: {
            id: true,
            name: true,
            floorNumber: true,
          },
        },
        _count: {
          select: {
            reservations: true,
            facilities: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        room: {
          ...newRoom,
          createdAt: newRoom.createdAt.toISOString(),
          updatedAt: newRoom.updatedAt.toISOString(),
          lastCleaned: newRoom.lastCleaned
            ? newRoom.lastCleaned.toISOString()
            : null,
          nextCleaningDue: newRoom.nextCleaningDue
            ? newRoom.nextCleaningDue.toISOString()
            : null,
        },
        message: `Room ${newRoom.roomNumber} created successfully`,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Room creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create room",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
