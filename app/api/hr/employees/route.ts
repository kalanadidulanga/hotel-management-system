
import { PrismaClient, PrivilegeType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { first } from "lodash";
import { NextRequest, NextResponse } from "next/server";

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
  { user: { firstName: { contains: search.toLowerCase() } } },
  { user: { lastName: { contains: search.toLowerCase() } } },
  { user: { email: { contains: search.toLowerCase() } } },
  { employeeId: { contains: search.toLowerCase() } },
  { user: { nic: { contains: search.toLowerCase() } } },
  { user: { contact: { contains: search.toLowerCase() } } },
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
            firstName: true,
            lastName: true,
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
      firstName,
      lastName,
      email,
      password,
      role,
      nic,
      contact,
      address,
      dateOfBirth,
      // Staff details
      gender,
      maritalStatus,
      nationality,
      religion,
      emergencyName,
      emergencyRelation,
      emergencyPhone,
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
      !firstName ||
      !lastName ||
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
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: role as any,
          nic,
          gender: gender || null,
          maritalStatus: maritalStatus || null,
          nationality: nationality || null,
          religion: religion || null,
          emergencyName: emergencyName || null,
          emergencyRelation: emergencyRelation || null,
          emergencyPhone: emergencyPhone || null,
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
          firstName: result.user.firstName,
          lastName: result.user.lastName,
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