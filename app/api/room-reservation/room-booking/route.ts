import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";



export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomType = searchParams.get("roomType");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    // Fetch all required data in parallel
    const [bookingTypes, roomTypes, complementaryItems, availableRooms] =
      await Promise.all([
        // Booking Types
        prisma.bookingType.findMany({
          include: {
            bookingSources: true,
          },
          orderBy: { name: "asc" },
        }),

        // Room Types
        prisma.roomList.findMany({
          select: {
            id: true,
            roomType: true,
            rate: true,
            hourlyCharge: true,
            capacity: true,
            bedNo: true,
            bedType: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { roomType: "asc" },
        }),

        // Complementary Items
        prisma.complementaryItem.findMany({
          select: {
            id: true,
            roomType: true,
            complementary: true,
            rate: true,
          },
          orderBy: { complementary: "asc" },
        }),

        // Available Rooms (if roomType is specified)
        roomType ? getAvailableRooms(roomType, checkIn, checkOut) : [],
      ]);

    // Transform booking types to include their sources
    const transformedBookingTypes = bookingTypes.map((type) => ({
      id: type.id,
      name: type.name,
      sources: type.bookingSources.map((source) => ({
        id: source.id,
        bookingSource: source.bookingSource,
        commissionRate: source.commissionRate,
        totalBalance: source.totalBalance,
        paidAmount: source.paidAmount,
        dueAmount: source.dueAmount,
      })),
    }));

    return NextResponse.json({
      bookingTypes: transformedBookingTypes,
      roomTypes: roomTypes.map((rt) => ({
        id: rt.id,
        roomType: rt.roomType,
        rate: rt.rate,
        hourlyCharge: rt.hourlyCharge,
        capacity: rt.capacity,
        bedNo: rt.bedNo,
        bedType: rt.bedType.name,
      })),
      complementaryItems,
      availableRooms,
    });
  } catch (error: any) {
    console.error("Error fetching form data:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

async function getAvailableRooms(
  roomType: string,
  checkIn?: string | null,
  checkOut?: string | null
) {
  // Get all rooms of the specified type
  let availableRooms = await prisma.room.findMany({
    where: {
      roomType: roomType,
      isAvailable: true,
    },
    include: {
      floorList: {
        include: {
          floor: true,
        },
      },
      roomList: {
        select: {
          roomType: true,
          rate: true,
          hourlyCharge: true,
        },
      },
    },
    orderBy: {
      roomNumber: "asc",
    },
  });

  // If check-in/check-out dates are provided, filter out reserved rooms
  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Get reservations that overlap with the requested dates
    const overlappingReservations = await prisma.reservation.findMany({
      where: {
        roomType: roomType,
        OR: [
          {
            AND: [
              { checkInDate: { lte: checkOutDate } },
              { checkOutDate: { gte: checkInDate } },
            ],
          },
        ],
      },
      select: {
        roomNumber: true,
      },
    });

    const reservedRoomNumbers = overlappingReservations.map(
      (r) => r.roomNumber
    );

    // Filter out reserved rooms
    availableRooms = availableRooms.filter(
      (room) => !reservedRoomNumbers.includes(room.roomNumber.toString())
    );
  }

  return availableRooms;
}



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      // Reservation details
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime,
      arrivalFrom,
      bookingType,
      bookingSource,
      purposeOfVisit,
      remarks,

      // Room details
      roomType,
      roomNumber,
      adults,
      children,
      billingType,

      // Customer
      customerId,

      // Complimentary items
      complementaryItemIds = [],

      // Payment details
      discountReason,
      discountAmount = 0,
      commissionPercent = 0,
      commissionAmount = 0,
      bookingCharge = 0,
      tax = 0,
      serviceCharge = 0,
      paymentMode,
      advanceRemarks,
      advanceAmount = 0,
    } = body;

    // Validate required fields
    if (
      !checkInDate ||
      !checkOutDate ||
      !roomType ||
      !roomNumber ||
      !customerId
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if room is available
    const room = await prisma.room.findFirst({
      where: {
        roomNumber: parseInt(roomNumber),
        roomType: roomType,
        isAvailable: true,
      },
      include: {
        roomList: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { message: "Room not available" },
        { status: 400 }
      );
    }

    // Calculate room price
    const checkIn = new Date(checkInDate + " " + checkInTime);
    const checkOut = new Date(checkOutDate + " " + checkOutTime);

    let roomPrice = 0;
    if (billingType === "hourly") {
      const hours = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
      );
      roomPrice = Math.max(1, hours) * room.roomList!.hourlyCharge;
    } else {
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      roomPrice = Math.max(1, nights) * room.roomList!.rate;
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        checkInTime,
        checkOutTime,
        arrivalFrom,
        bookingType,
        purposeOfVisit,
        remarks,
        roomType,
        roomNumber,
        adults,
        children,
        roomPrice: Math.round(roomPrice),
        billingType,
        customerId,
        discountReason,
        discountAmount,
        commissionPercent,
        commissionAmount,
        bookingCharge,
        tax,
        serviceCharge,
        paymentMode,
        advanceRemarks,
        advanceAmount,

        // Connect complimentary items
        complementaryItems: {
          connect: complementaryItemIds.map((id: number) => ({ id })),
        },
      },
      include: {
        customer: true,
        complementaryItems: true,
      },
    });

    // Mark room as unavailable for the reservation period
    await prisma.room.update({
      where: { id: room.id },
      data: { isAvailable: false },
    });

    return NextResponse.json(
      {
        message: "Reservation created successfully",
        reservation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}