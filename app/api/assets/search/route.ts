import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface AssetSearchFilters {
  searchTerm?: string;
  assetType?: string;
  status?: string;
  location?: string;
  categoryId?: string;
  assignedToId?: string;
  condition?: string;
  "dateRange.from"?: string;
  "dateRange.to"?: string;
  "priceRange.min"?: string;
  "priceRange.max"?: string;
}

interface AssetSearchResult {
  id: string;
  assetId: string;
  name: string;
  code: string;
  type: string;
  status: string;
  condition?: string;
  location?: string;
  purchasePrice: number;
  currentValue?: number;
  category: {
    id: number;
    name: string;
  } | null;
  assignedTo: {
    id: number;
    name: string;
    fullName?: string;
  } | null;
  brand?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  maintenanceDate: string;
  lastMaintenanceDate?: string;
  relevance: number;
  tags: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: AssetSearchFilters = {};

    // Parse search parameters
    searchParams.forEach((value, key) => {
      filters[key as keyof AssetSearchFilters] = value;
    });

    const searchTerm = filters.searchTerm?.toLowerCase() || "";
    const assetType = filters.assetType;
    const status = filters.status;
    const location = filters.location?.toLowerCase() || "";
    const categoryId = filters.categoryId;
    const assignedToId = filters.assignedToId;
    const condition = filters.condition;

    const whereConditions: any = {};

