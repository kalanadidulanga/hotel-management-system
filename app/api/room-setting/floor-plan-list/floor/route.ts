import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all floors
export async function GET() {
  try {
    const items = await prisma.floor.findMany({
      orderBy: { id: "asc" },
      include: { floorLists: true }, // Include related FloorList entries
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch floors" },
      { status: 500 }
    );
  }
}

// CREATE a floor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { message: "Valid 'name' is required" },
        { status: 400 }
      );
    }

    const created = await prisma.floor.create({
      data: { name },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to create floor", error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE a floor
export async function PUT(req: NextRequest) {
  try {
    const { id, name } = await req.json();

    if (!id || !name || typeof name !== "string") {
      return NextResponse.json(
        { message: "Valid 'id' and 'name' are required" },
        { status: 400 }
      );
    }

    const updated = await prisma.floor.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to update floor", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE a floor
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    const deleted = await prisma.floor.delete({
      where: { id },
    });

    return NextResponse.json(deleted);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to delete floor", error: error.message },
      { status: 500 }
    );
  }
}
