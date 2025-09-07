import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST() {
  try {
    console.log("🔄 Starting automatic notification generation...");

    const currentDate = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(currentDate.getDate() + 5);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

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
            title: `🔧 Maintenance Due: ${asset.name}`,
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
            title: `🚨 OVERDUE: ${asset.name}`,
            message: `URGENT: Maintenance for ${asset.name} (${asset.assetId}) is overdue by ${daysOverdue} days. Immediate attention required!`,
            priority: daysOverdue > 7 ? "CRITICAL" : "HIGH",
            scheduledFor: asset.maintenanceDate,
            escalationLevel: Math.min(Math.floor(daysOverdue / 7), 3),
          },
        });

        notifications.push(notification);
      }
    }

    // 3. Generate warranty expiring notifications (30 days before)
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
            title: `🛡️ Warranty Expiring: ${asset.name}`,
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
              gte: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
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
            title: `⚠️ Asset ${asset.status}: ${asset.name}`,
            message: `${asset.name} (${
              asset.assetId
            }) is marked as ${asset.status.toLowerCase()}. Location: ${
              asset.location || "N/A"
            }. Requires immediate attention!`,
            priority: asset.status === "OUT_OF_ORDER" ? "CRITICAL" : "HIGH",
            scheduledFor: currentDate,
            escalationLevel: 0,
          },
        });

        notifications.push(notification);
      }
    }

    console.log(
      `✅ Generated ${notifications.length} notifications automatically`
    );

    return NextResponse.json({
      success: true,
      message: `Generated ${notifications.length} notifications automatically`,
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Automatic notification generation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate notifications automatically",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
