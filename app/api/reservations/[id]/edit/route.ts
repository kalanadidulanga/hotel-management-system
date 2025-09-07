// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/db";

// // GET - Fetch reservation data for editing
// export async function GET(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }>}
// ) {
//   try {
//      const { id } = await context.params; // ✅ await params
//     const reservationId = parseInt(id);

//     if (isNaN(reservationId)) {
//       return NextResponse.json(
//         { error: "Invalid reservation ID" },
//         { status: 400 }
//       );
//     }

//     const reservation = await prisma.reservation.findUnique({
//       where: { id: reservationId },
//       include: {
//         customer: true,
//         room: {
//           include: {
//             floor: true,
//           },
//         },
//         roomClass: true,
//         bookedByStaff: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     if (!reservation) {
//       return NextResponse.json(
//         { error: "Reservation not found" },
//         { status: 404 }
//       );
//     }

//     // Check if reservation can be edited
//     if (reservation.reservationStatus === "CHECKED_OUT") {
//       return NextResponse.json(
//         { error: "Cannot edit a checked-out reservation" },
//         { status: 400 }
//       );
//     }

//     if (reservation.reservationStatus === "CANCELLED") {
//       return NextResponse.json(
//         { error: "Cannot edit a cancelled reservation" },
//         { status: 400 }
//       );
//     }

//     // Get available rooms for potential room change
//     const availableRooms = await prisma.room.findMany({
//       where: {
//         OR: [
//           { status: "AVAILABLE" },
//           { id: reservation.roomId }, // Include current room
//         ],
//       },
//       include: {
//         roomClass: true,
//         floor: true,
//       },
//       orderBy: {
//         roomNumber: "asc",
//       },
//     });

//     // Get room classes for pricing
//     const roomClasses = await prisma.roomClass.findMany({
//       orderBy: {
//         name: "asc",
//       },
//     });

//     // Transform dates for JSON serialization
//     const transformedReservation = {
//       ...reservation,
//       checkInDate: reservation.checkInDate.toISOString().split("T")[0],
//       checkOutDate: reservation.checkOutDate.toISOString().split("T")[0],
//       actualCheckIn: reservation.actualCheckIn
//         ? reservation.actualCheckIn.toISOString()
//         : null,
//       actualCheckOut: reservation.actualCheckOut
//         ? reservation.actualCheckOut.toISOString()
//         : null,
//       cancellationDate: reservation.cancellationDate
//         ? reservation.cancellationDate.toISOString()
//         : null,
//       createdAt: reservation.createdAt.toISOString(),
//       updatedAt: reservation.updatedAt.toISOString(),
//       customer: {
//         ...reservation.customer,
//         dateOfBirth: reservation.customer.dateOfBirth
//           ? reservation.customer.dateOfBirth.toISOString().split("T")[0]
//           : null,
//         createdAt: reservation.customer.createdAt.toISOString(),
//         updatedAt: reservation.customer.updatedAt.toISOString(),
//       },
//     };

//     return NextResponse.json({
//       reservation: transformedReservation,
//       availableRooms,
//       roomClasses,
//       success: true,
//     });
//   } catch (error) {
//     console.error("Reservation edit fetch error:", error);
//     return NextResponse.json(
//       {
//         error:
//           "Internal server error: " +
//           (error instanceof Error ? error.message : "Unknown error"),
//       },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // PUT - Update reservation
// export async function PUT(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const reservationId = parseInt(params.id);
//     const body = await request.json();

//     if (isNaN(reservationId)) {
//       return NextResponse.json(
//         { error: "Invalid reservation ID" },
//         { status: 400 }
//       );
//     }

//     const existingReservation = await prisma.reservation.findUnique({
//       where: { id: reservationId },
//       include: { room: true, customer: true },
//     });

//     if (!existingReservation) {
//       return NextResponse.json(
//         { error: "Reservation not found" },
//         { status: 404 }
//       );
//     }

//     // Check if reservation can be edited
//     if (existingReservation.reservationStatus === "CHECKED_OUT") {
//       return NextResponse.json(
//         { error: "Cannot edit a checked-out reservation" },
//         { status: 400 }
//       );
//     }

//     if (existingReservation.reservationStatus === "CANCELLED") {
//       return NextResponse.json(
//         { error: "Cannot edit a cancelled reservation" },
//         { status: 400 }
//       );
//     }

//     // Calculate number of nights if dates are being changed
//     let numberOfNights = existingReservation.numberOfNights;
//     if (body.checkInDate && body.checkOutDate) {
//       const checkIn = new Date(body.checkInDate);
//       const checkOut = new Date(body.checkOutDate);
//       numberOfNights = Math.ceil(
//         (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
//       );
//     }

