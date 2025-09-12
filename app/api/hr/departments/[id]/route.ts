import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Get single department
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const department = await prisma.department.findUnique({
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
            staffClass: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json(
      { error: "Failed to fetch department" },
      { status: 500 }
    );
  }
}

// PUT - Update department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // await here ✅
    const departmentId = Number(id);
    const body = await request.json();
    const { name, description, isActive } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current department)
    const duplicateDepartment = await prisma.department.findFirst({
      where: {
        name: name.trim(),
        id: { not: departmentId },
      },
    });

    if (duplicateDepartment) {
      return NextResponse.json(
        { error: "Department with this name already exists" },
        { status: 409 }
      );
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id : departmentId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive ?? existingDepartment.isActive,
      },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}

// DELETE - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // await here ✅
    const departmentId = Number(id);

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Check if department has staff
    if (department._count.staff > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete department. ${department._count.staff} staff members are assigned to this department.`,
        },
        { status: 409 }
      );
    }

    // Delete department
    await prisma.department.delete({
      where: { id: departmentId },
    });

    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
