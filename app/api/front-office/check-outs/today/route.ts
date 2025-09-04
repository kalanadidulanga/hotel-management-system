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

        // Fetch today's check-outs (both checked in and already checked out)
        const reservations = await prisma.reservation.findMany({
            where: {
                checkOutDate: {
                    gte: today,
                    lt: tomorrow,
                },
                reservationStatus: {
                    in: ['CHECKED_IN', 'CHECKED_OUT']
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
            orderBy: [
                { reservationStatus: 'asc' }, // CHECKED_IN first, then CHECKED_OUT
                { checkOutDate: 'asc' }
            ],
        });

        // Transform the data with null safety
        const transformedReservations = reservations.map(reservation => ({
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
            paidAmount: (reservation.totalAmount || 0) - (reservation.balanceAmount || 0),
            reservationStatus: reservation.reservationStatus || 'UNKNOWN',
            paymentStatus: reservation.paymentStatus || 'PENDING',
            specialRequests: reservation.specialRequests || null,
        }));

        return NextResponse.json({
            reservations: transformedReservations,
            count: transformedReservations.length,
            success: true,
        });

    } catch (error) {
        console.error("Today's check-outs fetch error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch today's check-outs",
                details: error instanceof Error ? error.message : "Unknown error",
                success: false,
                // Provide empty fallback data
                reservations: [],
                count: 0,
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}