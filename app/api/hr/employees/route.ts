// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";

// const prisma = new PrismaClient();


// // GET - Fetch all employees
// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const search = searchParams.get("search") || "";
//     const departmentId = searchParams.get("departmentId");
//     const classId = searchParams.get("classId");
//     const status = searchParams.get("status");
//     const sortBy = searchParams.get("sortBy") || "createdAt";
//     const sortOrder = searchParams.get("sortOrder") || "desc";
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const skip = (page - 1) * limit;

//     // Build where clause
//     const where: any = {};

//     // Fix search query for SQLite (remove mode: "insensitive")
//     if (search && search.trim()) {
//       const searchTerm = search.trim().toLowerCase(); // Convert to lowercase for manual case-insensitive search
//       where.OR = [
//         // Search in user name (using contains without mode for SQLite)
//         { 
//           user: { 
//             name: { 
//               contains: searchTerm
//             } 
//           } 
//         },
//         // Search in user email
//         { 
//           user: { 
//             email: { 
//               contains: searchTerm
//             } 
//           } 
//         },
//         // Search in employee ID
//         { 
//           employeeId: { 
//             contains: searchTerm
//           } 
//         },
//         // Search in user NIC
//         { 
//           user: { 
//             nic: { 
//               contains: searchTerm
//             } 
//           } 
//         },
//         // Search in user contact
//         { 
//           user: { 
//             contact: { 
//               contains: searchTerm
//             } 
//           } 
//         },
//       ];
//     }

//     // Apply other filters
//     if (departmentId && departmentId !== "all") {
//       if (where.OR) {
//         // If search is active, combine with AND
//         where.AND = [
//           { OR: where.OR },
//           { departmentId: parseInt(departmentId) }
//         ];
//         delete where.OR;
//       } else {
//         where.departmentId = parseInt(departmentId);
//       }
//     }

//     if (classId && classId !== "all") {
//       const classFilter = { classId: parseInt(classId) };
//       if (where.AND) {
//         where.AND.push(classFilter);
//       } else if (where.OR) {
//         where.AND = [
//           { OR: where.OR },
//           classFilter
//         ];
//         delete where.OR;
//       } else {
//         where.classId = parseInt(classId);
//       }
//     }

//     if (status === "active") {
//       const statusFilter = { isActive: true };
//       if (where.AND) {
//         where.AND.push(statusFilter);
//       } else if (where.OR) {
//         where.AND = [
//           { OR: where.OR },
//           statusFilter
//         ];
//         delete where.OR;
//       } else {
//         where.isActive = true;
//       }
//     } else if (status === "inactive") {
//       const statusFilter = { isActive: false };
//       if (where.AND) {
//         where.AND.push(statusFilter);
//       } else if (where.OR) {
//         where.AND = [
//           { OR: where.OR },
//           statusFilter
//         ];
//         delete where.OR;
//       } else {
//         where.isActive = false;
//       }
//     }

//     // Build orderBy
//     let orderBy: any = {};
//     if (sortBy === "name") {
//       orderBy = { user: { name: sortOrder } };
//     } else if (sortBy === "department") {
//       orderBy = { department: { name: sortOrder } };
//     } else if (sortBy === "staffClass") {
//       orderBy = { staffClass: { name: sortOrder } };
//     } else {
//       orderBy = { [sortBy]: sortOrder };
//     }

//     console.log("Search query:", JSON.stringify(where, null, 2)); // Debug log

//     // Fetch employees with related data
//     const [employees, total] = await Promise.all([
//       prisma.staff.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy,
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               role: true,
//               nic: true,
//               contact: true,
//               address: true,
//               dateOfBirth: true,
//               createdAt: true,
//             },
//           },
//           department: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//           staffClass: {
//             select: {
//               id: true,
//               name: true,
//               salaryType: true,
//               baseSalary: true,
//             },
//           },
//           _count: {
//             select: {
//               attendance: true,
//               leaves: true,
//             },
//           },
//         },
//       }),
//       prisma.staff.count({ where }),
//     ]);

//     // Get statistics
//     const [
//       totalEmployees,
//       activeEmployees,
//       inactiveEmployees,
//       recentHires,
//       departments,
//       staffClasses,
//     ] = await Promise.all([
//       prisma.staff.count(),
//       prisma.staff.count({ where: { isActive: true } }),
//       prisma.staff.count({ where: { isActive: false } }),
//       prisma.staff.count({
//         where: {
//           joinDate: {
//             gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
//           },
//         },
//       }),
//       prisma.department.findMany({
//         include: {
//           _count: {
//             select: { staff: true },
//           },
//         },
//       }),
//       prisma.staffClassHR.findMany({
//         include: {
//           _count: {
//             select: { staff: true },
//           },
//         },
//       }),
//     ]);

