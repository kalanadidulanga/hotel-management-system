import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET specific room by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID", success: false },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
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
        facilities: {
          include: {
            facility: true,
          },
        },
        reservations: {
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
          orderBy: {
            checkInDate: "desc",
          },
          take: 10, // Limit recent reservations
        },
        _count: {
          select: {
            reservations: true,
            facilities: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found", success: false },
        { status: 404 }
      );
    }

    // Transform dates for JSON serialization
    const transformedRoom = {
      ...room,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
      lastCleaned: room.lastCleaned ? room.lastCleaned.toISOString() : null,
      nextCleaningDue: room.nextCleaningDue
        ? room.nextCleaningDue.toISOString()
        : null,
      reservations: room.reservations.map((res) => ({
        ...res,
        checkInDate: res.checkInDate.toISOString(),
        checkOutDate: res.checkOutDate.toISOString(),
        createdAt: res.createdAt.toISOString(),
        updatedAt: res.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({
      room: transformedRoom,
      success: true,
    });
  } catch (error) {
    console.error("Room fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch room details",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update room
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID", success: false },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      roomNumber,
      roomClassId,
      floorId,
      status,
      hasBalcony,
      hasSeaView,
      hasKitchenette,
      specialNotes,
      cleaningNotes,
      isActive,
    } = body;

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomClass: true,
      },
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: "Room not found", success: false },
        { status: 404 }
      );
    }

    // Validate room number if being changed
    if (roomNumber && roomNumber.trim() !== existingRoom.roomNumber) {
      if (!/^[A-Za-z0-9-]+$/.test(roomNumber.trim())) {
        return NextResponse.json(
          {
            error: "Room number can only contain letters, numbers, and hyphens",
            success: false,
          },
          { status: 400 }
        );
      }

      const duplicateRoom = await prisma.room.findFirst({
        where: {
          roomNumber: roomNumber.trim(),
          id: { not: roomId },
        },
      });

      if (duplicateRoom) {
        return NextResponse.json(
          {
            error: `Room number "${roomNumber}" already exists`,
            success: false,
          },
          { status: 400 }
        );
      }
    }

    // Validate room class if being changed
    if (roomClassId && parseInt(roomClassId) !== existingRoom.roomClassId) {
      const roomClass = await prisma.roomClass.findUnique({
        where: { id: parseInt(roomClassId) },
      });

      if (!roomClass) {
        return NextResponse.json(
          { error: "Selected room class does not exist", success: false },
          { status: 400 }
        );
      }
    }

    // Validate floor if being changed
    if (floorId && floorId !== "") {
      const floor = await prisma.floor.findUnique({
        where: { id: parseInt(floorId) },
      });

      if (!floor) {
        return NextResponse.json(
          { error: "Selected floor does not exist", success: false },
          { status: 400 }
        );
      }
    }

    // Validate status
    if (status) {
      const validStatuses = [
        "AVAILABLE",
        "OCCUPIED",
        "MAINTENANCE",
        "CLEANING",
        "OUT_OF_ORDER",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid room status", success: false },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};

    if (roomNumber) updateData.roomNumber = roomNumber.trim();
    if (roomClassId) updateData.roomClassId = parseInt(roomClassId);
    if (floorId !== undefined) {
      updateData.floorId = floorId === "" ? null : parseInt(floorId);
    }
    if (status) updateData.status = status;
    if (hasBalcony !== undefined) updateData.hasBalcony = Boolean(hasBalcony);
    if (hasSeaView !== undefined) updateData.hasSeaView = Boolean(hasSeaView);
    if (hasKitchenette !== undefined)
      updateData.hasKitchenette = Boolean(hasKitchenette);
    if (specialNotes !== undefined)
      updateData.specialNotes = specialNotes?.trim() || null;
    if (cleaningNotes !== undefined)
      updateData.cleaningNotes = cleaningNotes?.trim() || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    updateData.updatedAt = new Date();

    // Update the room
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: updateData,
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
      message: `Room ${updatedRoom.roomNumber} updated successfully`,
      success: true,
    });
  } catch (error) {
    console.error("Room update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update room",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete room (same as previous implementation)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
      return NextResponse.json(
        { error: "Invalid room ID", success: false },
        { status: 400 }
      );
    }

    // Check if room exists and has reservations
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        _count: {
          select: {
            reservations: true,
            facilities: true,
          },
        },
      },
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: "Room not found", success: false },
        { status: 404 }
      );
    }

    if (existingRoom._count.reservations > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete room ${existingRoom.roomNumber} because it has ${existingRoom._count.reservations} reservations`,
          success: false,
        },
        { status: 400 }
      );
    }

    // Delete room (cascade will handle facilities)
    await prisma.room.delete({
      where: { id: roomId },
    });

    return NextResponse.json({
      message: `Room ${existingRoom.roomNumber} deleted successfully`,
      success: true,
    });
  } catch (error) {
    console.error("Room deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete room",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
