import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; privilegeId: string } }
) {
  try {
    const employeeId = parseInt(params.id);
    const privilegeId = parseInt(params.privilegeId);
    const body = await request.json();

    if (isNaN(employeeId) || isNaN(privilegeId)) {
      return NextResponse.json(
        { error: "Invalid employee or privilege ID" },
        { status: 400 }
      );
    }

    const { canRead, canWrite, canDelete } = body;

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

    // Check if privilege exists and belongs to the employee
    const existingPrivilege = await prisma.staffPrivilege.findFirst({
      where: {
        id: privilegeId,
        staffId: employeeId,
      },
    });

    if (!existingPrivilege) {
      return NextResponse.json(
        { error: "Privilege not found" },
        { status: 404 }
      );
    }

    // Update the privilege permissions
    const updatedPrivilege = await prisma.staffPrivilege.update({
      where: { id: privilegeId },
      data: {
        canRead: canRead !== undefined ? canRead : existingPrivilege.canRead,
        canWrite:
          canWrite !== undefined ? canWrite : existingPrivilege.canWrite,
        canDelete:
          canDelete !== undefined ? canDelete : existingPrivilege.canDelete,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Privilege updated successfully",
      privilege: updatedPrivilege,
    });
  } catch (error) {
    console.error("Update privilege error:", error);
    return NextResponse.json(
      { error: "Failed to update privilege" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; privilegeId: string } }
) {
  try {
    const employeeId = parseInt(params.id);
    const privilegeId = parseInt(params.privilegeId);

    if (isNaN(employeeId) || isNaN(privilegeId)) {
      return NextResponse.json(
        { error: "Invalid employee or privilege ID" },
        { status: 400 }
      );
    }

    // Check if privilege exists and belongs to the employee
    const existingPrivilege = await prisma.staffPrivilege.findFirst({
      where: {
        id: privilegeId,
        staffId: employeeId,
      },
    });

    if (!existingPrivilege) {
      return NextResponse.json(
        { error: "Privilege not found" },
        { status: 404 }
      );
    }

    // Delete the privilege
    await prisma.staffPrivilege.delete({
      where: { id: privilegeId },
    });

    return NextResponse.json({
      success: true,
      message: "Privilege removed successfully",
    });
  } catch (error) {
    console.error("Remove privilege error:", error);
    return NextResponse.json(
      { error: "Failed to remove privilege" },
      { status: 500 }
    );
  }
}
