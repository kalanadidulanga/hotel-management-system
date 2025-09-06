import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";



// GET - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("assetType"); // Filter by asset type if provided

    const whereCondition =
      assetType && assetType !== "all"
        ? { assetType: assetType.toUpperCase() as "FIXED_ASSET" | "UTENSIL" }
        : {};

    const categories = await prisma.assetCategory.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      categories,
      totalCount: categories.length,
    });
  } catch (error) {
    console.error("Categories GET API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, assetType } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    if (!assetType || !["FIXED_ASSET", "UTENSIL"].includes(assetType)) {
      return NextResponse.json(
        { error: "Valid asset type is required (FIXED_ASSET or UTENSIL)" },
        { status: 400 }
      );
    }

    // Check if category with same name and asset type already exists
    // For SQLite, we'll handle case-insensitive comparison in the application layer
    const existingCategories = await prisma.assetCategory.findMany({
      where: {
        assetType: assetType as "FIXED_ASSET" | "UTENSIL",
      },
    });

    const duplicateExists = existingCategories.some(
      (cat) => cat.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicateExists) {
      return NextResponse.json(
        { error: "A category with this name and asset type already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.assetCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        assetType: assetType as "FIXED_ASSET" | "UTENSIL",
      },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    return NextResponse.json({
      category,
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Categories POST API error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, assetType } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { error: "Category ID and name are required" },
        { status: 400 }
      );
    }

    if (!assetType || !["FIXED_ASSET", "UTENSIL"].includes(assetType)) {
      return NextResponse.json(
        { error: "Valid asset type is required (FIXED_ASSET or UTENSIL)" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.assetCategory.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if another category with same name and asset type already exists (excluding current one)
    // For SQLite, we'll handle case-insensitive comparison in the application layer
    const existingCategories = await prisma.assetCategory.findMany({
      where: {
        assetType: assetType as "FIXED_ASSET" | "UTENSIL",
        id: {
          not: parseInt(id),
        },
      },
    });

    const duplicateExists = existingCategories.some(
      (cat) => cat.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicateExists) {
      return NextResponse.json(
        { error: "A category with this name and asset type already exists" },
        { status: 409 }
      );
    }

    const updatedCategory = await prisma.assetCategory.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        assetType: assetType as "FIXED_ASSET" | "UTENSIL",
      },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    return NextResponse.json({
      category: updatedCategory,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Categories PUT API error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.assetCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category has assets
    if (existingCategory._count.assets > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. It has ${existingCategory._count.assets} assets assigned to it. Please reassign or remove the assets first.`,
        },
        { status: 409 }
      );
    }

    await prisma.assetCategory.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Categories DELETE API error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
