// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/db";

// export async function POST(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const reservationId = parseInt(params.id);
//     if (!reservationId || isNaN(reservationId)) {
//       return NextResponse.json(
//         { error: "Invalid reservation ID", success: false },
//         { status: 400 }
//       );
//     }

//     const body = await request.json();
//     const { notes } = body;

//     console.log("Check-in request for reservation ID:", reservationId);
//     console.log("Notes:", notes);

//     // Verify reservation exists and is eligible for check-in
//     const reservation = await prisma.reservation.findUnique({
//       where: { id: reservationId },
//       include: {
//         room: {
//           include: {
//             floor: true,
//           },
//         },
//         customer: true,
//         roomClass: true,
//       },
//     });

//     console.log("Found reservation:", reservation ? "Yes" : "No");
//     if (reservation) {
//       console.log("Reservation status:", reservation.reservationStatus);
//       console.log("Room status:", reservation.room?.status);
//       console.log("Room ID:", reservation.roomId);
//     }

//     if (!reservation) {
//       return NextResponse.json(
//         { error: "Reservation not found", success: false },
//         { status: 404 }
//       );
//     }

//     if (reservation.reservationStatus !== "CONFIRMED") {
//       return NextResponse.json(
//         {
//           error: `Reservation status is ${reservation.reservationStatus}, not CONFIRMED for check-in`,
//           success: false,
//         },
//         { status: 400 }
//       );
//     }

//     // Check if room exists
//     if (!reservation.room) {
//       return NextResponse.json(
//         { error: "No room assigned to this reservation", success: false },
//         { status: 400 }
//       );
//     }

//     // Enhanced room status check
//     const roomStatus = reservation.room.status || "AVAILABLE";

//     // Check if room is occupied by a different guest
//     if (roomStatus === "OCCUPIED") {
//       // Check if there's another active reservation for this room
//       const conflictingReservation = await prisma.reservation.findFirst({
//         where: {
//           roomId: reservation.roomId,
//           reservationStatus: "CHECKED_IN",
//           id: { not: reservationId }, // Exclude current reservation
//           OR: [
//             {
//               checkOutDate: { gte: new Date() }, // Check-out is today or in future
//             },
//             {
//               actualCheckOut: null, // Haven't checked out yet
//             },
//           ],
//         },
//         include: {
//           customer: { select: { firstName: true, lastName: true } },
//         },
//       });

//       if (conflictingReservation) {
//         return NextResponse.json(
//           {
//             error: `Room ${reservation.room.roomNumber} is currently occupied by ${conflictingReservation.customer?.firstName} ${conflictingReservation.customer?.lastName}. Please check them out first.`,
//             success: false,
//           },
//           { status: 400 }
//         );
//       }

//       // If no conflicting reservation, allow check-in (room might be marked occupied incorrectly)
//       console.log(
//         "Room is marked OCCUPIED but no conflicting reservation found. Proceeding with check-in."
//       );
//     } else if (!["AVAILABLE", "CLEANING", "MAINTENANCE"].includes(roomStatus)) {
//       // Only block if room is in a truly unavailable state
//       return NextResponse.json(
//         {
//           error: `Room ${reservation.room.roomNumber} is currently ${roomStatus} and not available for check-in`,
//           success: false,
//         },
//         { status: 400 }
//       );
//     }

//     console.log("Starting transaction...");

//     // Start transaction
//     const result = await prisma.$transaction(async (tx) => {
//       try {
//         // Update reservation status and check-in time
//         console.log("Updating reservation...");
//         const updatedReservation = await tx.reservation.update({
//           where: { id: reservationId },
//           data: {
//             reservationStatus: "CHECKED_IN",
//             actualCheckIn: new Date(),
//             remarks: notes
//               ? `Check-in notes: ${notes}${
//                   reservation.remarks
//                     ? `\n\nPrevious remarks: ${reservation.remarks}`
//                     : ""
//                 }`
//               : reservation.remarks,
//           },
//           include: {
//             customer: {
//               select: {
//                 id: true,
//                 firstName: true,
//                 lastName: true,
//                 email: true,
//                 phone: true,
//                 identityNumber: true,
//                 address: true,
//                 nationality: true,
//               },
//             },
//             room: {
//               select: {
//                 id: true,
//                 roomNumber: true,
//                 status: true,
//                 floor: {
//                   select: {
//                     name: true,
//                   },
//                 },
//               },
//             },
//             roomClass: {
//               select: {
//                 name: true,
//                 maxOccupancy: true,
//               },
//             },
//           },
//         });

