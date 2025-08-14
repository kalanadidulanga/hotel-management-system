import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      
      firstName,
      lastName,
      gender,
      email,
      
      phone,
      dateOfBirth,
      occupation,
      nationality,
      identityNumber,
      address,
      
      contactType,
      
      
      identityType,
     
      
    } = body;

    // Validate required fields
    if (!firstName || typeof firstName !== "string") {
      return NextResponse.json(
        { message: "Valid 'firstName' (string) is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Valid 'email' (string) is required" },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { message: "Valid 'phone' (string) is required" },
        { status: 400 }
      );
    }

    if (!gender || typeof gender !== "string") {
      return NextResponse.json(
        { message: "Valid 'gender' (string) is required" },
        { status: 400 }
      );
    }

    if (!dateOfBirth) {
      return NextResponse.json(
        { message: "Valid 'dateOfBirth' is required" },
        { status: 400 }
      );
    }

    if (!nationality) {
      return NextResponse.json(
        { message: "Valid 'nationality' is required" },
        { status: 400 }
      );
    }

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { message: "Valid 'address' (string) is required" },
        { status: 400 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        title: null,
        firstName,
        lastName: lastName || null,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        anniversary:  null,
        nationality,
       
        occupation: occupation || null,
        email,
        countryCode:  "+94",
        phone,
        contactType: contactType || null,
        
        address,
        identityType: identityType || null,
        identityNumber: identityNumber || null,
       
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);

    // Handle unique constraint violations
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        {
          message: `${field} already exists. Please use a different ${field}.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      firstName,
      lastName,
      gender,
      email,
      countryCode,
      phone,
      dateOfBirth,
      occupation,
      nationality,
      identityNumber,
      address,
      anniversary,
      contactType,
      country,
      state,
      city,
      zipcode,
      identityType,
      frontIdUrl,
      backIdUrl,
      guestImageUrl,
      isVip,
    } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { message: "Valid 'id' (number) is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!firstName || typeof firstName !== "string") {
      return NextResponse.json(
        { message: "Valid 'firstName' (string) is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Valid 'email' (string) is required" },
        { status: 400 }
      );
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        title: title || null,
        firstName,
        lastName: lastName || null,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        anniversary: anniversary ? new Date(anniversary) : null,
        nationality,
        isVip: isVip !== undefined ? isVip : undefined,
        occupation: occupation || null,
        email,
        countryCode: countryCode || undefined,
        phone,
        contactType: contactType || null,
        country: country || null,
        state: state || null,
        city: city || null,
        zipcode: zipcode || null,
        address,
        identityType: identityType || null,
        identityNumber: identityNumber || null,
        frontIdUrl: frontIdUrl || null,
        backIdUrl: backIdUrl || null,
        guestImageUrl: guestImageUrl || null,
      },
    });

    return NextResponse.json(customer, { status: 200 });
  } catch (error: any) {
    console.error("Error updating customer:", error);

    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        {
          message: `${field} already exists. Please use a different ${field}.`,
        },
        { status: 409 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { message: "Valid 'id' (number) is required" },
        { status: 400 }
      );
    }

    // Delete customer
    const deleted = await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json(deleted, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting customer:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
