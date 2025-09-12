import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, PrivilegeType } from "@prisma/client";

const prisma = new PrismaClient();

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

    const { action, privileges } = body;

    if (!action || !privileges || !Array.isArray(privileges)) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.staff.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    let result;

    if (action === "assign_recommended") {
      // Assign recommended privileges based on role
      const recommendedPrivileges = getRecommendedPrivilegesForRole(
        employee.user.role
      );

      // Get current privileges
      const currentPrivileges = await prisma.staffPrivilege.findMany({
        where: { staffId: employeeId },
        select: { privilege: true },
      });

      const currentPrivilegeNames = currentPrivileges.map((p) => p.privilege);
      const newPrivileges = recommendedPrivileges.filter(
        (p) => !currentPrivilegeNames.includes(p.privilege)
      );

      if (newPrivileges.length === 0) {
        return NextResponse.json({
          success: true,
          message: "All recommended privileges already assigned",
          assignedCount: 0,
        });
      }

      // Assign new privileges in transaction
      result = await prisma.$transaction(async (tx) => {
        const assigned = [];
        for (const priv of newPrivileges) {
          const newPrivilege = await tx.staffPrivilege.create({
            data: {
              staffId: employeeId,
              privilege: priv.privilege,
              canRead: priv.canRead,
              canWrite: priv.canWrite,
              canDelete: priv.canDelete,
              grantedBy: 1, // Should be from session
            },
          });
          assigned.push(newPrivilege);
        }
        return assigned;
      });

      return NextResponse.json({
        success: true,
        message: `${result.length} recommended privileges assigned`,
        assignedCount: result.length,
        privileges: result,
      });
    } else if (action === "remove_all") {
      // Remove all privileges
      const deleteResult = await prisma.staffPrivilege.deleteMany({
        where: { staffId: employeeId },
      });

      return NextResponse.json({
        success: true,
        message: `${deleteResult.count} privileges removed`,
        removedCount: deleteResult.count,
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Bulk privilege operation error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}

// Helper function to get recommended privileges for a role
function getRecommendedPrivilegesForRole(role: string) {
  const rolePrivileges: Record<
    string,
    Array<{
      privilege: PrivilegeType;
      canRead: boolean;
      canWrite: boolean;
      canDelete: boolean;
    }>
  > = {
    ADMIN: [
      {
        privilege: PrivilegeType.ADD_USERS,
        canRead: true,
        canWrite: true,
        canDelete: true,
      },
      {
        privilege: PrivilegeType.RESTAURANT_ORDERS,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.INVENTORY,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.ROOM_SETTING,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.ACCOUNTS,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.GENERAL_LEDGER,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.UNIT_PRICING,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
    ],
    MANAGER: [
      {
        privilege: PrivilegeType.ADD_USERS,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.RESTAURANT_ORDERS,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.INVENTORY,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.ROOM_SETTING,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.ACCOUNTS,
        canRead: true,
        canWrite: false,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.UNIT_PRICING,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
    ],
    FRONT_OFFICE: [
      {
        privilege: PrivilegeType.RESTAURANT_ORDERS,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.INVENTORY,
        canRead: true,
        canWrite: false,
        canDelete: false,
      },
      {
        privilege: PrivilegeType.ROOM_SETTING,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
    ],
    CASHIER: [
      {
        privilege: PrivilegeType.RESTAURANT_ORDERS,
        canRead: true,
        canWrite: true,
        canDelete: false,
      },
    ],
  };

  return rolePrivileges[role] || [];
}