//     // Prepare update data - only essential fields
//     const updateData: any = {
//       updatedAt: new Date(),
//     };

//     // Update customer information if provided
//     const customerUpdates: any = {};
//     if (body.customer) {
//       if (body.customer.firstName)
//         customerUpdates.firstName = body.customer.firstName;
//       if (body.customer.lastName !== undefined)
//         customerUpdates.lastName = body.customer.lastName;
//       if (body.customer.phone) customerUpdates.phone = body.customer.phone;
//       if (body.customer.email) customerUpdates.email = body.customer.email;
//       if (body.customer.nationality)
//         customerUpdates.nationality = body.customer.nationality;
//       if (body.customer.identityNumber)
//         customerUpdates.identityNumber = body.customer.identityNumber;
//       if (body.customer.identityType)
//         customerUpdates.identityType = body.customer.identityType;
//       if (body.customer.gender) customerUpdates.gender = body.customer.gender;
//       if (body.customer.dateOfBirth)
//         customerUpdates.dateOfBirth = new Date(body.customer.dateOfBirth);
//       if (body.customer.address)
//         customerUpdates.address = body.customer.address;
//       if (body.customer.occupation !== undefined)
//         customerUpdates.occupation = body.customer.occupation;
//       customerUpdates.updatedAt = new Date();
//     }

//     // Update reservation data - only existing schema fields
//     if (body.checkInDate) updateData.checkInDate = new Date(body.checkInDate);
//     if (body.checkOutDate)
//       updateData.checkOutDate = new Date(body.checkOutDate);
//     if (body.checkInTime) updateData.checkInTime = body.checkInTime;
//     if (body.checkOutTime) updateData.checkOutTime = body.checkOutTime;
//     if (body.adults !== undefined) updateData.adults = parseInt(body.adults);
//     if (body.children !== undefined)
//       updateData.children = parseInt(body.children);
//     if (body.infants !== undefined) updateData.infants = parseInt(body.infants);
//     if (body.specialRequests !== undefined)
//       updateData.specialRequests = body.specialRequests;
//     if (body.remarks !== undefined) updateData.remarks = body.remarks;
//     if (body.billingType) updateData.billingType = body.billingType;
//     if (body.roomClassId) updateData.roomClassId = body.roomClassId;

//     updateData.numberOfNights = numberOfNights;

//     // Calculate pricing if relevant fields are updated
//     if (body.baseRoomRate !== undefined) {
//       updateData.baseRoomRate = parseFloat(body.baseRoomRate);
//       updateData.totalRoomCharge = updateData.baseRoomRate * numberOfNights;
//     }

//     if (body.extraCharges !== undefined)
//       updateData.extraCharges = parseFloat(body.extraCharges);

//     // Handle discount - only set if not "NONE"
//     if (body.discountType && body.discountType !== "NONE") {
//       updateData.discountType = body.discountType;
//       if (body.discountValue !== undefined)
//         updateData.discountValue = parseFloat(body.discountValue);
//       if (body.discountReason !== undefined)
//         updateData.discountReason = body.discountReason;
//     } else {
//       // Clear discount if "NONE" is selected
//       updateData.discountType = null;
//       updateData.discountValue = 0;
//       updateData.discountReason = null;
//     }

//     // Calculate discount amount
//     const baseCharge =
//       updateData.totalRoomCharge || existingReservation.totalRoomCharge;
//     const extraCharges =
//       updateData.extraCharges !== undefined
//         ? updateData.extraCharges
//         : existingReservation.extraCharges;
//     const subtotal = baseCharge + extraCharges;

//     let discountAmount = 0;
//     if (
//       updateData.discountType === "PERCENTAGE" &&
//       updateData.discountValue > 0
//     ) {
//       discountAmount = (subtotal * updateData.discountValue) / 100;
//     } else if (
//       updateData.discountType === "FIXED_AMOUNT" &&
//       updateData.discountValue > 0
//     ) {
//       discountAmount = updateData.discountValue;
//     }
//     updateData.discountAmount = discountAmount;

//     if (body.serviceCharge !== undefined)
//       updateData.serviceCharge = parseFloat(body.serviceCharge);
//     if (body.tax !== undefined) updateData.tax = parseFloat(body.tax);

//     // Recalculate total amount
//     const serviceCharge =
//       updateData.serviceCharge !== undefined
//         ? updateData.serviceCharge
//         : existingReservation.serviceCharge;
//     const tax =
//       updateData.tax !== undefined ? updateData.tax : existingReservation.tax;

