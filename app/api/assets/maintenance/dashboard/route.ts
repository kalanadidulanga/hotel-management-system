import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "30"; // days
    const status = searchParams.get("status") || "all";

    const days = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Get maintenance statistics
    const [
      totalMaintenanceLogs,
      pendingMaintenance,
      overdueMaintenance,
      completedMaintenance,
      inProgressMaintenance,
      totalMaintenanceCost,
      maintenanceByPriority,
      recentMaintenanceLogs,
      upcomingMaintenance,
      maintenancesByStaff,
      assetsNeedingMaintenance,
    ] = await Promise.all([
      // Total maintenance logs in timeframe
      prisma.maintenanceLog.count({
        where: {
          createdAt: { gte: dateFrom },
        },
      }),

      // Pending maintenance count
      prisma.maintenanceLog.count({
        where: {
          status: "SCHEDULED",
          scheduledDate: { gte: new Date() },
        },
      }),

      // Overdue maintenance count
      prisma.maintenanceLog.count({
        where: {
          status: "OVERDUE",
        },
      }),

      // Completed maintenance in timeframe
      prisma.maintenanceLog.count({
        where: {
          status: "COMPLETED",
          createdAt: { gte: dateFrom },
        },
      }),

      // In progress maintenance
      prisma.maintenanceLog.count({
        where: {
          status: "IN_PROGRESS",
        },
      }),

      // Total maintenance cost in timeframe
      prisma.maintenanceLog.aggregate({
        where: {
          createdAt: { gte: dateFrom },
        },
        _sum: {
          cost: true,
          partsCost: true,
          laborCost: true,
        },
      }),

      // Maintenance by priority
      prisma.maintenanceLog.groupBy({
        by: ["priority"],
        where: {
          createdAt: { gte: dateFrom },
        },
        _count: {
          priority: true,
        },
        _sum: {
          cost: true,
        },
      }),

      // Recent maintenance logs
      prisma.maintenanceLog.findMany({
        where:
          status !== "all"
            ? {
                status: status.toUpperCase() as any,
                createdAt: { gte: dateFrom },
              }
            : {
                createdAt: { gte: dateFrom },
              },
        include: {
          asset: {
            select: {
              id: true,
              assetId: true,
              name: true,
              type: true,
              location: true,
              imageUrl: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              fullName: true,
              department: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),

      // Upcoming maintenance (next 30 days)
      prisma.asset.findMany({
        where: {
          maintenanceDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          assetId: true,
          name: true,
          type: true,
          maintenanceDate: true,
          location: true,
          assignedTo: {
            select: {
              name: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          maintenanceDate: "asc",
        },
        take: 15,
      }),

      // Maintenance by staff member
      prisma.maintenanceLog.groupBy({
        by: ["staffId"],
        where: {
          createdAt: { gte: dateFrom },
        },
        _count: {
          id: true,
        },
        _sum: {
          cost: true,
        },
      }),

      // Assets needing immediate attention
      prisma.asset.findMany({
        where: {
          OR: [
            { maintenanceDate: { lt: new Date() } }, // Overdue
            {
              maintenanceDate: {
                lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
              },
            },
            { status: "MAINTENANCE" },
            { status: "DAMAGED" },
          ],
        },
        select: {
          id: true,
          assetId: true,
          name: true,
          type: true,
          status: true,
          maintenanceDate: true,
          location: true,
          assignedTo: {
            select: {
              name: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          maintenanceDate: "asc",
        },
        take: 10,
      }),
    ]);

    // Get staff details for maintenance by staff
    const staffIds = maintenancesByStaff.map((m: { staffId: number }) => m.staffId);
    const staffDetails = await prisma.user.findMany({
      where: {
        id: { in: staffIds },
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        department: true,
      },
    });

    // Combine staff data with maintenance counts
    const staffMaintenanceData = maintenancesByStaff.map((maintenance: { staffId: number } & Record<string, any>) => {
      const staff = staffDetails.find((s: { id: number }) => s.id === maintenance.staffId);
      return {
        ...maintenance,
        staff,
      };
    });

    // Calculate maintenance status distribution for chart
    const statusDistribution = [
      { status: "Completed", count: completedMaintenance, color: "#22c55e" },
      { status: "In Progress", count: inProgressMaintenance, color: "#3b82f6" },
      { status: "Scheduled", count: pendingMaintenance, color: "#f59e0b" },
      { status: "Overdue", count: overdueMaintenance, color: "#ef4444" },
    ];

    // Calculate priority distribution
    const priorityDistribution = [
      { priority: "CRITICAL", count: 0, color: "#dc2626" },
      { priority: "HIGH", count: 0, color: "#ea580c" },
      { priority: "MEDIUM", count: 0, color: "#d97706" },
      { priority: "LOW", count: 0, color: "#65a30d" },
    ];

    maintenanceByPriority.forEach((item: { priority: string; _count: { priority: number } }) => {
      const priorityItem = priorityDistribution.find(
        (p) => p.priority === item.priority
      );
      if (priorityItem) {
        priorityItem.count = item._count.priority;
      }
    });

    // Calculate total maintenance cost
    const totalCost =
      (totalMaintenanceCost._sum.cost || 0) +
      (totalMaintenanceCost._sum.partsCost || 0) +
      (totalMaintenanceCost._sum.laborCost || 0);

    return NextResponse.json({
      summary: {
        totalMaintenanceLogs,
        pendingMaintenance,
        overdueMaintenance,
        completedMaintenance,
        inProgressMaintenance,
        totalMaintenanceCost: totalCost,
        averageCostPerMaintenance:
          totalMaintenanceLogs > 0 ? totalCost / totalMaintenanceLogs : 0,
      },
      charts: {
        statusDistribution,
        priorityDistribution,
        maintenanceByPriority: maintenanceByPriority.map((item: { priority: string; _count: { priority: number }; _sum: { cost: number | null } }) => ({
          priority: item.priority,
          count: item._count.priority,
          totalCost: item._sum.cost || 0,
        })),
      },
      recentMaintenanceLogs,
      upcomingMaintenance,
      staffMaintenanceData,
      assetsNeedingMaintenance,
      timeframe: days,
    });
  } catch (error) {
    console.error("Maintenance dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance dashboard data" },
      { status: 500 }
    );
  }
}
