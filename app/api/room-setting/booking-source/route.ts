import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; // adjust the path if needed

// GET: Fetch all booking sources
export async function GET() {
  try {
    const items = await prisma.bookingSource.findMany({
      orderBy: { id: "asc" },
      include: {
        bookingType: true, // Optional: include the related bookingType
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch booking sources" },
      { status: 500 }
    );
  }
}

// POST: Create a new booking source
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingTypeId,
      bookingSource,
      commissionRate,
      totalBalance,
      paidAmount,
      dueAmount,
    } = body;

    // Validate required fields
    if (
      !bookingTypeId ||
      !bookingSource ||
      commissionRate === undefined ||
      totalBalance === undefined ||
      paidAmount === undefined ||
      dueAmount === undefined
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const created = await prisma.bookingSource.create({
      data: {
        bookingTypeId,
        bookingSource,
        commissionRate,
        totalBalance,
        paidAmount,
        dueAmount,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking source:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update a booking source
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      bookingTypeId,
      bookingSource,
      commissionRate,
      totalBalance,
      paidAmount,
      dueAmount,
    } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Valid 'id' is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.bookingSource.update({
      where: { id },
      data: {
        bookingTypeId,
        bookingSource,
        commissionRate,
        totalBalance,
        paidAmount,
        dueAmount,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating booking source:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a booking source
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Valid 'id' is required" },
        { status: 400 }
      );
    }

    const deleted = await prisma.bookingSource.delete({
      where: { id },
    });

    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting booking source:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
