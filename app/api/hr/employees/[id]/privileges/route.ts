import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, PrivilegeType } from "@prisma/client";

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

    const privileges = await prisma.staffPrivilege.findMany({
      where: { staffId: employeeId },
      orderBy: { grantedAt: "desc" },
    });

    return NextResponse.json({ privileges });
  } catch (error) {
    console.error("Get employee privileges error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee privileges" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const { privilege, canRead, canWrite, canDelete } = body;

    if (
      !privilege ||
      !Object.values(PrivilegeType).includes(privilege as PrivilegeType)
    ) {
      return NextResponse.json(
        { error: "Invalid privilege type" },
        { status: 400 }
      );
    }

    // Validate that at least one permission is granted
    if (!canRead && !canWrite && !canDelete) {
      return NextResponse.json(
        {
          error:
            "At least one permission (read, write, or delete) must be granted",
        },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.staff.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Check if privilege already exists
    const existingPrivilege = await prisma.staffPrivilege.findUnique({
      where: {
        staffId_privilege: {
          staffId: employeeId,
          privilege: privilege as PrivilegeType,
        },
      },
    });

    if (existingPrivilege) {
      return NextResponse.json(
        { error: "Employee already has this privilege" },
        { status: 400 }
      );
    }

    // Create new privilege
    const newPrivilege = await prisma.staffPrivilege.create({
      data: {
        staffId: employeeId,
        privilege: privilege as PrivilegeType,
        canRead: canRead || false,
        canWrite: canWrite || false,
        canDelete: canDelete || false,
        grantedBy: 1, // Should be from session/auth - current user ID
      },
    });

    return NextResponse.json({
      success: true,
      message: "Privilege assigned successfully",
      privilege: newPrivilege,
    });
  } catch (error) {
    console.error("Assign privilege error:", error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return NextResponse.json(
          { error: "Employee already has this privilege" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to assign privilege" },
      { status: 500 }
    );
  }
}
