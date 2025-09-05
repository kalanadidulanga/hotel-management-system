"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Users,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    ArrowUp,
    ArrowDown,
    Eye,
    Plus,
    Search,
    RefreshCw,
    Loader2,
    Bell,
    AlertTriangle,
    TrendingUp,
    Home,
    UserCheck,
    UserX,
    CreditCard,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
    occupancy: {
        totalRooms: number;
        occupiedRooms: number;
        availableRooms: number;
        maintenanceRooms: number;
        occupancyRate: number;
    };
    reservations: {
        totalToday: number;
        checkingInToday: number;
        checkingOutToday: number;
        confirmedReservations: number;
    };
    revenue: {
        todayRevenue: number;
        weekRevenue: number;
        monthRevenue: number;
        pendingPayments: number;
    };
    alerts: {
        overdueCheckouts: number;
        maintenanceRooms: number;
        pendingPayments: number;
        lowInventory: number;
    };
}

interface RecentActivity {
    id: number;
    type: 'CHECK_IN' | 'CHECK_OUT' | 'BOOKING' | 'PAYMENT' | 'MAINTENANCE';
    description: string;
    customerName: string;
    roomNumber: string;
    amount?: number;
    timestamp: string;
    status: string;
}

interface UpcomingReservation {
    id: number;
    bookingNumber: string;
    customerName: string;
    customerPhone: string;
    roomNumber: string;
    roomClass: string;
    checkInTime: string;
    checkOutTime: string;
    adults: number;
    children: number;
    totalAmount: number;
    status: string;
}

