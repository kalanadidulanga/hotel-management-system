// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@/lib/generated/prisma";

// const prisma = new PrismaClient();

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const search = searchParams.get("search") || "";
//     const vipOnly = searchParams.get("vip") === "true";
//     const nationality = searchParams.get("nationality");
//     const sortBy = searchParams.get("sortBy") || "createdAt";
//     const sortOrder = searchParams.get("sortOrder") || "desc";

//     const skip = (page - 1) * limit;

//     // Build where clause
//     const where: any = {};

//     // Search functionality
//     if (search) {
//       where.OR = [
//         { firstName: { contains: search, mode: "insensitive" } },
//         { lastName: { contains: search, mode: "insensitive" } },
//         { email: { contains: search, mode: "insensitive" } },
//         { phone: { contains: search, mode: "insensitive" } },
//         { identityNumber: { contains: search, mode: "insensitive" } },
//         { customerID: { contains: search, mode: "insensitive" } },
//       ];
//     }

//     // VIP filter
//     if (vipOnly) {
//       where.isVip = true;
//     }

//     // Nationality filter
//     if (nationality && nationality !== "all") {
//       where.nationality = nationality;
//     }

//     // Only active customers by default
//     where.isActive = true;

//     // Fetch customers with pagination
//     const [customers, totalCount] = await Promise.all([
//       prisma.customer.findMany({
//         where,
//         orderBy: {
//           [sortBy]: sortOrder,
//         },
//         skip,
//         take: limit,
//         select: {
//           id: true,
//           customerID: true,
//           firstName: true,
//           lastName: true,
//           fullName: true,
//           email: true,
//           phone: true,
//           identityNumber: true,
//           nationality: true,
//           isVip: true,
//           vipLevel: true,
//           occupation: true,
//           country: true,
//           city: true,
//           guestImageUrl: true,
//           createdAt: true,
//           updatedAt: true,
//           _count: {
//             select: {
//               reservations: true,
//             },
//           },
//         },
//       }),
//       prisma.customer.count({ where }),
//     ]);

//     // Get statistics
//     const stats = await prisma.customer.aggregate({
//       _count: {
//         id: true,
//       },
//       where: { isActive: true },
//     });

//     const [vipCount, nationalStats, recentCount] = await Promise.all([
//       prisma.customer.count({
//         where: { isVip: true, isActive: true },
//       }),
//       prisma.customer.groupBy({
//         by: ["nationality"],
//         _count: {
//           id: true,
//         },
//         where: { isActive: true },
//       }),
//       prisma.customer.count({
//         where: {
//           isActive: true,
//           createdAt: {
//             gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
//           },
//         },
//       }),
//     ]);

//     const nationalityStats = {
//       native: 0,
//       foreigner: 0,
//     };

//     nationalStats.forEach((stat) => {
//       if (stat.nationality === "native") {
//         nationalityStats.native = stat._count.id;
//       } else if (stat.nationality === "foreigner") {
//         nationalityStats.foreigner = stat._count.id;
//       }
//     });

//     const response = {
//       customers,
//       stats: {
//         total: stats._count.id || 0,
//         vip: vipCount,
//         recent: recentCount,
//         nationality: nationalityStats,
//       },
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(totalCount / limit),
//         totalItems: totalCount,
//         itemsPerPage: limit,
//       },
//     };

//     return NextResponse.json(response);
//   } catch (error) {
//     console.error("Error fetching customers:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch customers" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();

//     // Generate customer ID
//     const customerCount = await prisma.customer.count();
//     const customerID = `CUST-${(customerCount + 1)
//       .toString()
//       .padStart(6, "0")}`;

//     // Create full name
//     const fullName = `${body.firstName}${
//       body.lastName ? " " + body.lastName : ""
//     }`;

//     const customer = await prisma.customer.create({
//       data: {
//         customerID,
//         fullName,
//         ...body,
//       },
//     });

//     return NextResponse.json({ customer });
//   } catch (error: any) {
//     console.error("Error creating customer:", error);

//     if (error.code === "P2002") {
//       return NextResponse.json(
//         { error: "Customer with this email or identity number already exists" },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: "Failed to create customer" },
//       { status: 500 }
//     );
//   }
// }


// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@/lib/generated/prisma";

// const prisma = new PrismaClient();

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const search = searchParams.get("search") || "";
//     const vipOnly = searchParams.get("vip") === "true";
//     const nationality = searchParams.get("nationality");
//     const sortBy = searchParams.get("sortBy") || "createdAt";
//     const sortOrder = searchParams.get("sortOrder") || "desc";

