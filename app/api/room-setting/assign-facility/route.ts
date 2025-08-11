import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const assignments = await prisma.roomFacilityAssignment.findMany({
      include: {
        room: true,
        facility: {
          include: {
            facility_type: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error("Error fetching facility assignments:", error);
    return NextResponse.json(
      { message: "Failed to fetch facility assignments", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, facilityIds } = body;

    // Validate input
    if (!roomId || typeof roomId !== "number") {
      return NextResponse.json(
        { message: "Valid 'roomId' (number) is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(facilityIds)) {
      return NextResponse.json(
        { message: "Valid 'facilityIds' (array) is required" },
        { status: 400 }
      );
    }

    // Check if room exists
    const room = await prisma.roomList.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    // Delete existing assignments for this room
    await prisma.roomFacilityAssignment.deleteMany({
      where: { roomId },
    });

    // Create new assignments
    if (facilityIds.length > 0) {
      const assignments = facilityIds.map((facilityId: number) => ({
        roomId,
        facilityId,
      }));

      await prisma.roomFacilityAssignment.createMany({
        data: assignments,
      });
    }

    return NextResponse.json(
      {
        message: "Facilities assigned successfully",
        assignedCount: facilityIds.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error assigning facilities:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, facilityIds } = body;

    if (!roomId || typeof roomId !== "number") {
      return NextResponse.json(
        { message: "Valid 'roomId' (number) is required" },
        { status: 400 }
      );
    }

    let deletedCount = 0;

    if (facilityIds && Array.isArray(facilityIds)) {
      // Delete specific facility assignments
      const result = await prisma.roomFacilityAssignment.deleteMany({
        where: {
          roomId,
          facilityId: {
            in: facilityIds,
          },
        },
      });
      deletedCount = result.count;
    } else {
      // Delete all assignments for the room
      const result = await prisma.roomFacilityAssignment.deleteMany({
        where: { roomId },
      });
      deletedCount = result.count;
    }

    return NextResponse.json(
      {
        message: "Facility assignments deleted successfully",
        deletedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting facility assignments:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
