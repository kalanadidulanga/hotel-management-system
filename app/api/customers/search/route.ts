import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { searchTerm, searchType } = await request.json();

    if (!searchTerm || typeof searchTerm !== "string") {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 }
      );
    }

    const trimmedTerm = searchTerm.trim();

    // Build search conditions based on search type
    const searchConditions: any = {
      isActive: true, // Only search active customers
    };

    if (searchType === "nic") {
      // NIC-specific search (exact match for identity number)
      // For SQLite, we use contains instead of exact match for better results
      searchConditions.identityNumber = {
        contains: trimmedTerm,
      };
    } else {
      // General search across multiple fields
      // For SQLite, we remove the mode: 'insensitive' since it's not supported
      searchConditions.OR = [
        // Name search
        {
          firstName: {
            contains: trimmedTerm,
          },
        },
        {
          lastName: {
            contains: trimmedTerm,
          },
        },
        {
          fullName: {
            contains: trimmedTerm,
          },
        },
        // Contact search
        {
          email: {
            contains: trimmedTerm,
          },
        },
        {
          phone: {
            contains: trimmedTerm,
          },
        },
        {
          alternatePhone: {
            contains: trimmedTerm,
          },
        },
        // Identity search
        {
          identityNumber: {
            contains: trimmedTerm,
          },
        },
        // Customer ID search
        {
          customerID: {
            contains: trimmedTerm,
          },
        },
        // Address search
        {
          address: {
            contains: trimmedTerm,
          },
        },
        {
          city: {
            contains: trimmedTerm,
          },
        },
        {
          country: {
            contains: trimmedTerm,
          },
        },
      ];
    }

    // Execute search with related data
    const customers = await prisma.customer.findMany({
      where: searchConditions,
      include: {
        _count: {
          select: {
            reservations: true,
            quickOrders: true,
            wakeUpCalls: true,
          },
        },
        reservations: {
          where: {
            reservationStatus: "CHECKED_IN",
          },
          include: {
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
          take: 1,
          orderBy: {
            checkInDate: "desc",
          },
        },
      },
      orderBy: [
        { isVip: "desc" }, // VIP customers first
        { createdAt: "desc" }, // Then by creation date
      ],
      take: 50, // Limit results to 50 for performance
    });

    // Transform results to include current stay info
    const transformedCustomers = customers.map((customer: {
      dateOfBirth: Date | null;
      createdAt: Date;
      updatedAt: Date;
      anniversary: Date | null;
      reservations: Array<{
        checkInDate: Date;
        checkOutDate: Date;
        createdAt: Date;
        updatedAt: Date;
        actualCheckIn: Date | null;
        actualCheckOut: Date | null;
        cancellationDate: Date | null;
        [key: string]: any;
      }>;
      [key: string]: any;
    }) => ({
      ...customer,
      // Convert dates to strings for JSON serialization
      dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.toISOString() : null,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      anniversary: customer.anniversary
        ? customer.anniversary.toISOString()
        : null,
      currentStay:
        customer.reservations.length > 0
          ? {
              ...customer.reservations[0],
              checkInDate: customer.reservations[0].checkInDate.toISOString(),
              checkOutDate: customer.reservations[0].checkOutDate.toISOString(),
              createdAt: customer.reservations[0].createdAt.toISOString(),
              updatedAt: customer.reservations[0].updatedAt.toISOString(),
              actualCheckIn: customer.reservations[0].actualCheckIn
                ? customer.reservations[0].actualCheckIn.toISOString()
                : null,
              actualCheckOut: customer.reservations[0].actualCheckOut
                ? customer.reservations[0].actualCheckOut.toISOString()
                : null,
              cancellationDate: customer.reservations[0].cancellationDate
                ? customer.reservations[0].cancellationDate.toISOString()
                : null,
            }
          : null,
      reservations: undefined, // Remove reservations from response to keep it clean
    }));

    return NextResponse.json({
      customers: transformedCustomers,
      total: transformedCustomers.length,
      searchTerm: trimmedTerm,
      searchType: searchType || "general",
    });
  } catch (error) {
    console.error("Customer search error:", error);
    return NextResponse.json(
      {
        error:
          "Internal server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for customer search." },
    { status: 405 }
  );
}
