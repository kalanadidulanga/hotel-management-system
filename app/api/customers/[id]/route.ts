// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/db";

// export async function GET(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id } = await context.params; // ✅ await the params
//     const customerId = parseInt(id);

//     if (isNaN(customerId)) {
//       return NextResponse.json(
//         { error: "Invalid customer ID" },
//         { status: 400 }
//       );
//     }

//     const customer = await prisma.customer.findUnique({
//       where: { id: customerId },
//       include: {
//         reservations: {
//           orderBy: { createdAt: "desc" },
//           take: 10,
//           include: {
//             room: {
//               select: {
//                 roomNumber: true,
//               },
//             },
//             roomClass: {
//               select: {
//                 name: true,
//               },
//             },
//           },
//         },
//         quickOrders: {
//           orderBy: { createdAt: "desc" },
//           take: 5,
//           include: {
//             deliveredByStaff: {
//               select: {
//                 name: true,
//               },
//             },
//           },
//         },
//         wakeUpCalls: {
//           orderBy: { date: "desc" },
//           take: 5,
//         },
//         _count: {
//           select: {
//             reservations: true,
//             quickOrders: true,
//             wakeUpCalls: true,
//           },
//         },
//       },
//     });

//     if (!customer) {
//       return NextResponse.json(
//         { error: "Customer not found" },
//         { status: 404 }
//       );
//     }

//     // Calculate customer statistics
//     const stats = {
//       totalBookings: customer._count.reservations,
//       totalOrders: customer._count.quickOrders,
//       totalWakeUpCalls: customer._count.wakeUpCalls,
//       totalSpent: await prisma.reservation.aggregate({
//         where: { customerId: customerId },
//         _sum: { totalAmount: true },
//       }),
//       lastVisit: await prisma.reservation.findFirst({
//         where: {
//           customerId: customerId,
//           reservationStatus: "CHECKED_OUT",
//         },
//         orderBy: { actualCheckOut: "desc" },
//         select: { actualCheckOut: true },
//       }),
//       currentStay: await prisma.reservation.findFirst({
//         where: {
//           customerId: customerId,
//           reservationStatus: "CHECKED_IN",
//         },
//         include: {
//           room: {
//             select: { roomNumber: true },
//           },
//           roomClass: {
//             select: { name: true },
//           },
//         },
//       }),
//     };

//     return NextResponse.json({
//       customer,
//       stats,
//     });
//   } catch (error) {
//     console.error("Error fetching customer:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch customer" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const customerId = parseInt(params.id);
//     const body = await request.json();

//     if (isNaN(customerId)) {
//       return NextResponse.json(
//         { error: "Invalid customer ID" },
//         { status: 400 }
//       );
//     }

//     // Check if customer exists
//     const existingCustomer = await prisma.customer.findUnique({
//       where: { id: customerId },
//     });

//     if (!existingCustomer) {
//       return NextResponse.json(
//         { error: "Customer not found" },
//         { status: 404 }
//       );
//     }

//     // Check for email/identity conflicts with other customers
//     if (
//       body.email !== existingCustomer.email ||
//       body.identityNumber !== existingCustomer.identityNumber
//     ) {
//       const conflictCustomer = await prisma.customer.findFirst({
//         where: {
//           AND: [
//             { id: { not: customerId } },
//             {
//               OR: [
//                 { email: body.email },
//                 { identityNumber: body.identityNumber },
//               ],
//             },
//           ],
//         },
//       });

//       if (conflictCustomer) {
//         if (conflictCustomer.email === body.email) {
//           return NextResponse.json(
//             { error: "Another customer with this email already exists" },
//             { status: 400 }
//           );
//         }
//         if (conflictCustomer.identityNumber === body.identityNumber) {
//           return NextResponse.json(
//             {
//               error:
//                 "Another customer with this NIC/Identity number already exists",
//             },
//             { status: 400 }
//           );
//         }
//       }
//     }

//     // Create full name
//     const fullName = `${body.firstName}${
//       body.lastName ? " " + body.lastName : ""
//     }`;

//     // Process dates
//     const dateOfBirth = body.dateOfBirth
//       ? new Date(body.dateOfBirth)
//       : existingCustomer.dateOfBirth;
//     const anniversary = body.anniversary ? new Date(body.anniversary) : null;

//     const updatedCustomer = await prisma.customer.update({
//       where: { id: customerId },
//       data: {
//         fullName,
//         firstName: body.firstName,
//         lastName: body.lastName || null,
//         email: body.email,
//         phone: body.phone,
//         identityNumber: body.identityNumber,
//         nationality: body.nationality,
//         gender: body.gender || existingCustomer.gender,
//         dateOfBirth,
//         anniversary,
//         title: body.title || null,
//         occupation: body.occupation || null,
//         countryCode: body.countryCode || null,
//         alternatePhone: body.alternatePhone || null,
//         contactType: body.contactType || null,
//         country: body.country || null,
//         state: body.state || null,
//         city: body.city || null,
//         zipcode: body.zipcode || null,
//         address: body.address,
//         identityType: body.identityType || existingCustomer.identityType,
//         frontIdUrl: body.frontIdUrl || existingCustomer.frontIdUrl,
//         backIdUrl: body.backIdUrl || existingCustomer.backIdUrl,
//         guestImageUrl: body.guestImageUrl || existingCustomer.guestImageUrl,
//         specialRequests: body.specialRequests || null,
//         notes: body.notes || null,
//         isVip: body.isVip || false,
//         vipLevel: body.vipLevel || null,
//         updatedAt: new Date(),
//       },
//       select: {
//         id: true,
//         customerID: true,
//         firstName: true,
//         lastName: true,
//         fullName: true,
//         email: true,
//         phone: true,
//         identityNumber: true,
//         nationality: true,
//         isVip: true,
//         vipLevel: true,
//         updatedAt: true,
//       },
//     });

