import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// Ensure the uploads directory exists
async function ensureUploadDirExists() {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "assets");
  if (!fs.existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
}

// Save uploaded file and return its URL path
async function saveFile(
  fieldName: string,
  formData: FormData,
  assetId: string
) {
  const file = formData.get(fieldName) as File;
  if (!file || file.size === 0) return null;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileExtension = path.extname(file.name);
  const fileName = `${assetId}-${fieldName}-${Date.now()}${fileExtension}`;
  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "assets",
    fileName
  );

  await writeFile(filePath, buffer);
  return `/uploads/assets/${fileName}`;
}

// Delete old file if it exists
function deleteOldFile(filePath: string | null) {
  if (filePath && filePath.startsWith("/uploads/")) {
    const fullPath = path.join(process.cwd(), "public", filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await context.params; // Await params
    const assetId = parseInt(id);
   

    if (isNaN(assetId)) {
      return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
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
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Get asset for edit API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assetId = parseInt(params.id);

    if (isNaN(assetId)) {
      return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
    }

    await ensureUploadDirExists();

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as "FIXED_ASSET" | "UTENSIL";
    const categoryId = formData.get("categoryId") as string;
    const purchasePrice = formData.get("purchasePrice") as string;
    const purchaseDate = formData.get("purchaseDate") as string;
    const supplier = formData.get("supplier") as string;
    const warrantyPeriod = formData.get("warrantyPeriod") as string;
    const quantity = formData.get("quantity") as string;
    const unit = formData.get("unit") as string;
    const location = formData.get("location") as string;
    const serialNumber = formData.get("serialNumber") as string;
    const model = formData.get("model") as string;
    const brand = formData.get("brand") as string;
    const condition = formData.get("condition") as string;
    const status = formData.get("status") as
      | "ACTIVE"
      | "MAINTENANCE"
      | "RETIRED"
      | "DAMAGED"
      | "OUT_OF_ORDER";
    const maintenanceDate = formData.get("maintenanceDate") as string;
    const maintenanceInterval = formData.get("maintenanceInterval") as string;
    const assignedToId = formData.get("assignedToId") as string;
    const currentValue = formData.get("currentValue") as string;
    const depreciationRate = formData.get("depreciationRate") as string;
    const maintenanceCost = formData.get("maintenanceCost") as string;

    // Validation
    if (!name || !type || !purchasePrice || !purchaseDate || !maintenanceDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current asset data
    const currentAsset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!currentAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Handle file uploads
    let imageUrl = currentAsset.imageUrl;
    let documentUrl = currentAsset.documentUrl;

    const newImageUrl = await saveFile(
      "assetImage",
      formData,
      currentAsset.assetId
    );
    if (newImageUrl) {
      deleteOldFile(currentAsset.imageUrl);
      imageUrl = newImageUrl;
    }

    const newDocumentUrl = await saveFile(
      "assetDocument",
      formData,
      currentAsset.assetId
    );
    if (newDocumentUrl) {
      deleteOldFile(currentAsset.documentUrl);
      documentUrl = newDocumentUrl;
    }

    // Calculate warranty expiry
    let warrantyExpiry = currentAsset.warrantyExpiry;
    if (warrantyPeriod && parseInt(warrantyPeriod) > 0) {
      warrantyExpiry = new Date(purchaseDate);
      warrantyExpiry.setMonth(
        warrantyExpiry.getMonth() + parseInt(warrantyPeriod)
      );
    } else if (warrantyPeriod === "0" || warrantyPeriod === "") {
      warrantyExpiry = null;
    }

    // Update asset - using exact schema field names and types
    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        name,
        description: description || null,
        type, // AssetType enum
        categoryId:
          categoryId && categoryId !== "none" ? parseInt(categoryId) : null,
        purchasePrice: parseFloat(purchasePrice),
        purchaseDate: new Date(purchaseDate),
        supplier: supplier || null,
        warrantyPeriod: warrantyPeriod ? parseInt(warrantyPeriod) : null,
        warrantyExpiry,
        quantity: parseInt(quantity) || 1,
        unit: unit || null,
        location: location || null,
        serialNumber: serialNumber || null,
        model: model || null,
        brand: brand || null,
        condition: condition || null,
        status: status || "ACTIVE", // AssetStatus enum
        maintenanceDate: new Date(maintenanceDate),
        maintenanceInterval: parseInt(maintenanceInterval) || 365,
        maintenanceCost: maintenanceCost ? parseFloat(maintenanceCost) : 0,
        assignedToId:
          assignedToId && assignedToId !== "none"
            ? parseInt(assignedToId)
            : null,
        currentValue: currentValue ? parseFloat(currentValue) : null,
        depreciationRate: depreciationRate
          ? parseFloat(depreciationRate)
          : null,
        imageUrl,
        documentUrl,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            fullName: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      asset: updatedAsset,
      message: "Asset updated successfully",
    });
  } catch (error) {
    console.error("Update asset API error:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    );
  }
}
