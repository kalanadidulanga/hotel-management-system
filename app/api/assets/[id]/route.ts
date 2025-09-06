// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/db";

// export async function GET(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id } = await context.params;
//     const assetId = parseInt(id);

//     if (isNaN(assetId)) {
//       return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
//     }

//     const asset = await prisma.asset.findUnique({
//       where: { id: assetId },
//       include: {
//         category: {
//           select: {
//             id: true,
//             name: true,
//             assetType: true,
//           },
//         },
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//             fullName: true,
//             department: true,
//           },
//         },
//         maintenanceLogs: {
//           select: {
//             id: true,
//             maintenanceId: true, // Fixed: schema uses maintenanceId not logId
//             serviceType: true, // Fixed: schema uses serviceType not type
//             description: true,
//             cost: true,
//             serviceProvider: true, // Fixed: schema uses serviceProvider not performedBy
//             maintenanceDate: true, // Fixed: schema uses maintenanceDate not performedDate
//             nextMaintenanceDate: true,
//             status: true,
//           },
//           orderBy: {
//             maintenanceDate: "desc", // Fixed: changed from performedDate
//           },
//           take: 5,
//         },
//         notifications: {
//           where: {
//             isRead: false,
//           },
//           select: {
//             id: true,
//             type: true,
//             title: true,
//             message: true,
//             priority: true,
//             scheduledFor: true,
//             isRead: true,
//             createdAt: true,
//           },
//           orderBy: {
//             scheduledFor: "asc",
//           },
//         },
//       },
//     });

//     if (!asset) {
//       return NextResponse.json({ error: "Asset not found" }, { status: 404 });
//     }

//     // Calculate maintenance status and days difference
//     const today = new Date();
//     const maintenanceDate = new Date(asset.maintenanceDate);
//     const daysDiff = Math.ceil(
//       (maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
//     );

//     let maintenanceStatus = "scheduled";
//     if (daysDiff < 0) {
//       maintenanceStatus = "overdue";
//     } else if (daysDiff <= 3) {
//       maintenanceStatus = "urgent";
//     } else if (daysDiff <= 7) {
//       maintenanceStatus = "due-soon";
//     }

//     const assetWithStatus = {
//       ...asset,
//       maintenanceStatus,
//       daysDiff,
//     };

//     return NextResponse.json(assetWithStatus);
//   } catch (error) {
//     console.error("Get asset API error:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch asset" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const assetId = parseInt(params.id);

//     if (isNaN(assetId)) {
//       return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
//     }

//     // Check if asset exists
//     const asset = await prisma.asset.findUnique({
//       where: { id: assetId },
//     });

//     if (!asset) {
//       return NextResponse.json({ error: "Asset not found" }, { status: 404 });
//     }

//     // Delete related records first (due to foreign key constraints)
//     await prisma.assetNotification.deleteMany({
//       where: { assetId },
//     });

//     await prisma.maintenanceLog.deleteMany({
//       where: { assetId },
//     });

//     // Delete the asset
//     await prisma.asset.delete({
//       where: { id: assetId },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Asset deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete asset API error:", error);
//     return NextResponse.json(
//       { error: "Failed to delete asset" },
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
    const assetId = parseInt(id);

    if (isNaN(assetId)) {
      return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            assetType: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            fullName: true,
            department: true,
          },
        },
        maintenanceLogs: {
          select: {
            id: true,
            maintenanceId: true,
            serviceType: true,
            description: true,
            cost: true,
            serviceProvider: true,
            maintenanceDate: true,
            nextMaintenanceDate: true,
            status: true,
          },
          orderBy: {
            maintenanceDate: "desc",
          },
          take: 5,
        },
        notifications: {
          where: {
            isRead: false,
          },
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            priority: true,
            scheduledFor: true,
            isRead: true,
            createdAt: true,
          },
          orderBy: {
            scheduledFor: "asc",
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Calculate maintenance status and days difference
    const today = new Date();
    const maintenanceDate = new Date(asset.maintenanceDate);
    const daysDiff = Math.ceil(
      (maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let maintenanceStatus = "scheduled";
    if (daysDiff < 0) {
      maintenanceStatus = "overdue";
    } else if (daysDiff <= 3) {
      maintenanceStatus = "urgent";
    } else if (daysDiff <= 7) {
      maintenanceStatus = "due-soon";
    }

    const assetWithStatus = {
      ...asset,
      maintenanceStatus,
      daysDiff,
    };

    return NextResponse.json(assetWithStatus);
  } catch (error) {
    console.error("Get asset API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
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
    const assetId = parseInt(id);

    if (isNaN(assetId)) {
      return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.assetNotification.deleteMany({
      where: { assetId },
    });

    await prisma.maintenanceLog.deleteMany({
      where: { assetId },
    });

    // Delete the asset
    await prisma.asset.delete({
      where: { id: assetId },
    });

    return NextResponse.json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    console.error("Delete asset API error:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}