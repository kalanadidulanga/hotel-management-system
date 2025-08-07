import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all floorLists
export async function GET() {
  try {
    const items = await prisma.floorList.findMany({
      orderBy: { id: "asc" },
      include: { floor: true }, // include parent Floor
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch floor lists" },
      { status: 500 }
    );
  }
}

// CREATE a floorList
export async function POST(req: NextRequest) {
  try {
    const { floorName, noOfRoom, startRoomNo } = await req.json();

    if (!floorName || !noOfRoom || !startRoomNo) {
      return NextResponse.json(
        { message: "'floorName', 'noOfRoom', and 'startRoomNo' are required" },
        { status: 400 }
      );
    }

    const created = await prisma.floorList.create({
      data: {
        floorName,
        noOfRoom,
        startRoomNo,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to create floor list", error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE a floorList
export async function PUT(req: NextRequest) {
  try {
    const { id, floorName, noOfRoom, startRoomNo } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "'id' is required for update" },
        { status: 400 }
      );
    }

    const updated = await prisma.floorList.update({
      where: { id },
      data: {
        floorName,
        noOfRoom,
        startRoomNo,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to update floor list", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE a floorList
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    const deleted = await prisma.floorList.delete({
      where: { id },
    });

    return NextResponse.json(deleted);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to delete floor list", error: error.message },
      { status: 500 }
    );
  }
}
