import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// Ensure the uploads directory exists
async function ensureUploadDirExists() {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "maintenance");
    if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
    }
}

// Save uploaded file and return its URL path
async function saveFile(fieldName: string, formData: FormData, maintenanceId: string) {
    const file = formData.get(fieldName) as File;
    if (!file || file.size === 0) return null;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = path.extname(file.name);
    const fileName = `${maintenanceId}-${fieldName}-${Date.now()}${fileExtension}`;
    const filePath = path.join(process.cwd(), "public", "uploads", "maintenance", fileName);

    await writeFile(filePath, buffer);
    return `/uploads/maintenance/${fileName}`;
}

// Generate maintenance ID
function generateMaintenanceId() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `MNT-${year}${month}${day}-${timestamp}`;
}

// Get form data for dropdowns
export async function GET() {
    try {
        const [assets, staff] = await Promise.all([
            prisma.asset.findMany({
                select: {
                    id: true,
                    assetId: true,
                    name: true,
                    type: true,
                    location: true,
                    status: true,
                    category: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                }
            }),
            prisma.user.findMany({
                where: {
                    OR: [
                        { department: 'MAINTENANCE' },
                        { isDedicated: true },
                        { role: 'ADMIN' }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    fullName: true,
                    department: true,
                    staffClass: true
                },
                orderBy: {
                    name: 'asc'
                }
            })
        ]);

        return NextResponse.json({ assets, staff });
    } catch (error) {
        console.error("Get maintenance form data API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch form data" },
            { status: 500 }
        );
    }
}

// Create maintenance log
export async function POST(request: NextRequest) {
    try {
        await ensureUploadDirExists();

        const formData = await request.formData();
        
        // Extract form fields
        const assetId = formData.get("assetId") as string;
        const staffId = formData.get("staffId") as string;
        const maintenanceDate = formData.get("maintenanceDate") as string;
        const scheduledDate = formData.get("scheduledDate") as string;
        const description = formData.get("description") as string;
        const serviceType = formData.get("serviceType") as string;
        const serviceProvider = formData.get("serviceProvider") as string;
        const priority = formData.get("priority") as string;
        const status = formData.get("status") as string;
        const cost = formData.get("cost") as string;
        const partsCost = formData.get("partsCost") as string;
        const laborCost = formData.get("laborCost") as string;
        const partsUsed = formData.get("partsUsed") as string;
        const workOrderNumber = formData.get("workOrderNumber") as string;
        const inspectedBy = formData.get("inspectedBy") as string;
        const qualityRating = formData.get("qualityRating") as string;
        const remarks = formData.get("remarks") as string;
        const issuesFound = formData.get("issuesFound") as string;
        const recommendations = formData.get("recommendations") as string;

        // Validation
        if (!assetId || !staffId || !maintenanceDate || !description || !priority || !status) {
            return NextResponse.json(
                { error: "Missing required fields: Asset, Staff, Date, Description, Priority, and Status are required" },
                { status: 400 }
            );
        }

        // Generate maintenance ID
        const maintenanceId = generateMaintenanceId();

        // Handle file uploads
        const beforeImages = await saveFile("beforeImages", formData, maintenanceId);
        const afterImages = await saveFile("afterImages", formData, maintenanceId);

        // Create maintenance log
        const maintenanceLog = await prisma.maintenanceLog.create({
            data: {
                maintenanceId,
                assetId: parseInt(assetId),
                staffId: parseInt(staffId),
                maintenanceDate: new Date(maintenanceDate),
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                description,
                serviceType: serviceType || null,
                serviceProvider: serviceProvider || null,
                priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
                status: status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED',
                cost: cost ? parseFloat(cost) : 0,
                partsCost: partsCost ? parseFloat(partsCost) : 0,
                laborCost: laborCost ? parseFloat(laborCost) : 0,
                partsUsed: partsUsed || null,
                workOrderNumber: workOrderNumber || null,
                inspectedBy: inspectedBy || null,
                qualityRating: qualityRating ? parseInt(qualityRating) : null,
                remarks: remarks || null,
                issuesFound: issuesFound || null,
                recommendations: recommendations || null,
                beforeImages: beforeImages || null,
                afterImages: afterImages || null,
                startTime: status === 'IN_PROGRESS' ? new Date() : null,
                endTime: status === 'COMPLETED' ? new Date() : null
            },
            include: {
                asset: {
                    select: {
                        id: true,
                        assetId: true,
                        name: true,
                        type: true,
                        location: true
                    }
                },
                staff: {
                    select: {
                        id: true,
                        name: true,
                        fullName: true,
                        department: true
                    }
                }
            }
        });

        // Update asset status if maintenance is starting or completed
        if (status === 'IN_PROGRESS') {
            await prisma.asset.update({
                where: { id: parseInt(assetId) },
                data: { 
                    status: 'MAINTENANCE',
                    lastMaintenanceDate: new Date(maintenanceDate)
                }
            });
        } else if (status === 'COMPLETED') {
            // Calculate next maintenance date
            const asset = await prisma.asset.findUnique({
                where: { id: parseInt(assetId) },
                select: { maintenanceInterval: true }
            });
            
            const nextMaintenanceDate = new Date(maintenanceDate);
            nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + (asset?.maintenanceInterval || 365));

            await prisma.asset.update({
                where: { id: parseInt(assetId) },
                data: { 
                    status: 'ACTIVE',
                    lastMaintenanceDate: new Date(maintenanceDate),
                    maintenanceDate: nextMaintenanceDate
                }
            });
        }

        return NextResponse.json({
            success: true,
            maintenanceLog,
            message: "Maintenance log created successfully"
        });

    } catch (error) {
        console.error("Create maintenance log API error:", error);
        return NextResponse.json(
            { error: "Failed to create maintenance log" },
            { status: 500 }
        );
    }
}