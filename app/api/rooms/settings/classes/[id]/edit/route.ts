import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ Await params
    const roomClassId = parseInt(id);

    if (isNaN(roomClassId)) {
      return NextResponse.json(
        { error: "Invalid room class ID" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: "Room class name is required" },
        { status: 400 }
      );
    }

    if (!data.ratePerNight || data.ratePerNight <= 0) {
      return NextResponse.json(
        { error: "Night rate must be greater than 0" },
        { status: 400 }
      );
    }

    if (!data.rateDayUse || data.rateDayUse <= 0) {
      return NextResponse.json(
        { error: "Day rate must be greater than 0" },
        { status: 400 }
      );
    }

    if (!data.maxOccupancy || data.maxOccupancy <= 0) {
      return NextResponse.json(
        { error: "Max occupancy must be greater than 0" },
        { status: 400 }
      );
    }

    if (!data.standardOccupancy || data.standardOccupancy <= 0) {
      return NextResponse.json(
        { error: "Standard occupancy must be greater than 0" },
        { status: 400 }
      );
    }

    if (data.standardOccupancy > data.maxOccupancy) {
      return NextResponse.json(
        { error: "Standard occupancy cannot exceed max occupancy" },
        { status: 400 }
      );
    }

    // Check if room class exists
    const existingRoomClass = await prisma.roomClass.findUnique({
      where: { id: roomClassId },
      include: {
        _count: {
          select: {
            rooms: true,
            reservations: true,
          },
        },
      },
    });

    if (!existingRoomClass) {
      return NextResponse.json(
        { error: "Room class not found" },
        { status: 404 }
      );
    }

    // Check if the name is being changed and if it conflicts with another room class
    if (data.name.trim() !== existingRoomClass.name) {
      const nameConflict = await prisma.roomClass.findFirst({
        where: {
          name: {
            equals: data.name.trim(),
          },
          id: {
            not: roomClassId,
          },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          {
            error: `Room class "${data.name}" already exists. Please choose a different name.`,
          },
          { status: 400 }
        );
      }
    }

    // Update the room class
    const updatedRoomClass = await prisma.roomClass.update({
      where: { id: roomClassId },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        ratePerNight: parseFloat(data.ratePerNight),
        rateDayUse: parseFloat(data.rateDayUse),
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        extraPersonCharge: data.extraPersonCharge
          ? parseFloat(data.extraPersonCharge)
          : 0,
        childCharge: data.childCharge ? parseFloat(data.childCharge) : 0,
        maxOccupancy: parseInt(data.maxOccupancy),
        standardOccupancy: parseInt(data.standardOccupancy),
        roomSize: data.roomSize?.trim() || null,
        bedConfiguration: data.bedConfiguration?.trim() || null,
        cleaningFrequencyDays: parseInt(data.cleaningFrequencyDays) || 1,
        amenities: data.amenities || null, // Already JSON stringified from frontend
        specialFeatures: data.specialFeatures?.trim() || null,
        isActive: Boolean(data.isActive),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            rooms: true,
            reservations: true,
            roomImages: true,
            roomOffers: true,
            complementaryItems: true,
          },
        },
      },
    });

    // If cleaning frequency was changed, update the lastCleaningUpdate
    if (
      data.cleaningFrequencyDays !== existingRoomClass.cleaningFrequencyDays
    ) {
      await prisma.roomClass.update({
        where: { id: roomClassId },
        data: {
          lastCleaningUpdate: new Date(),
        },
      });
    }

    // Transform dates for JSON serialization
    const transformedRoomClass = {
      ...updatedRoomClass,
      createdAt: updatedRoomClass.createdAt.toISOString(),
      updatedAt: updatedRoomClass.updatedAt.toISOString(),
      lastCleaningUpdate: updatedRoomClass.lastCleaningUpdate.toISOString(),
    };

    return NextResponse.json({
      roomClass: transformedRoomClass,
      message: `Room class "${updatedRoomClass.name}" updated successfully`,
      success: true,
      changes: {
        hasRooms: existingRoomClass._count.rooms > 0,
        hasReservations: existingRoomClass._count.reservations > 0,
        cleaningFrequencyChanged:
          data.cleaningFrequencyDays !==
          existingRoomClass.cleaningFrequencyDays,
      },
    });
  } catch (error) {
    console.error("Room class update error:", error);
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: "Method not allowed. Use PUT to update the room class." },
    { status: 405 }
  );
}
