// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@/lib/generated/prisma";

// const prisma = new PrismaClient();

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const search = searchParams.get("search") || "";
//     const status = searchParams.get("status") || "";
//     const priority = searchParams.get("priority") || "";
//     const assetId = searchParams.get("assetId") || "";
//     const staffId = searchParams.get("staffId") || "";
//     const dateFrom = searchParams.get("dateFrom") || "";
//     const dateTo = searchParams.get("dateTo") || "";

//     const skip = (page - 1) * limit;

//     // Build where conditions
//     const whereConditions: any = {};

//     if (search) {
//       whereConditions.OR = [
//         { maintenanceId: { contains: search, mode: "insensitive" } },
//         { description: { contains: search, mode: "insensitive" } },
//         { serviceProvider: { contains: search, mode: "insensitive" } },
//         { workOrderNumber: { contains: search, mode: "insensitive" } },
//         {
//           asset: {
//             OR: [
//               { name: { contains: search, mode: "insensitive" } },
//               { assetId: { contains: search, mode: "insensitive" } },
//               { code: { contains: search, mode: "insensitive" } },
//             ],
//           },
//         },
//       ];
//     }

//     if (status && status !== "all") {
//       whereConditions.status = status.toUpperCase();
//     }

//     if (priority && priority !== "all") {
//       whereConditions.priority = priority.toUpperCase();
//     }

//     if (assetId) {
//       whereConditions.assetId = parseInt(assetId);
//     }

//     if (staffId) {
//       whereConditions.staffId = parseInt(staffId);
//     }

//     if (dateFrom && dateTo) {
//       whereConditions.maintenanceDate = {
//         gte: new Date(dateFrom),
//         lte: new Date(dateTo),
//       };
//     } else if (dateFrom) {
//       whereConditions.maintenanceDate = {
//         gte: new Date(dateFrom),
//       };
//     } else if (dateTo) {
//       whereConditions.maintenanceDate = {
//         lte: new Date(dateTo),
//       };
//     }

//     // Get maintenance logs with pagination
//     const [maintenanceLogs, totalCount] = await Promise.all([
//       prisma.maintenanceLog.findMany({
//         where: whereConditions,
//         include: {
//           asset: {
//             select: {
//               id: true,
//               assetId: true,
//               name: true,
//               type: true,
//               location: true,
//               imageUrl: true,
//               status: true,
//             },
//           },
//           staff: {
//             select: {
//               id: true,
//               name: true,
//               fullName: true,
//               department: true,
//             },
//           },
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//         skip,
//         take: limit,
//       }),
//       prisma.maintenanceLog.count({
//         where: whereConditions,
//       }),
//     ]);

//     const totalPages = Math.ceil(totalCount / limit);

//     return NextResponse.json({
//       maintenanceLogs,
//       pagination: {
//         page,
//         limit,
//         totalCount,
//         totalPages,
//         hasNext: page < totalPages,
//         hasPrev: page > 1,
//       },
//     });
//   } catch (error) {
//     console.error("Maintenance list API error:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch maintenance logs" },
//       { status: 500 }
//     );
//   }
// }
// 
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const assetType = searchParams.get("assetType") || "";
    const staffId = searchParams.get("staffId") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        { maintenanceId: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { serviceProvider: { contains: search, mode: "insensitive" } },
        { workOrderNumber: { contains: search, mode: "insensitive" } },
        {
          asset: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { assetId: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          staff: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { fullName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (status && status !== "all") {
      whereConditions.status = status.toUpperCase();
    }

    if (priority && priority !== "all") {
      whereConditions.priority = priority.toUpperCase();
    }

    // Handle assetType filter with potential conflicts
    if (assetType && assetType !== "all") {
      if (whereConditions.asset) {
        whereConditions.asset = {
          ...whereConditions.asset,
          type: assetType.toUpperCase(),
        };
      } else {
        whereConditions.asset = {
          type: assetType.toUpperCase(),
        };
      }
    }

    // Fixed staffId handling - only filter when not "all" and is a valid number
    if (staffId && staffId !== "all" && !isNaN(parseInt(staffId))) {
      whereConditions.staffId = parseInt(staffId);
    }

    if (dateFrom && dateTo) {
      whereConditions.maintenanceDate = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      };
    } else if (dateFrom) {
      whereConditions.maintenanceDate = {
        gte: new Date(dateFrom),
      };
    } else if (dateTo) {
      whereConditions.maintenanceDate = {
        lte: new Date(dateTo),
      };
    }

    // Build orderBy conditions
    let orderBy: any = {};
    if (sortBy === "assetName") {
      orderBy = { asset: { name: sortOrder } };
    } else if (sortBy === "staffName") {
      orderBy = { staff: { name: sortOrder } };
    } else if (sortBy === "cost") {
      orderBy = { cost: sortOrder };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Get maintenance logs with pagination
    const [maintenanceLogs, totalCount] = await Promise.all([
      prisma.maintenanceLog.findMany({
        where: whereConditions,
        include: {
          asset: {
            select: {
              id: true,
              assetId: true,
              name: true,
              type: true,
              location: true,
              imageUrl: true,
              status: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              fullName: true,
              department: true,
              staffClass: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.maintenanceLog.count({
        where: whereConditions,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get summary statistics for the filtered results
    const summaryStats = await prisma.maintenanceLog.aggregate({
      where: whereConditions,
      _sum: {
        cost: true,
        partsCost: true,
        laborCost: true,
      },
      _count: {
        id: true,
      },
    });

    // Get status distribution for filtered results
    const statusDistribution = await prisma.maintenanceLog.groupBy({
      by: ["status"],
      where: whereConditions,
      _count: {
        status: true,
      },
    });

    // Get priority distribution for filtered results
    const priorityDistribution = await prisma.maintenanceLog.groupBy({
      by: ["priority"],
      where: whereConditions,
      _count: {
        priority: true,
      },
    });

    // Get unique staff and assets for filter dropdowns
    const [staffList, assetsList] = await Promise.all([
      prisma.user.findMany({
        where: {
          maintenanceLogs: {
            some: {},
          },
        },
        select: {
          id: true,
          name: true,
          fullName: true,
          department: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.asset.findMany({
        where: {
          maintenanceLogs: {
            some: {},
          },
        },
        select: {
          id: true,
          assetId: true,
          name: true,
          type: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    // Fixed total cost calculation - only use cost field
    const totalCost = summaryStats._sum.cost || 0;

    return NextResponse.json({
      maintenanceLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary: {
        totalRecords: summaryStats._count.id,
        totalCost,
        averageCost:
          summaryStats._count.id > 0 ? totalCost / summaryStats._count.id : 0,
      },
      filters: {
        statusDistribution,
        priorityDistribution,
        staffList,
        assetsList,
      },
      appliedFilters: {
        search,
        status,
        priority,
        assetType,
        staffId,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error("Maintenance list API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch maintenance logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}