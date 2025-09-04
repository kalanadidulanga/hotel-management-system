import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// GET - Fetch reservation data for check-in
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ await params
    const reservationId = parseInt(id);

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Fetch reservation with all necessary data for check-in
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        customer: {
          select: {
            id: true,
            customerID: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            isVip: true,
            vipLevel: true,
            nationality: true,
            identityType: true,
            identityNumber: true,
            frontIdUrl: true,
            backIdUrl: true,
            guestImageUrl: true,
            address: true,
            specialRequests: true,
            notes: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            status: true,
            floor: {
              select: {
                id: true,
                name: true,
                floorNumber: true,
              },
            },
            facilities: {
              include: {
                facility: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    isChargeable: true,
                    chargeAmount: true,
                  },
                },
              },
            },
          },
        },
        roomClass: {
          select: {
            id: true,
            name: true,
            ratePerNight: true,
            rateDayUse: true,
            maxOccupancy: true,
            amenities: true,
            specialFeatures: true,
          },
        },
        complementaryItems: {
          select: {
            id: true,
            name: true,
            description: true,
            rate: true,
            isOptional: true,
          },
        },
        bookedByStaff: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if reservation is eligible for check-in
    if (reservation.reservationStatus === "CHECKED_IN") {
      return NextResponse.json(
        {
          error: "This guest is already checked in",
          currentStatus: reservation.reservationStatus,
          actualCheckIn: reservation.actualCheckIn,
        },
        { status: 400 }
      );
    }

    if (reservation.reservationStatus === "CHECKED_OUT") {
      return NextResponse.json(
        {
          error: "This reservation has already been checked out",
          currentStatus: reservation.reservationStatus,
        },
        { status: 400 }
      );
    }

    if (reservation.reservationStatus === "CANCELLED") {
      return NextResponse.json(
        {
          error: "This reservation has been cancelled and cannot be checked in",
          currentStatus: reservation.reservationStatus,
        },
        { status: 400 }
      );
    }

    // Check if room is available
    if (reservation.room.status !== "AVAILABLE") {
      return NextResponse.json(
        {
          error: `Room ${reservation.room.roomNumber} is not available (Status: ${reservation.room.status})`,
          roomStatus: reservation.room.status,
        },
        { status: 400 }
      );
    }

    // Calculate check-in timing
    const now = new Date();
    const checkInDate = new Date(reservation.checkInDate);
    const isEarlyCheckIn = now < checkInDate;
    const isLateCheckIn =
      now.getTime() - checkInDate.getTime() > 24 * 60 * 60 * 1000; // More than 1 day late

    // Calculate any early/late check-in fees
    let earlyCheckInFee = 0;
    let lateCheckInFee = 0;

    if (isEarlyCheckIn) {
      const hoursEarly = Math.ceil(
        (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      );
      earlyCheckInFee = hoursEarly * 100; // 100 LKR per hour early
    }

    if (isLateCheckIn) {
      const daysLate =
        Math.ceil(
          (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        ) - 1;
      lateCheckInFee = daysLate * 500; // 500 LKR per day late
    }

    // Transform room facilities
    const roomFacilities = reservation.room.facilities.map((assignment) => ({
      ...assignment.facility,
      isWorking: assignment.isWorking,
      notes: assignment.notes,
    }));

    const checkinData = {
      ...reservation,
      checkInDate: reservation.checkInDate.toISOString(),
      checkOutDate: reservation.checkOutDate.toISOString(),
      actualCheckIn: reservation.actualCheckIn
        ? reservation.actualCheckIn.toISOString()
        : null,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),

      // Check-in calculations
      isEarlyCheckIn,
      isLateCheckIn,
      earlyCheckInFee,
      lateCheckInFee,
      currentDateTime: now.toISOString(),

      // Transform nested data
      room: {
        ...reservation.room,
        facilities: roomFacilities,
      },
    };

    return NextResponse.json({
      reservation: checkinData,
      success: true,
    });
  } catch (error) {
    console.error("Check-in data fetch error:", error);
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

// POST - Process check-in
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    const {
      earlyCheckInFee = 0,
      lateCheckInFee = 0,
      additionalCharges = 0,
      paymentAmount = 0,
      paymentMethod = "CASH",
      paymentRemarks = "",
      staffNotes = "",
      guestConfirmation = false,
      identityVerified = false,
      keyCardIssued = false,
      roomInspected = false,
      checkedInBy,
    } = body;

    // Validation
    if (!guestConfirmation || !identityVerified) {
      return NextResponse.json(
        { error: "Guest confirmation and identity verification are required" },
        { status: 400 }
      );
    }

    // Fetch current reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        room: true,
        customer: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (reservation.reservationStatus !== "CONFIRMED") {
      return NextResponse.json(
        {
          error: `Cannot check in reservation with status '${reservation.reservationStatus}'`,
          currentStatus: reservation.reservationStatus,
        },
        { status: 400 }
      );
    }

    if (reservation.room.status !== "AVAILABLE") {
      return NextResponse.json(
        {
          error: `Room ${reservation.room.roomNumber} is not available for check-in`,
          roomStatus: reservation.room.status,
        },
        { status: 400 }
      );
    }

    // Calculate final amounts
    const totalAdditionalCharges =
      earlyCheckInFee + lateCheckInFee + additionalCharges;
    const updatedTotalAmount = reservation.totalAmount + totalAdditionalCharges;
    const updatedBalanceAmount = Math.max(
      0,
      updatedTotalAmount - reservation.advanceAmount - paymentAmount
    );

    // Update reservation to checked in
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        reservationStatus: "CHECKED_IN",
        actualCheckIn: new Date(),

        // Update financial totals
        extraCharges: reservation.extraCharges + totalAdditionalCharges,
        totalAmount: updatedTotalAmount,
        balanceAmount: updatedBalanceAmount,

        // Update payment info if additional payment made
        ...(paymentAmount > 0 && {
          advanceAmount: reservation.advanceAmount + paymentAmount,
          paymentMethod: paymentMethod,
          paymentStatus: updatedBalanceAmount === 0 ? "PAID" : "PARTIAL",
        }),

        // Add check-in remarks
        remarks: reservation.remarks
          ? `${reservation.remarks}\n\nCheck-in Notes: ${staffNotes}`
          : `Check-in Notes: ${staffNotes}`,

        updatedAt: new Date(),
      },
      include: {
        customer: true,
        room: true,
        roomClass: true,
      },
    });

    // Update room status to occupied
    await prisma.room.update({
      where: { id: reservation.roomId },
      data: {
        status: "OCCUPIED",
        updatedAt: new Date(),
      },
    });

    // Create payment record if additional payment was made
    if (paymentAmount > 0) {
      await prisma.payment.create({
        data: {
          reservationId: reservationId,
          customerId: reservation.customerId,
          amount: paymentAmount,
          paymentMethod: paymentMethod,
          paymentType: "ADVANCE_PAYMENT",
          paymentStatus: "COMPLETED",
          remarks: paymentRemarks || "Check-in payment",
        },
      });
    }

    // Create cash flow record
    await prisma.cashFlow.create({
      data: {
        staffId: checkedInBy || 1, // Default to staff ID 1 if not provided
        transactionType: "INFLOW",
        amount: paymentAmount,
        paymentMethod: paymentMethod,
        referenceType: "RESERVATION",
        referenceId: reservationId,
        remarks: `Check-in payment for reservation ${reservation.bookingNumber}`,
      },
    });

    return NextResponse.json({
      message: "Guest checked in successfully",
      reservation: {
        ...updatedReservation,
        checkInDate: updatedReservation.checkInDate.toISOString(),
        checkOutDate: updatedReservation.checkOutDate.toISOString(),
        actualCheckIn: updatedReservation.actualCheckIn
          ? updatedReservation.actualCheckIn.toISOString()
          : null,
        createdAt: updatedReservation.createdAt.toISOString(),
        updatedAt: updatedReservation.updatedAt.toISOString(),
      },
      checkinSummary: {
        originalAmount: reservation.totalAmount,
        earlyCheckInFee,
        lateCheckInFee,
        additionalCharges,
        totalAdditionalCharges,
        updatedTotalAmount,
        advancePaid: reservation.advanceAmount,
        checkinPayment: paymentAmount,
        finalBalance: updatedBalanceAmount,
        keyCardIssued,
        roomInspected,
      },
      success: true,
    });
  } catch (error) {
    console.error("Check-in process error:", error);
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
