import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = parseInt(params.id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const employee = await prisma.staff.findUnique({
      where: { id: employeeId },
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
            id: true,
            privilege: true,
            canRead: true,
            canWrite: true,
            canDelete: true,
            grantedAt: true,
          },
        },
        _count: {
          select: {
            attendance: true,
            leaves: true,
            shifts: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Get employee error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      role,
      nic,
      contact,
      address,
      dateOfBirth,
      departmentId,
      classId,
      probationEnd,
      isActive,
    } = body;

    // Validation
    if (!name || !email || !nic || !contact || !departmentId || !classId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const existingEmployee = await prisma.staff.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Check for duplicate email (excluding current user)
    if (email !== existingEmployee.user.email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (
        existingUserByEmail &&
        existingUserByEmail.id !== existingEmployee.userId
      ) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate NIC (excluding current user)
    if (nic !== existingEmployee.user.nic) {
      const existingUserByNic = await prisma.user.findUnique({
        where: { nic },
      });

      if (
        existingUserByNic &&
        existingUserByNic.id !== existingEmployee.userId
      ) {
        return NextResponse.json(
          { error: "NIC already exists" },
          { status: 400 }
        );
      }
    }

    // Validate department and staff class
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

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user
      const updatedUser = await tx.user.update({
        where: { id: existingEmployee.userId },
        data: {
          name,
          email,
          role: role as any,
          nic,
          contact,
          address: address || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        },
      });

      // Update staff
      const updatedStaff = await tx.staff.update({
        where: { id: employeeId },
        data: {
          departmentId: parseInt(departmentId),
          classId: parseInt(classId),
          probationEnd: probationEnd ? new Date(probationEnd) : null,
          isActive:
            isActive !== undefined ? isActive : existingEmployee.isActive,
        },
      });

      return { user: updatedUser, staff: updatedStaff };
    });

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully",
      employee: result,
    });
  } catch (error) {
    console.error("Update employee error:", error);

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
      }
    }

    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = parseInt(params.id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const existingEmployee = await prisma.staff.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
        _count: {
          select: {
            attendance: true,
            leaves: true,
            shifts: true,
            privileges: true,
          },
        },
      },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Instead of deleting, deactivate the employee to preserve data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Deactivate staff
      await tx.staff.update({
        where: { id: employeeId },
        data: { isActive: false },
      });

      // Remove all privileges
      await tx.staffPrivilege.deleteMany({
        where: { staffId: employeeId },
      });

      return {
        removedPrivileges: existingEmployee._count.privileges,
        preservedRecords: {
          attendance: existingEmployee._count.attendance,
          leaves: existingEmployee._count.leaves,
          shifts: existingEmployee._count.shifts,
        },
      };
    });

    return NextResponse.json({
      success: true,
      message: `Employee deactivated successfully. ${result.removedPrivileges} privileges removed. Historical data preserved.`,
      details: result,
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate employee" },
      { status: 500 }
    );
  }
}
