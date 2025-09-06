import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get categories
    const categories = await prisma.assetCategory.findMany({
      select: {
        id: true,
        name: true,
        assetType: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });

    // Get staff members who can be assigned assets
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "MANAGER", "CASHIER"],
        },
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        department: true,
        staffClass: true,
        isDedicated: true,
      },
      orderBy: { name: "asc" },
    });

    // Get next available asset IDs (suggestions)
    const lastFixedAsset = await prisma.asset.findFirst({
      where: { type: "FIXED_ASSET" },
      orderBy: { assetId: "desc" },
      select: { assetId: true },
    });

    const lastUtensil = await prisma.asset.findFirst({
      where: { type: "UTENSIL" },
      orderBy: { assetId: "desc" },
      select: { assetId: true },
    });

    // Generate suggested asset IDs
    const generateNextId = (lastId: string | null, prefix: string) => {
      if (!lastId) return `${prefix}-001`;

      const match = lastId.match(new RegExp(`${prefix}-(\\d+)`));
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        return `${prefix}-${nextNum.toString().padStart(3, "0")}`;
      }
      return `${prefix}-001`;
    };

    const suggestedIds = {
      fixedAsset: generateNextId(lastFixedAsset?.assetId || null, "FURN"),
      utensil: generateNextId(lastUtensil?.assetId || null, "UTIL"),
    };

    return NextResponse.json({
      categories,
      staff,
      suggestedIds,
    });
  } catch (error) {
    console.error("Form data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch form data" },
      { status: 500 }
    );
  }
}
