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


import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const vipOnly = searchParams.get("vip") === "true";
    const nationality = searchParams.get("nationality");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search functionality
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { identityNumber: { contains: search, mode: "insensitive" } },
        { customerID: { contains: search, mode: "insensitive" } },
      ];
    }

    // VIP filter
    if (vipOnly) {
      where.isVip = true;
    }

    // Nationality filter
    if (nationality && nationality !== "all") {
      where.nationality = nationality;
    }

    // Only active customers by default
    where.isActive = true;

    // Fetch customers with pagination
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
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
          guestImageUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reservations: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Get statistics
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

    nationalStats.forEach((stat) => {
      if (stat.nationality === "native") {
        nationalityStats.native = stat._count.id;
      } else if (stat.nationality === "foreigner") {
        nationalityStats.foreigner = stat._count.id;
      }
    });

    const response = {
      customers,
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.firstName ||
      !body.email ||
      !body.phone ||
      !body.identityNumber ||
      !body.nationality
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: firstName, email, phone, identityNumber, nationality",
        },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [{ email: body.email }, { identityNumber: body.identityNumber }],
      },
    });

    if (existingCustomer) {
      if (existingCustomer.email === body.email) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        );
      }
      if (existingCustomer.identityNumber === body.identityNumber) {
        return NextResponse.json(
          { error: "Customer with this NIC/Identity number already exists" },
          { status: 400 }
        );
      }
    }

    // Generate customer ID
    const customerCount = await prisma.customer.count();
    const customerID = `CUST-${(customerCount + 1)
      .toString()
      .padStart(6, "0")}`;

    // Create full name
    const fullName = `${body.firstName}${
      body.lastName ? " " + body.lastName : ""
    }`;

    // Process dates
    const dateOfBirth = body.dateOfBirth
      ? new Date(body.dateOfBirth)
      : new Date();
    const anniversary = body.anniversary ? new Date(body.anniversary) : null;

    const customer = await prisma.customer.create({
      data: {
        customerID,
        fullName,
        firstName: body.firstName,
        lastName: body.lastName || null,
        email: body.email,
        phone: body.phone,
        identityNumber: body.identityNumber,
        nationality: body.nationality,
        gender: body.gender || "Other",
        dateOfBirth,
        anniversary,
        title: body.title || null,
        occupation: body.occupation || null,
        countryCode: body.countryCode || null,
        alternatePhone: body.alternatePhone || null,
        contactType: body.contactType || null,
        country: body.country || null,
        state: body.state || null,
        city: body.city || null,
        zipcode: body.zipcode || null,
        address: body.address,
        identityType: body.identityType || "NIC",
        frontIdUrl: body.frontIdUrl || null,
        backIdUrl: body.backIdUrl || null,
        guestImageUrl: body.guestImageUrl || null,
        specialRequests: body.specialRequests || null,
        notes: body.notes || null,
        isVip: body.isVip || false,
        vipLevel: body.vipLevel || null,
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
        createdAt: true,
      },
    });

    return NextResponse.json({
      customer,
      message: "Customer created successfully",
    });
  } catch (error: any) {
    console.error("Error creating customer:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Customer with this email or identity number already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}