import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

interface SearchFilters {
  searchTerm?: string;
  entityType?: string;
  status?: string;
  location?: string;
  assetType?: string;
  customerType?: string;
  "dateRange.from"?: string;
  "dateRange.to"?: string;
  "priceRange.min"?: string;
  "priceRange.max"?: string;
}

interface SearchResult {
  id: string;
  type: "asset" | "customer" | "reservation" | "room" | "maintenance" | "user";
  title: string;
  subtitle: string;
  description: string;
  status?: string;
  tags: string[];
  data: any;
  relevance: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: SearchFilters = {};

    // Parse search parameters
    searchParams.forEach((value, key) => {
      filters[key as keyof SearchFilters] = value;
    });

    const searchTerm = filters.searchTerm?.toLowerCase() || "";
    const entityType = filters.entityType;
    const status = filters.status;
    const location = filters.location?.toLowerCase() || "";
    const assetType = filters.assetType;
    const customerType = filters.customerType;

    let allResults: SearchResult[] = [];

    // Search Assets
    if (!entityType || entityType === "all" || entityType === "asset") {
      const whereConditions: any = {};

      if (searchTerm) {
        whereConditions.OR = [
          { name: { contains: searchTerm } },
          { code: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { brand: { contains: searchTerm } },
          { model: { contains: searchTerm } },
          { location: { contains: searchTerm } },
        ];
      }

      if (status && status !== "all") {
        whereConditions.status = status.toUpperCase();
      }

      if (location) {
        whereConditions.location = { contains: location };
      }

      if (assetType && assetType !== "all") {
        whereConditions.type = assetType.toUpperCase();
      }

      const assets = await prisma.asset.findMany({
        where: whereConditions,
        include: {
          category: true,
          assignedTo: true,
        },
        take: 50,
      });

      const assetResults = assets.map((asset) => ({
        id: asset.id.toString(),
        type: "asset" as const,
        title: asset.name,
        subtitle: `${asset.code} - ${asset.type}`,
        description: asset.description || "No description available",
        status: asset.status,
        tags: [
          asset.category?.name || "Uncategorized",
          asset.brand || "",
          asset.type,
          asset.location || "",
        ].filter(Boolean),
        data: {
          ...asset,
          location: asset.location,
          price: asset.purchasePrice,
          date: asset.createdAt,
        },
        relevance: calculateRelevance(searchTerm, [
          asset.name,
          asset.code,
          asset.description || "",
          asset.brand || "",
          asset.model || "",
        ]),
      }));

      allResults.push(...assetResults);
    }

    // Search Customers
    if (!entityType || entityType === "all" || entityType === "customer") {
      const whereConditions: any = {};

      if (searchTerm) {
        whereConditions.OR = [
          { firstName: { contains: searchTerm } },
          { lastName: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { phone: { contains: searchTerm } },
          { customerID: { contains: searchTerm } },
          { identityNumber: { contains: searchTerm } },
        ];
      }

      if (status && status !== "all") {
        whereConditions.isActive = status === "active";
      }

      const customers = await prisma.customer.findMany({
        where: whereConditions,
        take: 50,
      });

      const customerResults = customers.map((customer) => ({
        id: customer.id.toString(),
        type: "customer" as const,
        title: `${customer.firstName} ${customer.lastName || ""}`.trim(),
        subtitle: `${customer.customerID} - ${customer.email}`,
        description: `${customer.nationality} customer ${
          customer.isVip ? "(VIP)" : ""
        }`,
        status: customer.isActive ? "active" : "inactive",
        tags: [
          customer.nationality,
          customer.isVip ? "VIP" : "Regular",
          customer.gender,
          customer.occupation || "",
        ].filter(Boolean),
        data: {
          ...customer,
          phone: customer.phone,
          email: customer.email,
          location: `${customer.city || ""} ${customer.country || ""}`.trim(),
          date: customer.createdAt,
        },
        relevance: calculateRelevance(searchTerm, [
          customer.firstName,
          customer.lastName || "",
          customer.email,
          customer.customerID,
        ]),
      }));

      allResults.push(...customerResults);
    }

    // Search Reservations
    if (!entityType || entityType === "all" || entityType === "reservation") {
      const whereConditions: any = {};

      if (searchTerm) {
        whereConditions.OR = [
          { bookingNumber: { contains: searchTerm } },
          { roomType: { contains: searchTerm } },
          { purposeOfVisit: { contains: searchTerm } },
          {
            customer: {
              OR: [
                { firstName: { contains: searchTerm } },
                { lastName: { contains: searchTerm } },
                { email: { contains: searchTerm } },
              ],
            },
          },
        ];
      }

      // Date range filter
      if (filters["dateRange.from"] || filters["dateRange.to"]) {
        whereConditions.AND = whereConditions.AND || [];
        if (filters["dateRange.from"]) {
          whereConditions.AND.push({
            checkInDate: { gte: new Date(filters["dateRange.from"]) },
          });
        }
        if (filters["dateRange.to"]) {
          whereConditions.AND.push({
            checkOutDate: { lte: new Date(filters["dateRange.to"]) },
          });
        }
      }

      const reservations = await prisma.reservation.findMany({
        where: whereConditions,
        include: {
          customer: true,
          roomTypeDetails: true,
          room: true,
        },
        take: 50,
      });

      const reservationResults = reservations.map((reservation) => ({
        id: reservation.id.toString(),
        type: "reservation" as const,
        title: `Booking ${reservation.bookingNumber}`,
        subtitle: `${reservation.customer.firstName} ${
          reservation.customer.lastName || ""
        } - Room ${reservation.roomNumber}`,
        description: `${
          reservation.roomType
        } from ${reservation.checkInDate.toDateString()} to ${reservation.checkOutDate.toDateString()}`,
        status:
          new Date() < reservation.checkInDate
            ? "upcoming"
            : new Date() > reservation.checkOutDate
            ? "completed"
            : "active",
        tags: [
          reservation.roomType,
          reservation.purposeOfVisit,
          reservation.paymentMode,
          `${reservation.adults || 0} adults`,
          reservation.children ? `${reservation.children} children` : "",
        ].filter(Boolean),
        data: {
          ...reservation,
          price: reservation.total,
          date: reservation.checkInDate,
          location: `Room ${reservation.roomNumber}`,
          phone: reservation.customer.phone,
          email: reservation.customer.email,
        },
        relevance: calculateRelevance(searchTerm, [
          reservation.bookingNumber,
          reservation.customer.firstName,
          reservation.customer.lastName || "",
          reservation.roomType,
          reservation.purposeOfVisit,
        ]),
      }));

      allResults.push(...reservationResults);
    }

    // Search Rooms
    if (!entityType || entityType === "all" || entityType === "room") {
      const whereConditions: any = {};

      if (searchTerm) {
        whereConditions.OR = [
          { roomNumber: parseInt(searchTerm) || -1 },
          { roomType: { contains: searchTerm } },
          {
            roomList: {
              OR: [
                { roomType: { contains: searchTerm } },
                { roomDescription: { contains: searchTerm } },
              ],
            },
          },
        ];
      }

      if (status && status !== "all") {
        whereConditions.isAvailable = status === "active";
      }

      const rooms = await prisma.room.findMany({
        where: whereConditions,
        include: {
          roomList: true,
          floorList: {
            include: {
              floor: true,
            },
          },
        },
        take: 50,
      });

      const roomResults = rooms.map((room) => ({
        id: room.id.toString(),
        type: "room" as const,
        title: `Room ${room.roomNumber}`,
        subtitle: `${room.roomType || "Standard"} - ${
          room.floorList.floor.name
        }`,
        description:
          room.roomList?.roomDescription ||
          `Room on ${room.floorList.floor.name}`,
        status: room.isAvailable ? "available" : "occupied",
        tags: [
          room.roomType || "Standard",
          room.floorList.floor.name,
          room.isAvailable ? "Available" : "Occupied",
        ].filter(Boolean),
        data: {
          ...room,
          price: room.roomList?.rate || 0,
          location: `${room.floorList.floor.name} Floor`,
          date: room.roomList?.createdAt,
        },
        relevance: calculateRelevance(searchTerm, [
          room.roomNumber.toString(),
          room.roomType || "",
          room.roomList?.roomDescription || "",
        ]),
      }));

      allResults.push(...roomResults);
    }

    // Search Maintenance Logs
    if (!entityType || entityType === "all" || entityType === "maintenance") {
      const whereConditions: any = {};

      if (searchTerm) {
        whereConditions.OR = [
          { maintenanceId: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { serviceProvider: { contains: searchTerm } },
          { serviceType: { contains: searchTerm } },
          {
            asset: {
              OR: [
                { name: { contains: searchTerm } },
                { code: { contains: searchTerm } },
              ],
            },
          },
        ];
      }

      if (status && status !== "all") {
        whereConditions.status = status.toUpperCase();
      }

      const maintenanceLogs = await prisma.maintenanceLog.findMany({
        where: whereConditions,
        include: {
          asset: true,
          staff: true,
        },
        take: 50,
      });

      const maintenanceResults = maintenanceLogs.map((log) => ({
        id: log.id.toString(),
        type: "maintenance" as const,
        title: `Maintenance ${log.maintenanceId}`,
        subtitle: `${log.asset.name} - ${log.serviceType || "General"}`,
        description: log.description,
        status: log.status.toLowerCase(),
        tags: [
          log.serviceType || "General",
          log.priority,
          log.serviceProvider || "Internal",
          log.asset.type,
        ].filter(Boolean),
        data: {
          ...log,
          price: log.cost,
          date: log.maintenanceDate,
          location: log.asset.location,
        },
        relevance: calculateRelevance(searchTerm, [
          log.maintenanceId,
          log.description,
          log.asset.name,
          log.serviceType || "",
        ]),
      }));

      allResults.push(...maintenanceResults);
    }

    // Search Users
    if (!entityType || entityType === "all" || entityType === "user") {
      const whereConditions: any = {};

      if (searchTerm) {
        whereConditions.OR = [
          { name: { contains: searchTerm } },
          { fullName: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { nic: { contains: searchTerm } },
          { contact: { contains: searchTerm } },
        ];
      }

      const users = await prisma.user.findMany({
        where: whereConditions,
        take: 50,
      });

      const userResults = users.map((user) => ({
        id: user.id.toString(),
        type: "user" as const,
        title: user.fullName || user.name,
        subtitle: `${user.email} - ${user.role}`,
        description: `${user.department || "General"} ${
          user.staffClass || "Staff"
        }`,
        status: "active",
        tags: [
          user.role,
          user.department || "",
          user.staffClass || "",
          user.isDedicated ? "Dedicated" : "General",
        ].filter(Boolean),
        data: {
          ...user,
          phone: user.contact,
          email: user.email,
          date: user.createdAt,
        },
        relevance: calculateRelevance(searchTerm, [
          user.name,
          user.fullName || "",
          user.email,
        ]),
      }));

      allResults.push(...userResults);
    }

    // Sort by relevance
    allResults.sort((a, b) => b.relevance - a.relevance);

    // Calculate result statistics
    const resultsByType = allResults.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      results: allResults,
      totalResults: allResults.length,
      resultsByType,
      searchTerm: filters.searchTerm || "",
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform search",
        results: [],
        totalResults: 0,
        resultsByType: {},
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate search relevance
function calculateRelevance(searchTerm: string, fields: string[]): number {
  if (!searchTerm) return 0;

  const term = searchTerm.toLowerCase();
  let relevance = 0;

  fields.forEach((field, index) => {
    const fieldValue = field.toLowerCase();

    // Exact match gets highest score
    if (fieldValue === term) {
      relevance += 1.0;
    }
    // Starts with search term gets high score
    else if (fieldValue.startsWith(term)) {
      relevance += 0.8;
    }
    // Contains search term gets medium score
    else if (fieldValue.includes(term)) {
      relevance += 0.5;
    }

    // First fields get higher weight
    const weight = 1 / (index + 1);
    relevance *= weight;
  });

  return Math.min(relevance, 1.0);
}
