import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all promocodes
export async function GET() {
  try {
    const promocodes = await prisma.promocode.findMany({
      orderBy: { id: "asc" },
      include: {
        room: true, // include room info (optional)
      },
    });

    return NextResponse.json(promocodes);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch promocodes" },
      { status: 500 }
    );
  }
}

// Create new promocode
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomType, fromDate, toDate, discount, promocode, status } = body;

    if (
      !roomType ||
      !fromDate ||
      !toDate ||
      !discount ||
      !promocode ||
      !status
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const created = await prisma.promocode.create({
      data: {
        roomType,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        discount: Number(discount),
        promocode,
        status,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating promocode:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// Update promocode
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, roomType, fromDate, toDate, discount, promocode, status } =
      body;

    if (!id) {
      return NextResponse.json(
        { message: "'id' is required for update" },
        { status: 400 }
      );
    }

    const updated = await prisma.promocode.update({
      where: { id },
      data: {
        roomType,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        discount: Number(discount),
        promocode,
        status,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating promocode:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// Delete promocode
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "'id' is required for deletion" },
        { status: 400 }
      );
    }

    const deleted = await prisma.promocode.delete({
      where: { id },
    });

    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting promocode:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