//         console.log("Reservation updated, now updating room...");

//         // Update room status to occupied
//         if (!reservation.roomId) {
//           throw new Error("Invalid room ID - cannot update room status");
//         }

//         await tx.room.update({
//           where: { id: reservation.roomId },
//           data: {
//             status: "OCCUPIED",
//           },
//         });

//         console.log("Room status updated to OCCUPIED");
//         return updatedReservation;
//       } catch (transactionError) {
//         console.error("Transaction error:", transactionError);

//         if (transactionError instanceof Error) {
//           console.error("Error name:", transactionError.name);
//           console.error("Error message:", transactionError.message);
//           console.error("Error stack:", transactionError.stack);
//         }

//         throw new Error(
//           `Transaction failed: ${
//             transactionError instanceof Error
//               ? transactionError.message
//               : "Unknown transaction error"
//           }`
//         );
//       }
//     });

//     console.log("Transaction completed successfully");

//     // Transform dates to ISO strings
//     const transformedReservation = {
//       ...result,
//       checkInDate: result.checkInDate?.toISOString() || null,
//       checkOutDate: result.checkOutDate?.toISOString() || null,
//       actualCheckIn: result.actualCheckIn?.toISOString() || null,
//       actualCheckOut: result.actualCheckOut?.toISOString() || null,
//       createdAt: result.createdAt?.toISOString() || null,
//       updatedAt: result.updatedAt?.toISOString() || null,
//     };

//     return NextResponse.json({
//       reservation: transformedReservation,
//       message: "Guest checked in successfully",
//       success: true,
//     });
//   } catch (error) {
//     console.error("Check-in process error:", error);

//     if (error instanceof Error) {
//       console.error("Error details:", {
//         name: error.name,
//         message: error.message,
//         stack: error.stack,
//       });
//     }

//     let errorMessage = "Failed to process check-in";
//     if (error instanceof Error) {
//       if (error.message.includes("Foreign key constraint")) {
//         errorMessage =
//           "Database relationship error. Please check room and customer data.";
//       } else if (error.message.includes("Unique constraint")) {
//         errorMessage =
//           "Check-in conflict. This reservation may already be processed.";
//       } else if (error.message.includes("Transaction failed")) {
//         errorMessage = error.message;
//       } else if (error.message.includes("Record to update not found")) {
//         errorMessage = "Reservation or room record not found for update.";
//       } else {
//         errorMessage = error.message;
//       }
//     }

//     return NextResponse.json(
//       {
//         error: errorMessage,
//         details: error instanceof Error ? error.message : "Unknown error",
//         success: false,
//       },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const reservationId = parseInt(params.id);
//     if (!reservationId || isNaN(reservationId)) {
//       return NextResponse.json(
//         { error: "Invalid reservation ID", success: false },
//         { status: 400 }
//       );
//     }

//     const reservation = await prisma.reservation.findUnique({
//       where: { id: reservationId },
//       include: {
//         customer: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//             phone: true,
//             identityNumber: true,
//             address: true,
//             nationality: true,
//           },
//         },
//         room: {
//           select: {
//             id: true,
//             roomNumber: true,
//             status: true,
//             floor: {
//               select: {
//                 name: true,
//               },
//             },
//           },
//         },
//         roomClass: {
//           select: {
//             name: true,
//             maxOccupancy: true,
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

//     const transformedReservation = {
//       ...reservation,
//       checkInDate: reservation.checkInDate?.toISOString() || null,
//       checkOutDate: reservation.checkOutDate?.toISOString() || null,
//       actualCheckIn: reservation.actualCheckIn?.toISOString() || null,
//       actualCheckOut: reservation.actualCheckOut?.toISOString() || null,
//       createdAt: reservation.createdAt?.toISOString() || null,
//       updatedAt: reservation.updatedAt?.toISOString() || null,
//     };

