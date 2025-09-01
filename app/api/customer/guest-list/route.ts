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
          isActive: true, // only active customers
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            {
              identityNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              identityType: { contains: search, mode: "insensitive" as const },
            },
          ],
        }
      : {
          isActive: true, // only active customers
        };

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




export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    // Delete customer
    const customer = await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(
      { message: "Customer deleted successfully", customer },
      { status: 200 }
    );
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
