import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const currentDate = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(currentDate.getDate() + 5);

    const notifications = [];

    // 1. Generate maintenance due notifications (5 days before)
    const assetsDueMaintenance = await prisma.asset.findMany({
      where: {
        maintenanceDate: {
          gte: currentDate,
          lte: fiveDaysFromNow,
        },
        status: {
          not: "RETIRED",
        },
      },
      include: {
        category: true,
        assignedTo: true,
        notifications: {
          where: {
            type: "MAINTENANCE_DUE",
            scheduledFor: {
              gte: currentDate,
              lte: fiveDaysFromNow,
            },
          },
        },
      },
    });

    for (const asset of assetsDueMaintenance) {
      // Skip if notification already exists for this period
      if (asset.notifications.length === 0) {
        const daysUntilMaintenance = Math.ceil(
          (asset.maintenanceDate.getTime() - currentDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const notification = await prisma.assetNotification.create({
          data: {
            notificationId: `MAINT-${asset.id}-${Date.now()}`,
            assetId: asset.id,
            userId: asset.assignedToId,
            type: "MAINTENANCE_DUE",
            title: `Maintenance Due: ${asset.name}`,
            message: `Maintenance for ${asset.name} (${
              asset.assetId
            }) is due in ${daysUntilMaintenance} days. Location: ${
              asset.location || "N/A"
            }`,
            priority:
              daysUntilMaintenance <= 1
                ? "CRITICAL"
                : daysUntilMaintenance <= 2
                ? "HIGH"
                : "MEDIUM",
            scheduledFor: asset.maintenanceDate,
            escalationLevel: 0,
          },
        });

        notifications.push(notification);
      }
    }

    // 2. Generate overdue maintenance notifications
    const assetsOverdueMaintenance = await prisma.asset.findMany({
      where: {
        maintenanceDate: {
          lt: currentDate,
        },
        status: {
          not: "RETIRED",
        },
      },
      include: {
        category: true,
        assignedTo: true,
        notifications: {
          where: {
            type: "MAINTENANCE_OVERDUE",
            createdAt: {
              gte: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        },
      },
    });

    for (const asset of assetsOverdueMaintenance) {
      // Skip if overdue notification already created today
      if (asset.notifications.length === 0) {
        const daysOverdue = Math.ceil(
          (currentDate.getTime() - asset.maintenanceDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const notification = await prisma.assetNotification.create({
          data: {
            notificationId: `OVERDUE-${asset.id}-${Date.now()}`,
            assetId: asset.id,
            userId: asset.assignedToId,
            type: "MAINTENANCE_OVERDUE",
            title: `Maintenance Overdue: ${asset.name}`,
            message: `Maintenance for ${asset.name} (${asset.assetId}) is overdue by ${daysOverdue} days. Immediate attention required!`,
            priority: daysOverdue > 7 ? "CRITICAL" : "HIGH",
            scheduledFor: asset.maintenanceDate,
            escalationLevel: Math.min(Math.floor(daysOverdue / 7), 3),
          },
        });

        notifications.push(notification);
      }
    }

    // 3. Generate warranty expiring notifications (30 days before)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

    const assetsWarrantyExpiring = await prisma.asset.findMany({
      where: {
        warrantyExpiry: {
          gte: currentDate,
          lte: thirtyDaysFromNow,
        },
        status: {
          not: "RETIRED",
        },
      },
      include: {
        category: true,
        assignedTo: true,
        notifications: {
          where: {
            type: "WARRANTY_EXPIRING",
            scheduledFor: {
              gte: currentDate,
              lte: thirtyDaysFromNow,
            },
          },
        },
      },
    });

    for (const asset of assetsWarrantyExpiring) {
      if (asset.notifications.length === 0 && asset.warrantyExpiry) {
        const daysUntilExpiry = Math.ceil(
          (asset.warrantyExpiry.getTime() - currentDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const notification = await prisma.assetNotification.create({
          data: {
            notificationId: `WARRANTY-${asset.id}-${Date.now()}`,
            assetId: asset.id,
            userId: asset.assignedToId,
            type: "WARRANTY_EXPIRING",
            title: `Warranty Expiring: ${asset.name}`,
            message: `Warranty for ${asset.name} (${asset.assetId}) expires in ${daysUntilExpiry} days. Consider renewal or replacement.`,
            priority: daysUntilExpiry <= 7 ? "HIGH" : "MEDIUM",
            scheduledFor: asset.warrantyExpiry,
            escalationLevel: 0,
          },
        });

        notifications.push(notification);
      }
    }

    // 4. Generate notifications for damaged assets
    const damagedAssets = await prisma.asset.findMany({
      where: {
        status: {
          in: ["DAMAGED", "OUT_OF_ORDER"],
        },
      },
      include: {
        category: true,
        assignedTo: true,
        notifications: {
          where: {
            type: "ASSET_DAMAGED",
            createdAt: {
              gte: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    for (const asset of damagedAssets) {
      if (asset.notifications.length === 0) {
        const notification = await prisma.assetNotification.create({
          data: {
            notificationId: `DAMAGED-${asset.id}-${Date.now()}`,
            assetId: asset.id,
            userId: asset.assignedToId,
            type: "ASSET_DAMAGED",
            title: `Asset Damaged: ${asset.name}`,
            message: `${asset.name} (${
              asset.assetId
            }) is marked as ${asset.status.toLowerCase()}. Requires immediate attention.`,
            priority: asset.status === "OUT_OF_ORDER" ? "CRITICAL" : "HIGH",
            scheduledFor: currentDate,
            escalationLevel: 0,
          },
        });

        notifications.push(notification);
      }
    }

    return NextResponse.json({
      message: `Generated ${notifications.length} notifications`,
      notifications: notifications.length,
      types: {
        maintenance_due: notifications.filter(
          (n) => n.type === "MAINTENANCE_DUE"
        ).length,
        maintenance_overdue: notifications.filter(
          (n) => n.type === "MAINTENANCE_OVERDUE"
        ).length,
        warranty_expiring: notifications.filter(
          (n) => n.type === "WARRANTY_EXPIRING"
        ).length,
        asset_damaged: notifications.filter((n) => n.type === "ASSET_DAMAGED")
          .length,
      },
    });
  } catch (error) {
    console.error("Generate notifications API error:", error);
    return NextResponse.json(
      { error: "Failed to generate notifications" },
      { status: 500 }
    );
  }
}

// GET method for automatic generation (can be called by cron jobs)
export async function GET(request: NextRequest) {
  return POST(request);
}