//     return NextResponse.json({
//       employees,
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit),
//       },
//       stats: {
//         total: totalEmployees,
//         active: activeEmployees,
//         inactive: inactiveEmployees,
//         recentHires,
//         departments,
//         staffClasses,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching employees:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch employees" },
//       { status: 500 }
//     );
//   }
// }

// // ...rest of your POST method remains the same

// // POST - Create new employee with login credentials (SRS 2.3)
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const {
//       // User details
//       name,
//       email,
//       password,
//       role = "CASHIER",
//       nic,
//       contact,
//       address,
//       dateOfBirth,
//       department: userDepartment,
//       staffClass: userStaffClass,

//       // Employee details
//       employeeId,
//       joinDate,
//       departmentId,
//       classId,
//       probationEnd,
//     } = body;

//     // Validation
//     if (!name || !email || !password) {
//       return NextResponse.json(
//         { error: "Name, email, and password are required" },
//         { status: 400 }
//       );
//     }

//     if (!employeeId || !nic || !contact || !departmentId || !classId) {
//       return NextResponse.json(
//         {
//           error:
//             "Employee ID, NIC, contact, department, and staff class are required",
//         },
//         { status: 400 }
//       );
//     }

//     // Check if user already exists
//     const existingUser = await prisma.user.findFirst({
//       where: {
//         OR: [{ email: email.trim().toLowerCase() }, { nic: nic.trim() }],
//       },
//     });

//     if (existingUser) {
//       return NextResponse.json(
//         { error: "User with this email or NIC already exists" },
//         { status: 409 }
//       );
//     }

//     // Check if employee ID already exists
//     const existingEmployee = await prisma.staff.findFirst({
//       where: {
//         employeeId: employeeId.trim(),
//       },
//     });

//     if (existingEmployee) {
//       return NextResponse.json(
//         { error: "Employee with this ID already exists" },
//         { status: 409 }
//       );
//     }

//     // Verify department and staff class exist
//     const [department, staffClass] = await Promise.all([
//       prisma.department.findUnique({ where: { id: parseInt(departmentId) } }),
//       prisma.staffClassHR.findUnique({ where: { id: parseInt(classId) } }),
//     ]);

//     if (!department) {
//       return NextResponse.json(
//         { error: "Department not found" },
//         { status: 400 }
//       );
//     }

//     if (!staffClass) {
//       return NextResponse.json(
//         { error: "Staff class not found" },
//         { status: 400 }
//       );
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 12);

//     // Create user and employee in transaction
//     const result = await prisma.$transaction(async (tx) => {
//       // Create user
//       const user = await tx.user.create({
//         data: {
//           name: name.trim(),
//           email: email.trim().toLowerCase(),
//           password: hashedPassword,
//           role,
//           nic: nic?.trim(),
//           contact: contact?.trim(),
//           address: address?.trim(),
//           dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
//           department: userDepartment,
//           staffClass: userStaffClass,
//         },
//       });

//       // Create employee
//       const employee = await tx.staff.create({
//         data: {
//           userId: user.id,
//           employeeId: employeeId.trim(),
//           joinDate: new Date(joinDate),
//           probationEnd: probationEnd ? new Date(probationEnd) : null,
//           departmentId: parseInt(departmentId),
//           classId: parseInt(classId),
//           isActive: true,
//         },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               role: true,
//               nic: true,
//               contact: true,
//               address: true,
//               dateOfBirth: true,
//               createdAt: true,
//             },
//           },
//           department: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//           staffClass: {
//             select: {
//               id: true,
//               name: true,
//               salaryType: true,
//               baseSalary: true,
//             },
//           },
//         },
//       });

//       return employee;
//     });

