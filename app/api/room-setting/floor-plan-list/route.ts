import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

function handlePrismaError(error: any) {
  if (error.code === "P2002") {
    return NextResponse.json(
      { message: "Room number must be unique" },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { message: "Database error", error: error.message },
    { status: 500 }
  );
}

// GET all floorLists
export async function GET() {
  try {
    const items = await prisma.floorList.findMany({
      orderBy: { id: "asc" },
      include: { floor: true },
    });
    return NextResponse.json(items);
  } catch (error: any) {
    return handlePrismaError(error);
  }
}

// CREATE floorList with rooms
export async function POST(req: NextRequest) {
  try {
    const { floorName, noOfRoom, startRoomNo } = await req.json();

    if (!floorName || !noOfRoom || !startRoomNo) {
      return NextResponse.json(
        { message: "'floorName', 'noOfRoom', and 'startRoomNo' are required" },
        { status: 400 }
      );
    }

    const roomNumbers = Array.from(
      { length: noOfRoom },
      (_, i) => startRoomNo + i
    );

    // Pre-check for duplicates
    const existingRooms = await prisma.room.findMany({
      where: { roomNumber: { in: roomNumbers } },
      select: { roomNumber: true },
    });
    if (existingRooms.length > 0) {
      return NextResponse.json(
        {
          message: `The following room numbers already exist: ${existingRooms
            .map((r) => r.roomNumber)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    const createdFloorList = await prisma.floorList.create({
      data: {
        floorName,
        noOfRoom,
        startRoomNo,
        rooms: {
          create: roomNumbers.map((num) => ({
            roomNumber: num,
          })),
        },
      },
      include: { rooms: true },
    });

    return NextResponse.json(createdFloorList, { status: 201 });
  } catch (error: any) {
    return handlePrismaError(error);
  }
}

// UPDATE floorList and rooms
export async function PUT(req: NextRequest) {
  try {
    const { id, floorName, noOfRoom, startRoomNo } = await req.json();

    if (!id || !floorName || !noOfRoom || !startRoomNo) {
      return NextResponse.json(
        {
          message:
            "'id', 'floorName', 'noOfRoom', and 'startRoomNo' are required",
        },
        { status: 400 }
      );
    }

    const newRoomNumbers = Array.from(
      { length: noOfRoom },
      (_, i) => startRoomNo + i
    );

    const existingRooms = await prisma.room.findMany({
      where: {
        roomNumber: { in: newRoomNumbers },
        floorListId: { not: id },
      },
      select: { roomNumber: true },
    });
    if (existingRooms.length > 0) {
      return NextResponse.json(
        {
          message: `The following room numbers already exist: ${existingRooms
            .map((r) => r.roomNumber)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updatedFloorList = await prisma.floorList.update({
      where: { id },
      data: { floorName, noOfRoom, startRoomNo },
    });

    // Replace rooms atomically
    await prisma.room.deleteMany({ where: { floorListId: id } });
    await prisma.room.createMany({
      data: newRoomNumbers.map((num) => ({
        roomNumber: num,
        floorListId: id,
      })),
    });

    return NextResponse.json({ ...updatedFloorList, rooms: newRoomNumbers });
  } catch (error: any) {
    return handlePrismaError(error);
  }
}

// DELETE floorList
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { message: "'id' is required for deletion" },
        { status: 400 }
      );
    }

    await prisma.room.deleteMany({ where: { floorListId: id } });
    const deletedFloorList = await prisma.floorList.delete({ where: { id } });

    return NextResponse.json(deletedFloorList);
  } catch (error: any) {
    return handlePrismaError(error);
  }
}
