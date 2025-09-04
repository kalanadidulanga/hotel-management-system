import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// GET - Fetch reservation data for checkout
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id);

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Fetch reservation with all necessary data for checkout
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
          },
        },
        roomClass: {
          select: {
            id: true,
            name: true,
            ratePerNight: true,
            rateDayUse: true,
            maxOccupancy: true,
          },
        },
        quickOrders: {
          where: {
            orderStatus: {
              not: "CANCELLED",
            },
          },
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPrice: true,
            totalAmount: true,
            orderStatus: true,
            createdAt: true,
            deliveredAt: true,
            deliveredByStaff: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
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

    // Check if reservation is eligible for checkout
    if (reservation.reservationStatus !== "CHECKED_IN") {
      return NextResponse.json(
        { error: "Reservation is not checked in or already checked out" },
        { status: 400 }
      );
    }

    // Calculate additional charges from quick orders
    const quickOrdersTotal = reservation.quickOrders.reduce(
      (total, order) => total + order.totalAmount,
      0
    );

    // Calculate complementary items total
    const complementaryTotal = reservation.complementaryItems.reduce(
      (total, item) => total + item.rate,
      0
    );

    // Calculate stay duration
    const checkInDate = new Date(reservation.checkInDate);
    const currentDate = new Date();
    const actualStayDays = Math.ceil(
      (currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate any late checkout fees
    const checkOutTime = new Date(reservation.checkOutDate);
    checkOutTime.setHours(12, 0, 0, 0); // Standard checkout time 12:00 PM
    const lateCheckoutFee =
      currentDate > checkOutTime
        ? Math.ceil(
            (currentDate.getTime() - checkOutTime.getTime()) / (1000 * 60 * 60)
          ) * 50
        : 0; // 50 LKR per hour

    // Calculate final totals
    const updatedTotalAmount =
      reservation.totalAmount +
      quickOrdersTotal +
      complementaryTotal +
      lateCheckoutFee;
    const finalBalanceAmount = Math.max(
      0,
      updatedTotalAmount - reservation.advanceAmount
    );

    const checkoutData = {
      ...reservation,
      checkInDate: reservation.checkInDate.toISOString(),
      checkOutDate: reservation.checkOutDate.toISOString(),
      actualCheckIn: reservation.actualCheckIn
        ? reservation.actualCheckIn.toISOString()
        : null,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),

      // Additional calculations for checkout
      quickOrdersTotal,
      complementaryTotal,
      lateCheckoutFee,
      actualStayDays,
      updatedTotalAmount,
      finalBalanceAmount,

      // Transform nested dates
      customer: {
        ...reservation.customer,
      },
      quickOrders: reservation.quickOrders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      })),
    };

    return NextResponse.json({
      reservation: checkoutData,
      success: true,
    });
  } catch (error) {
    console.error("Checkout data fetch error:", error);
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

// POST - Process checkout
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
      additionalCharges = 0,
      lateCheckoutFee = 0,
      finalPaymentMethod = "CASH",
      paymentAmount = 0,
      paymentRemarks = "",
      damageFee = 0,
      damageDescription = "",
      staffNotes = "",
    } = body;

    // Fetch current reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        room: true,
        customer: true,
        quickOrders: {
          where: {
            orderStatus: {
              not: "CANCELLED",
            },
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

    if (reservation.reservationStatus !== "CHECKED_IN") {
      return NextResponse.json(
        { error: "Reservation is not checked in" },
        { status: 400 }
      );
    }

    // Calculate final amounts
    const quickOrdersTotal = reservation.quickOrders.reduce(
      (total, order) => total + order.totalAmount,
      0
    );
    const complementaryTotal = reservation.complementaryItems.reduce(
      (total, item) => total + item.rate,
      0
    );

    const finalTotalAmount =
      reservation.totalAmount +
      quickOrdersTotal +
      complementaryTotal +
      additionalCharges +
      lateCheckoutFee +
      damageFee;

    const finalBalanceAmount = Math.max(
      0,
      finalTotalAmount - reservation.advanceAmount - paymentAmount
    );

    // Update reservation to checked out
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        reservationStatus: "CHECKED_OUT",
        actualCheckOut: new Date(),

        // Update financial totals
        extraCharges:
          reservation.extraCharges +
          additionalCharges +
          lateCheckoutFee +
          damageFee,
        totalAmount: finalTotalAmount,
        balanceAmount: finalBalanceAmount,

        // Update payment info if additional payment made
        ...(paymentAmount > 0 && {
          advanceAmount: reservation.advanceAmount + paymentAmount,
          paymentMethod: finalPaymentMethod,
          paymentStatus: finalBalanceAmount === 0 ? "PAID" : "PARTIAL",
        }),

        // Add checkout remarks
        remarks: reservation.remarks
          ? `${reservation.remarks}\n\nCheckout Notes: ${staffNotes}`
          : `Checkout Notes: ${staffNotes}`,

        updatedAt: new Date(),
      },
      include: {
        customer: true,
        room: true,
        roomClass: true,
      },
    });

    // Update room status to available
    await prisma.room.update({
      where: { id: reservation.roomId },
      data: {
        status: "AVAILABLE",
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
          paymentMethod: finalPaymentMethod,
          paymentType: "CHECKOUT_PAYMENT",
          paymentStatus: "COMPLETED",
          remarks: paymentRemarks || "Checkout payment",
          createdAt: new Date(),
        },
      });
    }

    // Log damage fee if applicable
    if (damageFee > 0) {
      await prisma.incidentLog.create({
        data: {
          reservationId: reservationId,
          roomId: reservation.roomId,
          incidentType: "DAMAGE",
          description: damageDescription,
          amount: damageFee,
          status: "RESOLVED",
          createdAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      message: "Guest checked out successfully",
      reservation: {
        ...updatedReservation,
        checkInDate: updatedReservation.checkInDate.toISOString(),
        checkOutDate: updatedReservation.checkOutDate.toISOString(),
        actualCheckIn: updatedReservation.actualCheckIn
          ? updatedReservation.actualCheckIn.toISOString()
          : null,
        actualCheckOut: updatedReservation.actualCheckOut
          ? updatedReservation.actualCheckOut.toISOString()
          : null,
        createdAt: updatedReservation.createdAt.toISOString(),
        updatedAt: updatedReservation.updatedAt.toISOString(),
      },
      checkoutSummary: {
        originalAmount: reservation.totalAmount,
        quickOrdersTotal,
        complementaryTotal,
        additionalCharges,
        lateCheckoutFee,
        damageFee,
        finalTotalAmount,
        advancePaid: reservation.advanceAmount,
        checkoutPayment: paymentAmount,
        finalBalance: finalBalanceAmount,
      },
      success: true,
    });
  } catch (error) {
    console.error("Checkout process error:", error);
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
