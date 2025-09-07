// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@/lib/generated/prisma";

// const prisma = new PrismaClient();

// export async function DELETE(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const roomClassId = parseInt(params.id);

//         if (isNaN(roomClassId)) {
//             return NextResponse.json(
//                 { error: 'Invalid room class ID' },
//                 { status: 400 }
//             );
//         }

//         // Check if room class exists
//         const existingRoomClass = await prisma.roomClass.findUnique({
//             where: { id: roomClassId },
//             include: {
//                 _count: {
//                     select: {
//                         rooms: true,
//                         reservations: true
//                     }
//                 }
//             }
//         });

//         if (!existingRoomClass) {
//             return NextResponse.json(
//                 { error: 'Room class not found' },
//                 { status: 404 }
//             );
//         }

//         // Check if room class has associated rooms
//         if (existingRoomClass._count.rooms > 0) {
//             return NextResponse.json(
//                 { 
//                     error: `Cannot delete room class "${existingRoomClass.name}" because it has ${existingRoomClass._count.rooms} associated room(s). Please move or delete the rooms first.` 
//                 },
//                 { status: 400 }
//             );
//         }

//         // Check if room class has reservations
//         if (existingRoomClass._count.reservations > 0) {
//             return NextResponse.json(
//                 { 
//                     error: `Cannot delete room class "${existingRoomClass.name}" because it has ${existingRoomClass._count.reservations} associated reservation(s).` 
//                 },
//                 { status: 400 }
//             );
//         }

//         // Delete the room class (cascade delete will handle related data)
//         await prisma.roomClass.delete({
//             where: { id: roomClassId }
//         });

//         return NextResponse.json({
//             message: `Room class "${existingRoomClass.name}" deleted successfully`,
//             success: true
//         });

//     } catch (error) {
//         console.error('Room class deletion error:', error);
//         return NextResponse.json(
//             { 
//                 error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
//             },
//             { status: 500 }
//         );
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// export async function GET(
//     request: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const roomClassId = parseInt(params.id);

//         if (isNaN(roomClassId)) {
//             return NextResponse.json(
//                 { error: 'Invalid room class ID' },
//                 { status: 400 }
//             );
//         }

//         const roomClass = await prisma.roomClass.findUnique({
//             where: { id: roomClassId },
//             include: {
//                 _count: {
//                     select: {
//                         rooms: true,
//                         reservations: true,
//                         roomImages: true,
//                         roomOffers: true,
//                         complementaryItems: true
//                     }
//                 },
//                 rooms: {
//                     include: {
//                         floor: true
//                     }
//                 },
//                 roomImages: true,
//                 roomOffers: {
//                     where: {
//                         isActive: true
//                     }
//                 },
//                 complementaryItems: true
//             }
//         });

//         if (!roomClass) {
//             return NextResponse.json(
//                 { error: 'Room class not found' },
//                 { status: 404 }
//             );
//         }

//         // Transform dates for JSON serialization
//         const transformedRoomClass = {
//             ...roomClass,
//             createdAt: roomClass.createdAt.toISOString(),
//             updatedAt: roomClass.updatedAt.toISOString(),
//             lastCleaningUpdate: roomClass.lastCleaningUpdate.toISOString(),
//             rooms: roomClass.rooms.map(room => ({
//                 ...room,
//                 createdAt: room.createdAt.toISOString(),
//                 updatedAt: room.updatedAt.toISOString(),
//                 lastCleaned: room.lastCleaned ? room.lastCleaned.toISOString() : null,
//                 nextCleaningDue: room.nextCleaningDue ? room.nextCleaningDue.toISOString() : null,
//             })),
//             roomImages: roomClass.roomImages.map(img => ({
//                 ...img,
//                 createdAt: img.createdAt.toISOString(),
//             })),
//             roomOffers: roomClass.roomOffers.map(offer => ({
//                 ...offer,
//                 validFrom: offer.validFrom.toISOString(),
//                 validTo: offer.validTo.toISOString(),
//                 createdAt: offer.createdAt.toISOString(),
//                 updatedAt: offer.updatedAt.toISOString(),
//             }))
//         };

//         return NextResponse.json({
//             roomClass: transformedRoomClass,
//             success: true
//         });