//     const skip = (page - 1) * limit;

//     // Build where clause
//     const where: any = {};

//     // Search functionality
//     if (search) {
//       where.OR = [
//         { firstName: { contains: search, mode: "insensitive" } },
//         { lastName: { contains: search, mode: "insensitive" } },
//         { email: { contains: search, mode: "insensitive" } },
//         { phone: { contains: search, mode: "insensitive" } },
//         { identityNumber: { contains: search, mode: "insensitive" } },
//         { customerID: { contains: search, mode: "insensitive" } },
//       ];
//     }

//     // VIP filter
//     if (vipOnly) {
//       where.isVip = true;
//     }

//     // Nationality filter
//     if (nationality && nationality !== "all") {
//       where.nationality = nationality;
//     }

//     // Only active customers by default
//     where.isActive = true;

//     // Fetch customers with pagination
//     const [customers, totalCount] = await Promise.all([
//       prisma.customer.findMany({
//         where,
//         orderBy: {
//           [sortBy]: sortOrder,
//         },
//         skip,
//         take: limit,
//         select: {
//           id: true,
//           customerID: true,
//           firstName: true,
//           lastName: true,
//           fullName: true,
//           email: true,
//           phone: true,
//           identityNumber: true,
//           nationality: true,
//           isVip: true,
//           vipLevel: true,
//           occupation: true,
//           country: true,
//           city: true,
//           guestImageUrl: true,
//           createdAt: true,
//           updatedAt: true,
//           _count: {
//             select: {
//               reservations: true,
//             },
//           },
//         },
//       }),
//       prisma.customer.count({ where }),
//     ]);

//     // Get statistics
//     const stats = await prisma.customer.aggregate({
//       _count: {
//         id: true,
//       },
//       where: { isActive: true },
//     });

//     const [vipCount, nationalStats, recentCount] = await Promise.all([
//       prisma.customer.count({
//         where: { isVip: true, isActive: true },
//       }),
//       prisma.customer.groupBy({
//         by: ["nationality"],
//         _count: {
//           id: true,
//         },
//         where: { isActive: true },
//       }),
//       prisma.customer.count({
//         where: {
//           isActive: true,
//           createdAt: {
//             gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
//           },
//         },
//       }),
//     ]);

//     const nationalityStats = {
//       native: 0,
//       foreigner: 0,
//     };

//     nationalStats.forEach((stat) => {
//       if (stat.nationality === "native") {
//         nationalityStats.native = stat._count.id;
//       } else if (stat.nationality === "foreigner") {
//         nationalityStats.foreigner = stat._count.id;
//       }
//     });

//     const response = {
//       customers,
//       stats: {
//         total: stats._count.id || 0,
//         vip: vipCount,
//         recent: recentCount,
//         nationality: nationalityStats,
//       },
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(totalCount / limit),
//         totalItems: totalCount,
//         itemsPerPage: limit,
//       },
//     };

//     return NextResponse.json(response);
//   } catch (error) {
//     console.error("Error fetching customers:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch customers" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();

//     // Validate required fields
//     if (
//       !body.firstName ||
//       !body.email ||
//       !body.phone ||
//       !body.identityNumber ||
//       !body.nationality
//     ) {
//       return NextResponse.json(
//         {
//           error:
//             "Missing required fields: firstName, email, phone, identityNumber, nationality",
//         },
//         { status: 400 }
//       );
//     }

//     // Check if customer already exists
//     const existingCustomer = await prisma.customer.findFirst({
//       where: {
//         OR: [{ email: body.email }, { identityNumber: body.identityNumber }],
//       },
//     });

//     if (existingCustomer) {
//       if (existingCustomer.email === body.email) {
//         return NextResponse.json(
//           { error: "Customer with this email already exists" },
//           { status: 400 }
//         );
//       }
//       if (existingCustomer.identityNumber === body.identityNumber) {
//         return NextResponse.json(
//           { error: "Customer with this NIC/Identity number already exists" },
//           { status: 400 }
//         );
//       }
//     }

//     // Generate customer ID
//     const customerCount = await prisma.customer.count();
//     const customerID = `CUST-${(customerCount + 1)
//       .toString()
//       .padStart(6, "0")}`;

//     // Create full name
//     const fullName = `${body.firstName}${
//       body.lastName ? " " + body.lastName : ""
//     }`;

