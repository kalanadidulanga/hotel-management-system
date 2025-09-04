import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "all"; // all, nic, phone, email, name, booking

    console.log("Quick search query:", query, "type:", type);

    if (!query || query.length < 2) {
      return NextResponse.json({
        customers: [],
        reservations: [],
        message: "Please enter at least 2 characters to search",
        success: true,
      });
    }

    let customers = [];
    let reservations = [];

    // Search customers
    if (
      type === "all" ||
      type === "nic" ||
      type === "phone" ||
      type === "email" ||
      type === "name"
    ) {
      const customerSearchConditions = [];

      if (type === "all" || type === "nic") {
        customerSearchConditions.push({
          identityNumber: {
            contains: query,
            mode: "insensitive",
          },
        });
      }

      if (type === "all" || type === "phone") {
        customerSearchConditions.push({
          phone: {
            contains: query,
            mode: "insensitive",
          },
        });
        // Also search alternate phone
        customerSearchConditions.push({
          alternatePhone: {
            contains: query,
            mode: "insensitive",
          },
        });
      }

      if (type === "all" || type === "email") {
        customerSearchConditions.push({
          email: {
            contains: query,
            mode: "insensitive",
          },
        });
      }

      if (type === "all" || type === "name") {
        customerSearchConditions.push({
          firstName: {
            contains: query,
            mode: "insensitive",
          },
        });
        customerSearchConditions.push({
          lastName: {
            contains: query,
            mode: "insensitive",
          },
        });
        customerSearchConditions.push({
          fullName: {
            contains: query,
            mode: "insensitive",
          },
        });
      }

      customers = await prisma.customer.findMany({
        where: {
          AND: [
            { isActive: true }, // Only active customers
            {
              OR: customerSearchConditions,
            },
          ],
        },
        include: {
          reservations: {
            include: {
              room: {
                select: {
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
            orderBy: {
              createdAt: "desc",
            },
            take: 5, // Latest 5 reservations per customer
          },
        },
        take: 10, // Limit to 10 customers
      });
    }

    // Search reservations by booking number
    if (type === "all" || type === "booking") {
      reservations = await prisma.reservation.findMany({
        where: {
          bookingNumber: {
            contains: query,
            mode: "insensitive",
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              customerID: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true,
              identityNumber: true,
              nationality: true,
              isVip: true,
              vipLevel: true,
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
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });
    }

    // Transform data for response
    const transformedCustomers = customers.map((customer) => ({
      ...customer,
      createdAt: customer.createdAt?.toISOString() || null,
      updatedAt: customer.updatedAt?.toISOString() || null,
      dateOfBirth: customer.dateOfBirth?.toISOString() || null,
      anniversary: customer.anniversary?.toISOString() || null,
      reservations: customer.reservations.map((reservation) => ({
        ...reservation,
        checkInDate: reservation.checkInDate?.toISOString() || null,
        checkOutDate: reservation.checkOutDate?.toISOString() || null,
        actualCheckIn: reservation.actualCheckIn?.toISOString() || null,
        actualCheckOut: reservation.actualCheckOut?.toISOString() || null,
        createdAt: reservation.createdAt?.toISOString() || null,
        updatedAt: reservation.updatedAt?.toISOString() || null,
        cancellationDate: reservation.cancellationDate?.toISOString() || null,
      })),
    }));

    const transformedReservations = reservations.map((reservation) => ({
      ...reservation,
      checkInDate: reservation.checkInDate?.toISOString() || null,
      checkOutDate: reservation.checkOutDate?.toISOString() || null,
      actualCheckIn: reservation.actualCheckIn?.toISOString() || null,
      actualCheckOut: reservation.actualCheckOut?.toISOString() || null,
      createdAt: reservation.createdAt?.toISOString() || null,
      updatedAt: reservation.updatedAt?.toISOString() || null,
      cancellationDate: reservation.cancellationDate?.toISOString() || null,
    }));

    console.log(
      `Found ${transformedCustomers.length} customers and ${transformedReservations.length} reservations`
    );

    return NextResponse.json({
      customers: transformedCustomers,
      reservations: transformedReservations,
      query,
      type,
      stats: {
        customersFound: transformedCustomers.length,
        reservationsFound: transformedReservations.length,
        totalResults:
          transformedCustomers.length + transformedReservations.length,
      },
      success: true,
    });
  } catch (error) {
    console.error("Quick search error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform search",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
        customers: [],
        reservations: [],
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
