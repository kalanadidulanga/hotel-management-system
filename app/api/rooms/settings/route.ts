import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get room classes with room count and reservation count
    const roomClasses = await prisma.roomClass.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            rooms: true,
            reservations: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 10, // Limit for overview
    });

    // Get recent rooms with status
    const recentRooms = await prisma.room.findMany({
      include: {
        roomClass: {
          select: {
            name: true,
          },
        },
        floor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    });

    // Calculate statistics
    const totalRooms = await prisma.room.count();
    const totalClasses = await prisma.roomClass.count({
      where: { isActive: true },
    });

    // Room status counts
    const roomStatusCounts = await prisma.room.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Calculate room status stats
    const statusStats = roomStatusCounts.reduce((acc: any, curr) => {
      acc[curr.status.toLowerCase() + "Rooms"] = curr._count.id;
      return acc;
    }, {});

    const availableRooms = statusStats.availableRooms || 0;
    const occupiedRooms = statusStats.occupiedRooms || 0;
    const maintenanceRooms = statusStats.maintenanceRooms || 0;
    const cleaningRooms = statusStats.cleaningRooms || 0;

    // Calculate occupancy rate
    const occupancyRate =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Calculate average rate per night
    const averageRateResult = await prisma.roomClass.aggregate({
      where: { isActive: true },
      _avg: {
        ratePerNight: true,
      },
    });
    const averageRate = averageRateResult._avg.ratePerNight || 0;

    // Transform room classes data
    const transformedRoomClasses = roomClasses.map((roomClass) => ({
      ...roomClass,
      createdAt: roomClass.createdAt.toISOString(),
      updatedAt: roomClass.updatedAt.toISOString(),
      lastCleaningUpdate: roomClass.lastCleaningUpdate.toISOString(),
    }));

    // Transform rooms data
    const transformedRecentRooms = recentRooms.map((room) => ({
      ...room,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
      lastCleaned: room.lastCleaned ? room.lastCleaned.toISOString() : null,
      nextCleaningDue: room.nextCleaningDue
        ? room.nextCleaningDue.toISOString()
        : null,
    }));

    const stats = {
      totalRooms,
      totalClasses,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      cleaningRooms,
      averageRate: Math.round(averageRate),
      occupancyRate,
    };

    return NextResponse.json({
      roomClasses: transformedRoomClasses,
      recentRooms: transformedRecentRooms,
      stats,
      success: true,
    });
  } catch (error) {
    console.error("Room settings fetch error:", error);
    return NextResponse.json(
      {
        error:
          "Internal server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
        roomClasses: [],
        recentRooms: [],
        stats: {
          totalRooms: 0,
          totalClasses: 0,
          availableRooms: 0,
          occupiedRooms: 0,
          maintenanceRooms: 0,
          cleaningRooms: 0,
          averageRate: 0,
          occupancyRate: 0,
        },
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Method not allowed. Use GET to fetch room settings." },
    { status: 405 }
  );
}