//     // Process dates
//     const dateOfBirth = body.dateOfBirth
//       ? new Date(body.dateOfBirth)
//       : new Date();
//     const anniversary = body.anniversary ? new Date(body.anniversary) : null;

//     const customer = await prisma.customer.create({
//       data: {
//         customerID,
//         fullName,
//         firstName: body.firstName,
//         lastName: body.lastName || null,
//         email: body.email,
//         phone: body.phone,
//         identityNumber: body.identityNumber,
//         nationality: body.nationality,
//         gender: body.gender || "Other",
//         dateOfBirth,
//         anniversary,
//         title: body.title || null,
//         occupation: body.occupation || null,
//         countryCode: body.countryCode || null,
//         alternatePhone: body.alternatePhone || null,
//         contactType: body.contactType || null,
//         country: body.country || null,
//         state: body.state || null,
//         city: body.city || null,
//         zipcode: body.zipcode || null,
//         address: body.address,
//         identityType: body.identityType || "NIC",
//         frontIdUrl: body.frontIdUrl || null,
//         backIdUrl: body.backIdUrl || null,
//         guestImageUrl: body.guestImageUrl || null,
//         specialRequests: body.specialRequests || null,
//         notes: body.notes || null,
//         isVip: body.isVip || false,
//         vipLevel: body.vipLevel || null,
//       },
//       select: {
//         id: true,
//         customerID: true,
//         firstName: true,
//         lastName: true,
//         fullName: true,
//         email: true,
//         phone: true,
//         identityNumber: true,
//         nationality: true,
//         isVip: true,
//         vipLevel: true,
//         createdAt: true,
//       },
//     });

//     return NextResponse.json({
//       customer,
//       message: "Customer created successfully",
//     });
//   } catch (error: any) {
//     console.error("Error creating customer:", error);

