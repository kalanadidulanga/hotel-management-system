import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Fetch all rooms with bed type info
export async function GET() {
  try {
    const rooms = await prisma.roomList.findMany({
      orderBy: { id: "asc" },
      include: { bedType: true },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch room list" },
      { status: 500 }
    );
  }
}

// POST: Create a new room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomType,
      rate,
      bedCharge,
      hourlyCharge,
      personCharge,
      capacity,
      extraCapability,
      roomSize,
      bedNo,
      bedTypeId,
      roomDescription,
      reserveCondition,
    } = body;

    // Validate required fields
    if (
      !roomType ||
      typeof roomType !== "string" ||
      typeof rate !== "number" ||
      typeof bedCharge !== "number" ||
      typeof hourlyCharge !== "number" ||
      typeof personCharge !== "number" ||
      typeof capacity !== "number" ||
      typeof extraCapability !== "boolean" ||
      !roomSize ||
      typeof roomSize !== "string" ||
      typeof bedNo !== "number" ||
      typeof bedTypeId !== "number"
    ) {
      return NextResponse.json(
        { message: "Missing or invalid room fields" },
        { status: 400 }
      );
    }

    const created = await prisma.roomList.create({
      data: {
        roomType,
        rate,
        bedCharge,
        hourlyCharge,
        personCharge,
        capacity,
        extraCapability,
        roomSize,
        bedNo,
        bedTypeId,
        roomDescription: roomDescription, 
        reserveCondition: reserveCondition 
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update an existing room
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      roomType,
      rate,
      bedCharge,
      hourlyCharge,
      personCharge,
      capacity,
      extraCapability,
      roomSize,
      bedNo,
      bedTypeId,
      roomDescription,
      reserveCondition,
    } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { message: "Valid 'id' is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.roomList.update({
      where: { id },
      data: {
        roomType,
        rate,
        bedCharge,
        hourlyCharge,
        personCharge,
        capacity,
        extraCapability,
        roomSize,
        bedNo,
        bedTypeId,
        roomDescription: roomDescription,
        reserveCondition : reserveCondition
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a room by ID
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { message: "Valid 'id' is required" },
        { status: 400 }
      );
    }

    const deleted = await prisma.roomList.delete({
      where: { id },
    });

    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
