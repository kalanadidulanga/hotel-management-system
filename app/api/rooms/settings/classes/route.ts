import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Get all room classes with related data
    const roomClasses = await prisma.roomClass.findMany({
      include: {
        _count: {
          select: {
            rooms: true,
            reservations: true,
            roomImages: true,
            roomOffers: {
              where: {
                isActive: true,
              },
            },
            complementaryItems: true,
          },
        },
      },
      orderBy: [
        { isActive: "desc" }, // Active classes first
        { name: "asc" }, // Then alphabetically
      ],
    });

    // Calculate statistics
    const stats = {
      totalClasses: roomClasses.length,
      activeClasses: roomClasses.filter((rc) => rc.isActive).length,
      totalRooms: roomClasses.reduce((sum, rc) => sum + rc._count.rooms, 0),
      totalReservations: roomClasses.reduce(
        (sum, rc) => sum + rc._count.reservations,
        0
      ),
      averageRate:
        roomClasses.length > 0
          ? Math.round(
              roomClasses.reduce((sum, rc) => sum + rc.ratePerNight, 0) /
                roomClasses.length
            )
          : 0,
    };

    // Transform data for JSON response
    const transformedRoomClasses = roomClasses.map((roomClass) => ({
      ...roomClass,
      createdAt: roomClass.createdAt.toISOString(),
      updatedAt: roomClass.updatedAt.toISOString(),
      lastCleaningUpdate: roomClass.lastCleaningUpdate.toISOString(),
    }));

    return NextResponse.json({
      roomClasses: transformedRoomClasses,
      stats,
      success: true,
    });
  } catch (error) {
    console.error("Room classes fetch error:", error);
    return NextResponse.json(
      {
        error:
          "Internal server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
        roomClasses: [],
        stats: {
          totalClasses: 0,
          activeClasses: 0,
          totalRooms: 0,
          totalReservations: 0,
          averageRate: 0,
        },
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Remove DELETE from here - it belongs in the [id] route
export async function POST() {
  return NextResponse.json(
    {
      error: "Method not allowed. Use GET to fetch room classes.",
    },
    { status: 405 }
  );
}
