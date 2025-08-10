import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "id";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const search = searchParams.get("search") || "";

    

    const skip = (page - 1) * limit;

    // Build where clause for search
  const trimmedSearch = search.trim();

  const whereClause = trimmedSearch
    ? {
        OR: [
          { firstName: { contains: trimmedSearch } },
          { lastName: { contains: trimmedSearch } },
          { email: { contains: trimmedSearch } },
          { phone: { contains: trimmedSearch } },
          { occupation: { contains: trimmedSearch } },
          { city: { contains: trimmedSearch } },
        ],
      }
    : {};


    // Build orderBy clause
    let orderBy: any = {};

    // Map frontend sort keys to database fields
    switch (sortBy) {
      case "sl":
        orderBy = { id: sortOrder };
        break;
      case "firstName":
        orderBy = { firstName: sortOrder };
        break;
      case "lastName":
        orderBy = { lastName: sortOrder };
        break;
      case "email":
        orderBy = { email: sortOrder };
        break;
      case "phone":
        orderBy = { phone: sortOrder };
        break;
      case "balance":
        orderBy = { id: sortOrder }; // Since we don't have balance field in schema, use id
        break;
      default:
        orderBy = { id: sortOrder };
    }

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          title: true,
          gender: true,
          dateOfBirth: true,
          nationality: true,
          isVip: true,
          occupation: true,
          countryCode: true,
          contactType: true,
          country: true,
          state: true,
          city: true,
          zipcode: true,
          address: true,
          identityType: true,
          identityNumber: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    // Transform data to match frontend interface
    const transformedCustomers = customers.map((customer) => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName || "",
      email: customer.email,
      phone: customer.phone,
      balance: 0, // Since balance isn't in your schema, defaulting to 0
      status: customer.isVip ? "Active" : "Active", // Map based on your business logic
      createdAt: customer.createdAt.toISOString(),
      // Include additional fields for detailed view
      title: customer.title,
      gender: customer.gender,
      dateOfBirth: customer.dateOfBirth.toISOString(),
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
      identityType: customer.identityType,
      identityNumber: customer.identityNumber,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      customers: transformedCustomers,
      total,
      totalPages,
      currentPage: page,
      limit,
      search,
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { message: "Failed to fetch customers", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      anniversary,
      nationality,
      isVip,
      occupation,
      email,
      countryCode,
      phone,
      contactType,
      country,
      state,
      city,
      zipcode,
      address,
      identityType,
      identityNumber,
      frontIdUrl,
      backIdUrl,
      guestImageUrl,
    } = body;

  

    if (!firstName || typeof firstName !== "string") {
      return NextResponse.json(
        { message: "Valid 'firstName' is required" },
        { status: 400 }
      );
    }


    if (!dateOfBirth) {
      return NextResponse.json(
        { message: "Valid 'dateOfBirth' is required" },
        { status: 400 }
      );
    }

    if (!nationality || !["native", "foreigner"].includes(nationality)) {
      return NextResponse.json(
        { message: "Valid 'nationality' (native/foreigner) is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Valid 'email' is required" },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { message: "Valid 'phone' is required" },
        { status: 400 }
      );
    }




  

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { message: "Valid 'address' is required" },
        { status: 400 }
      );
    }

 

    if (!identityNumber || typeof identityNumber !== "string") {
      return NextResponse.json(
        { message: "Valid 'identityNumber' is required" },
        { status: 400 }
      );
    }

    // Create customer
    const created = await prisma.customer.create({
      data: {
        title,
        firstName,
        lastName: lastName || null,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        anniversary: anniversary ? new Date(anniversary) : null,
        nationality,
        isVip: isVip || false,
        occupation: occupation || null,
        email,
        countryCode,
        phone,
        contactType,
        country,
        state,
        city,
        zipcode,
        address,
        identityType,
        identityNumber,
        frontIdUrl: frontIdUrl || null,
        backIdUrl: backIdUrl || null,
        guestImageUrl: guestImageUrl || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);

    // Handle unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        { message: `${field} already exists` },
        { status: 400 }
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
        { message: "Valid 'id' is required" },
        { status: 400 }
      );
    }

    // Process dates if provided
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.anniversary) {
      updateData.anniversary = new Date(updateData.anniversary);
    }

    // Update customer
    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating customer:", error);

    // Handle unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        { message: `${field} already exists` },
        { status: 400 }
      );
    }

    // Handle record not found
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
        { message: "Valid 'id' is required" },
        { status: 400 }
      );
    }

    // Check if customer has reservations
    const reservationCount = await prisma.reservation.count({
      where: { customerId: id },
    });

    if (reservationCount > 0) {
      return NextResponse.json(
        { message: "Cannot delete customer with existing reservations" },
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

    // Handle record not found
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
