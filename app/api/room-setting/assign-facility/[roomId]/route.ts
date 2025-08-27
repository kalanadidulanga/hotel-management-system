import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = Number(params.roomId);
    if (!roomId) {
      return NextResponse.json(
        { success: false, message: "Invalid roomId" },
        { status: 400 }
      );
    }

    const assignments = await prisma.roomFacilityAssignment.findMany({
      where: { roomId },
      include: {
        facility: {
          include: { facility_type: true },
        },
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}



export async function POST(req: NextRequest) {
  try {
    const { roomId, facilityIds } = await req.json();

    if (!roomId || !Array.isArray(facilityIds)) {
      return NextResponse.json(
        { success: false, message: "Invalid data" },
        { status: 400 }
      );
    }

    // Remove all existing assignments for this room
    await prisma.roomFacilityAssignment.deleteMany({
      where: { roomId: Number(roomId) },
    });

    // Add new assignments
    const assignments = await Promise.all(
      facilityIds.map((facilityId: number) =>
        prisma.roomFacilityAssignment.create({
          data: {
            roomId: Number(roomId),
            facilityId: Number(facilityId),
          },
        })
      )
    );

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}