//     return NextResponse.json({
//       reservation: transformedReservation,
//       success: true,
//     });
//   } catch (error) {
//     console.error("Reservation fetch error:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to fetch reservation details",
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // FIXED - changed to context with Promise
) {
  try {
    const { id } = await context.params; // FIXED - await params
    const reservationId = parseInt(id);
    if (!reservationId || isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID", success: false },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { notes } = body;

    console.log("Check-in request for reservation ID:", reservationId);
    console.log("Notes:", notes);

    // Verify reservation exists and is eligible for check-in
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

    console.log("Found reservation:", reservation ? "Yes" : "No");
    if (reservation) {
      console.log("Reservation status:", reservation.reservationStatus);
      console.log("Room status:", reservation.room?.status);
      console.log("Room ID:", reservation.roomId);
    }

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found", success: false },
        { status: 404 }
      );
    }

    if (reservation.reservationStatus !== "CONFIRMED") {
      return NextResponse.json(
        {
          error: `Reservation status is ${reservation.reservationStatus}, not CONFIRMED for check-in`,
          success: false,
        },
        { status: 400 }
      );
    }

    // Check if room exists
    if (!reservation.room) {
      return NextResponse.json(
        { error: "No room assigned to this reservation", success: false },
        { status: 400 }
      );
    }

    // Enhanced room status check
    const roomStatus = reservation.room.status || "AVAILABLE";

    // Check if room is occupied by a different guest
    if (roomStatus === "OCCUPIED") {
      // Check if there's another active reservation for this room
      const conflictingReservation = await prisma.reservation.findFirst({
        where: {
          roomId: reservation.roomId,
          reservationStatus: "CHECKED_IN",
          id: { not: reservationId }, // Exclude current reservation
          OR: [
            {
              checkOutDate: { gte: new Date() }, // Check-out is today or in future
            },
            {
              actualCheckOut: null, // Haven't checked out yet
            },
          ],
        },
        include: {
          customer: { select: { firstName: true, lastName: true } },
        },
      });

      if (conflictingReservation) {
        return NextResponse.json(
          {
            error: `Room ${reservation.room.roomNumber} is currently occupied by ${conflictingReservation.customer?.firstName} ${conflictingReservation.customer?.lastName}. Please check them out first.`,
            success: false,
          },
          { status: 400 }
        );
      }

      // If no conflicting reservation, allow check-in (room might be marked occupied incorrectly)
      console.log(
        "Room is marked OCCUPIED but no conflicting reservation found. Proceeding with check-in."
      );
    } else if (!["AVAILABLE", "CLEANING", "MAINTENANCE"].includes(roomStatus)) {
      // Only block if room is in a truly unavailable state
      return NextResponse.json(
        {
          error: `Room ${reservation.room.roomNumber} is currently ${roomStatus} and not available for check-in`,
          success: false,
        },
        { status: 400 }
      );
    }

    console.log("Starting transaction...");

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      try {
        // Update reservation status and check-in time
        console.log("Updating reservation...");
        const updatedReservation = await tx.reservation.update({
          where: { id: reservationId },
          data: {
            reservationStatus: "CHECKED_IN",
            actualCheckIn: new Date(),
            remarks: notes
              ? `Check-in notes: ${notes}${
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

        console.log("Reservation updated, now updating room...");

        // Update room status to occupied
        if (!reservation.roomId) {
          throw new Error("Invalid room ID - cannot update room status");
        }

        await tx.room.update({
          where: { id: reservation.roomId },
          data: {
            status: "OCCUPIED",
          },
        });

        console.log("Room status updated to OCCUPIED");
        return updatedReservation;
      } catch (transactionError) {
        console.error("Transaction error:", transactionError);

        if (transactionError instanceof Error) {
          console.error("Error name:", transactionError.name);
          console.error("Error message:", transactionError.message);
          console.error("Error stack:", transactionError.stack);
        }

        throw new Error(
          `Transaction failed: ${
            transactionError instanceof Error
              ? transactionError.message
              : "Unknown transaction error"
          }`
        );
      }
    });

    console.log("Transaction completed successfully");

    // Transform dates to ISO strings
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
      message: "Guest checked in successfully",
      success: true,
    });
  } catch (error) {
    console.error("Check-in process error:", error);

    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    let errorMessage = "Failed to process check-in";
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        errorMessage =
          "Database relationship error. Please check room and customer data.";
      } else if (error.message.includes("Unique constraint")) {
        errorMessage =
          "Check-in conflict. This reservation may already be processed.";
      } else if (error.message.includes("Transaction failed")) {
        errorMessage = error.message;
      } else if (error.message.includes("Record to update not found")) {
        errorMessage = "Reservation or room record not found for update.";
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
  context: { params: Promise<{ id: string }> } // FIXED - changed to context with Promise
) {
  try {
    const { id } = await context.params; // FIXED - await params
    const reservationId = parseInt(id);
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