import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id);
    if (!reservationId || isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID", success: false },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { extraCharges = 0, minibarCharges = 0, damageCharges = 0, lateCheckoutFee = 0, notes } = body;

    // Verify reservation exists and is eligible for check-out
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        room: {
          include: {
            floor: true,
          },
        },
        customer: true,
        roomClass: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found", success: false },
        { status: 404 }
      );
    }

    if (reservation.reservationStatus !== "CHECKED_IN") {
      return NextResponse.json(
        { error: "Guest is not currently checked in", success: false },
        { status: 400 }
      );
    }

    // Calculate additional charges
    const additionalCharges = 
      (parseFloat(extraCharges) || 0) + 
      (parseFloat(minibarCharges) || 0) + 
      (parseFloat(damageCharges) || 0) + 
      (parseFloat(lateCheckoutFee) || 0);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      try {
        // Update reservation with check-out details
        const updatedReservation = await tx.reservation.update({
          where: { id: reservationId },
          data: {
            reservationStatus: "CHECKED_OUT",
            actualCheckOut: new Date(),
            totalAmount: (reservation.totalAmount || 0) + additionalCharges,
            balanceAmount: (reservation.balanceAmount || 0) + additionalCharges,
            // Add check-out notes to remarks
            remarks: notes
              ? `Check-out notes: ${notes}${
                  reservation.remarks
                    ? `\n\nPrevious remarks: ${reservation.remarks}`
                    : ""
                }`
              : reservation.remarks,
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
        });

        // Update room status to cleaning (ready for housekeeping)
        await tx.room.update({
          where: { id: reservation.roomId },
          data: {
            status: "CLEANING",
          },
        });

        // Create additional charges record if any charges exist
        if (additionalCharges > 0) {
          const chargeDetails = [];
          if (extraCharges > 0) chargeDetails.push(`Extra Services: ${extraCharges}`);
          if (minibarCharges > 0) chargeDetails.push(`Minibar: ${minibarCharges}`);
          if (damageCharges > 0) chargeDetails.push(`Damage: ${damageCharges}`);
          if (lateCheckoutFee > 0) chargeDetails.push(`Late Checkout: ${lateCheckoutFee}`);

          // You can create a charges table entry here if you have one
          // For now, we'll just log it in the reservation remarks
          await tx.reservation.update({
            where: { id: reservationId },
            data: {
              remarks: `${updatedReservation.remarks || ''}\n\nAdditional Charges (${new Date().toISOString()}): ${chargeDetails.join(', ')} - Total: ${additionalCharges}`,
            },
          });
        }

        return updatedReservation;
      } catch (transactionError) {
        console.error("Transaction error:", transactionError);
        throw new Error(`Transaction failed: ${transactionError instanceof Error ? transactionError.message : 'Unknown transaction error'}`);
      }
    });

    // Transform dates to ISO strings with null safety
    const transformedReservation = {
      ...result,
      checkInDate: result.checkInDate?.toISOString() || null,
      checkOutDate: result.checkOutDate?.toISOString() || null,
      actualCheckIn: result.actualCheckIn?.toISOString() || null,
      actualCheckOut: result.actualCheckOut?.toISOString() || null,
      createdAt: result.createdAt?.toISOString() || null,
      updatedAt: result.updatedAt?.toISOString() || null,
    };

    return NextResponse.json({
      reservation: transformedReservation,
      additionalCharges,
      finalAmount: result.totalAmount,
      message: "Guest checked out successfully",
      success: true,
    });
  } catch (error) {
    console.error("Check-out process error:", error);
    
    // More specific error handling
    let errorMessage = "Failed to process check-out";
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        errorMessage = "Database relationship error. Please check room and customer data.";
      } else if (error.message.includes("Unique constraint")) {
        errorMessage = "Check-out conflict. This reservation may already be processed.";
      } else if (error.message.includes("Transaction failed")) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id);
    if (!reservationId || isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID", success: false },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
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
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found", success: false },
        { status: 404 }
      );
    }

    // Transform dates to ISO strings with null safety
    const transformedReservation = {
      ...reservation,
      checkInDate: reservation.checkInDate?.toISOString() || null,
      checkOutDate: reservation.checkOutDate?.toISOString() || null,
      actualCheckIn: reservation.actualCheckIn?.toISOString() || null,
      actualCheckOut: reservation.actualCheckOut?.toISOString() || null,
      createdAt: reservation.createdAt?.toISOString() || null,
      updatedAt: reservation.updatedAt?.toISOString() || null,
    };

    return NextResponse.json({
      reservation: transformedReservation,
      success: true,
    });
  } catch (error) {
    console.error("Reservation fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch reservation details",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}