    // Search term conditions
    if (searchTerm) {
      whereConditions.OR = [
        { name: { contains: searchTerm } },
        { code: { contains: searchTerm } },
        { assetId: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { brand: { contains: searchTerm } },
        { model: { contains: searchTerm } },
        { serialNumber: { contains: searchTerm } },
        { location: { contains: searchTerm } },
        { supplier: { contains: searchTerm } },
        {
          category: {
            name: { contains: searchTerm },
          },
        },
        {
          assignedTo: {
            OR: [
              { name: { contains: searchTerm } },
              { fullName: { contains: searchTerm } },
              { email: { contains: searchTerm } },
            ],
          },
        },
      ];
    }

    // Asset type filter
    if (assetType && assetType !== "all") {
      whereConditions.type = assetType.toUpperCase() as
        | "FIXED_ASSET"
        | "UTENSIL";
    }

    // Status filter
    if (status && status !== "all") {
      whereConditions.status = status.toUpperCase();
    }

    // Location filter
    if (location) {
      whereConditions.location = { contains: location };
    }

    // Category filter
    if (categoryId && categoryId !== "all") {
      whereConditions.categoryId = parseInt(categoryId);
    }

    // Assigned to filter
    if (assignedToId && assignedToId !== "all") {
      whereConditions.assignedToId = parseInt(assignedToId);
    }

    // Condition filter
    if (condition && condition !== "all") {
      whereConditions.condition = condition;
    }

    // Date range filters
    if (filters["dateRange.from"] || filters["dateRange.to"]) {
      whereConditions.AND = whereConditions.AND || [];

      if (filters["dateRange.from"]) {
        whereConditions.AND.push({
          purchaseDate: { gte: new Date(filters["dateRange.from"]) },
        });
      }

      if (filters["dateRange.to"]) {
        whereConditions.AND.push({
          purchaseDate: { lte: new Date(filters["dateRange.to"]) },
        });
      }
    }

    // Price range filters
    if (filters["priceRange.min"] || filters["priceRange.max"]) {
      whereConditions.AND = whereConditions.AND || [];

      if (filters["priceRange.min"]) {
        whereConditions.AND.push({
          purchasePrice: { gte: parseFloat(filters["priceRange.min"]) },
        });
      }

      if (filters["priceRange.max"]) {
        whereConditions.AND.push({
          purchasePrice: { lte: parseFloat(filters["priceRange.max"]) },
        });
      }
    }

    // Fetch assets with related data
    const assets = await prisma.asset.findMany({
      where: whereConditions,
      include: {
        category: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            fullName: true,
            email: true,
            department: true,
            staffClass: true,
          },
        },
        maintenanceLogs: {
          orderBy: { maintenanceDate: "desc" },
          take: 1,
          select: {
            maintenanceDate: true,
            cost: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100, // Limit results for performance
    });

    // Transform assets to search results with relevance scoring
    const assetResults: AssetSearchResult[] = assets.map((asset) => {
      const relevance = calculateAssetRelevance(searchTerm, asset);

      return {
        id: asset.id.toString(),
        assetId: asset.assetId,
        name: asset.name,
        code: asset.code,
        type: asset.type,
        status: asset.status,
        condition: asset.condition || undefined,
        location: asset.location || undefined,
        purchasePrice: asset.purchasePrice,
        currentValue: asset.currentValue || undefined,
        category: asset.category
          ? {
              id: asset.category.id,
              name: asset.category.name,
            }
          : null,
        assignedTo: asset.assignedTo
          ? {
              id: asset.assignedTo.id,
              name: asset.assignedTo.name,
              fullName: asset.assignedTo.fullName || undefined,
            }
          : null,
        brand: asset.brand || undefined,
        model: asset.model || undefined,
        serialNumber: asset.serialNumber || undefined,
        description: asset.description || undefined,
        purchaseDate: asset.purchaseDate.toISOString(),
        warrantyExpiry: asset.warrantyExpiry?.toISOString(),
        maintenanceDate: asset.maintenanceDate.toISOString(),
        lastMaintenanceDate: asset.lastMaintenanceDate?.toISOString(),
        relevance,
        tags: generateAssetTags(asset),
      };
    });

    // Sort by relevance if there's a search term, otherwise by updated date
    const sortedResults = searchTerm
      ? assetResults.sort((a, b) => b.relevance - a.relevance)
      : assetResults;

    // Calculate statistics
    const stats = {
      totalAssets: sortedResults.length,
      byType: sortedResults.reduce((acc, asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: sortedResults.reduce((acc, asset) => {
        acc[asset.status] = (acc[asset.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: sortedResults.reduce((acc, asset) => {
        const categoryName = asset.category?.name || "Uncategorized";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalValue: sortedResults.reduce(
        (sum, asset) => sum + asset.purchasePrice,
        0
      ),
      averageValue:
        sortedResults.length > 0
          ? sortedResults.reduce((sum, asset) => sum + asset.purchasePrice, 0) /
            sortedResults.length
          : 0,
    };

    return NextResponse.json({
      assets: sortedResults,
      stats,
      searchTerm: filters.searchTerm || "",
      appliedFilters: Object.keys(filters).filter(
        (key) =>
          filters[key as keyof AssetSearchFilters] &&
          filters[key as keyof AssetSearchFilters] !== "all"
      ),
    });
  } catch (error) {
    console.error("Asset search API error:", error);
    return NextResponse.json(
      {
        error: "Failed to search assets",
        assets: [],
        stats: {
          totalAssets: 0,
          byType: {},
          byStatus: {},
          byCategory: {},
          totalValue: 0,
          averageValue: 0,
        },
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate asset-specific relevance
function calculateAssetRelevance(searchTerm: string, asset: any): number {
  if (!searchTerm) return 1.0;

  const term = searchTerm.toLowerCase();
  let relevance = 0;
  let maxScore = 0;

  // Define search fields with their weights (higher weight = more important)
  const searchFields = [
    { field: asset.name, weight: 3.0 },
    { field: asset.code, weight: 2.5 },
    { field: asset.assetId, weight: 2.5 },
    { field: asset.brand || "", weight: 2.0 },
    { field: asset.model || "", weight: 2.0 },
    { field: asset.category?.name || "", weight: 1.5 },
    { field: asset.description || "", weight: 1.0 },
    { field: asset.serialNumber || "", weight: 1.0 },
    { field: asset.location || "", weight: 1.0 },
    { field: asset.assignedTo?.name || "", weight: 1.0 },
  ];

  searchFields.forEach(({ field, weight }) => {
    const fieldValue = field.toLowerCase();
    let score = 0;

    if (fieldValue === term) {
      score = 1.0; // Exact match
    } else if (fieldValue.startsWith(term)) {
      score = 0.8; // Starts with term
    } else if (fieldValue.includes(term)) {
      score = 0.5; // Contains term
    }

    relevance += score * weight;
    maxScore += weight;
  });

  return maxScore > 0 ? relevance / maxScore : 0;
}

// Helper function to generate asset tags
function generateAssetTags(asset: any): string[] {
  const tags: string[] = [];

  if (asset.category?.name) tags.push(asset.category.name);
  if (asset.type) tags.push(asset.type);
  if (asset.status) tags.push(asset.status);
  if (asset.condition) tags.push(asset.condition);
  if (asset.brand) tags.push(asset.brand);
  if (asset.location) tags.push(asset.location);
  if (asset.assignedTo?.name) tags.push(`Assigned to ${asset.assignedTo.name}`);

  // Add maintenance status
  if (asset.maintenanceDate && new Date(asset.maintenanceDate) < new Date()) {
    tags.push("Maintenance Due");
  }

  // Add warranty status
  if (asset.warrantyExpiry) {
    const warrantyDate = new Date(asset.warrantyExpiry);
    const now = new Date();
    if (warrantyDate > now) {
      tags.push("Under Warranty");
    } else {
      tags.push("Warranty Expired");
    }
  }

  return tags.filter(Boolean);
}