//     if (error.code === "P2002") {
//       return NextResponse.json(
//         { error: "Customer with this email or identity number already exists" },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: "Failed to create customer" },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all customers with advanced filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Search and filter parameters
    const search = searchParams.get("search") || "";
    const isVip = searchParams.get("isVip");
    const vipOnly = searchParams.get("vip") === "true"; // Support both parameter names
    const nationality = searchParams.get("nationality");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // For reservation form (simple response)
    const simple = searchParams.get("simple") === "true";

    const whereConditions: any = {
      isActive: true,
    };

    // Enhanced search functionality including NIC
    if (search) {
      whereConditions.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { customerID: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { identityNumber: { contains: search } }, // NIC search capability
      ];
    }

    // VIP filter (support both parameter names)
    if (vipOnly || isVip === "true") {
      whereConditions.isVip = true;
    }

    // Nationality filter
    if (nationality && nationality !== "all") {
      whereConditions.nationality = nationality;
    }

    // Simple response for reservation form
    if (simple) {
      const customers = await prisma.customer.findMany({
        where: whereConditions,
        orderBy: [
          { isVip: "desc" }, // VIP customers first
          { firstName: "asc" },
        ],
        take: limit,
        select: {
          id: true,
          customerID: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          phone: true,
          identityNumber: true,
          nationality: true,
          isVip: true,
          gender: true,
          dateOfBirth: true,
          address: true,
        },
      });

      return NextResponse.json({
        customers,
        success: true,
      });
    }

    // Full response with pagination and statistics
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: whereConditions,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
        select: {
          id: true,
          customerID: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          phone: true,
          identityNumber: true,
          nationality: true,
          isVip: true,
          vipLevel: true,
          occupation: true,
          country: true,
          city: true,
          address: true,
          gender: true,
          dateOfBirth: true,
          guestImageUrl: true,
          specialRequests: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reservations: true,
            },
          },
        },
      }),
      prisma.customer.count({ where: whereConditions }),
    ]);

    // Get comprehensive statistics
    const stats = await prisma.customer.aggregate({
      _count: {
        id: true,
      },
      where: { isActive: true },
    });

    const [vipCount, nationalStats, recentCount] = await Promise.all([
      prisma.customer.count({
        where: { isVip: true, isActive: true },
      }),
      prisma.customer.groupBy({
        by: ["nationality"],
        _count: {
          id: true,
        },
        where: { isActive: true },
      }),
      prisma.customer.count({
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    const nationalityStats = {
      native: 0,
      foreigner: 0,
    };

    nationalStats.forEach((stat: { nationality: string; _count: { id: number } }) => {
      if (stat.nationality === "native") {
        nationalityStats.native = stat._count.id;
      } else if (stat.nationality === "foreigner") {
        nationalityStats.foreigner = stat._count.id;
      }
    });

    const response = {
      customers: customers.map((customer: {
        dateOfBirth: Date | null;
        createdAt: Date;
        updatedAt: Date;
        [key: string]: any;
      }) => ({
        ...customer,
        dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.toISOString() : null,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      })),
      stats: {
        total: stats._count.id || 0,
        vip: vipCount,
        recent: recentCount,
        nationality: nationalityStats,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch customers",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new customer with enhanced validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      nationality,
      identityType,
      identityNumber,
      phone,
      email,
      address,
      occupation,
      specialRequests,
      // Additional fields from original
      countryCode,
      alternatePhone,
      contactType,
      country,
      state,
      city,
      zipcode,
      frontIdUrl,
      backIdUrl,
      guestImageUrl,
      notes,
      isVip,
      vipLevel,
    } = body;

    // Enhanced validation
    if (!firstName || !identityNumber || !phone || !dateOfBirth || !address) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details:
            "First name, identity number, phone, date of birth, and address are required",
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate NIC format for Sri Lankan customers
    if (nationality === "native" && identityType === "NIC") {
      const nicPattern = /^(\d{9}[VvXx]|\d{12})$/;
      if (!nicPattern.test(identityNumber)) {
        return NextResponse.json(
          {
            error: "Invalid NIC format",
            details:
              "NIC should be 10 characters (9 digits + V/X) or 12 digits",
            success: false,
          },
          { status: 400 }
        );
      }
    }

    // Email validation if provided
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        {
          error: "Invalid email format",
          details: "Please enter a valid email address",
          success: false,
        },
        { status: 400 }
      );
    }

    // Check if customer with same identity number or email already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [{ identityNumber }, ...(email ? [{ email }] : [])],
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          error: "Customer already exists",
          details:
            existingCustomer.identityNumber === identityNumber
              ? "A customer with this identity number already exists"
              : "A customer with this email already exists",
          success: false,
        },
        { status: 400 }
      );
    }

    // Generate unique customer ID with improved format
    const customerID = await generateCustomerID();

    // Create full name
    const fullName = `${firstName} ${lastName || ""}`.trim();

    // Process dates
    const dobDate = new Date(dateOfBirth);
    const anniversary = body.anniversary ? new Date(body.anniversary) : null;

    // Create customer with all fields
    const customer = await prisma.customer.create({
      data: {
        customerID,
        title,
        firstName,
        lastName: lastName || null,
        fullName,
        gender: gender || "Other",
        dateOfBirth: dobDate,
        anniversary,
        nationality: nationality as "native" | "foreigner",
        identityType: identityType || "NIC",
        identityNumber,
        phone,
        email: email || `${customerID}@hotel.local`, // Generate email if not provided
        countryCode,
        alternatePhone,
        contactType,
        country,
        state,
        city,
        zipcode,
        address,
        occupation,
        specialRequests,
        notes,
        frontIdUrl,
        backIdUrl,
        guestImageUrl,
        isVip: isVip || false,
        vipLevel,
      },
      select: {
        id: true,
        customerID: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        identityNumber: true,
        nationality: true,
        isVip: true,
        vipLevel: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        customer: {
          ...customer,
          dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.toISOString() : null,
          createdAt: customer.createdAt.toISOString(),
        },
        message: `Customer ${customer.customerID} created successfully`,
        success: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Customer creation error:", error);

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const target = error.meta?.target;
      let message = "Customer with this information already exists";

      if (target?.includes("email")) {
        message = "Customer with this email already exists";
      } else if (target?.includes("identityNumber")) {
        message = "Customer with this NIC/Identity number already exists";
      }

      return NextResponse.json(
        {
          error: message,
          success: false,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create customer",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Enhanced customer ID generation function
async function generateCustomerID(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, "0");

  const prefix = `CST${year}${month}`;

  try {
    // Find the latest customer ID for this month
    const latestCustomer = await prisma.customer.findFirst({
      where: {
        customerID: {
          startsWith: prefix,
        },
      },
      orderBy: {
        customerID: "desc",
      },
    });

    let sequence = 1;
    if (latestCustomer) {
      const lastSequence = parseInt(latestCustomer.customerID.slice(-4));
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating customer ID:", error);
    // Fallback to count-based ID
    const customerCount = await prisma.customer.count();
    return `CST-${(customerCount + 1).toString().padStart(6, "0")}`;
  }
}