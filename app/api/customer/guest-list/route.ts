import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "id";
    const sortDir = searchParams.get("sortDir") || "desc";

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            {
              firstName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              lastName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              identityNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              identityType: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    // Build orderBy clause
    let orderBy: any = { id: sortDir };

    switch (sortBy) {
      case "firstName":
      case "guestName":
        orderBy = { firstName: sortDir };
        break;
      case "lastName":
        orderBy = { lastName: sortDir };
        break;
      case "email":
        orderBy = { email: sortDir };
        break;
      case "phone":
      case "mobile":
        orderBy = { phone: sortDir };
        break;
      case "identityType":
        orderBy = { identityType: sortDir };
        break;
      case "identityNumber":
      case "identityId":
        orderBy = { identityNumber: sortDir };
        break;
      case "createdAt":
        orderBy = { createdAt: sortDir };
        break;
      default:
        orderBy = { id: sortDir };
    }

    // Get total count for pagination
    const totalCount = await prisma.customer.count({
      where: whereClause,
    });

    // Fetch customers with reservations to get booking numbers
    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        reservations: {
          select: {
            bookingNumber: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get the most recent booking number
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Transform data to match frontend interface
    const guests = customers.map((customer) => ({
      id: customer.id,
      bookingNumber: customer.reservations[0]?.bookingNumber || "N/A",
      guestName: `${customer.firstName} ${customer.lastName || ""}`.trim(),
      gender: customer.gender || "",
      mobile: customer.phone || "",
      email: customer.email || "",
      identityType: customer.identityType || "",
      identityId: customer.identityNumber || "",
      createdAt: customer.createdAt.toISOString().split("T")[0],
      // Include full customer data for editing
      customerData: {
        title: customer.title,
        firstName: customer.firstName,
        lastName: customer.lastName,
        dateOfBirth: customer.dateOfBirth,
        anniversary: customer.anniversary,
        nationality: customer.nationality,
        isVip: customer.isVip,
        occupation: customer.occupation,
        countryCode: customer.countryCode,
        contactType: customer.contactType,
        country: customer.country,
        state: customer.state,
        city: customer.city,
        zipcode: customer.zipcode,
        address: customer.address,
        frontIdUrl: customer.frontIdUrl,
        backIdUrl: customer.backIdUrl,
        guestImageUrl: customer.guestImageUrl,
      },
    }));

    // Return data with pagination info
    return NextResponse.json({
      data: guests,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json(
      { message: "Failed to fetch guests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      nationality,
      email,
      phone,
      address,
      identityType,
      identityNumber,
      title,
      anniversary,
      isVip,
      occupation,
      countryCode,
      contactType,
      country,
      state,
      city,
      zipcode,
      frontIdUrl,
      backIdUrl,
      guestImageUrl,
    } = body;

    // Validate required inputs
    if (
      !firstName ||
      !gender ||
      !dateOfBirth ||
      !nationality ||
      !email ||
      !phone ||
      !address
    ) {
      return NextResponse.json(
        {
          message:
            "Required fields: firstName, gender, dateOfBirth, nationality, email, phone, address",
        },
        { status: 400 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        title: title || null,
        firstName,
        lastName: lastName || null,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        anniversary: anniversary ? new Date(anniversary) : null,
        nationality,
        isVip: isVip || false,
        occupation: occupation || null,
        email,
        countryCode: countryCode || "+1", // default if not provided
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
    const { id, ...updateData } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { message: "Valid 'id' (number) is required" },
        { status: 400 }
      );
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
        // Handle date fields properly
        dateOfBirth: updateData.dateOfBirth
          ? new Date(updateData.dateOfBirth)
          : undefined,
        anniversary: updateData.anniversary
          ? new Date(updateData.anniversary)
          : null,
      },
    });

    return NextResponse.json(customer, { status: 200 });
  } catch (error: any) {
    console.error("Error updating customer:", error);
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
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