//     } catch (error) {
//         console.error('Room class fetch error:', error);
//         return NextResponse.json(
//             { 
//                 error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
//             },
//             { status: 500 }
//         );
//     } finally {
//         await prisma.$disconnect();
//     }
// }
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET specific room class with detailed information
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const roomClassId = parseInt(id);

    if (isNaN(roomClassId)) {
      return NextResponse.json(
        { error: "Invalid room class ID" },
        { status: 400 }
      );
    }

    const roomClass = await prisma.roomClass.findUnique({
      where: { id: roomClassId },
      include: {
        _count: {
          select: {
            rooms: true,
            reservations: true,
            roomImages: true,
            roomOffers: {
              where: {
                isActive: true,
                validTo: {
                  gte: new Date(),
                },
              },
            },
            complementaryItems: true,
          },
        },
        rooms: {
          include: {
            floor: {
              select: {
                id: true,
                name: true,
                floorNumber: true,
              },
            },
          },
          take: 12,
          orderBy: [{ floor: { floorNumber: "asc" } }, { roomNumber: "asc" }],
        },
        roomImages: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
          take: 8,
        },
        roomOffers: {
          where: {
            isActive: true,
          },
          orderBy: [{ validTo: "desc" }, { createdAt: "desc" }],
          take: 10,
        },
        complementaryItems: {
          orderBy: [{ isOptional: "asc" }, { name: "asc" }],
        },
      },
    });

    if (!roomClass) {
      return NextResponse.json(
        { error: "Room class not found" },
        { status: 404 }
      );
    }

    // Transform dates for JSON serialization
    const transformedRoomClass = {
      ...roomClass,
      createdAt: roomClass.createdAt.toISOString(),
      updatedAt: roomClass.updatedAt.toISOString(),
      lastCleaningUpdate: roomClass.lastCleaningUpdate.toISOString(),
      rooms: roomClass.rooms.map((room) => ({
        ...room,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
        lastCleaned: room.lastCleaned ? room.lastCleaned.toISOString() : null,
        nextCleaningDue: room.nextCleaningDue
          ? room.nextCleaningDue.toISOString()
          : null,
      })),
      roomImages: roomClass.roomImages.map((img) => ({
        ...img,
        createdAt: img.createdAt.toISOString(),
      })),
      roomOffers: roomClass.roomOffers.map((offer) => ({
        ...offer,
        validFrom: offer.validFrom.toISOString(),
        validTo: offer.validTo.toISOString(),
        createdAt: offer.createdAt.toISOString(),
        updatedAt: offer.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({
      roomClass: transformedRoomClass,
      success: true,
      meta: {
        totalRooms: roomClass._count.rooms,
        totalReservations: roomClass._count.reservations,
        totalImages: roomClass._count.roomImages,
        totalActiveOffers: roomClass._count.roomOffers,
        totalComplementaryItems: roomClass._count.complementaryItems,
        roomsShown: roomClass.rooms.length,
        imagesShown: roomClass.roomImages.length,
        offersShown: roomClass.roomOffers.length,
      },
    });
  } catch (error) {
    console.error("Room class fetch error:", error);
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

// DELETE specific room class
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const roomClassId = parseInt(id);

    if (isNaN(roomClassId)) {
      return NextResponse.json(
        { error: "Invalid room class ID" },
        { status: 400 }
      );
    }

    // Check if room class exists and get dependency counts
    const existingRoomClass = await prisma.roomClass.findUnique({
      where: { id: roomClassId },
      include: {
        _count: {
          select: {
            rooms: true,
            reservations: true,
            roomImages: true,
            roomOffers: true,
            complementaryItems: true,
          },
        },
      },
    });

    if (!existingRoomClass) {
      return NextResponse.json(
        { error: "Room class not found" },
        { status: 404 }
      );
    }

    // Check for blocking dependencies
    if (existingRoomClass._count.rooms > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete room class "${existingRoomClass.name}" because it has ${existingRoomClass._count.rooms} associated room(s). Please move or delete the rooms first.`,
          dependencies: {
            rooms: existingRoomClass._count.rooms,
            reservations: existingRoomClass._count.reservations,
          },
        },
        { status: 400 }
      );
    }

    if (existingRoomClass._count.reservations > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete room class "${existingRoomClass.name}" because it has ${existingRoomClass._count.reservations} associated reservation(s).`,
          dependencies: {
            rooms: existingRoomClass._count.rooms,
            reservations: existingRoomClass._count.reservations,
          },
        },
        { status: 400 }
      );
    }

    // Use transaction to safely delete room class and all related data
    const deleteResult = await prisma.$transaction(async (tx) => {
      const deletedData = {
        roomImages: 0,
        roomOffers: 0,
        complementaryItems: 0,
      };

      // Delete room images
      if (existingRoomClass._count.roomImages > 0) {
        const deletedImages = await tx.roomImage.deleteMany({
          where: { roomClassId: roomClassId },
        });
        deletedData.roomImages = deletedImages.count;
      }

      // Delete room offers
      if (existingRoomClass._count.roomOffers > 0) {
        const deletedOffers = await tx.roomOffer.deleteMany({
          where: { roomClassId: roomClassId },
        });
        deletedData.roomOffers = deletedOffers.count;
      }

      // Delete complementary items
      if (existingRoomClass._count.complementaryItems > 0) {
        const deletedItems = await tx.complementaryItem.deleteMany({
          where: { roomClassId: roomClassId },
        });
        deletedData.complementaryItems = deletedItems.count;
      }

      // Finally delete the room class
      const deletedRoomClass = await tx.roomClass.delete({
        where: { id: roomClassId },
      });

      return { deletedRoomClass, deletedData };
    });

    return NextResponse.json({
      message: `Room class "${existingRoomClass.name}" and all related data deleted successfully`,
      success: true,
      deletedData: {
        roomClass: existingRoomClass.name,
        roomImages: deleteResult.deletedData.roomImages,
        roomOffers: deleteResult.deletedData.roomOffers,
        complementaryItems: deleteResult.deletedData.complementaryItems,
        totalItemsDeleted:
          1 +
          deleteResult.deletedData.roomImages +
          deleteResult.deletedData.roomOffers +
          deleteResult.deletedData.complementaryItems,
      },
    });
  } catch (error) {
    console.error("Room class deletion error:", error);
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

// Redirect PUT/PATCH requests to edit endpoint
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json(
    {
      error: `Use PUT /api/rooms/settings/classes/${id}/edit to update the room class.`,
      editEndpoint: `/api/rooms/settings/classes/${id}/edit`,
    },
    { status: 405 }
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return NextResponse.json(
    {
      error: `Use PUT /api/rooms/settings/classes/${id}/edit to update the room class.`,
      editEndpoint: `/api/rooms/settings/classes/${id}/edit`,
    },
    { status: 405 }
  );
}