//     return NextResponse.json({
//       customer: updatedCustomer,
//       message: "Customer updated successfully",
//     });
//   } catch (error: any) {
//     console.error("Error updating customer:", error);

//     if (error.code === "P2002") {
//       return NextResponse.json(
//         { error: "Customer with this email or identity number already exists" },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: "Failed to update customer" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const customerId = parseInt(params.id);

//     if (isNaN(customerId)) {
//       return NextResponse.json(
//         { error: "Invalid customer ID" },
//         { status: 400 }
//       );
//     }

//     // Check if customer has active reservations
//     const activeReservations = await prisma.reservation.findMany({
//       where: {
//         customerId: customerId,
//         reservationStatus: {
//           in: ["CONFIRMED", "CHECKED_IN"],
//         },
//       },
//     });

//     if (activeReservations.length > 0) {
//       return NextResponse.json(
//         { error: "Cannot delete customer with active reservations" },
//         { status: 400 }
//       );
//     }

//     // Soft delete - mark as inactive instead of actual deletion
//     await prisma.customer.update({
//       where: { id: customerId },
//       data: {
//         isActive: false,
//         updatedAt: new Date(),
//       },
//     });

//     return NextResponse.json({
//       message: "Customer deactivated successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting customer:", error);
//     return NextResponse.json(
//       { error: "Failed to delete customer" },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        reservations: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
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
          },
        },
        quickOrders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            deliveredByStaff: {
              select: {
                name: true,
              },
            },
          },
        },
        wakeUpCalls: {
          orderBy: { date: "desc" },
          take: 5,
        },
        _count: {
          select: {
            reservations: true,
            quickOrders: true,
            wakeUpCalls: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Calculate customer statistics
    const stats = {
      totalBookings: customer._count.reservations,
      totalOrders: customer._count.quickOrders,
      totalWakeUpCalls: customer._count.wakeUpCalls,
      totalSpent: await prisma.reservation.aggregate({
        where: { customerId: customerId },
        _sum: { totalAmount: true },
      }),
      lastVisit: await prisma.reservation.findFirst({
        where: {
          customerId: customerId,
          reservationStatus: "CHECKED_OUT",
        },
        orderBy: { actualCheckOut: "desc" },
        select: { actualCheckOut: true },
      }),
      currentStay: await prisma.reservation.findFirst({
        where: {
          customerId: customerId,
          reservationStatus: "CHECKED_IN",
        },
        include: {
          room: {
            select: { roomNumber: true },
          },
          roomClass: {
            select: { name: true },
          },
        },
      }),
    };

    return NextResponse.json({
      customer,
      stats,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // FIXED - changed to context with Promise
) {
  try {
    const { id } = await context.params; // FIXED - await params
    const customerId = parseInt(id);
    const body = await request.json();

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check for email/identity conflicts with other customers
    if (
      body.email !== existingCustomer.email ||
      body.identityNumber !== existingCustomer.identityNumber
    ) {
      const conflictCustomer = await prisma.customer.findFirst({
        where: {
          AND: [
            { id: { not: customerId } },
            {
              OR: [
                { email: body.email },
                { identityNumber: body.identityNumber },
              ],
            },
          ],
        },
      });

      if (conflictCustomer) {
        if (conflictCustomer.email === body.email) {
          return NextResponse.json(
            { error: "Another customer with this email already exists" },
            { status: 400 }
          );
        }
        if (conflictCustomer.identityNumber === body.identityNumber) {
          return NextResponse.json(
            {
              error:
                "Another customer with this NIC/Identity number already exists",
            },
            { status: 400 }
          );
        }
      }
    }

    // Create full name
    const fullName = `${body.firstName}${
      body.lastName ? " " + body.lastName : ""
    }`;

    // Process dates
    const dateOfBirth = body.dateOfBirth
      ? new Date(body.dateOfBirth)
      : existingCustomer.dateOfBirth;
    const anniversary = body.anniversary ? new Date(body.anniversary) : null;

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        fullName,
        firstName: body.firstName,
        lastName: body.lastName || null,
        email: body.email,
        phone: body.phone,
        identityNumber: body.identityNumber,
        nationality: body.nationality,
        gender: body.gender || existingCustomer.gender,
        dateOfBirth,
        anniversary,
        title: body.title || null,
        occupation: body.occupation || null,
        countryCode: body.countryCode || null,
        alternatePhone: body.alternatePhone || null,
        contactType: body.contactType || null,
        country: body.country || null,
        state: body.state || null,
        city: body.city || null,
        zipcode: body.zipcode || null,
        address: body.address,
        identityType: body.identityType || existingCustomer.identityType,
        frontIdUrl: body.frontIdUrl || existingCustomer.frontIdUrl,
        backIdUrl: body.backIdUrl || existingCustomer.backIdUrl,
        guestImageUrl: body.guestImageUrl || existingCustomer.guestImageUrl,
        specialRequests: body.specialRequests || null,
        notes: body.notes || null,
        isVip: body.isVip || false,
        vipLevel: body.vipLevel || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        customerID: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        identityNumber: true,
        nationality: true,
        isVip: true,
        vipLevel: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      customer: updatedCustomer,
      message: "Customer updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating customer:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Customer with this email or identity number already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // FIXED - changed to context with Promise
) {
  try {
    const { id } = await context.params; // FIXED - await params
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Check if customer has active reservations
    const activeReservations = await prisma.reservation.findMany({
      where: {
        customerId: customerId,
        reservationStatus: {
          in: ["CONFIRMED", "CHECKED_IN"],
        },
      },
    });

    if (activeReservations.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete customer with active reservations" },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive instead of actual deletion
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Customer deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}