import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; // adjust path if needed

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "id";
    const sortDir = searchParams.get("sortDir") || "desc";

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            {
              bookingNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              customer: {
                firstName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              customer: {
                lastName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              customer: {
                phone: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              customer: {
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              roomType: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            // Search by room number (convert to string for comparison)
            ...(isNaN(Number(search))
              ? []
              : [
                  {
                    roomNumber: {
                      equals: Number(search),
                    },
                  },
                ]),
          ],
        }
      : {};

    // Build orderBy clause
    let orderBy: any = { id: sortDir };

    switch (sortBy) {
      case "bookingNumber":
        orderBy = { bookingNumber: sortDir };
        break;
      case "customerName":
        orderBy = { customer: { firstName: sortDir } };
        break;
      case "checkInDate":
        orderBy = { checkInDate: sortDir };
        break;
      case "checkOutDate":
        orderBy = { checkOutDate: sortDir };
        break;
      case "roomType":
        orderBy = { roomType: sortDir };
        break;
      case "roomNumber":
        orderBy = { roomNumber: sortDir };
        break;
      case "total":
        orderBy = { total: sortDir };
        break;
      case "advanceAmount":
        orderBy = { advanceAmount: sortDir };
        break;
      case "balanceAmount":
        orderBy = { balanceAmount: sortDir };
        break;
      default:
        orderBy = { id: sortDir };
    }

    // Get total count for pagination
    const totalCount = await prisma.reservation.count({
      where: whereClause,
    });

    // Fetch reservations with pagination and search
    const items = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            nationality: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            isAvailable: true,
          },
        },
        roomTypeDetails: {
          select: {
            roomType: true,
            rate: true,
            capacity: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Return data with pagination info
    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { message: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingNumber,
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime,
      roomType,
      roomNumber,
      customerId,
      roomPrice,
      total,
      advanceAmount,
      balanceAmount,
      paymentMode,
      purposeOfVisit,
      billingType,
    } = body;

    // Validate required inputs
    if (!bookingNumber || typeof bookingNumber !== "string") {
      return NextResponse.json(
        { message: "Valid 'bookingNumber' (string) is required" },
        { status: 400 }
      );
    }

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { message: "Valid check-in and check-out dates are required" },
        { status: 400 }
      );
    }

    if (!roomType || !roomNumber || !customerId) {
      return NextResponse.json(
        { message: "Room type, room number, and customer ID are required" },
        { status: 400 }
      );
    }

    // Create reservation
    const created = await prisma.reservation.create({
      data: {
        bookingNumber,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        checkInTime: checkInTime || "14:00",
        checkOutTime: checkOutTime || "12:00",
        roomType,
        roomNumber: parseInt(roomNumber),
        customerId: parseInt(customerId),
        roomPrice: parseInt(roomPrice) || 0,
        total: parseInt(total) || 0,
        advanceAmount: parseInt(advanceAmount) || 0,
        balanceAmount: parseInt(balanceAmount) || 0,
        paymentMode: paymentMode || "cash",
        purposeOfVisit: purposeOfVisit || "leisure",
        billingType: billingType || "nightly",
      },
      include: {
        customer: true,
        room: true,
        roomTypeDetails: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { message: "Valid 'id' (number) is required" },
        { status: 400 }
      );
    }

    // Update reservation
    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        customer: true,
        room: true,
        roomTypeDetails: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating reservation:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { message: "Valid 'id' (number) is required" },
        { status: 400 }
      );
    }

    // Get reservation details before deletion
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Reservation not found" },
        { status: 404 }
      );
    }

    // Delete reservation
    const deleted = await prisma.reservation.delete({
      where: { id },
    });

    // Make room available again
    await prisma.room.update({
      where: { id: reservation.room.id },
      data: { isAvailable: true },
    });

    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting reservation:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
