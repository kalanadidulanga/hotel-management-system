import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db"; // adjust path if needed

export async function GET() {
  try {
    // Get today's date for filtering check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reservations = await prisma.reservation.findMany({
      where: {
        // Get reservations where check-in date is today or in the past
        // and checkout date is today or in the future
        OR: [
          {
            checkInDate: {
              gte: today,
              lt: tomorrow
            }
          },
          {
            AND: [
              {
                checkInDate: {
                  lte: today
                }
              },
              {
                checkOutDate: {
                  gte: today
                }
              }
            ]
          }
        ]
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            nationality: true
          }
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            isAvailable: true
          }
        },
        roomTypeDetails: {
          select: {
            roomType: true,
            rate: true,
            capacity: true
          }
        }
      },
      orderBy: {
        checkInDate: "asc"
      }
    });

    return NextResponse.json(reservations);
  } catch (error: any) {
    console.error("Error fetching check-in list:", error);
    return NextResponse.json(
      { message: "Failed to fetch check-in list", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reservationId, checkInNotes } = body;

    // Validate input
    if (!reservationId || typeof reservationId !== "number") {
      return NextResponse.json(
        { message: "Valid 'reservationId' (number) is required" },
        { status: 400 }
      );
    }

    // Check if reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        room: true,
        customer: true
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Reservation not found" },
        { status: 404 }
      );
    }

    // Update reservation with check-in details
    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        // You might want to add a checkedIn field to your schema
        // or use a separate CheckIn table for tracking actual check-ins
        updatedAt: new Date(),
        ...(checkInNotes && { remarks: checkInNotes })
      },
      include: {
        customer: true,
        room: true,
        roomTypeDetails: true
      }
    });

    // Update room availability
    await prisma.room.update({
      where: { id: reservation.room.id },
      data: { isAvailable: false }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error processing check-in:", error);
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
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            nationality: true
          }
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            isAvailable: true
          }
        },
        roomTypeDetails: {
          select: {
            roomType: true,
            rate: true,
            capacity: true
          }
        }
      }
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
      include: { room: true }
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Reservation not found" },
        { status: 404 }
      );
    }

    // Delete reservation (cancel check-in)
    const deleted = await prisma.reservation.delete({
      where: { id }
    });

    // Make room available again
    await prisma.room.update({
      where: { id: reservation.room.id },
      data: { isAvailable: true }
    });

    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    console.error("Error cancelling reservation:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}