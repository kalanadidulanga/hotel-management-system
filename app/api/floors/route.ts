import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
// GET all floors
export async function GET() {
  try {
    const floors = await prisma.floor.findMany({
      include: {
        _count: {
          select: {
            rooms: true,
          },
        },
      },
      orderBy: {
        floorNumber: "asc",
      },
    });

    // Transform for JSON response
    const transformedFloors = floors.map((floor) => ({
      ...floor,
      createdAt: floor.createdAt.toISOString(),
    }));

    return NextResponse.json({
      floors: transformedFloors,
      success: true,
      count: floors.length,
    });
  } catch (error) {
    console.error("Floors fetch error:", error);
    return NextResponse.json(
      {
        error:
          "Internal server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new floor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, floorNumber, description } = body;

    // Validation
    if (!name || !floorNumber) {
      return NextResponse.json(
        { error: "Floor name and floor number are required" },
        { status: 400 }
      );
    }

    // Check for duplicate floor number
    const existingFloor = await prisma.floor.findUnique({
      where: { floorNumber: parseInt(floorNumber) },
    });

    if (existingFloor) {
      return NextResponse.json(
        { error: "Floor number already exists" },
        { status: 400 }
      );
    }

    const newFloor = await prisma.floor.create({
      data: {
        name: name.trim(),
        floorNumber: parseInt(floorNumber),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(
      {
        floor: {
          ...newFloor,
          createdAt: newFloor.createdAt.toISOString(),
        },
        message: `Floor "${newFloor.name}" created successfully`,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Floor creation error:", error);
    return NextResponse.json(
      {
        error:
          "Internal server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
