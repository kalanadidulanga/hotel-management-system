import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.name?.trim()) {
            return NextResponse.json(
                { error: 'Room class name is required' },
                { status: 400 }
            );
        }

        if (!data.ratePerNight || data.ratePerNight <= 0) {
            return NextResponse.json(
                { error: 'Night rate must be greater than 0' },
                { status: 400 }
            );
        }

        if (!data.rateDayUse || data.rateDayUse <= 0) {
            return NextResponse.json(
                { error: 'Day rate must be greater than 0' },
                { status: 400 }
            );
        }

        if (!data.maxOccupancy || data.maxOccupancy <= 0) {
            return NextResponse.json(
                { error: 'Max occupancy must be greater than 0' },
                { status: 400 }
            );
        }

        if (!data.standardOccupancy || data.standardOccupancy <= 0) {
            return NextResponse.json(
                { error: 'Standard occupancy must be greater than 0' },
                { status: 400 }
            );
        }

        if (data.standardOccupancy > data.maxOccupancy) {
            return NextResponse.json(
                { error: 'Standard occupancy cannot exceed max occupancy' },
                { status: 400 }
            );
        }

        // Check if room class name already exists
        const existingRoomClass = await prisma.roomClass.findFirst({
            where: {
                name: {
                    equals: data.name.trim(),
                }
            }
        });

        if (existingRoomClass) {
            return NextResponse.json(
                { error: `Room class "${data.name}" already exists. Please choose a different name.` },
                { status: 400 }
            );
        }

        // Create the room class
        const roomClass = await prisma.roomClass.create({
            data: {
                name: data.name.trim(),
                description: data.description?.trim() || null,
                ratePerNight: parseFloat(data.ratePerNight),
                rateDayUse: parseFloat(data.rateDayUse),
                hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
                extraPersonCharge: data.extraPersonCharge ? parseFloat(data.extraPersonCharge) : 0,
                childCharge: data.childCharge ? parseFloat(data.childCharge) : 0,
                maxOccupancy: parseInt(data.maxOccupancy),
                standardOccupancy: parseInt(data.standardOccupancy),
                roomSize: data.roomSize?.trim() || null,
                bedConfiguration: data.bedConfiguration?.trim() || null,
                cleaningFrequencyDays: parseInt(data.cleaningFrequencyDays) || 1,
                amenities: data.amenities || null, // Already JSON stringified from frontend
                specialFeatures: data.specialFeatures?.trim() || null,
                isActive: Boolean(data.isActive),
                lastCleaningUpdate: new Date(), // Set initial cleaning update
            },
            include: {
                _count: {
                    select: {
                        rooms: true,
                        reservations: true,
                        roomImages: true,
                        roomOffers: true,
                        complementaryItems: true
                    }
                }
            }
        });

        // Transform dates for JSON serialization
        const transformedRoomClass = {
            ...roomClass,
            createdAt: roomClass.createdAt.toISOString(),
            updatedAt: roomClass.updatedAt.toISOString(),
            lastCleaningUpdate: roomClass.lastCleaningUpdate.toISOString(),
        };

        return NextResponse.json({
            roomClass: transformedRoomClass,
            message: `Room class "${roomClass.name}" created successfully`,
            success: true
        }, { status: 201 });

    } catch (error) {
        console.error('Room class creation error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST to create a room class.' },
        { status: 405 }
    );
}