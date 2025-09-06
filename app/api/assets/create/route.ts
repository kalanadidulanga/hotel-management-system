import prisma from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false,
    },
};

// Ensure the uploads directory exists
async function ensureUploadDirExists() {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "assets");
    if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
    }
}

// Save uploaded file and return its URL path
async function saveFile(fieldName: string, formData: FormData, assetId: string) {
    const file = formData.get(fieldName) as File;
    if (!file || file.size === 0) return null;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = path.extname(file.name);
    const fileName = `${assetId}-${fieldName}-${Date.now()}${fileExtension}`;
    const filePath = path.join(process.cwd(), "public", "uploads", "assets", fileName);

    await writeFile(filePath, buffer);
    return `/uploads/assets/${fileName}`;
}

// Generate unique Asset ID
async function generateUniqueAssetId(type: 'FIXED_ASSET' | 'UTENSIL'): Promise<string> {
    const prefix = type === 'FIXED_ASSET' ? 'FURN' : 'UTIL';
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // Find the last asset of this type for current year
    const lastAsset = await prisma.asset.findFirst({
        where: {
            type,
            assetId: {
                startsWith: `${prefix}-${currentYear}`
            }
        },
        orderBy: {
            assetId: 'desc'
        }
    });

    let nextNumber = 1;
    if (lastAsset) {
        const match = lastAsset.assetId.match(/\d{4}$/);
        if (match) {
            nextNumber = parseInt(match[0]) + 1;
        }
    }

    return `${prefix}-${currentYear}${nextNumber.toString().padStart(4, '0')}`;
}

// Generate unique Asset Code
async function generateUniqueAssetCode(name: string, type: 'FIXED_ASSET' | 'UTENSIL'): Promise<string> {
    // Create base code from name (first 3 letters) + type prefix
    const nameCode = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
    const typePrefix = type === 'FIXED_ASSET' ? 'F' : 'U';
    
    // Find existing codes with similar pattern
    const baseCode = `${nameCode}${typePrefix}`;
    const existingCodes = await prisma.asset.findMany({
        where: {
            code: {
                startsWith: baseCode
            }
        },
        select: { code: true },
        orderBy: { code: 'desc' }
    });

    let nextNumber = 1;
    if (existingCodes.length > 0) {
        const lastCode = existingCodes[0].code;
        const match = lastCode.match(/\d+$/);
        if (match) {
            nextNumber = parseInt(match[0]) + 1;
        }
    }

    return `${baseCode}${nextNumber.toString().padStart(3, '0')}`;
}

export async function POST(request: NextRequest) {
    try {
        await ensureUploadDirExists();

        const formData = await request.formData();
        
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const type = formData.get("type") as 'FIXED_ASSET' | 'UTENSIL';
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
        const maintenanceDate = formData.get("maintenanceDate") as string;
        const maintenanceInterval = formData.get("maintenanceInterval") as string;
        const assignedToId = formData.get("assignedToId") as string;

        // Validation
        if (!name || !type || !purchasePrice || !purchaseDate || !maintenanceDate) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Generate unique Asset ID and Code
        const assetId = await generateUniqueAssetId(type);
        const code = await generateUniqueAssetCode(name, type);

        // Handle file uploads
        const imageUrl = await saveFile("assetImage", formData, assetId);
        const documentUrl = await saveFile("assetDocument", formData, assetId);

        // Calculate warranty expiry
        let warrantyExpiry = null;
        if (warrantyPeriod && parseInt(warrantyPeriod) > 0) {
            warrantyExpiry = new Date(purchaseDate);
            warrantyExpiry.setMonth(warrantyExpiry.getMonth() + parseInt(warrantyPeriod));
        }

        // Generate QR code (simple asset ID based)
        const qrCode = `ASSET_${assetId}`;

        // Create asset
        const asset = await prisma.asset.create({
            data: {
                name,
                assetId,
                code,
                description,
                type,
                categoryId: categoryId && categoryId !== 'none' ? parseInt(categoryId) : null,
                purchasePrice: parseFloat(purchasePrice),
                purchaseDate: new Date(purchaseDate),
                supplier,
                warrantyPeriod: warrantyPeriod ? parseInt(warrantyPeriod) : null,
                warrantyExpiry,
                quantity: parseInt(quantity) || 1,
                unit,
                location,
                serialNumber,
                model,
                brand,
                condition: condition || 'Good',
                status: 'ACTIVE',
                maintenanceDate: new Date(maintenanceDate),
                maintenanceInterval: parseInt(maintenanceInterval) || 365,
                assignedToId: assignedToId && assignedToId !== 'none' ? parseInt(assignedToId) : null,
                imageUrl,
                documentUrl,
                qrCode,
                currentValue: parseFloat(purchasePrice) // Initially same as purchase price
            },
            include: {
                category: true,
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        fullName: true,
                        department: true
                    }
                }
            }
        });

        // Create initial asset notification for maintenance
        const maintenanceNotificationDate = new Date(maintenanceDate);
        const reminderDate = new Date(maintenanceNotificationDate);
        reminderDate.setDate(reminderDate.getDate() - 7); // 7 days before maintenance

        await prisma.assetNotification.create({
            data: {
                notificationId: `MAINT_${assetId}_${Date.now()}`,
                assetId: asset.id,
                userId: assignedToId && assignedToId !== 'none' ? parseInt(assignedToId) : null,
                type: "MAINTENANCE_DUE",
                title: `Maintenance Due: ${name}`,
                message: `Maintenance is due for asset ${assetId} - ${name} on ${maintenanceDate}`,
                priority: "MEDIUM",
                scheduledFor: reminderDate,
                isRead: false,
                isActionTaken: false
            }
        });

        return NextResponse.json({
            success: true,
            asset: {
                ...asset,
                generatedAssetId: assetId,
                generatedCode: code
            },
            message: "Asset created successfully"
        });

    } catch (error) {
        console.error("Create asset API error:", error);
        
        return NextResponse.json(
            { error: "Failed to create asset" },
            { status: 500 }
        );
    }
}