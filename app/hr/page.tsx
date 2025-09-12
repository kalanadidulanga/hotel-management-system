"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    Clock,
    DollarSign,
    HelpCircle,
    MapPin,
    Moon,
    Plus,
    RefreshCw,
    Star,
    UserCheck,
    UserPlus,
    Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface HRDashboardData {
    stats: {
        staff: {
            total: number;
            active: number;
            inactive: number;
            recentHires: number;
        };
        departments: {
            total: number;
            active: number;
            breakdown: Array<{
                id: number;
                name: string;
                _count: { staff: number };
            }>;
        };
        attendance: {
            today: {
                total: number;
                present: number;
                absent: number;
                late: number;
                leave: number;
            };
            monthly: Record<string, number>;
        };
        leaves: {
            pending: number;
            approvedToday: number;
            overdue: number;
        };
        shifts: {
            nightShiftToday: number;
            totalAssignments: number;
        };
        payroll: {
            pendingSalaries: number;
            processedThisMonth: number;
            totalAmount: number;
        };
        appraisals: {
            pending: number;
            overdue: number;
            completedThisMonth: number;
        };
    };
    alerts: Array<{
        type: 'warning' | 'error' | 'info';
        title: string;
        message: string;
        count: number;
        link: string;
    }>;
    recentActivities: {
        attendance: Array<any>;
        leaves: Array<any>;
        upcomingAppraisals: Array<any>;
    };
    leaveBalanceData: Array<{
        staffId: number;
        totalAllowed: number;
        usedLeaves: number;
        remainingLeaves: number;
    }>;
}

