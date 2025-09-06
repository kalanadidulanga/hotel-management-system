import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const month = parseInt(searchParams.get("month") || "1");
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const roomClassId = searchParams.get("roomClassId");
    const status = searchParams.get("status");

    // Validate month and year
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid month. Must be between 1 and 12.", success: false },
        { status: 400 }
      );
    }

    if (year < 2000 || year > 2100) {
      return NextResponse.json(
        {
          error: "Invalid year. Must be between 2000 and 2100.",
          success: false,
        },
        { status: 400 }
      );
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1); // First day of month
    const endDate = new Date(year, month, 0); // Last day of month

    // Extend to show some days from previous/next month for full calendar view
    const calendarStart = new Date(startDate);
    calendarStart.setDate(calendarStart.getDate() - startDate.getDay());

    const calendarEnd = new Date(endDate);
    calendarEnd.setDate(calendarEnd.getDate() + (6 - endDate.getDay()));

    // Build where conditions for reservations
    const whereConditions: any = {
      OR: [
        {
          // Reservations that start in this period
          checkInDate: {
            gte: calendarStart,
            lte: calendarEnd,
          },
        },
        {
          // Reservations that end in this period
          checkOutDate: {
            gte: calendarStart,
            lte: calendarEnd,
          },
        },
        {
          // Reservations that span across this period
          AND: [
            { checkInDate: { lte: calendarStart } },
            { checkOutDate: { gte: calendarEnd } },
          ],
        },
      ],
    };

    // Filter by room class
    if (roomClassId && roomClassId !== "all") {
      whereConditions.roomClassId = parseInt(roomClassId);
    }

    // Filter by status
    if (status && status !== "all") {
      whereConditions.reservationStatus = status;
    }

    // Fetch reservations for the calendar view
    const reservations = await prisma.reservation.findMany({
      where: whereConditions,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
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
      orderBy: [{ checkInDate: "asc" }, { room: { roomNumber: "asc" } }],
    });

    // Calculate today's date for stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate statistics
    const stats = {
      totalReservations: reservations.length,
      checkedIn: reservations.filter(
        (r) => r.reservationStatus === "CHECKED_IN"
      ).length,
      checkingOut: reservations.filter((r) => {
        const checkOut = new Date(r.checkOutDate);
        checkOut.setHours(0, 0, 0, 0);
        return (
          checkOut.getTime() === today.getTime() &&
          r.reservationStatus === "CHECKED_IN"
        );
      }).length,
      arriving: reservations.filter((r) => {
        const checkIn = new Date(r.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        return (
          checkIn.getTime() === today.getTime() &&
          r.reservationStatus === "CONFIRMED"
        );
      }).length,
    };

    // Transform dates for JSON serialization
    const transformedReservations = reservations.map((reservation) => ({
      ...reservation,
      checkInDate: reservation.checkInDate.toISOString(),
      checkOutDate: reservation.checkOutDate.toISOString(),
      actualCheckIn: reservation.actualCheckIn
        ? reservation.actualCheckIn.toISOString()
        : null,
      actualCheckOut: reservation.actualCheckOut
        ? reservation.actualCheckOut.toISOString()
        : null,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      calendar: {
        month,
        year,
        reservations: transformedReservations,
        stats,
      },
      filters: {
        month,
        year,
        roomClassId,
        status,
      },
      success: true,
    });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch calendar data",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