//     return NextResponse.json(result, { status: 201 });
//   } catch (error) {
//     console.error("Error creating employee:", error);
//     return NextResponse.json(
//       { error: "Failed to create employee" },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, PrivilegeType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { employeeId: { contains: search, mode: "insensitive" } },
        { user: { nic: { contains: search, mode: "insensitive" } } },
        { user: { contact: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (departmentId && departmentId !== "all") {
      where.departmentId = parseInt(departmentId);
    }

    if (classId && classId !== "all") {
      where.classId = parseInt(classId);
    }

    if (status && status !== "all") {
      where.isActive = status === "active";
    }

    // Get employees with all relations
    const employees = await prisma.staff.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            nic: true,
            contact: true,
            address: true,
            dateOfBirth: true,
            createdAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        staffClass: {
          select: {
            id: true,
            name: true,
            salaryType: true,
            baseSalary: true,
          },
        },
        privileges: {
          select: {
            privilege: true,
            canRead: true,
            canWrite: true,
            canDelete: true,
          },
        },
        _count: {
          select: {
            attendance: true,
            leaves: true,
          },
        },
      },
      orderBy: {
        [sortBy === "createdAt" ? "createdAt" : sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.staff.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Get stats
    const stats = await getEmployeeStats();

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
      },
      stats,
    });
  } catch (error) {
    console.error("Get employees error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // User details
      name,
      email,
      password,
      role,
      nic,
      contact,
      address,
      dateOfBirth,
      // Staff details
      employeeId,
      joinDate,
      departmentId,
      classId,
      probationEnd,
      // Privileges
      selectedPrivileges,
    } = body;

    // Validation
    if (
      !name ||
      !email ||
      !password ||
      !employeeId ||
      !nic ||
      !contact ||
      !departmentId ||
      !classId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Check for duplicate NIC
    const existingUserByNic = await prisma.user.findUnique({
      where: { nic },
    });

    if (existingUserByNic) {
      return NextResponse.json(
        { error: "NIC already exists" },
        { status: 400 }
      );
    }

    // Check for duplicate employee ID
    const existingStaff = await prisma.staff.findUnique({
      where: { employeeId },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 400 }
      );
    }

    // Validate department and staff class exist
    const [department, staffClass] = await Promise.all([
      prisma.department.findUnique({
        where: { id: parseInt(departmentId) },
      }),
      prisma.staffClassHR.findUnique({
        where: { id: parseInt(classId) },
      }),
    ]);

    if (!department) {
      return NextResponse.json(
        { error: "Invalid department" },
        { status: 400 }
      );
    }

    if (!staffClass) {
      return NextResponse.json(
        { error: "Invalid staff class" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and staff in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as any,
          nic,
          contact,
          address: address || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        },
      });

      // Create staff
      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          employeeId,
          departmentId: parseInt(departmentId),
          classId: parseInt(classId),
          joinDate: new Date(joinDate),
          probationEnd: probationEnd ? new Date(probationEnd) : null,
          isActive: true,
        },
      });

      // Assign privileges if provided
      let privilegesAssigned = 0;
      if (selectedPrivileges && selectedPrivileges.length > 0) {
        for (const privilege of selectedPrivileges) {
          try {
            // Validate privilege type
            if (
              Object.values(PrivilegeType).includes(
                privilege.privilege as PrivilegeType
              )
            ) {
              await tx.staffPrivilege.create({
                data: {
                  staffId: staff.id,
                  privilege: privilege.privilege as PrivilegeType,
                  canRead: privilege.canRead || false,
                  canWrite: privilege.canWrite || false,
                  canDelete: privilege.canDelete || false,
                  grantedBy: 1, // Should be current user ID from session
                },
              });
              privilegesAssigned++;
            }
          } catch (privilegeError) {
            console.error(
              "Error assigning privilege:",
              privilege.privilege,
              privilegeError
            );
          }
        }
      }

      return { user, staff, privilegesAssigned };
    });

    return NextResponse.json({
      success: true,
      message: "Employee created successfully",
      employee: {
        id: result.staff.id,
        employeeId: result.staff.employeeId,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
      },
      privilegesAssigned: result.privilegesAssigned,
    });
  } catch (error) {
    console.error("Create employee error:", error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        if (error.message.includes("email")) {
          return NextResponse.json(
            { error: "Email already exists" },
            { status: 400 }
          );
        }
        if (error.message.includes("nic")) {
          return NextResponse.json(
            { error: "NIC already exists" },
            { status: 400 }
          );
        }
        if (error.message.includes("employeeId")) {
          return NextResponse.json(
            { error: "Employee ID already exists" },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}

// Helper function to get employee statistics
async function getEmployeeStats() {
  try {
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      recentHires,
      departments,
      staffClasses,
    ] = await Promise.all([
      // Total employees
      prisma.staff.count(),

      // Active employees
      prisma.staff.count({
        where: { isActive: true },
      }),

      // Inactive employees
      prisma.staff.count({
        where: { isActive: false },
      }),

      // Recent hires (last 30 days)
      prisma.staff.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Departments with staff count
      prisma.department.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              staff: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),

      // Staff classes with staff count
      prisma.staffClassHR.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              staff: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      total: totalEmployees,
      active: activeEmployees,
      inactive: inactiveEmployees,
      recentHires,
      departments,
      staffClasses,
    };
  } catch (error) {
    console.error("Error getting employee stats:", error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      recentHires: 0,
      departments: [],
      staffClasses: [],
    };
  }
}