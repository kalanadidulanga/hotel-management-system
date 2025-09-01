import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get current date for maintenance comparisons
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

    // Get total assets count by type
    const totalFixedAssets = await prisma.asset.count({
      where: { type: "FIXED_ASSET" },
    });

    const totalUtensils = await prisma.asset.count({
      where: { type: "UTENSIL" },
    });

    // Get assets by status
    const assetsByStatus = await prisma.asset.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Get maintenance alerts
    const maintenanceDue = await prisma.asset.count({
      where: {
        maintenanceDate: {
          lte: thirtyDaysFromNow,
          gte: currentDate,
        },
        status: "ACTIVE",
      },
    });

    const maintenanceOverdue = await prisma.asset.count({
      where: {
        maintenanceDate: {
          lt: currentDate,
        },
        status: "ACTIVE",
      },
    });

    // Get recent maintenance activities (last 10)
    const recentMaintenances = await prisma.maintenanceLog.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        asset: {
          select: {
            name: true,
            assetId: true,
            type: true,
          },
        },
        staff: {
          select: {
            name: true,
            fullName: true,
          },
        },
      },
    });

    // Get maintenance cost for current month
    const currentMonth = new Date();
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const monthlyMaintenanceCost = await prisma.maintenanceLog.aggregate({
      where: {
        maintenanceDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        cost: true,
      },
    });

    // Get asset value summary
    const assetValueSummary = await prisma.asset.aggregate({
      _sum: {
        purchasePrice: true,
        currentValue: true,
      },
    });

    // Get top categories by count
    const topCategories = await prisma.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true },
        },
      },
      orderBy: {
        assets: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Get assets requiring immediate attention (overdue + critical status)
    const criticalAssets = await prisma.asset.findMany({
      where: {
        OR: [
          {
            maintenanceDate: {
              lt: currentDate,
            },
          },
          {
            status: "DAMAGED",
          },
          {
            status: "OUT_OF_ORDER",
          },
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
      },
      take: 10,
      orderBy: {
        maintenanceDate: "asc",
      },
    });

    // Get unread notifications count
    const unreadNotifications = await prisma.assetNotification.count({
      where: {
        isRead: false,
      },
    });

    const dashboardData = {
      summary: {
        totalAssets: totalFixedAssets + totalUtensils,
        totalFixedAssets,
        totalUtensils,
        maintenanceDue,
        maintenanceOverdue,
        unreadNotifications,
        monthlyMaintenanceCost: monthlyMaintenanceCost._sum.cost || 0,
        totalAssetValue: assetValueSummary._sum.purchasePrice || 0,
        currentAssetValue: assetValueSummary._sum.currentValue || 0,
      },
      assetsByStatus,
      topCategories,
      recentMaintenances,
      criticalAssets,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
