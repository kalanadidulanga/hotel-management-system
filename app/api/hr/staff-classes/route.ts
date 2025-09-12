import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, SalaryType } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch all staff classes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const salaryType = searchParams.get("salaryType");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (salaryType && salaryType !== "all") {
      where.salaryType = salaryType as SalaryType;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Fetch staff classes with staff count
    const [staffClasses, total] = await Promise.all([
      prisma.staffClassHR.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { staff: true },
          },
        },
      }),
      prisma.staffClassHR.count({ where }),
    ]);

    // Calculate salary stats
    const salaryStats = await prisma.staffClassHR.groupBy({
      by: ["salaryType"],
      _count: {
        salaryType: true,
      },
      _avg: {
        baseSalary: true,
      },
    });

    return NextResponse.json({
      staffClasses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        active: await prisma.staffClassHR.count({ where: { isActive: true } }),
        salaryTypes: salaryStats.reduce((acc, stat) => {
          acc[stat.salaryType] = {
            count: stat._count.salaryType,
            avgSalary: stat._avg.baseSalary,
          };
          return acc;
        }, {} as Record<string, any>),
      },
    });
  } catch (error) {
    console.error("Error fetching staff classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff classes" },
      { status: 500 }
    );
  }
}

// POST - Create new staff class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      salaryType,
      baseSalary,
      maxLeavesPerMonth,
      maxLeavesPerYear,
      nightShiftRate,
      overtimeRate,
    } = body;

    // Validation
    if (!name || !salaryType || !baseSalary) {
      return NextResponse.json(
        { error: "Name, salary type, and base salary are required" },
        { status: 400 }
      );
    }

    if (baseSalary <= 0) {
      return NextResponse.json(
        { error: "Base salary must be greater than 0" },
        { status: 400 }
      );
    }

    // Check if staff class already exists
    const existingStaffClass = await prisma.staffClassHR.findUnique({
      where: { name: name.trim() },
    });

    if (existingStaffClass) {
      return NextResponse.json(
        { error: "Staff class with this name already exists" },
        { status: 409 }
      );
    }

    // Create staff class
    const staffClass = await prisma.staffClassHR.create({
      data: {
        name: name.trim(),
        salaryType: salaryType as SalaryType,
        baseSalary: parseFloat(baseSalary),
        maxLeavesPerMonth: parseInt(maxLeavesPerMonth) || 2,
        maxLeavesPerYear: parseInt(maxLeavesPerYear) || 24,
        nightShiftRate: nightShiftRate ? parseFloat(nightShiftRate) : null,
        overtimeRate: overtimeRate ? parseFloat(overtimeRate) : null,
        isActive: true,
      },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    return NextResponse.json(staffClass, { status: 201 });
  } catch (error) {
    console.error("Error creating staff class:", error);
    return NextResponse.json(
      { error: "Failed to create staff class" },
      { status: 500 }
    );
  }
}