export default function HRDashboard() {
    const [data, setData] = useState<HRDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchDashboardData();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/dashboard`);
            if (!response.ok) throw new Error("Failed to fetch HR dashboard data");

            const dashboardData = await response.json();
            setData(dashboardData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching HR dashboard:", error);
            toast.error("Failed to load HR dashboard");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data) return null;

    const attendanceRate = data.stats.attendance.today.total > 0
        ? (data.stats.attendance.today.present / data.stats.attendance.today.total) * 100
        : 0;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Users className="w-8 h-8 text-blue-600 mr-3" />
                        HR Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Human Resource management overview and quick actions
                    </p>
                    {lastUpdated && (
                        <p className="text-sm text-gray-500 mt-1">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-3">
                    <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Link href="/hr/employees/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Employee
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Alerts Section (SRS 2.5, 2.10) */}
            {data.alerts.length > 0 && (
                <div className="space-y-3">
                    {data.alerts.map((alert, index) => (
                        <Card key={index} className={`border-l-4 ${alert.type === 'error' ? 'border-l-red-500 bg-red-50' :
                                alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                                    'border-l-blue-500 bg-blue-50'
                            }`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {alert.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                                        {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                                        {alert.type === 'info' && <HelpCircle className="w-5 h-5 text-blue-600" />}
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                                            <p className="text-sm text-gray-600">{alert.message}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'}>
                                            {alert.count}
                                        </Badge>
                                        <Link href={alert.link}>
                                            <Button size="sm" variant="outline">
                                                View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Staff */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                                <p className="text-2xl font-bold text-gray-900">{data.stats.staff.total}</p>
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    +{data.stats.staff.recentHires} this month
                                </p>
                            </div>
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Active Staff */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                                <p className="text-2xl font-bold text-green-600">{data.stats.staff.active}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {data.stats.staff.inactive} inactive
                                </p>
                            </div>
                            <UserCheck className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Attendance */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{attendanceRate.toFixed(1)}%</p>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs text-green-600">
                                        ✓ {data.stats.attendance.today.present}
                                    </span>
                                    <span className="text-xs text-red-600">
                                        ✗ {data.stats.attendance.today.absent}
                                    </span>
                                    <span className="text-xs text-yellow-600">
                                        ⏰ {data.stats.attendance.today.late}
                                    </span>
                                </div>
                            </div>
                            <Clock className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Actions */}
                <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">Pending Actions</p>
                                <p className="text-2xl font-bold text-orange-800">
                                    {data.stats.leaves.pending + data.stats.appraisals.overdue}
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                    {data.stats.leaves.pending} leaves, {data.stats.appraisals.overdue} appraisals
                                </p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-orange-600 animate-pulse" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Department Overview & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Breakdown (SRS 2.1) */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <MapPin className="w-5 h-5 mr-2" />
                            Department Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.stats.departments.breakdown.map((dept) => (
                                <div key={dept.id} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        <span className="font-medium">{dept.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Progress
                                            value={(dept._count.staff / data.stats.staff.total) * 100}
                                            className="w-20"
                                        />
                                        <Badge variant="secondary">{dept._count.staff}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Link href="/hr/departments">
                                <Button variant="outline" size="sm" className="w-full">
                                    Manage Departments
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/hr/attendance/mark">
                            <Button variant="outline" className="w-full justify-start">
                                <UserCheck className="w-4 h-4 mr-2" />
                                Mark Attendance
                            </Button>
                        </Link>
                        <Link href="/hr/leaves">
                            <Button variant="outline" className="w-full justify-start">
                                <Calendar className="w-4 h-4 mr-2" />
                                Review Leave Requests
                                {data.stats.leaves.pending > 0 && (
                                    <Badge className="ml-auto" variant="destructive">
                                        {data.stats.leaves.pending}
                                    </Badge>
                                )}
                            </Button>
                        </Link>
                        <Link href="/hr/shifts">
                            <Button variant="outline" className="w-full justify-start">
                                <Moon className="w-4 h-4 mr-2" />
                                Manage Night Shifts
                                {data.stats.shifts.nightShiftToday > 0 && (
                                    <Badge className="ml-auto">
                                        {data.stats.shifts.nightShiftToday}
                                    </Badge>
                                )}
                            </Button>
                        </Link>
                        <Link href="/hr/payroll">
                            <Button variant="outline" className="w-full justify-start">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Process Payroll
                                {data.stats.payroll.pendingSalaries > 0 && (
                                    <Badge className="ml-auto" variant="secondary">
                                        {data.stats.payroll.pendingSalaries}
                                    </Badge>
                                )}
                            </Button>
                        </Link>
                        <Link href="/hr/appraisals">
                            <Button variant="outline" className="w-full justify-start">
                                <Star className="w-4 h-4 mr-2" />
                                Schedule Appraisals
                                {data.stats.appraisals.overdue > 0 && (
                                    <Badge className="ml-auto" variant="destructive">
                                        {data.stats.appraisals.overdue} overdue
                                    </Badge>
                                )}
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activities & Payroll Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Recent Attendance */}
                            <div>
                                <h4 className="font-medium text-sm text-gray-600 mb-2">Latest Attendance</h4>
                                <div className="space-y-2">
                                    {data.recentActivities.attendance.slice(0, 3).map((attendance: any, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <span>{attendance.staff.user.name}</span>
                                            <Badge variant={
                                                attendance.status === 'PRESENT' ? 'default' :
                                                    attendance.status === 'LATE' ? 'secondary' :
                                                        attendance.status === 'ABSENT' ? 'destructive' : 'outline'
                                            }>
                                                {attendance.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Recent Leave Requests */}
                            <div>
                                <h4 className="font-medium text-sm text-gray-600 mb-2">Recent Leave Requests</h4>
                                <div className="space-y-2">
                                    {data.recentActivities.leaves.slice(0, 3).map((leave: any, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <span>{leave.staff.user.name}</span>
                                            <Badge variant={
                                                leave.status === 'APPROVED' ? 'default' :
                                                    leave.status === 'PENDING' ? 'secondary' : 'destructive'
                                            }>
                                                {leave.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payroll Summary (SRS 2.7) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <DollarSign className="w-5 h-5 mr-2" />
                            Payroll Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Monthly Payroll</span>
                                <span className="font-bold text-lg">
                                    ${data.stats.payroll.totalAmount.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Processed This Month</span>
                                <Badge variant="default">{data.stats.payroll.processedThisMonth}</Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Pending Processing</span>
                                <Badge variant={data.stats.payroll.pendingSalaries > 0 ? 'destructive' : 'secondary'}>
                                    {data.stats.payroll.pendingSalaries}
                                </Badge>
                            </div>

                            <Separator />

                            {/* Upcoming Appraisals (SRS 2.10) */}
                            <div>
                                <h4 className="font-medium text-sm text-gray-600 mb-2">Upcoming Appraisals</h4>
                                <div className="space-y-2">
                                    {data.recentActivities.upcomingAppraisals.slice(0, 3).map((appraisal: any, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <span>{appraisal.staff.user.name}</span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(appraisal.scheduledDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/hr/departments">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 text-center">
                            <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <h3 className="font-semibold">Departments</h3>
                            <p className="text-sm text-gray-600">Manage departments</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/hr/employees">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 text-center">
                            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <h3 className="font-semibold">Employees</h3>
                            <p className="text-sm text-gray-600">Staff management</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/hr/attendance">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 text-center">
                            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <h3 className="font-semibold">Attendance</h3>
                            <p className="text-sm text-gray-600">Track attendance</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/hr/payroll">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 text-center">
                            <DollarSign className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <h3 className="font-semibold">Payroll</h3>
                            <p className="text-sm text-gray-600">Salary management</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}