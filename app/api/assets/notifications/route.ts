import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (type && type !== "all") {
      where.type = type.replace("-", "_").toUpperCase();
    }

    if (status === "read") {
      where.isRead = true;
    } else if (status === "unread") {
      where.isRead = false;
    }

    if (priority && priority !== "all") {
      where.priority = priority.toUpperCase();
    }

    // Fetch notifications with pagination
    const [notifications, totalCount] = await Promise.all([
      prisma.assetNotification.findMany({
        where,
        include: {
          asset: {
            include: {
              category: true,
              assignedTo: true,
            },
          },
          user: true,
        },
        orderBy: [
          { priority: "desc" }, // Critical first
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.assetNotification.count({ where }),
    ]);

    // Calculate statistics
    const stats = await prisma.assetNotification.aggregate({
      _count: {
        id: true,
      },
      where: {},
    });

    const [unreadCount, criticalCount, overdueCount, typeStats] =
      await Promise.all([
        prisma.assetNotification.count({ where: { isRead: false } }),
        prisma.assetNotification.count({ where: { priority: "CRITICAL" } }),
        prisma.assetNotification.count({
          where: {
            type: "MAINTENANCE_OVERDUE",
            isActionTaken: false,
          },
        }),
        prisma.assetNotification.groupBy({
          by: ["type"],
          _count: {
            id: true,
          },
        }),
      ]);

    const byType = {
      maintenance_due: 0,
      maintenance_overdue: 0,
      warranty_expiring: 0,
      asset_damaged: 0,
    };

    typeStats.forEach((stat) => {
      const type = stat.type.toLowerCase() as keyof typeof byType;
      if (byType.hasOwnProperty(type)) {
        byType[type] = stat._count.id;
      }
    });

    const response = {
      notifications,
      stats: {
        total: stats._count.id || 0,
        unread: unreadCount,
        critical: criticalCount,
        overdue: overdueCount,
        byType,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, notificationIds, userId } = await request.json();

    if (action === "markAsRead") {
      await prisma.assetNotification.updateMany({
        where: {
          id: { in: notificationIds.map(Number) },
        },
        data: {
          isRead: true,
          acknowledgedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "markAllAsRead") {
      await prisma.assetNotification.updateMany({
        where: {
          userId: userId ? Number(userId) : undefined,
          isRead: false,
        },
        data: {
          isRead: true,
          acknowledgedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "takeAction") {
      await prisma.assetNotification.updateMany({
        where: {
          id: { in: notificationIds.map(Number) },
        },
        data: {
          isActionTaken: true,
          isRead: true,
          acknowledgedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { notificationIds } = await request.json();

    await prisma.assetNotification.deleteMany({
      where: {
        id: { in: notificationIds.map(Number) },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}