export default function FrontOfficeDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [upcomingCheckIns, setUpcomingCheckIns] = useState<UpcomingReservation[]>([]);
    const [upcomingCheckOuts, setUpcomingCheckOuts] = useState<UpcomingReservation[]>([]);
    const [loading, setLoading] = useState(true);

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
            const response = await fetch(`${apiBaseUrl}/api/front-office/dashboard`);

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
                setRecentActivities(data.recentActivities || []);
                setUpcomingCheckIns(data.upcomingCheckIns || []);
                setUpcomingCheckOuts(data.upcomingCheckOuts || []);
            } else {
                throw new Error(data.error || 'Failed to load dashboard');
            }
        } catch (error) {

            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'CHECK_IN':
                return <UserCheck className="w-4 h-4 text-green-600" />;
            case 'CHECK_OUT':
                return <UserX className="w-4 h-4 text-red-600" />;
            case 'BOOKING':
                return <Calendar className="w-4 h-4 text-blue-600" />;
            case 'PAYMENT':
                return <CreditCard className="w-4 h-4 text-purple-600" />;
            case 'MAINTENANCE':
                return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case 'CONFIRMED':
                return 'default';
            case 'CHECKED_IN':
                return 'secondary';
            case 'CHECKED_OUT':
                return 'outline';
            case 'CANCELLED':
                return 'destructive';
            case 'PENDING':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading dashboard...</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                        Front Office Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Welcome to your daily operations center
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                    <Button asChild>
                        <Link href="/reservations/new">
                            <Plus className="w-4 h-4 mr-2" />
                            New Booking
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="h-16 flex flex-col space-y-1">
                    <Link href="/front-office/check-in">
                        <UserCheck className="w-6 h-6" />
                        <span>Check-In</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex flex-col space-y-1">
                    <Link href="/front-office/check-out">
                        <UserX className="w-6 h-6" />
                        <span>Check-Out</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex flex-col space-y-1">
                    <Link href="/front-office/quick-search">
                        <Search className="w-6 h-6" />
                        <span>Quick Search</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex flex-col space-y-1">
                    <Link href="/reservations/calendar">
                        <Calendar className="w-6 h-6" />
                        <span>Calendar</span>
                    </Link>
                </Button>
            </div>

            {/* Alert Cards */}
            {stats && stats.alerts && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {stats.alerts.overdueCheckouts > 0 && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <Bell className="w-6 h-6 text-red-600 mr-3" />
                                    <div>
                                        <p className="text-sm text-red-600">Overdue Checkouts</p>
                                        <p className="text-2xl font-bold text-red-700">{stats.alerts.overdueCheckouts}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {stats.alerts.maintenanceRooms > 0 && (
                        <Card className="border-yellow-200 bg-yellow-50">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
                                    <div>
                                        <p className="text-sm text-yellow-600">Maintenance Rooms</p>
                                        <p className="text-2xl font-bold text-yellow-700">{stats.alerts.maintenanceRooms}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {stats.alerts.pendingPayments > 0 && (
                        <Card className="border-purple-200 bg-purple-50">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <CreditCard className="w-6 h-6 text-purple-600 mr-3" />
                                    <div>
                                        <p className="text-sm text-purple-600">Pending Payments</p>
                                        <p className="text-2xl font-bold text-purple-700">{stats.alerts.pendingPayments}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Main Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Occupancy Stats */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Room Occupancy</CardTitle>
                            <Home className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.occupancy.occupancyRate.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.occupancy.occupiedRooms} of {stats.occupancy.totalRooms} rooms occupied
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center">
                                    <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                    {stats.occupancy.availableRooms} Available
                                </span>
                                <span className="flex items-center">
                                    <AlertTriangle className="w-3 h-3 text-yellow-600 mr-1" />
                                    {stats.occupancy.maintenanceRooms} Maintenance
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Today's Reservations */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.reservations.totalToday}</div>
                            <p className="text-xs text-muted-foreground">Total reservations today</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center">
                                    <ArrowUp className="w-3 h-3 text-green-600 mr-1" />
                                    {stats.reservations.checkingInToday} Check-ins
                                </span>
                                <span className="flex items-center">
                                    <ArrowDown className="w-3 h-3 text-red-600 mr-1" />
                                    {stats.reservations.checkingOutToday} Check-outs
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Revenue Stats */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.revenue.todayRevenue)}</div>
                            <p className="text-xs text-muted-foreground">
                                {formatCurrency(stats.revenue.pendingPayments)} pending
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center">
                                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                                    Week: {formatCurrency(stats.revenue.weekRevenue)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monthly Revenue */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.revenue.monthRevenue)}</div>
                            <p className="text-xs text-muted-foreground">This month's total</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Today's Check-ins and Check-outs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today's Check-ins */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                                <UserCheck className="w-5 h-5 mr-2 text-green-600" />
                                Today's Check-ins ({upcomingCheckIns.length})
                            </span>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/front-office/check-in">
                                    View All
                                </Link>
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {upcomingCheckIns.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No check-ins scheduled for today</p>
                            ) : (
                                upcomingCheckIns.slice(0, 5).map((reservation) => (
                                    <div key={reservation.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-medium">{reservation.customerName}</h4>
                                                <Badge variant={getStatusBadgeVariant(reservation.status)}>
                                                    {reservation.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Room {reservation.roomNumber} • {reservation.roomClass}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {reservation.adults} Adults, {reservation.children} Children
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{formatCurrency(reservation.totalAmount)}</p>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/reservations/${reservation.id}`}>
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Check-outs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                                <UserX className="w-5 h-5 mr-2 text-red-600" />
                                Today's Check-outs ({upcomingCheckOuts.length})
                            </span>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/front-office/check-out">
                                    View All
                                </Link>
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {upcomingCheckOuts.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No check-outs scheduled for today</p>
                            ) : (
                                upcomingCheckOuts.slice(0, 5).map((reservation) => (
                                    <div key={reservation.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-medium">{reservation.customerName}</h4>
                                                <Badge variant={getStatusBadgeVariant(reservation.status)}>
                                                    {reservation.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Room {reservation.roomNumber} • {reservation.roomClass}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {reservation.adults} Adults, {reservation.children} Children
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{formatCurrency(reservation.totalAmount)}</p>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/reservations/${reservation.id}`}>
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {recentActivities.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No recent activity</p>
                        ) : (
                            recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                                    {getActivityIcon(activity.type)}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{activity.description}</p>
                                        <p className="text-xs text-gray-500">
                                            {activity.customerName} • Room {activity.roomNumber}
                                            {activity.amount && ` • ${formatCurrency(activity.amount)}`}
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(activity.timestamp))} ago
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}