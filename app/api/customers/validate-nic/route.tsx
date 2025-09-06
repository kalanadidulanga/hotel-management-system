import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const { identityNumber } = await request.json();

        if (!identityNumber) {
            return NextResponse.json(
                { error: "Identity number is required" },
                { status: 400 }
            );
        }

        // Check if customer exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { identityNumber },
            select: {
                id: true,
                customerID: true,
                firstName: true,
                lastName: true,
                fullName: true,
                email: true,
                phone: true,
                isVip: true,
                vipLevel: true,
                createdAt: true
            }
        });

        if (existingCustomer) {
            return NextResponse.json({
                exists: true,
                customer: existingCustomer
            });
        }

        // Validate NIC format (basic validation for Sri Lankan NIC)
        const isValidNIC = validateSriLankanNIC(identityNumber);

        return NextResponse.json({
            exists: false,
            isValidFormat: isValidNIC,
            suggestedData: isValidNIC ? extractNICData(identityNumber) : null
        });

    } catch (error) {
        console.error("Error validating NIC:", error);
        return NextResponse.json(
            { error: "Failed to validate NIC" },
            { status: 500 }
        );
    }
}

function validateSriLankanNIC(nic: string): boolean {
    // Old format: 9 digits + V (e.g., 123456789V)
    // New format: 12 digits (e.g., 199812345678)
    const oldFormat = /^[0-9]{9}[Vv]$/;
    const newFormat = /^[0-9]{12}$/;

    return oldFormat.test(nic) || newFormat.test(nic);
}

function extractNICData(nic: string) {
    let year, dayOfYear, gender;

    if (nic.length === 10) { // Old format
        year = parseInt('19' + nic.substr(0, 2));
        dayOfYear = parseInt(nic.substr(2, 3));
    } else { // New format
        year = parseInt(nic.substr(0, 4));
        dayOfYear = parseInt(nic.substr(4, 3));
    }

    // Determine gender (day > 500 means female)
    if (dayOfYear > 500) {
        gender = 'Female';
        dayOfYear -= 500;
    } else {
        gender = 'Male';
    }

    // Calculate approximate birth date
    const birthDate = new Date(year, 0, dayOfYear);

    return {
        gender,
        dateOfBirth: birthDate.toISOString().split('T')[0],
        nationality: 'native' // Assume native for valid NIC
    };
}