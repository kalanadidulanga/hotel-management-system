import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// GET reservation by ID with comprehensive details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
      const { id } = await params; // ✅ await params
      const reservationId = parseInt(id);

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        customer: true,
        room: {
          include: {
            floor: true,
            facilities: {
              include: {
                facility: true,
              },
            },
          },
        },
        roomClass: true,
        bookedByStaff: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        quickOrders: {
          include: {
            deliveredByStaff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        complementaryItems: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Calculate additional statistics
    const stats = await calculateReservationStats(reservationId);

    // Calculate status flags
    const currentDate = new Date();
    const checkInDate = new Date(reservation.checkInDate);
    const checkOutDate = new Date(reservation.checkOutDate);

    const isCurrentlyActive =
      reservation.reservationStatus === "CHECKED_IN" &&
      currentDate >= checkInDate &&
      currentDate <= checkOutDate;
    const isPastStay = currentDate > checkOutDate;
    const isFutureStay = currentDate < checkInDate;
    const isOverdue =
      checkOutDate < currentDate &&
      reservation.reservationStatus === "CHECKED_IN";

    const paymentCompletion =
      reservation.totalAmount > 0
        ? Math.round(
            (reservation.advanceAmount / reservation.totalAmount) * 100
          )
        : 0;

    // Transform dates for JSON serialization
    const transformedReservation = {
      ...reservation,
      checkInDate: reservation.checkInDate.toISOString(),
      checkOutDate: reservation.checkOutDate.toISOString(),
      actualCheckIn: reservation.actualCheckIn
        ? reservation.actualCheckIn.toISOString()
        : null,
      actualCheckOut: reservation.actualCheckOut
        ? reservation.actualCheckOut.toISOString()
        : null,
      cancellationDate: reservation.cancellationDate
        ? reservation.cancellationDate.toISOString()
        : null,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
      customer: {
        ...reservation.customer,
        dateOfBirth: reservation.customer.dateOfBirth
          ? reservation.customer.dateOfBirth.toISOString()
          : null,
        createdAt: reservation.customer.createdAt.toISOString(),
        updatedAt: reservation.customer.updatedAt.toISOString(),
      },
      quickOrders: reservation.quickOrders.map((order) => ({
        ...order,
        deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      })),

      // Computed fields
      guestCount:
        reservation.adults + reservation.children + reservation.infants,
      nightsStayed:
        reservation.actualCheckIn && reservation.actualCheckOut
          ? Math.ceil(
              (new Date(reservation.actualCheckOut).getTime() -
                new Date(reservation.actualCheckIn).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : reservation.numberOfNights,
      isOverdue,
      isCurrentlyActive,
      isPastStay,
      isFutureStay,
      paymentCompletion,
      canCheckIn:
        reservation.reservationStatus === "CONFIRMED" &&
        currentDate >= checkInDate,
      canCheckOut: reservation.reservationStatus === "CHECKED_IN",
      ...stats,
    };

    return NextResponse.json({
      reservation: transformedReservation,
      success: true,
    });
  } catch (error) {
    console.error("Reservation details fetch error:", error);
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

// PUT - Update reservation status
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ await params
    const reservationId = parseInt(id);
    const body = await request.json();

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    const existingReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };

    // Handle status updates
    if (body.reservationStatus) {
      updateData.reservationStatus = body.reservationStatus;

      // Set actual check-in/out times
      if (
        body.reservationStatus === "CHECKED_IN" &&
        !existingReservation.actualCheckIn
      ) {
        updateData.actualCheckIn = new Date();
        // Update room status to occupied
        await prisma.room.update({
          where: { id: existingReservation.roomId },
          data: { status: "OCCUPIED" },
        });
      }

      if (
        body.reservationStatus === "CHECKED_OUT" &&
        !existingReservation.actualCheckOut
      ) {
        updateData.actualCheckOut = new Date();
        // Update room status to maintenance (for cleaning)
        await prisma.room.update({
          where: { id: existingReservation.roomId },
          data: { status: "MAINTENANCE" },
        });
      }
    }

    // Handle other updates
    if (body.specialRequests !== undefined)
      updateData.specialRequests = body.specialRequests;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;
    if (body.advanceAmount !== undefined) {
      updateData.advanceAmount = parseFloat(body.advanceAmount);
      updateData.balanceAmount = Math.max(
        0,
        existingReservation.totalAmount - updateData.advanceAmount
      );

      // Update payment status
      if (updateData.advanceAmount >= existingReservation.totalAmount) {
        updateData.paymentStatus = "PAID";
      } else if (updateData.advanceAmount > 0) {
        updateData.paymentStatus = "PARTIAL";
      } else {
        updateData.paymentStatus = "PENDING";
      }
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
      include: {
        customer: true,
        room: {
          include: {
            floor: true,
            facilities: {
              include: {
                facility: true,
              },
            },
          },
        },
        roomClass: true,
        bookedByStaff: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        quickOrders: {
          include: {
            deliveredByStaff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        complementaryItems: true,
      },
    });

    // Calculate updated stats
    const stats = await calculateReservationStats(reservationId);

    return NextResponse.json({
      reservation: {
        ...updatedReservation,
        checkInDate: updatedReservation.checkInDate.toISOString(),
        checkOutDate: updatedReservation.checkOutDate.toISOString(),
        actualCheckIn: updatedReservation.actualCheckIn?.toISOString() || null,
        actualCheckOut:
          updatedReservation.actualCheckOut?.toISOString() || null,
        cancellationDate:
          updatedReservation.cancellationDate?.toISOString() || null,
        createdAt: updatedReservation.createdAt.toISOString(),
        updatedAt: updatedReservation.updatedAt.toISOString(),
        customer: {
          ...updatedReservation.customer,
          dateOfBirth:
            updatedReservation.customer.dateOfBirth?.toISOString() || null,
          createdAt: updatedReservation.customer.createdAt.toISOString(),
          updatedAt: updatedReservation.customer.updatedAt.toISOString(),
        },
        quickOrders: updatedReservation.quickOrders.map((order) => ({
          ...order,
          deliveredAt: order.deliveredAt
            ? order.deliveredAt.toISOString()
            : null,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        })),
        // Add computed fields
        guestCount:
          updatedReservation.adults +
          updatedReservation.children +
          updatedReservation.infants,
        canCheckIn: updatedReservation.reservationStatus === "CONFIRMED",
        canCheckOut: updatedReservation.reservationStatus === "CHECKED_IN",
        ...stats,
      },
      message: `Reservation ${updatedReservation.bookingNumber} updated successfully`,
      success: true,
    });
  } catch (error) {
    console.error("Reservation update error:", error);
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

// DELETE - Cancel reservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") || "No reason provided";

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (reservation.reservationStatus === "CHECKED_OUT") {
      return NextResponse.json(
        { error: "Cannot cancel a checked-out reservation" },
        { status: 400 }
      );
    }

    if (reservation.reservationStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "Reservation is already cancelled" },
        { status: 400 }
      );
    }

    // Cancel the reservation
    const cancelledReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        reservationStatus: "CANCELLED",
        cancellationReason: reason,
        cancellationDate: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update room status back to available
    await prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: "AVAILABLE" },
    });

    return NextResponse.json({
      message: `Reservation ${cancelledReservation.bookingNumber} cancelled successfully`,
      reservation: {
        ...cancelledReservation,
        checkInDate: cancelledReservation.checkInDate.toISOString(),
        checkOutDate: cancelledReservation.checkOutDate.toISOString(),
        cancellationDate:
          cancelledReservation.cancellationDate?.toISOString() || null,
        createdAt: cancelledReservation.createdAt.toISOString(),
        updatedAt: cancelledReservation.updatedAt.toISOString(),
      },
      success: true,
    });
  } catch (error) {
    console.error("Reservation cancellation error:", error);
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

// Helper function to calculate reservation statistics
async function calculateReservationStats(reservationId: number) {
  try {
    const quickOrdersTotal = await prisma.quickOrder.aggregate({
      where: { reservationId },
      _sum: { totalAmount: true },
      _count: true,
    });

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { complementaryItems: true },
    });

    const complementaryTotal =
      reservation?.complementaryItems.reduce(
        (sum, item) => sum + item.rate,
        0
      ) || 0;

    return {
      quickOrdersTotal: quickOrdersTotal._sum.totalAmount || 0,
      quickOrdersCount: quickOrdersTotal._count || 0,
      complementaryTotal,
      grandTotal:
        (reservation?.totalAmount || 0) +
        (quickOrdersTotal._sum.totalAmount || 0),
    };
  } catch (error) {
    console.error("Error calculating reservation stats:", error);
    return {
      quickOrdersTotal: 0,
      quickOrdersCount: 0,
      complementaryTotal: 0,
      grandTotal: 0,
    };
  }
}
