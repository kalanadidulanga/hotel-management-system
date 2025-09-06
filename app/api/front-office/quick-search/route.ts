import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "all";

    if (!query || query.length < 2) {
      return NextResponse.json({
        customers: [],
        reservations: [],
        rooms: [],
        assets: [],
        message: "Please enter at least 2 characters to search",
        success: true,
      });
    }

    let customers: any[] = [];
    let reservations: any[] = [];
    let rooms: any[] = [];
    let assets: any[] = [];

    // Search customers
    if (
      type === "all" ||
      type === "nic" ||
      type === "phone" ||
      type === "email" ||
      type === "name"
    ) {
      const customerConditions = [];

      if (type === "all" || type === "nic") {
        customerConditions.push({
          identityNumber: { contains: query },
        });
      }
      if (type === "all" || type === "phone") {
        customerConditions.push({
          phone: { contains: query },
        });
        // Also search alternate phone if exists
        customerConditions.push({
          alternatePhone: { contains: query },
        });
      }
      if (type === "all" || type === "email") {
        customerConditions.push({
          email: { contains: query },
        });
      }
      if (type === "all" || type === "name") {
        customerConditions.push({
          firstName: { contains: query },
        });
        if (query.length > 0) {
          customerConditions.push({
            lastName: { contains: query },
          });
          customerConditions.push({
            fullName: { contains: query },
          });
        }
      }

      customers = await prisma.customer.findMany({
        where: {
          AND: [{ isActive: true }, { OR: customerConditions }],
        },
        include: {
          reservations: {
            include: {
              room: { select: { roomNumber: true } },
              roomClass: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        take: 10,
      });
    }

    // Search reservations
    if (type === "all" || type === "booking") {
      reservations = await prisma.reservation.findMany({
        where: {
          bookingNumber: { contains: query },
        },
        include: {
          customer: {
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
            },
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              status: true,
              floor: { select: { name: true } },
            },
          },
          roomClass: {
            select: {
              name: true,
              maxOccupancy: true,
            },
          },
        },
        take: 10,
      });
    }

    // Search rooms
    if (type === "all" || type === "room") {
      rooms = await prisma.room.findMany({
        where: {
          AND: [{ isActive: true }, { roomNumber: { contains: query } }],
        },
        include: {
          roomClass: {
            select: {
              name: true,
              maxOccupancy: true,
              ratePerNight: true,
            },
          },
          floor: { select: { name: true } },
          reservations: {
            where: {
              reservationStatus: {
                in: ["CONFIRMED", "CHECKED_IN"],
              },
            },
            include: {
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                  fullName: true,
                },
              },
            },
            orderBy: { checkInDate: "desc" },
            take: 1,
          },
        },
        take: 10,
      });
    }

    // Search assets
    if (type === "all" || type === "asset") {
      assets = await prisma.asset.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { code: { contains: query } },
            { assetId: { contains: query } },
            { serialNumber: { contains: query } },
          ],
        },
        include: {
          category: {
            select: {
              name: true,
              assetType: true,
            },
          },
          assignedTo: {
            select: {
              name: true,
              department: true,
            },
          },
        },
        take: 10,
      });
    }

    return NextResponse.json({
      customers,
      reservations,
      rooms,
      assets,
      query,
      type,
      stats: {
        customersFound: customers.length,
        reservationsFound: reservations.length,
        roomsFound: rooms.length,
        assetsFound: assets.length,
        totalResults:
          customers.length + reservations.length + rooms.length + assets.length,
      },
      success: true,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
        customers: [],
        reservations: [],
        rooms: [],
        assets: [],
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
