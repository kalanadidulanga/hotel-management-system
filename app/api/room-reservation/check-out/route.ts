import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Get all ongoing checkouts (occupied rooms) with search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let whereClause: any = {
      isAvailable: false, // Only occupied rooms
    };

    // Add search functionality
    if (search) {
      whereClause = {
        AND: [
          { isAvailable: false },
          {
            OR: [
              {
                roomNumber: {
                  equals: isNaN(Number(search)) ? undefined : Number(search),
                },
              },
              {
                reservations: {
                  some: {
                    customer: {
                      OR: [
                        {
                          firstName: {
                            contains: search,
                            mode: "insensitive",
                          },
                        },
                        {
                          lastName: {
                            contains: search,
                            mode: "insensitive",
                          },
                        },
                        {
                          phone: {
                            contains: search,
                            mode: "insensitive",
                          },
                        },
                      ],
                    },
                  },
                },
              },
              {
                reservations: {
                  some: {
                    bookingNumber: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ].filter(
              (condition) =>
                !(
                  condition.roomNumber &&
                  condition.roomNumber.equals === undefined
                )
            ),
          },
        ],
      };
    }

    const occupiedRooms = await prisma.room.findMany({
      where: whereClause,
      include: {
        reservations: {
          orderBy: {
            checkInDate: "desc",
          },
          take: 1, // Get latest reservation
          include: {
            customer: true,
          },
        },
      },
    });

    const checkoutList = occupiedRooms.map((room) => ({
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType || "Standard",
      isAvailable: room.isAvailable,
      reservation: room.reservations[0] || null,
    }));

    return NextResponse.json({
      success: true,
      data: checkoutList,
      searchTerm: search,
      totalFound: checkoutList.length,
    });
  } catch (error) {
    console.error("Error fetching occupied rooms:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch occupied rooms" },
      { status: 500 }
    );
  }
}

// Checkout room (change room status to available)
export async function POST(req: NextRequest) {
  try {
    const { roomNumber } = await req.json();

    if (!roomNumber) {
      return NextResponse.json(
        { success: false, message: "Room number is required" },
        { status: 400 }
      );
    }

    // Check if room exists and is occupied
    const room = await prisma.room.findUnique({
      where: { roomNumber: Number(roomNumber) },
      include: {
        reservations: {
          orderBy: { checkInDate: "desc" },
          take: 1,
          include: { customer: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    if (room.isAvailable) {
      return NextResponse.json(
        { success: false, message: "Room is already available" },
        { status: 400 }
      );
    }

    // Update room status to available
    const updatedRoom = await prisma.room.update({
      where: { roomNumber: Number(roomNumber) },
      data: { isAvailable: true },
    });

    return NextResponse.json({
      success: true,
      message: `Room ${roomNumber} checked out successfully`,
      data: updatedRoom,
      guestName: room.reservations[0]?.customer
        ? `${room.reservations[0].customer.firstName} ${
            room.reservations[0].customer.lastName || ""
          }`
        : "Guest",
    });
  } catch (error) {
    console.error("Error checking out room:", error);
    return NextResponse.json(
      { success: false, message: "Failed to checkout room" },
      { status: 500 }
    );
  }
}
