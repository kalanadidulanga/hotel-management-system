import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  const { roomId, facilityIds } = await req.json();

  if (!roomId || !Array.isArray(facilityIds)) {
    return NextResponse.json(
      { success: false, message: "Invalid data" },
      { status: 400 }
    );
  }

  // Remove all assignments for this room
  await prisma.roomFacilityAssignment.deleteMany({
    where: { roomId: Number(roomId) },
  });

  // Add new assignments
  await Promise.all(
    facilityIds.map((facilityId: number) =>
      prisma.roomFacilityAssignment.create({
        data: { roomId: Number(roomId), facilityId: Number(facilityId) },
      })
    )
  );

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = Number(searchParams.get("roomId"));
  if (!roomId) return NextResponse.json([], { status: 200 });

  const assignments = await prisma.roomFacilityAssignment.findMany({
    where: { roomId },
    select: { facilityId: true },
  });

  return NextResponse.json(assignments.map((a) => a.facilityId));
}
