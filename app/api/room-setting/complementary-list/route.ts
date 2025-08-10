// /app/api/room-setting/complementary-list/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all complementary items
export async function GET() {
  try {
    const items = await prisma.complementaryItem.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET Complementary Items Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch complementary items" },
      { status: 500 }
    );
  }
}

// POST - create new complementary item
export async function POST(req: Request) {
  try {
    const { roomType, complementary, rate } = await req.json();

    if (!roomType?.trim() || !complementary?.trim()) {
      return NextResponse.json(
        { message: "Room type and complementary are required" },
        { status: 400 }
      );
    }

    const newItem = await prisma.complementaryItem.create({
      data: {
        roomType,
        complementary,
        rate: Number(rate) || 0,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("POST Complementary Item Error:", error);
    return NextResponse.json(
      { message: "Failed to create complementary item" },
      { status: 500 }
    );
  }
}

// PUT - update complementary item
export async function PUT(req: Request) {
  try {
    const { id, roomType, complementary, rate } = await req.json();

    if (!id || !roomType?.trim() || !complementary?.trim()) {
      return NextResponse.json(
        { message: "ID, room type, and complementary are required" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.complementaryItem.update({
      where: { id: Number(id) },
      data: {
        roomType,
        complementary,
        rate: Number(rate) || 0,
      },
    });

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error("PUT Complementary Item Error:", error);
    return NextResponse.json(
      { message: "Failed to update complementary item" },
      { status: 500 }
    );
  }
}

// DELETE - remove complementary item
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    await prisma.complementaryItem.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Complementary Item Error:", error);
    return NextResponse.json(
      { message: "Failed to delete complementary item" },
      { status: 500 }
    );
  }
}
