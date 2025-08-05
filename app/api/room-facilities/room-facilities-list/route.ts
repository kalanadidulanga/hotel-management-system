import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    // Input validation
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { message: "Valid 'name' is required" },
        { status: 400 }
      );
    }

    // Check for duplicates
    const existing = await prisma.room_Facility_List.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Facility already exists with this name" },
        { status: 409 }
      );
    }

    // Create new facility
    const facility = await prisma.room_Facility_List.create({
      data: { name },
    });

    return NextResponse.json(facility, { status: 201 });
  } catch (error: any) {
    console.error("Error creating facility:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}




export async function GET(req: NextRequest) {
  try {
    const facilities = await prisma.room_Facility_List.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(facilities, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching facilities:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}



export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name } = body;

    // Validate input
    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { message: "Valid 'id' is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { message: "Valid 'name' is required" },
        { status: 400 }
      );
    }

    // Check if facility exists
    const existing = await prisma.room_Facility_List.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Facility not found" },
        { status: 404 }
      );
    }

    // Optional: check for duplicate name
    const duplicate = await prisma.room_Facility_List.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "Another facility already uses this name" },
        { status: 409 }
      );
    }

    // Update facility
    const updated = await prisma.room_Facility_List.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating facility:", error);
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

    // Validate input
    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { message: "Valid 'id' is required" },
        { status: 400 }
      );
    }

    // Check if facility exists
    const existing = await prisma.room_Facility_List.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Facility not found" },
        { status: 404 }
      );
    }

    // Delete facility
    await prisma.room_Facility_List.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Facility deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting facility:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}