import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get current date info
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Fetch all HR statistics in parallel
    const [
      // Staff Statistics
      totalStaff,
      activeStaff,
      inactiveStaff,
      staffByDepartment,
      recentHires,

      // Department Statistics
      totalDepartments,
      activeDepartments,

      // Attendance Statistics
      todayAttendance,
      monthlyAttendanceStats,
      lateArrivals,

      // Leave Statistics
      pendingLeaves,
      approvedLeavesToday,
      leaveBalance,
      overdueLeaves,

      // Shift Statistics
      nightShiftToday,
      shiftAssignments,

      // Payroll Statistics
      pendingSalaries,
      processedSalariesThisMonth,
      totalSalaryAmount,

      // Appraisal Statistics
      pendingAppraisals,
      overdueAppraisals,
      completedAppraisalsThisMonth,

      // Recent Activities
      recentAttendance,
      recentLeaves,
      upcomingAppraisals,
    ] = await Promise.all([
      // Staff counts
      prisma.staff.count(),
      prisma.staff.count({ where: { isActive: true } }),
      prisma.staff.count({ where: { isActive: false } }),

      // Staff by department
      prisma.department.findMany({
        include: {
          _count: {
            select: { staff: true },
          },
        },
        where: { isActive: true },
      }),

      // Recent hires (last 30 days)
      prisma.staff.count({
        where: {
          joinDate: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Department counts
      prisma.department.count(),
      prisma.department.count({ where: { isActive: true } }),

      // Today's attendance
      prisma.attendance.findMany({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        },
        include: {
          staff: {
            include: {
              user: true,
              department: true,
            },
          },
        },
      }),

      // Monthly attendance stats
      prisma.attendance.groupBy({
        by: ["status"],
        where: {
          date: {
            gte: startOfMonth,
          },
        },
        _count: {
          status: true,
        },
      }),

      // Late arrivals today
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
          status: "LATE",
        },
      }),

      // Leave statistics
      prisma.leave.count({ where: { status: "PENDING" } }),

      prisma.leave.count({
        where: {
          status: "APPROVED",
          startDate: {
            lte: now,
          },
          endDate: {
            gte: now,
          },
        },
      }),

      // Leave balance calculation (simplified)
      prisma.staff.findMany({
        select: {
          id: true,
          staffClass: {
            select: {
              maxLeavesPerYear: true,
            },
          },
          leaves: {
            where: {
              status: "APPROVED",
              startDate: {
                gte: startOfYear,
              },
            },
            select: {
              totalDays: true,
            },
          },
        },
      }),

      // Overdue leaves (pending for more than 7 days)
      prisma.leave.count({
        where: {
          status: "PENDING",
          appliedAt: {
            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Night shift today
      prisma.shiftAssignment.count({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
          shift: {
            isNightShift: true,
          },
          isActive: true,
        },
      }),

      // Total shift assignments today
      prisma.shiftAssignment.count({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
          isActive: true,
        },
      }),

      // Payroll statistics
      prisma.salary.count({
        where: {
          status: "PENDING",
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      }),

      prisma.salary.count({
        where: {
          status: "PROCESSED",
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      }),

      prisma.salary.aggregate({
        _sum: {
          netSalary: true,
        },
        where: {
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      }),

      // Appraisal statistics
      prisma.appraisal.count({ where: { status: "SCHEDULED" } }),

      prisma.appraisal.count({
        where: {
          status: "SCHEDULED",
          scheduledDate: {
            lt: now,
          },
        },
      }),

      prisma.appraisal.count({
        where: {
          status: "COMPLETED",
          completedDate: {
            gte: startOfMonth,
          },
        },
      }),

      // Recent activities
      prisma.attendance.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          staff: {
            include: {
              user: true,
              department: true,
            },
          },
        },
      }),

      prisma.leave.findMany({
        take: 5,
        orderBy: {
          appliedAt: "desc",
        },
        include: {
          staff: {
            include: {
              user: true,
            },
          },
        },
      }),

      prisma.appraisal.findMany({
        take: 5,
        where: {
          scheduledDate: {
            gte: now,
          },
        },
        orderBy: {
          scheduledDate: "asc",
        },
        include: {
          staff: {
            include: {
              user: true,
            },
          },
        },
      }),
    ]);

    // Process leave balance data
    const leaveBalanceData = leaveBalance.map((staff) => {
      const usedLeaves = staff.leaves.reduce(
        (sum, leave) => sum + leave.totalDays,
        0
      );
      const totalAllowed = staff.staffClass.maxLeavesPerYear;
      return {
        staffId: staff.id,
        totalAllowed,
        usedLeaves,
        remainingLeaves: totalAllowed - usedLeaves,
      };
    });

    // Calculate alerts
    const alerts = [];

    // Holiday limit exceeded alerts (SRS 2.5)
    const exceededLimits = leaveBalanceData.filter(
      (lb) => lb.remainingLeaves < 0
    );
    if (exceededLimits.length > 0) {
      alerts.push({
        type: "warning",
        title: "Leave Limit Exceeded",
        message: `${exceededLimits.length} staff members have exceeded their leave limits`,
        count: exceededLimits.length,
        link: "/hr/leaves",
      });
    }

    // Overdue appraisals (SRS 2.10)
    if (overdueAppraisals > 0) {
      alerts.push({
        type: "error",
        title: "Overdue Appraisals",
        message: `${overdueAppraisals} appraisals are overdue`,
        count: overdueAppraisals,
        link: "/hr/appraisals",
      });
    }

    // Pending leaves
    if (overdueLeaves > 0) {
      alerts.push({
        type: "warning",
        title: "Pending Leave Requests",
        message: `${overdueLeaves} leave requests pending for more than 7 days`,
        count: overdueLeaves,
        link: "/hr/leaves",
      });
    }

    // Process attendance stats
    const attendanceStats = monthlyAttendanceStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    const response = {
      stats: {
        staff: {
          total: totalStaff,
          active: activeStaff,
          inactive: inactiveStaff,
          recentHires,
        },
        departments: {
          total: totalDepartments,
          active: activeDepartments,
          breakdown: staffByDepartment,
        },
        attendance: {
          today: {
            total: todayAttendance.length,
            present: todayAttendance.filter((a) => a.status === "PRESENT")
              .length,
            absent: todayAttendance.filter((a) => a.status === "ABSENT").length,
            late: lateArrivals,
            leave: todayAttendance.filter((a) => a.status === "LEAVE").length,
          },
          monthly: attendanceStats,
        },
        leaves: {
          pending: pendingLeaves,
          approvedToday: approvedLeavesToday,
          overdue: overdueLeaves,
        },
        shifts: {
          nightShiftToday,
          totalAssignments: shiftAssignments,
        },
        payroll: {
          pendingSalaries,
          processedThisMonth: processedSalariesThisMonth,
          totalAmount: totalSalaryAmount._sum.netSalary || 0,
        },
        appraisals: {
          pending: pendingAppraisals,
          overdue: overdueAppraisals,
          completedThisMonth: completedAppraisalsThisMonth,
        },
      },
      alerts,
      recentActivities: {
        attendance: recentAttendance,
        leaves: recentLeaves,
        upcomingAppraisals,
      },
      leaveBalanceData: leaveBalanceData.slice(0, 10), // Top 10 for dashboard
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("HR Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch HR dashboard data" },
      { status: 500 }
    );
  }
}
