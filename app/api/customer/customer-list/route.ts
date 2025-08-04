import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch customers with server-side filtering, pagination, and sorting
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "id";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const search = searchParams.get("search") || "";

    // Debug logging
    console.log("Search parameters:", {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
    });

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause for search - Fixed the search logic
    const whereClause = search.trim()
      ? {
          OR: [
            {
              firstName: {
                contains: search.trim(),
                mode: "insensitive" as const,
              },
            },
            {
              lastName: {
                contains: search.trim(),
                mode: "insensitive" as const,
              },
            },
            {
              email: { contains: search.trim(), mode: "insensitive" as const },
            },
            {
              phone: { contains: search.trim(), mode: "insensitive" as const },
            },
            {
              nationalId: {
                contains: search.trim(),
                mode: "insensitive" as const,
              },
            },
            {
              profession: {
                contains: search.trim(),
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    console.log("Where clause:", JSON.stringify(whereClause, null, 2));

    // Build orderBy clause
    let orderBy: any = { id: "asc" };

    if (sortBy === "sl" || sortBy === "id") {
      orderBy = { id: sortOrder };
    } else if (sortBy === "firstName") {
      orderBy = { firstName: sortOrder };
    } else if (sortBy === "lastName") {
      orderBy = { lastName: sortOrder };
    } else if (sortBy === "email") {
      orderBy = { email: sortOrder };
    } else if (sortBy === "phone") {
      orderBy = { phone: sortOrder };
    }

    // Fetch customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          nationality: true,
          profession: true,
          nationalId: true, // Add this field for debugging
          createdAt: true,
        },
      }),
      prisma.customer.count({
        where: whereClause,
      }),
    ]);

    console.log(`Found ${customers.length} customers out of ${total} total`);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Format response to match frontend expectations
    const response = {
      customers: customers.map((customer) => ({
        ...customer,
        balance: 0, // Default balance since it's not in schema
        status: "Active" as const, // Default status since it's not in schema
      })),
      total,
      totalPages,
      currentPage: page,
      limit,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      profession,
      nationality,
      nationalId,
      address,
    } = body;

    // Basic validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !dateOfBirth ||
  
      !nationality ||
      !nationalId ||
      !address
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate nationality enum
    if (nationality !== "native" && nationality !== "foreigner") {
      return NextResponse.json(
        { message: "Nationality must be either 'native' or 'foreigner'" },
        { status: 400 }
      );
    }

    // Check for existing email, phone, or national ID
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [{ email }, { phone }, { nationalId }],
      },
    });

    if (existing) {
      let conflictField = "";
      if (existing.email === email) conflictField = "email";
      else if (existing.phone === phone) conflictField = "phone";
      else if (existing.nationalId === nationalId)
        conflictField = "national ID";

      return NextResponse.json(
        { message: `Customer with this ${conflictField} already exists` },
        { status: 409 }
      );
    }

    const created = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        profession,
        nationality,
        nationalId,
        address,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update customer
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      profession,
      nationality,
      nationalId,
      address,
    } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { message: "Valid 'id' (number) is required" },
        { status: 400 }
      );
    }

    // Validate nationality enum if provided
    if (
      nationality &&
      nationality !== "native" &&
      nationality !== "foreigner"
    ) {
      return NextResponse.json(
        { message: "Nationality must be either 'native' or 'foreigner'" },
        { status: 400 }
      );
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    // Check for conflicts with email, phone, or nationalId (excluding current customer)
    if (email || phone || nationalId) {
      const conflicts = await prisma.customer.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                email ? { email } : {},
                phone ? { phone } : {},
                nationalId ? { nationalId } : {},
              ].filter((condition) => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (conflicts) {
        let conflictField = "";
        if (email && conflicts.email === email) conflictField = "email";
        else if (phone && conflicts.phone === phone) conflictField = "phone";
        else if (nationalId && conflicts.nationalId === nationalId)
          conflictField = "national ID";

        return NextResponse.json(
          {
            message: `Another customer with this ${conflictField} already exists`,
          },
          { status: 409 }
        );
      }
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined)
      updateData.dateOfBirth = new Date(dateOfBirth);
    if (profession !== undefined) updateData.profession = profession;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (nationalId !== undefined) updateData.nationalId = nationalId;
    if (address !== undefined) updateData.address = address;

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove a customer
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (typeof id !== "number" || isNaN(id)) {
      return NextResponse.json(
        { message: "Valid 'id' is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }

    await prisma.customer.delete({ where: { id } });

    return NextResponse.json(
      { message: "Customer deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
