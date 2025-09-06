import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// GET all reservations with filtering and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    console.log(
      "API: Received search params:",
      Object.fromEntries(searchParams.entries())
    );

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const roomClassId = searchParams.get("roomClassId") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search") || "";

    // Build where conditions
    const whereConditions: any = {};

    // Status filter
    if (status && status !== "all") {
      whereConditions.reservationStatus = status;
    }

    // Room class filter
    if (roomClassId && roomClassId !== "all") {
      whereConditions.roomClassId = parseInt(roomClassId);
    }

    // Date range filter - Fixed to handle overlapping reservations properly
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);

      // Validate dates
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format", success: false },
          { status: 400 }
        );
      }

      whereConditions.OR = [
        {
          checkInDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
        {
          checkOutDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
        {
          AND: [
            { checkInDate: { lte: fromDate } },
            { checkOutDate: { gte: toDate } },
          ],
        },
      ];
    } else if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (!isNaN(fromDate.getTime())) {
        whereConditions.checkInDate = { gte: fromDate };
      }
    } else if (dateTo) {
      const toDate = new Date(dateTo);
      if (!isNaN(toDate.getTime())) {
        whereConditions.checkOutDate = { lte: toDate };
      }
    }

    // Search filter - FIXED: Removed mode parameter that was causing errors
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      console.log("API: Applying search filter for:", searchTerm);

      const searchConditions = [
        {
          bookingNumber: {
            contains: searchTerm,
          },
        },
        {
          customer: {
            firstName: {
              contains: searchTerm,
            },
          },
        },
        {
          customer: {
            lastName: {
              contains: searchTerm,
            },
          },
        },
        {
          customer: {
            phone: {
              contains: searchTerm,
            },
          },
        },
        {
          customer: {
            email: {
              contains: searchTerm,
            },
          },
        },
        {
          room: {
            roomNumber: {
              contains: searchTerm,
            },
          },
        },
      ];

      // Combine with existing OR conditions for date range
      if (whereConditions.OR) {
        whereConditions.AND = [
          { OR: whereConditions.OR },
          { OR: searchConditions },
        ];
        delete whereConditions.OR;
      } else {
        whereConditions.OR = searchConditions;
      }
    }

    console.log(
      "API: Final where conditions:",
      JSON.stringify(whereConditions, null, 2)
    );

    // Get total count for pagination
    const totalCount = await prisma.reservation.count({
      where: whereConditions,
    });

    console.log("API: Total count:", totalCount);

    // Fetch reservations with comprehensive related data
    const reservations = await prisma.reservation.findMany({
      where: whereConditions,
      include: {
        customer: {
          select: {
            id: true,
            customerID: true,
            firstName: true,
            lastName: true,
            fullName: true,
            phone: true,
            email: true,
            isVip: true,
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
            hourlyRate: true,
            maxOccupancy: true,
          },
        },
        bookedByStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quickOrders: {
          include: {
            deliveredByStaff: {
              select: {
                name: true,
              },
            },
          },
        },
        complementaryItems: true,
      },
      orderBy: [{ reservationStatus: "asc" }, { checkInDate: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    console.log("API: Found reservations:", reservations.length);

    // Calculate dashboard statistics
    const stats = await calculateReservationStats();

    // Transform dates for JSON serialization
    const transformedReservations = reservations.map((reservation) => ({
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
      quickOrders: reservation.quickOrders.map((order) => ({
        ...order,
        deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      })),
      guestCount:
        reservation.adults + reservation.children + reservation.infants, // Computed field
    }));

    const response = {
      reservations: transformedReservations,
      stats,
      success: true,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };

    console.log(
      "API: Sending response with",
      transformedReservations.length,
      "reservations"
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("Reservations fetch error:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to fetch reservations",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to calculate comprehensive reservation statistics
async function calculateReservationStats() {
  try {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Execute all queries in parallel for better performance
    const [
      totalReservations,
      activeReservations,
      todayCheckIns,
      todayCheckOuts,
      pendingReservations,
      cancelledReservations,
      monthlyRevenue,
      lastMonthRevenue,
      totalRooms,
      occupiedRooms,
      monthlyReservations,
    ] = await Promise.all([
      // Total reservations
      prisma.reservation.count(),

      // Active reservations (checked in)
      prisma.reservation.count({
        where: { reservationStatus: "CHECKED_IN" },
      }),

      // Today's check-ins
      prisma.reservation.count({
        where: {
          checkInDate: {
            gte: today,
            lt: tomorrow,
          },
          reservationStatus: { in: ["CONFIRMED", "CHECKED_IN"] },
        },
      }),

      // Today's check-outs
      prisma.reservation.count({
        where: {
          checkOutDate: {
            gte: today,
            lt: tomorrow,
          },
          reservationStatus: "CHECKED_IN",
        },
      }),

      // Pending confirmations
      prisma.reservation.count({
        where: { reservationStatus: "CONFIRMED" },
      }),

      // Cancelled reservations
      prisma.reservation.count({
        where: { reservationStatus: "CANCELLED" },
      }),

      // This month's revenue
      prisma.reservation.aggregate({
        where: {
          checkInDate: {
            gte: thisMonth,
            lt: nextMonth,
          },
          reservationStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Last month's revenue
      prisma.reservation.aggregate({
        where: {
          checkInDate: {
            gte: lastMonth,
            lt: thisMonth,
          },
          reservationStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Total active rooms - Fixed to handle missing isActive field
      prisma.room.count().catch(() => 0),

      // Currently occupied rooms
      prisma.reservation.count({
        where: {
          reservationStatus: "CHECKED_IN",
        },
      }),

      // Monthly reservations for ADR calculation
      prisma.reservation.findMany({
        where: {
          checkInDate: {
            gte: thisMonth,
            lt: nextMonth,
          },
          reservationStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
        select: {
          totalAmount: true,
          numberOfNights: true,
        },
      }),
    ]);

    // Calculate derived statistics
    const totalRoomNights = monthlyReservations.reduce(
      (sum, res) => sum + res.numberOfNights,
      0
    );

    const averageDailyRate =
      totalRoomNights > 0
        ? (monthlyRevenue._sum.totalAmount || 0) / totalRoomNights
        : 0;

    const occupancyRate =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const revenueGrowth =
      (lastMonthRevenue._sum.totalAmount || 0) > 0
        ? Math.round(
            (((monthlyRevenue._sum.totalAmount || 0) -
              (lastMonthRevenue._sum.totalAmount || 0)) /
              (lastMonthRevenue._sum.totalAmount || 1)) *
              100
          )
        : 0;

    return {
      totalReservations,
      activeReservations,
      todayCheckIns,
      todayCheckOuts,
      pendingReservations,
      cancelledReservations,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      averageDailyRate: Math.round(averageDailyRate * 100) / 100,
      occupancyRate,
      revenueGrowth,
      totalRoomNights,
    };
  } catch (error) {
    console.error("Error calculating reservation stats:", error);
    return {
      totalReservations: 0,
      activeReservations: 0,
      todayCheckIns: 0,
      todayCheckOuts: 0,
      pendingReservations: 0,
      cancelledReservations: 0,
      monthlyRevenue: 0,
      averageDailyRate: 0,
      occupancyRate: 0,
      revenueGrowth: 0,
      totalRoomNights: 0,
    };
  }
}

// POST - Create new reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      roomId,
      roomClassId,
      checkInDate,
      checkOutDate,
      checkInTime = "14:00",
      checkOutTime = "12:00",
      adults = 1,
      children = 0,
      infants = 0,
      bookingType,
      purposeOfVisit,
      arrivalFrom,
      specialRequests,
      remarks,
      billingType = "NIGHT_STAY",
      baseRoomRate,
      totalRoomCharge,
      extraCharges = 0,
      discountType,
      discountValue = 0,
      discountReason,
      discountAmount = 0,
      serviceCharge = 0,
      tax = 0,
      commissionPercent = 0,
      commissionAmount = 0,
      paymentMethod,
      totalAmount,
      advanceAmount = 0,
      balanceAmount,
      advanceRemarks,
      bookedBy,
      complementaryItemIds = [],
    } = body;

    // Enhanced validation
    if (
      !customerId ||
      !roomId ||
      !roomClassId ||
      !checkInDate ||
      !checkOutDate
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details:
            "Customer ID, room ID, room class ID, check-in date, and check-out date are required",
          success: false,
        },
        { status: 400 }
      );
    }

    if (!paymentMethod || !totalAmount) {
      return NextResponse.json(
        {
          error: "Missing payment information",
          details: "Payment method and total amount are required",
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      return NextResponse.json(
        {
          error: "Invalid date range",
          details: "Check-out date must be after check-in date",
          success: false,
        },
        { status: 400 }
      );
    }

    // Check if room is available
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        roomId: parseInt(roomId),
        reservationStatus: { in: ["CONFIRMED", "CHECKED_IN"] },
        OR: [
          {
            AND: [
              { checkInDate: { lte: checkIn } },
              { checkOutDate: { gt: checkIn } },
            ],
          },
          {
            AND: [
              { checkInDate: { lt: checkOut } },
              { checkOutDate: { gte: checkOut } },
            ],
          },
          {
            AND: [
              { checkInDate: { gte: checkIn } },
              { checkOutDate: { lte: checkOut } },
            ],
          },
        ],
      },
    });

    if (existingReservation) {
      return NextResponse.json(
        {
          error: "Room not available",
          details: "The selected room is already reserved for the given dates",
          success: false,
        },
        { status: 400 }
      );
    }

    // Calculate number of nights
    const numberOfNights = Math.max(
      1,
      Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    // Generate unique booking number
    const bookingNumber = await generateBookingNumber();

    // Calculate payment status
    const finalAdvanceAmount = parseFloat(advanceAmount.toString()) || 0;
    const finalTotalAmount = parseFloat(totalAmount.toString());
    const finalBalanceAmount =
      parseFloat(balanceAmount?.toString() || "0") ||
      finalTotalAmount - finalAdvanceAmount;

    const paymentStatus =
      finalAdvanceAmount >= finalTotalAmount
        ? "PAID"
        : finalAdvanceAmount > 0
        ? "PARTIAL"
        : "PENDING";

    // Create reservation within a transaction
    const reservation = await prisma.$transaction(async (tx) => {
      // Create the reservation
      const newReservation = await tx.reservation.create({
        data: {
          bookingNumber,
          customerId: parseInt(customerId.toString()),
          roomId: parseInt(roomId.toString()),
          roomClassId: parseInt(roomClassId.toString()),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          checkInTime,
          checkOutTime,
          numberOfNights,
          adults: parseInt(adults.toString()),
          children: parseInt(children.toString()),
          infants: parseInt(infants.toString()),
          bookingType,
          purposeOfVisit,
          arrivalFrom,
          specialRequests,
          remarks,
          billingType: billingType as any,
          baseRoomRate: parseFloat(baseRoomRate.toString()),
          totalRoomCharge: parseFloat(totalRoomCharge.toString()),
          extraCharges: parseFloat(extraCharges.toString()),
          discountType: discountType as any,
          discountValue: parseFloat(discountValue.toString()),
          discountReason,
          discountAmount: parseFloat(discountAmount.toString()),
          serviceCharge: parseFloat(serviceCharge.toString()),
          tax: parseFloat(tax.toString()),
          commissionPercent: parseFloat(commissionPercent.toString()),
          commissionAmount: parseFloat(commissionAmount.toString()),
          paymentMethod: paymentMethod as any,
          totalAmount: finalTotalAmount,
          advanceAmount: finalAdvanceAmount,
          balanceAmount: finalBalanceAmount,
          paymentStatus,
          advanceRemarks,
          bookedBy: bookedBy ? parseInt(bookedBy.toString()) : null,
          reservationStatus: "CONFIRMED",
          complementaryItems:
            complementaryItemIds.length > 0
              ? {
                  connect: complementaryItemIds.map((id: number) => ({
                    id: parseInt(id.toString()),
                  })),
                }
              : undefined,
        },
        include: {
          customer: true,
          room: true,
          roomClass: true,
          complementaryItems: true,
          bookedByStaff: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update room status if check-in is today
      const now = new Date();
      if (checkIn <= now) {
        await tx.room.update({
          where: { id: parseInt(roomId.toString()) },
          data: { status: "OCCUPIED" },
        });
      }

      return newReservation;
    });

    return NextResponse.json(
      {
        reservation: {
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
        },
        message: `Reservation ${reservation.bookingNumber} created successfully`,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Reservation creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create reservation",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to generate unique booking number
async function generateBookingNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const date = today.getDate().toString().padStart(2, "0");

  const prefix = `BK${year}${month}${date}`;

  try {
    // Find the latest booking number for today
    const latestBooking = await prisma.reservation.findFirst({
      where: {
        bookingNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        bookingNumber: "desc",
      },
    });

    let sequence = 1;
    if (latestBooking) {
      const lastSequence = parseInt(latestBooking.bookingNumber.slice(-3));
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating booking number:", error);
    // Fallback to timestamp-based booking number
    const timestamp = Date.now().toString().slice(-6);
    return `BK${year}${month}${date}${timestamp}`;
  }
}

// PUT - Update existing reservation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          error: "Reservation ID is required",
          success: false,
        },
        { status: 400 }
      );
    }

    // Check if reservation exists
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: parseInt(id.toString()) },
    });

    if (!existingReservation) {
      return NextResponse.json(
        {
          error: "Reservation not found",
          success: false,
        },
        { status: 404 }
      );
    }

    // Update reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id: parseInt(id.toString()) },
      data: updateData,
      include: {
        customer: true,
        room: true,
        roomClass: true,
        complementaryItems: true,
        bookedByStaff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
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
        cancellationDate: updatedReservation.cancellationDate
          ? updatedReservation.cancellationDate.toISOString()
          : null,
        createdAt: updatedReservation.createdAt.toISOString(),
        updatedAt: updatedReservation.updatedAt.toISOString(),
      },
      message: "Reservation updated successfully",
      success: true,
    });
  } catch (error) {
    console.error("Reservation update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update reservation",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Cancel reservation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const reason = searchParams.get("reason") || "No reason provided";

    if (!id) {
      return NextResponse.json(
        {
          error: "Reservation ID is required",
          success: false,
        },
        { status: 400 }
      );
    }

    // Check if reservation exists and can be cancelled
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingReservation) {
      return NextResponse.json(
        {
          error: "Reservation not found",
          success: false,
        },
        { status: 404 }
      );
    }

    if (existingReservation.reservationStatus === "CANCELLED") {
      return NextResponse.json(
        {
          error: "Reservation is already cancelled",
          success: false,
        },
        { status: 400 }
      );
    }

    if (existingReservation.reservationStatus === "CHECKED_OUT") {
      return NextResponse.json(
        {
          error: "Cannot cancel a completed reservation",
          success: false,
        },
        { status: 400 }
      );
    }

    // Cancel reservation within a transaction
    const cancelledReservation = await prisma.$transaction(async (tx) => {
      // Update reservation status
      const updated = await tx.reservation.update({
        where: { id: parseInt(id) },
        data: {
          reservationStatus: "CANCELLED",
          cancellationReason: reason,
          cancellationDate: new Date(),
        },
        include: {
          customer: true,
          room: true,
          roomClass: true,
        },
      });

      // Free up the room
      await tx.room.update({
        where: { id: updated.roomId },
        data: { status: "AVAILABLE" },
      });

      return updated;
    });

    return NextResponse.json({
      reservation: {
        ...cancelledReservation,
        checkInDate: cancelledReservation.checkInDate.toISOString(),
        checkOutDate: cancelledReservation.checkOutDate.toISOString(),
        actualCheckIn: cancelledReservation.actualCheckIn
          ? cancelledReservation.actualCheckIn.toISOString()
          : null,
        actualCheckOut: cancelledReservation.actualCheckOut
          ? cancelledReservation.actualCheckOut.toISOString()
          : null,
        cancellationDate: cancelledReservation.cancellationDate
          ? cancelledReservation.cancellationDate.toISOString()
          : null,
        createdAt: cancelledReservation.createdAt.toISOString(),
        updatedAt: cancelledReservation.updatedAt.toISOString(),
      },
      message: "Reservation cancelled successfully",
      success: true,
    });
  } catch (error) {
    console.error("Reservation cancellation error:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel reservation",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
