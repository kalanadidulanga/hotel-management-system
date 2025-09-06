// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/db";

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const reservationId = parseInt(params.id);

//     if (isNaN(reservationId)) {
//       return NextResponse.json(
//         { error: "Invalid reservation ID", success: false },
//         { status: 400 }
//       );
//     }

//     // Fetch reservation with all related data for invoice
//     const reservation = await prisma.reservation.findUnique({
//       where: { id: reservationId },
//       include: {
//         customer: {
//           select: {
//             firstName: true,
//             lastName: true,
//             email: true,
//             phone: true,
//             address: true,
//           },
//         },
//         room: {
//           select: {
//             roomNumber: true,
//           },
//         },
//         roomClass: {
//           select: {
//             name: true,
//           },
//         },
//         quickOrders: {
//           select: {
//             id: true,
//             description: true,
//             quantity: true,
//             unitPrice: true,
//             totalAmount: true,
//           },
//         },
//       },
//     });

//     if (!reservation) {
//       return NextResponse.json(
//         { error: "Reservation not found", success: false },
//         { status: 404 }
//       );
//     }

//     // Transform dates for JSON serialization
//     const transformedReservation = {
//       ...reservation,
//       checkInDate: reservation.checkInDate.toISOString(),
//       checkOutDate: reservation.checkOutDate.toISOString(),
//       actualCheckIn: reservation.actualCheckIn
//         ? reservation.actualCheckIn.toISOString()
//         : null,
//       actualCheckOut: reservation.actualCheckOut
//         ? reservation.actualCheckOut.toISOString()
//         : null,
//       createdAt: reservation.createdAt.toISOString(),
//       updatedAt: reservation.updatedAt.toISOString(),
//     };

//     return NextResponse.json({
//       reservation: transformedReservation,
//       success: true,
//     });
//   } catch (error) {
//     console.error("Invoice fetch error:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to fetch invoice data",
//         details: error instanceof Error ? error.message : "Unknown error",
//         success: false,
//       },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // FIXED - changed to context with Promise
) {
  try {
    const { id } = await context.params; // FIXED - await params
    const reservationId = parseInt(id);

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID", success: false },
        { status: 400 }
      );
    }

    // Fetch reservation with all related data for invoice
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        room: {
          select: {
            roomNumber: true,
          },
        },
        roomClass: {
          select: {
            name: true,
          },
        },
        quickOrders: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPrice: true,
            totalAmount: true,
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
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    };

    return NextResponse.json({
      reservation: transformedReservation,
      success: true,
    });
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch invoice data",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
