import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const assetType = searchParams.get("assetType") || "";
    const status = searchParams.get("status") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search functionality (requirement 5.5)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { assetId: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Filter by asset type (Fixed Asset/Utensil)
    if (assetType) {
      where.type = assetType;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by category
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    // Get total count for pagination
    const totalAssets = await prisma.asset.count({ where });

    // Get current date for maintenance status
    const currentDate = new Date();

    // Fetch assets with includes
    const assets = await prisma.asset.findMany({
      where,
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
        _count: {
          select: {
            maintenanceLogs: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder as "asc" | "desc",
      },
      skip,
      take: limit,
    });

    // Add maintenance status to each asset
    const assetsWithMaintenanceStatus = assets.map((asset) => {
      const daysDiff = Math.ceil(
        (new Date(asset.maintenanceDate).getTime() - currentDate.getTime()) /
          (1000 * 3600 * 24)
      );

      let maintenanceStatus = "scheduled";
      if (daysDiff < 0) maintenanceStatus = "overdue";
      else if (daysDiff <= 7) maintenanceStatus = "urgent";
      else if (daysDiff <= 30) maintenanceStatus = "due-soon";

      return {
        ...asset,
        maintenanceStatus,
        daysDiff,
      };
    });

    // Get filter options for frontend
    const categories = await prisma.assetCategory.findMany({
      select: {
        id: true,
        name: true,
        assetType: true,
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const totalPages = Math.ceil(totalAssets / limit);

    return NextResponse.json({
      assets: assetsWithMaintenanceStatus,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalAssets,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        categories,
      },
    });
  } catch (error) {
    console.error("Assets list API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}
