import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get week range
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Get month range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Parallel queries for better performance
    const [
      roomStats,
      todayReservations,
      checkingInToday,
      checkingOutToday,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      pendingPayments,
      recentActivities,
      maintenanceRooms,
      overdueCheckouts,
    ] = await Promise.all([
      // Room occupancy stats
      prisma.room.groupBy({
        by: ["status"],
        where: { isActive: true },
        _count: true,
      }),

      // Today's reservations
      prisma.reservation.count({
        where: {
          OR: [
            { checkInDate: { gte: today, lt: tomorrow } },
            { checkOutDate: { gte: today, lt: tomorrow } },
          ],
          reservationStatus: { in: ["CONFIRMED", "CHECKED_IN"] },
        },
      }),

      // Today's check-ins
      prisma.reservation.findMany({
        where: {
          checkInDate: { gte: today, lt: tomorrow },
          reservationStatus: "CONFIRMED",
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          room: {
            select: {
              roomNumber: true,
            },
          },
          roomClass: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { checkInDate: "asc" },
        take: 10,
      }),

      // Today's check-outs
      prisma.reservation.findMany({
        where: {
          checkOutDate: { gte: today, lt: tomorrow },
          reservationStatus: "CHECKED_IN",
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          room: {
            select: {
              roomNumber: true,
            },
          },
          roomClass: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { checkOutDate: "asc" },
        take: 10,
      }),

      // Today's revenue
      prisma.reservation.aggregate({
        where: {
          OR: [
            { checkInDate: { gte: today, lt: tomorrow } },
            { actualCheckIn: { gte: today, lt: tomorrow } },
          ],
          reservationStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Week's revenue
      prisma.reservation.aggregate({
        where: {
          checkInDate: { gte: weekStart, lt: weekEnd },
          reservationStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Month's revenue
      prisma.reservation.aggregate({
        where: {
          checkInDate: { gte: monthStart, lte: monthEnd },
          reservationStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Pending payments
      prisma.reservation.aggregate({
        where: {
          paymentStatus: { in: ["PENDING", "PARTIAL"] },
          reservationStatus: { in: ["CONFIRMED", "CHECKED_IN"] },
        },
        _sum: {
          balanceAmount: true,
        },
        _count: true,
      }),

      // Recent activities (mock data - you might want to create an activity log table)
      prisma.reservation.findMany({
        where: {
          OR: [
            {
              actualCheckIn: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
            {
              actualCheckOut: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
            { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          ],
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          room: {
            select: {
              roomNumber: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),

      // Maintenance rooms count
      prisma.room.count({
        where: {
          status: { in: ["MAINTENANCE", "OUT_OF_ORDER", "CLEANING"] },
          isActive: true,
        },
      }),

      // Overdue checkouts (past checkout time and still checked in)
      prisma.reservation.count({
        where: {
          checkOutDate: { lt: today },
          reservationStatus: "CHECKED_IN",
        },
      }),
    ]);

    // Process room stats
    const totalRooms = roomStats.reduce((sum, stat) => sum + stat._count, 0);
    const occupiedRooms =
      roomStats.find((stat) => stat.status === "OCCUPIED")?._count || 0;
    const availableRooms =
      roomStats.find((stat) => stat.status === "AVAILABLE")?._count || 0;
    const maintenanceRoomsCount = roomStats
      .filter((stat) =>
        ["MAINTENANCE", "OUT_OF_ORDER", "CLEANING"].includes(stat.status)
      )
      .reduce((sum, stat) => sum + stat._count, 0);

    const occupancyRate =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Transform check-in/check-out data
    const transformReservation = (reservation: any) => ({
      id: reservation.id,
      bookingNumber: reservation.bookingNumber,
      customerName: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
      customerPhone: reservation.customer.phone,
      roomNumber: reservation.room.roomNumber,
      roomClass: reservation.roomClass.name,
      checkInTime: reservation.checkInDate.toISOString(),
      checkOutTime: reservation.checkOutDate.toISOString(),
      adults: reservation.adults,
      children: reservation.children,
      totalAmount: reservation.totalAmount,
      status: reservation.reservationStatus,
    });

    // Transform recent activities
    const transformedActivities = recentActivities.map((activity, index) => ({
      id: activity.id,
      type: activity.actualCheckIn
        ? "CHECK_IN"
        : activity.actualCheckOut
        ? "CHECK_OUT"
        : "BOOKING",
      description: activity.actualCheckIn
        ? "Guest checked in"
        : activity.actualCheckOut
        ? "Guest checked out"
        : "New booking created",
      customerName: `${activity.customer.firstName} ${activity.customer.lastName}`,
      roomNumber: activity.room.roomNumber,
      amount: activity.totalAmount,
      timestamp: (
        activity.actualCheckIn ||
        activity.actualCheckOut ||
        activity.createdAt
      ).toISOString(),
      status: activity.reservationStatus,
    }));

    // Prepare dashboard stats
    const stats = {
      occupancy: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms: maintenanceRoomsCount,
        occupancyRate,
      },
      reservations: {
        totalToday: todayReservations,
        checkingInToday: checkingInToday.length,
        checkingOutToday: checkingOutToday.length,
        confirmedReservations: checkingInToday.length,
      },
      revenue: {
        todayRevenue: todayRevenue._sum.totalAmount || 0,
        weekRevenue: weekRevenue._sum.totalAmount || 0,
        monthRevenue: monthRevenue._sum.totalAmount || 0,
        pendingPayments: pendingPayments._sum.balanceAmount || 0,
      },
      alerts: {
        overdueCheckouts,
        maintenanceRooms: maintenanceRooms,
        pendingPayments: pendingPayments._count,
        lowInventory: 0, // You can implement this based on your inventory system
      },
    };

    return NextResponse.json({
      stats,
      recentActivities: transformedActivities,
      upcomingCheckIns: checkingInToday.map(transformReservation),
      upcomingCheckOuts: checkingOutToday.map(transformReservation),
      success: true,
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
