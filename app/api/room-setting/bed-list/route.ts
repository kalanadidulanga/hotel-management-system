import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; // adjust path if needed

export async function GET() {
  try {
    const items = await prisma.bedType.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch bed types" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { message: "Valid 'name' (string) is required" },
        { status: 400 }
      );
    }


    // Create bed type
    const created = await prisma.bedType.create({
      data: { name },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bed type:", error);
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

   

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { message: "Valid 'name' (string) is required" },
        { status: 400 }
      );
    }

    // Update bed type
    const updated = await prisma.bedType.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating bed type:", error);
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

   

    // Delete bed type
    const deleted = await prisma.bedType.delete({
      where: { id },
    });

    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting bed type:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