//     const newTotalAmount = subtotal - discountAmount + serviceCharge + tax;
//     updateData.totalAmount = newTotalAmount;
//     updateData.balanceAmount = Math.max(
//       0,
//       newTotalAmount - existingReservation.advanceAmount
//     );

//     // Update payment status
//     if (existingReservation.advanceAmount >= newTotalAmount) {
//       updateData.paymentStatus = "PAID";
//     } else if (existingReservation.advanceAmount > 0) {
//       updateData.paymentStatus = "PARTIAL";
//     } else {
//       updateData.paymentStatus = "PENDING";
//     }

//     // Perform the updates
//     const [updatedCustomer, updatedReservation] = await prisma.$transaction(
//       async (tx) => {
//         // Update customer if there are changes
//         let customer = existingReservation.customer;
//         if (Object.keys(customerUpdates).length > 0) {
//           customer = await tx.customer.update({
//             where: { id: existingReservation.customerId },
//             data: customerUpdates,
//           });
//         }

//         // Handle room change if needed
//         if (body.roomId && body.roomId !== existingReservation.roomId) {
//           const newRoom = await tx.room.findUnique({
//             where: { id: body.roomId },
//           });

//           if (!newRoom) {
//             throw new Error("Selected room not found");
//           }

//           if (
//             newRoom.status !== "AVAILABLE" &&
//             newRoom.id !== existingReservation.roomId
//           ) {
//             throw new Error("Selected room is not available");
//           }

//           // Update old room status (if not checked in)
//           if (existingReservation.reservationStatus === "CONFIRMED") {
//             await tx.room.update({
//               where: { id: existingReservation.roomId },
//               data: { status: "AVAILABLE" },
//             });
//           }

//           // Update new room status
//           const newRoomStatus =
//             existingReservation.reservationStatus === "CHECKED_IN"
//               ? "OCCUPIED"
//               : "AVAILABLE";
//           await tx.room.update({
//             where: { id: body.roomId },
//             data: { status: newRoomStatus },
//           });

//           // Update reservation with new room
//           updateData.room = { connect: { id: body.roomId } };
//         }

//         // Update reservation
//         const reservation = await tx.reservation.update({
//           where: { id: reservationId },
//           data: updateData,
//           include: {
//             customer: true,
//             room: {
//               include: {
//                 floor: true,
//               },
//             },
//             roomClass: true,
//             bookedByStaff: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//               },
//             },
//           },
//         });

//         return [customer, reservation];
//       }
//     );

//     // Transform dates for JSON response
//     const transformedReservation = {
//       ...updatedReservation,
//       checkInDate: updatedReservation.checkInDate.toISOString(),
//       checkOutDate: updatedReservation.checkOutDate.toISOString(),
//       actualCheckIn: updatedReservation.actualCheckIn?.toISOString() || null,
//       actualCheckOut: updatedReservation.actualCheckOut?.toISOString() || null,
//       cancellationDate:
//         updatedReservation.cancellationDate?.toISOString() || null,
//       createdAt: updatedReservation.createdAt.toISOString(),
//       updatedAt: updatedReservation.updatedAt.toISOString(),
//       customer: {
//         ...updatedReservation.customer,
//         dateOfBirth:
//           updatedReservation.customer.dateOfBirth
//             ?.toISOString()
//             .split("T")[0] || null,
//         createdAt: updatedReservation.customer.createdAt.toISOString(),
//         updatedAt: updatedReservation.customer.updatedAt.toISOString(),
//       },
//     };

