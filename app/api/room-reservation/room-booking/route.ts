import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Add type definition for complimentary items
type ComplementaryItemData = {
  id: number;
  roomType: string;
  complementary: string;
  rate: number;
};

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
function generateBookingNumber(lastNumber: string | null): string {
  const nextNum = lastNumber ? parseInt(lastNumber) + 1 : 1;
  return String(nextNum).padStart(8, "0"); // 8 digits, e.g., 00000330
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Find last booking number
    const lastReservation = await prisma.reservation.findFirst({
      orderBy: { id: "desc" },
      select: { bookingNumber: true },
    });

    const bookingNumber = generateBookingNumber(
      lastReservation?.bookingNumber || null
    );

    const reservation = await prisma.reservation.create({
      data: {
        bookingNumber, // ✅ save generated booking number
        checkInDate: new Date(data.checkInDate),
        checkOutDate: new Date(data.checkOutDate),
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        arrivalFrom: data.arrivalFrom || null,
        bookingType: data.bookingType || null,
        purposeOfVisit: data.purposeOfVisit,
        remarks: data.remarks || null,
        roomType: data.roomType,
        roomNumber: String(data.roomNumber),
        adults: data.adults || 0,
        children: data.children || 0,
        roomPrice: data.roomPrice,
        billingType: data.billingType,
        customerId: data.customers,
        discountReason: data.discountReason || null,
        discountAmount: data.discountAmount || 0,
        commissionPercent: data.commissionPercent || 0,
        commissionAmount: data.commissionAmount || 0,
        bookingCharge: data.bookingCharge || 0,
        tax: data.tax || 0,
        serviceCharge: data.serviceCharge || 0,
        paymentMode: data.paymentMode,
        advanceRemarks: data.advanceRemarks || null,
        advanceAmount: data.advanceAmount || 0,
        total: data.total || 0,
        balanceAmount: data.balanceAmount || 0,
        complementaryItems: {
          connect: data.complimentaryItems.map((item: any) => ({
            id: item.id,
          })),
        },
      },
    });

    return NextResponse.json({
      message: "Reservation saved successfully",
      bookingNumber,
      reservationId: reservation.id,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
