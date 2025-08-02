import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";



export async function GET() {
  try {
    const roomSizes = await prisma.room_Size_List.findMany({
      orderBy: { id: "asc" }, // Optional: sort by ID
    });

    return NextResponse.json(roomSizes, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching room sizes:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { room_size } = body;

    // Validate input
    if (!room_size || typeof room_size !== "string") {
      return NextResponse.json(
        { message: "Valid 'room_size' (string) is required" },
        { status: 400 }
      );
    }

    // Check for duplicate room size
    const existing = await prisma.room_Size_List.findUnique({
      where: { name: room_size },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Room size already exists" },
        { status: 409 }
      );
    }

    // Create room size
    const created = await prisma.room_Size_List.create({
      data: { name: room_size },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating room size:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}


export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, room_size } = body;

    // Validation
    if (
      !id ||
      typeof id !== "number" ||
      !room_size ||
      typeof room_size !== "string"
    ) {
      return NextResponse.json(
        {
          message: "Valid 'id' (number) and 'room_size' (string) are required",
        },
        { status: 400 }
      );
    }

    // Check if the item exists
    const existing = await prisma.room_Size_List.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Room size not found" },
        { status: 404 }
      );
    }

    // Update
    const updated = await prisma.room_Size_List.update({
      where: { id },
      data: { name: room_size },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating room size:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}



export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Valid 'id' is required" },
        { status: 400 }
      );
    }

    // Check if the item exists
    const existing = await prisma.room_Size_List.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Room size not found" },
        { status: 404 }
      );
    }

    // Delete
    await prisma.room_Size_List.delete({ where: { id } });

    return NextResponse.json({ message: "Room size deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting room size:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