//     return NextResponse.json({
//       reservation: transformedReservation,
//       message: `Reservation ${updatedReservation.bookingNumber} updated successfully`,
//       success: true,
//     });
//   } catch (error) {
//     console.error("Reservation update error:", error);
//     return NextResponse.json(
//       {
//         error:
//           "Internal server error: " +
//           (error instanceof Error ? error.message : "Unknown error"),
//       },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Fetch reservation data for editing
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

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        customer: true,
        room: {
          include: {
            floor: true,
          },
        },
        roomClass: true,
        bookedByStaff: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // Check if reservation can be edited
    if (reservation.reservationStatus === "CHECKED_OUT") {
      return NextResponse.json(
        { error: "Cannot edit a checked-out reservation" },
        { status: 400 }
      );
    }

    if (reservation.reservationStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot edit a cancelled reservation" },
        { status: 400 }
      );
    }

    // Get available rooms for potential room change
    const availableRooms = await prisma.room.findMany({
      where: {
        OR: [
          { status: "AVAILABLE" },
          { id: reservation.roomId }, // Include current room
        ],
      },
      include: {
        roomClass: true,
        floor: true,
      },
      orderBy: {
        roomNumber: "asc",
      },
    });

    // Get room classes for pricing
    const roomClasses = await prisma.roomClass.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Transform dates for JSON serialization
    const transformedReservation = {
      ...reservation,
      checkInDate: reservation.checkInDate.toISOString().split("T")[0],
      checkOutDate: reservation.checkOutDate.toISOString().split("T")[0],
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
          ? reservation.customer.dateOfBirth.toISOString().split("T")[0]
          : null,
        createdAt: reservation.customer.createdAt.toISOString(),
        updatedAt: reservation.customer.updatedAt.toISOString(),
      },
    };

    return NextResponse.json({
      reservation: transformedReservation,
      availableRooms,
      roomClasses,
      success: true,
    });
  } catch (error) {
    console.error("Reservation edit fetch error:", error);
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

// PUT - Update reservation
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // FIXED - changed to context with Promise
) {
  try {
    const { id } = await context.params; // FIXED - await params
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
      include: { room: true, customer: true },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if reservation can be edited
    if (existingReservation.reservationStatus === "CHECKED_OUT") {
      return NextResponse.json(
        { error: "Cannot edit a checked-out reservation" },
        { status: 400 }
      );
    }

    if (existingReservation.reservationStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot edit a cancelled reservation" },
        { status: 400 }
      );
    }

    // Calculate number of nights if dates are being changed
    let numberOfNights = existingReservation.numberOfNights;
    if (body.checkInDate && body.checkOutDate) {
      const checkIn = new Date(body.checkInDate);
      const checkOut = new Date(body.checkOutDate);
      numberOfNights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Prepare update data - only essential fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update customer information if provided
    const customerUpdates: any = {};
    if (body.customer) {
      if (body.customer.firstName)
        customerUpdates.firstName = body.customer.firstName;
      if (body.customer.lastName !== undefined)
        customerUpdates.lastName = body.customer.lastName;
      if (body.customer.phone) customerUpdates.phone = body.customer.phone;
      if (body.customer.email) customerUpdates.email = body.customer.email;
      if (body.customer.nationality)
        customerUpdates.nationality = body.customer.nationality;
      if (body.customer.identityNumber)
        customerUpdates.identityNumber = body.customer.identityNumber;
      if (body.customer.identityType)
        customerUpdates.identityType = body.customer.identityType;
      if (body.customer.gender) customerUpdates.gender = body.customer.gender;
      if (body.customer.dateOfBirth)
        customerUpdates.dateOfBirth = new Date(body.customer.dateOfBirth);
      if (body.customer.address)
        customerUpdates.address = body.customer.address;
      if (body.customer.occupation !== undefined)
        customerUpdates.occupation = body.customer.occupation;
      customerUpdates.updatedAt = new Date();
    }

    // Update reservation data - only existing schema fields
    if (body.checkInDate) updateData.checkInDate = new Date(body.checkInDate);
    if (body.checkOutDate)
      updateData.checkOutDate = new Date(body.checkOutDate);
    if (body.checkInTime) updateData.checkInTime = body.checkInTime;
    if (body.checkOutTime) updateData.checkOutTime = body.checkOutTime;
    if (body.adults !== undefined) updateData.adults = parseInt(body.adults);
    if (body.children !== undefined)
      updateData.children = parseInt(body.children);
    if (body.infants !== undefined) updateData.infants = parseInt(body.infants);
    if (body.specialRequests !== undefined)
      updateData.specialRequests = body.specialRequests;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;
    if (body.billingType) updateData.billingType = body.billingType;
    if (body.roomClassId) updateData.roomClassId = body.roomClassId;

    updateData.numberOfNights = numberOfNights;

    // Calculate pricing if relevant fields are updated
    if (body.baseRoomRate !== undefined) {
      updateData.baseRoomRate = parseFloat(body.baseRoomRate);
      updateData.totalRoomCharge = updateData.baseRoomRate * numberOfNights;
    }

    if (body.extraCharges !== undefined)
      updateData.extraCharges = parseFloat(body.extraCharges);

    // Handle discount - only set if not "NONE"
    if (body.discountType && body.discountType !== "NONE") {
      updateData.discountType = body.discountType;
      if (body.discountValue !== undefined)
        updateData.discountValue = parseFloat(body.discountValue);
      if (body.discountReason !== undefined)
        updateData.discountReason = body.discountReason;
    } else {
      // Clear discount if "NONE" is selected
      updateData.discountType = null;
      updateData.discountValue = 0;
      updateData.discountReason = null;
    }

    // Calculate discount amount
    const baseCharge =
      updateData.totalRoomCharge || existingReservation.totalRoomCharge;
    const extraCharges =
      updateData.extraCharges !== undefined
        ? updateData.extraCharges
        : existingReservation.extraCharges;
    const subtotal = baseCharge + extraCharges;

    let discountAmount = 0;
    if (
      updateData.discountType === "PERCENTAGE" &&
      updateData.discountValue > 0
    ) {
      discountAmount = (subtotal * updateData.discountValue) / 100;
    } else if (
      updateData.discountType === "FIXED_AMOUNT" &&
      updateData.discountValue > 0
    ) {
      discountAmount = updateData.discountValue;
    }
    updateData.discountAmount = discountAmount;

    if (body.serviceCharge !== undefined)
      updateData.serviceCharge = parseFloat(body.serviceCharge);
    if (body.tax !== undefined) updateData.tax = parseFloat(body.tax);

    // Recalculate total amount
    const serviceCharge =
      updateData.serviceCharge !== undefined
        ? updateData.serviceCharge
        : existingReservation.serviceCharge;
    const tax =
      updateData.tax !== undefined ? updateData.tax : existingReservation.tax;

    const newTotalAmount = subtotal - discountAmount + serviceCharge + tax;
    updateData.totalAmount = newTotalAmount;
    updateData.balanceAmount = Math.max(
      0,
      newTotalAmount - existingReservation.advanceAmount
    );

    // Update payment status
    if (existingReservation.advanceAmount >= newTotalAmount) {
      updateData.paymentStatus = "PAID";
    } else if (existingReservation.advanceAmount > 0) {
      updateData.paymentStatus = "PARTIAL";
    } else {
      updateData.paymentStatus = "PENDING";
    }

    // Perform the updates
    const [updatedCustomer, updatedReservation] = await prisma.$transaction(
      async (tx) => {
        // Update customer if there are changes
        let customer = existingReservation.customer;
        if (Object.keys(customerUpdates).length > 0) {
          customer = await tx.customer.update({
            where: { id: existingReservation.customerId },
            data: customerUpdates,
          });
        }

        // Handle room change if needed
        if (body.roomId && body.roomId !== existingReservation.roomId) {
          const newRoom = await tx.room.findUnique({
            where: { id: body.roomId },
          });

          if (!newRoom) {
            throw new Error("Selected room not found");
          }

          if (
            newRoom.status !== "AVAILABLE" &&
            newRoom.id !== existingReservation.roomId
          ) {
            throw new Error("Selected room is not available");
          }

          // Update old room status (if not checked in)
          if (existingReservation.reservationStatus === "CONFIRMED") {
            await tx.room.update({
              where: { id: existingReservation.roomId },
              data: { status: "AVAILABLE" },
            });
          }

          // Update new room status
          const newRoomStatus =
            existingReservation.reservationStatus === "CHECKED_IN"
              ? "OCCUPIED"
              : "AVAILABLE";
          await tx.room.update({
            where: { id: body.roomId },
            data: { status: newRoomStatus },
          });

          // Update reservation with new room
          updateData.room = { connect: { id: body.roomId } };
        }

        // Update reservation
        const reservation = await tx.reservation.update({
          where: { id: reservationId },
          data: updateData,
          include: {
            customer: true,
            room: {
              include: {
                floor: true,
              },
            },
            roomClass: true,
            bookedByStaff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return [customer, reservation];
      }
    );

    // Transform dates for JSON response
    const transformedReservation = {
      ...updatedReservation,
      checkInDate: updatedReservation.checkInDate.toISOString(),
      checkOutDate: updatedReservation.checkOutDate.toISOString(),
      actualCheckIn: updatedReservation.actualCheckIn?.toISOString() || null,
      actualCheckOut: updatedReservation.actualCheckOut?.toISOString() || null,
      cancellationDate:
        updatedReservation.cancellationDate?.toISOString() || null,
      createdAt: updatedReservation.createdAt.toISOString(),
      updatedAt: updatedReservation.updatedAt.toISOString(),
      customer: {
        ...updatedReservation.customer,
        dateOfBirth:
          updatedReservation.customer.dateOfBirth
            ?.toISOString()
            .split("T")[0] || null,
        createdAt: updatedReservation.customer.createdAt.toISOString(),
        updatedAt: updatedReservation.customer.updatedAt.toISOString(),
      },
    };

    return NextResponse.json({
      reservation: transformedReservation,
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