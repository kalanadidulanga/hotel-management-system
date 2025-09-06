import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("Check-out date range:");
    console.log("Today (start):", today.toISOString());
    console.log("Tomorrow (end):", tomorrow.toISOString());

    // First, let's see what reservations exist
    const allReservations = await prisma.reservation.findMany({
      select: {
        id: true,
        bookingNumber: true,
        checkOutDate: true,
        reservationStatus: true,
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
    });

    console.log("All reservations in database:", allReservations.length);
    console.log("Sample reservations:", allReservations.slice(0, 3));

    // Check reservations with today's checkout date
    const todayCheckouts = await prisma.reservation.findMany({
      where: {
        checkOutDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        bookingNumber: true,
        checkOutDate: true,
        reservationStatus: true,
      },
    });

    console.log(
      "Reservations with today's checkout date:",
      todayCheckouts.length
    );
    console.log("Today's checkouts:", todayCheckouts);

    // Fetch today's check-outs with more flexible status filtering
    const reservations = await prisma.reservation.findMany({
      where: {
        checkOutDate: {
          gte: today,
          lt: tomorrow,
        },
        // More inclusive status filter
        reservationStatus: {
          in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"], // Added CONFIRMED for reservations that should check out today
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            identityNumber: true,
            address: true,
            nationality: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            status: true,
            floor: {
              select: {
                name: true,
              },
            },
          },
        },
        roomClass: {
          select: {
            name: true,
            maxOccupancy: true,
          },
        },
      },
      orderBy: [{ reservationStatus: "asc" }, { checkOutDate: "asc" }],
    });

    console.log("Final filtered reservations:", reservations.length);

    // Transform the data with null safety
    const transformedReservations = reservations.map((reservation) => ({
      ...reservation,
      checkInDate: reservation.checkInDate?.toISOString() || null,
      checkOutDate: reservation.checkOutDate?.toISOString() || null,
      actualCheckIn: reservation.actualCheckIn?.toISOString() || null,
      actualCheckOut: reservation.actualCheckOut?.toISOString() || null,
      createdAt: reservation.createdAt?.toISOString() || null,
      updatedAt: reservation.updatedAt?.toISOString() || null,
      // Ensure all required fields have fallbacks
      bookingNumber: reservation.bookingNumber || `BOOK-${reservation.id}`,
      adults: reservation.adults || 0,
      children: reservation.children || 0,
      numberOfNights: reservation.numberOfNights || 0,
      totalAmount: reservation.totalAmount || 0,
      balanceAmount: reservation.balanceAmount || 0,
      paidAmount:
        (reservation.totalAmount || 0) - (reservation.balanceAmount || 0),
      reservationStatus: reservation.reservationStatus || "UNKNOWN",
      paymentStatus: reservation.paymentStatus || "PENDING",
      specialRequests: reservation.specialRequests || null,
    }));

    // Add stats like check-in API
    const stats = {
      total: transformedReservations.length,
      pendingCheckout: transformedReservations.filter(
        (r) => r.reservationStatus === "CHECKED_IN"
      ).length,
      checkedOut: transformedReservations.filter(
        (r) => r.reservationStatus === "CHECKED_OUT"
      ).length,
      confirmed: transformedReservations.filter(
        (r) => r.reservationStatus === "CONFIRMED"
      ).length,
      pendingPayments: transformedReservations.filter(
        (r) => r.paymentStatus !== "PAID"
      ).length,
    };

    console.log("Stats:", stats);

    return NextResponse.json({
      reservations: transformedReservations,
      stats: stats,
      count: transformedReservations.length,
      success: true,
      debug: {
        dateRange: {
          today: today.toISOString(),
          tomorrow: tomorrow.toISOString(),
        },
        totalReservationsInDb: allReservations.length,
        todayCheckoutCount: todayCheckouts.length,
      },
    });
  } catch (error) {
    console.error("Today's check-outs fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch today's check-outs",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
        reservations: [],
        count: 0,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
