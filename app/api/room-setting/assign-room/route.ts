import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        floorList: {
          include: {
            floor: true,
          },
        },
        roomList: {
          select: {
            roomType: true,
            rate: true,
            capacity: true,
          },
        },
      },
      orderBy: [
        {
          floorList: {
            floor: {
              name: "asc",
            },
          },
        },
        {
          roomNumber: "asc",
        },
      ],
    });

    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { message: "Failed to fetch rooms", error: error.message },
      { status: 500 }
    );
  }
}




export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomType, roomIds } = body;

    // Validate input
    if (!roomType || typeof roomType !== "string") {
      return NextResponse.json(
        { message: "Valid 'roomType' (string) is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      return NextResponse.json(
        { message: "Valid 'roomIds' (non-empty array) is required" },
        { status: 400 }
      );
    }

    // Validate that all roomIds are numbers
    if (!roomIds.every((id) => typeof id === "number")) {
      return NextResponse.json(
        { message: "All room IDs must be numbers" },
        { status: 400 }
      );
    }

    // Check if room type exists
    const roomTypeExists = await prisma.roomList.findUnique({
      where: { roomType },
    });

    if (!roomTypeExists) {
      return NextResponse.json(
        { message: "Room type does not exist" },
        { status: 404 }
      );
    }

    // Check if all rooms exist and are available
    const rooms = await prisma.room.findMany({
      where: {
        id: { in: roomIds },
      },
    });

    if (rooms.length !== roomIds.length) {
      return NextResponse.json(
        { message: "Some rooms do not exist" },
        { status: 404 }
      );
    }

    // Check if any rooms are already assigned or unavailable
    const unavailableRooms = rooms.filter((room) => !room.isAvailable);
    if (unavailableRooms.length > 0) {
      return NextResponse.json(
        {
          message: `Some rooms are not available: ${unavailableRooms
            .map((r) => r.roomNumber)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Update rooms with the new room type
    const updatedRooms = await prisma.room.updateMany({
      where: {
        id: { in: roomIds },
      },
      data: {
        roomType: roomType,
      },
    });

    // Get updated room details for response
    const assignedRooms = await prisma.room.findMany({
      where: {
        id: { in: roomIds },
      },
      include: {
        floorList: {
          include: {
            floor: true,
          },
        },
        roomList: {
          select: {
            roomType: true,
            rate: true,
            capacity: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Rooms assigned successfully",
        assignedCount: updatedRooms.count,
        rooms: assignedRooms,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error assigning rooms:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomIds, roomType } = body;

    // Validate input
    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      return NextResponse.json(
        { message: "Valid 'roomIds' (non-empty array) is required" },
        { status: 400 }
      );
    }

    if (roomType && typeof roomType !== "string") {
      return NextResponse.json(
        { message: "Valid 'roomType' (string) is required if provided" },
        { status: 400 }
      );
    }

    // If roomType is provided, check if it exists
    if (roomType) {
      const roomTypeExists = await prisma.roomList.findUnique({
        where: { roomType },
      });

      if (!roomTypeExists) {
        return NextResponse.json(
          { message: "Room type does not exist" },
          { status: 404 }
        );
      }
    }

    // Update rooms
    const updated = await prisma.room.updateMany({
      where: {
        id: { in: roomIds },
      },
      data: {
        roomType: roomType || null,
      },
    });

    return NextResponse.json(
      {
        message: "Rooms updated successfully",
        updatedCount: updated.count,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating room assignments:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomIds } = body;

    // Validate input
    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      return NextResponse.json(
        { message: "Valid 'roomIds' (non-empty array) is required" },
        { status: 400 }
      );
    }

    // Remove room type assignment (set to null)
    const updated = await prisma.room.updateMany({
      where: {
        id: { in: roomIds },
      },
      data: {
        roomType: null,
      },
    });

    return NextResponse.json(
      {
        message: "Room assignments removed successfully",
        updatedCount: updated.count,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error removing room assignments:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}