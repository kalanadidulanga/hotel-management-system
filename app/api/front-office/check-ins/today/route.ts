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

    // Fetch today's check-ins
    const reservations = await prisma.reservation.findMany({
      where: {
        checkInDate: {
          gte: today,
          lt: tomorrow,
        },
        reservationStatus: {
          in: ["CONFIRMED", "CHECKED_IN"],
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
            identityNumber: true, // Changed from 'nic' to 'identityNumber'
            address: true,
            nationality: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
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
      orderBy: [
        { reservationStatus: "asc" }, // CONFIRMED first, then CHECKED_IN
        { checkInDate: "asc" },
      ],
    });

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
      reservations: transformedReservations,
      stats: {
        total: reservations.length,
        pending: reservations.filter((r) => r.reservationStatus === "CONFIRMED")
          .length,
        checkedIn: reservations.filter(
          (r) => r.reservationStatus === "CHECKED_IN"
        ).length,
        pendingPayments: reservations.filter((r) => r.paymentStatus !== "PAID")
          .length,
      },
      success: true,
    });
  } catch (error) {
    console.error("Today's check-ins fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch today's check-ins",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
