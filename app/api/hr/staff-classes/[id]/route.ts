import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, SalaryType } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Get single staff class
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const staffClass = await prisma.staffClassHR.findUnique({
      where: { id },
      include: {
        _count: {
          select: { staff: true },
        },
        staff: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!staffClass) {
      return NextResponse.json(
        { error: "Staff class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(staffClass);
  } catch (error) {
    console.error("Error fetching staff class:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff class" },
      { status: 500 }
    );
  }
}

// PUT - Update staff class
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const {
      name,
      salaryType,
      baseSalary,
      maxLeavesPerMonth,
      maxLeavesPerYear,
      nightShiftRate,
      overtimeRate,
      isActive,
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

    // Check if staff class exists
    const existingStaffClass = await prisma.staffClassHR.findUnique({
      where: { id },
    });

    if (!existingStaffClass) {
      return NextResponse.json(
        { error: "Staff class not found" },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current staff class)
    const duplicateStaffClass = await prisma.staffClassHR.findFirst({
      where: {
        name: name.trim(),
        id: { not: id },
      },
    });

    if (duplicateStaffClass) {
      return NextResponse.json(
        { error: "Staff class with this name already exists" },
        { status: 409 }
      );
    }

    // Update staff class
    const updatedStaffClass = await prisma.staffClassHR.update({
      where: { id },
      data: {
        name: name.trim(),
        salaryType: salaryType as SalaryType,
        baseSalary: parseFloat(baseSalary),
        maxLeavesPerMonth: parseInt(maxLeavesPerMonth) || 2,
        maxLeavesPerYear: parseInt(maxLeavesPerYear) || 24,
        nightShiftRate: nightShiftRate ? parseFloat(nightShiftRate) : null,
        overtimeRate: overtimeRate ? parseFloat(overtimeRate) : null,
        isActive: isActive ?? existingStaffClass.isActive,
      },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    return NextResponse.json(updatedStaffClass);
  } catch (error) {
    console.error("Error updating staff class:", error);
    return NextResponse.json(
      { error: "Failed to update staff class" },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff class
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Check if staff class exists
    const staffClass = await prisma.staffClassHR.findUnique({
      where: { id },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    if (!staffClass) {
      return NextResponse.json(
        { error: "Staff class not found" },
        { status: 404 }
      );
    }

    // Check if staff class has staff
    if (staffClass._count.staff > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete staff class. ${staffClass._count.staff} staff members are assigned to this class.`,
        },
        { status: 409 }
      );
    }

    // Delete staff class
    await prisma.staffClassHR.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Staff class deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff class:", error);
    return NextResponse.json(
      { error: "Failed to delete staff class" },
      { status: 500 }
    );
  }
}
