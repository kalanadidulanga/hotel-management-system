"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    Eye,
    Package,
    Plus,
    Settings,
    TrendingUp,
    Utensils,
    Wrench,
    XCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from "sonner";

interface MaintenanceLog {
    id: number;
    maintenanceId: string;
    maintenanceDate: string;
    description: string;
    cost: number;
    status: string;
    priority: string;
    serviceType: string | null;
    serviceProvider: string | null;
    createdAt: string;
    asset: {
        id: number;
        assetId: string;
        name: string;
        type: string;
        location: string | null;
        imageUrl: string | null;
    };
    staff: {
        id: number;
        name: string;
        fullName: string | null;
        department: string | null;
    };
}

interface UpcomingMaintenance {
    id: number;
    assetId: string;
    name: string;
    type: string;
    maintenanceDate: string;
    location: string | null;
    assignedTo: {
        name: string;
        fullName: string | null;
    } | null;
}

interface DashboardData {
    summary: {
        totalMaintenanceLogs: number;
        pendingMaintenance: number;
        overdueMaintenance: number;
        completedMaintenance: number;
        inProgressMaintenance: number;
        totalMaintenanceCost: number;
        averageCostPerMaintenance: number;
    };
    charts: {
        statusDistribution: Array<{
            status: string;
            count: number;
            color: string;
        }>;
        priorityDistribution: Array<{
            priority: string;
            count: number;
            color: string;
        }>;
        maintenanceByPriority: Array<{
            priority: string;
            count: number;
            totalCost: number;
        }>;
    };
    recentMaintenanceLogs: MaintenanceLog[];
    upcomingMaintenance: UpcomingMaintenance[];
    staffMaintenanceData: Array<{
        staffId: number;
        _count: { id: number };
        _sum: { cost: number | null };
        staff: {
            id: number;
            name: string;
            fullName: string | null;
            department: string | null;
        };
    }>;
    assetsNeedingMaintenance: Array<{
        id: number;
        assetId: string;
        name: string;
        type: string;
        status: string;
        maintenanceDate: string;
        location: string | null;
        assignedTo: {
            name: string;
            fullName: string | null;
        } | null;
    }>;
    timeframe: number;
}

export default function MaintenanceDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("30");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchDashboardData();
    }, [timeframe, statusFilter]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/maintenance/dashboard?timeframe=${timeframe}&status=${statusFilter}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch dashboard data");
            }

            const dashboardData = await response.json();
            setData(dashboardData);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Failed to load maintenance dashboard");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'COMPLETED': 'bg-green-100 text-green-800',
            'IN_PROGRESS': 'bg-blue-100 text-blue-800',
            'SCHEDULED': 'bg-yellow-100 text-yellow-800',
            'OVERDUE': 'bg-red-100 text-red-800',
            'CANCELLED': 'bg-gray-100 text-gray-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            'CRITICAL': 'bg-red-100 text-red-800',
            'HIGH': 'bg-orange-100 text-orange-800',
            'MEDIUM': 'bg-yellow-100 text-yellow-800',
            'LOW': 'bg-green-100 text-green-800'
        };
        return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getMaintenanceStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'IN_PROGRESS':
                return <Settings className="w-4 h-4 text-blue-600 animate-spin" />;
            case 'SCHEDULED':
                return <Clock className="w-4 h-4 text-yellow-600" />;
            case 'OVERDUE':
                return <AlertTriangle className="w-4 h-4 text-red-600" />;
            default:
                return <XCircle className="w-4 h-4 text-gray-600" />;
        }
    };

    const getAssetTypeIcon = (type: string) => {
        return type === 'FIXED_ASSET' ?
            <Package className="w-4 h-4" /> :
            <Utensils className="w-4 h-4" />;
    };

    const isMaintenanceOverdue = (maintenanceDate: string) => {
        return new Date(maintenanceDate) < new Date();
    };

    const getDaysUntilMaintenance = (maintenanceDate: string) => {
        const today = new Date();
        const maintenance = new Date(maintenanceDate);
        const diffTime = maintenance.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
                    <Button onClick={fetchDashboardData}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Wrench className="w-8 h-8 text-blue-600 mr-3" />
                        Maintenance Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">Monitor and manage all maintenance activities</p>
                </div>

                <div className="flex items-center space-x-3">
                    <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last year</SelectItem>
                        </SelectContent>
                    </Select>

                    <Link href="/assets/maintenance/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Log Maintenance
                        </Button>
                    </Link>

                    <Link href="/assets/maintenance/list">
                        <Button variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            View All
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Maintenance</p>
                                <p className="text-2xl font-bold text-gray-900">{data.summary.totalMaintenanceLogs}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Wrench className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Last {timeframe} days
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overdue</p>
                                <p className="text-2xl font-bold text-red-600">{data.summary.overdueMaintenance}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-red-600">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Requires attention
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">In Progress</p>
                                <p className="text-2xl font-bold text-blue-600">{data.summary.inProgressMaintenance}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Settings className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-blue-600">
                            <Clock className="w-4 h-4 mr-1" />
                            Active work
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(data.summary.totalMaintenanceCost)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Avg: {formatCurrency(data.summary.averageCostPerMaintenance)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Distribution Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Maintenance Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.charts.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {data.charts.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Priority Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Priority Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.charts.priorityDistribution.map((priority) => (
                            <div key={priority.priority} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: priority.color }}
                                    ></div>
                                    <span className="font-medium">{priority.priority}</span>
                                </div>
                                <Badge variant="outline">{priority.count}</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Maintenance Logs */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Maintenance</CardTitle>
                            <Link href="/assets/maintenance/list">
                                <Button variant="outline" size="sm">View All</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.recentMaintenanceLogs.slice(0, 5).map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {log.asset.imageUrl ? (
                                            <div className="w-10 h-10 rounded overflow-hidden">
                                                <Image
                                                    src={log.asset.imageUrl}
                                                    alt={log.asset.name}
                                                    width={40}
                                                    height={40}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                                {getAssetTypeIcon(log.asset.type)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-sm">{log.asset.name}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Badge className={getStatusColor(log.status)} variant="outline">
                                                    {getMaintenanceStatusIcon(log.status)}
                                                    <span className="ml-1">{log.status}</span>
                                                </Badge>
                                                <Badge className={getPriorityColor(log.priority)} variant="outline">
                                                    {log.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-green-600">{formatCurrency(log.cost)}</p>
                                        <p className="text-xs text-gray-500">{formatDateTime(log.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Maintenance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.upcomingMaintenance.slice(0, 5).map((asset) => {
                                const daysUntil = getDaysUntilMaintenance(asset.maintenanceDate);
                                const isOverdue = isMaintenanceOverdue(asset.maintenanceDate);

                                return (
                                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                                {getAssetTypeIcon(asset.type)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{asset.name}</p>
                                                <p className="text-xs text-gray-500">ID: {asset.assetId}</p>
                                                {asset.location && (
                                                    <p className="text-xs text-gray-500">📍 {asset.location}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge
                                                className={isOverdue ? 'bg-red-100 text-red-800' :
                                                    daysUntil <= 3 ? 'bg-orange-100 text-orange-800' :
                                                        'bg-yellow-100 text-yellow-800'}
                                            >
                                                {isOverdue ? 'Overdue' :
                                                    daysUntil === 0 ? 'Today' :
                                                        daysUntil === 1 ? 'Tomorrow' :
                                                            `${daysUntil} days`}
                                            </Badge>
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(asset.maintenanceDate)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assets Needing Attention */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                        Assets Requiring Immediate Attention
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.assetsNeedingMaintenance.map((asset) => {
                            const daysUntil = getDaysUntilMaintenance(asset.maintenanceDate);
                            const isOverdue = daysUntil < 0;

                            return (
                                <div key={asset.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium">{asset.name}</h3>
                                        <Badge className={asset.status === 'DAMAGED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                            {asset.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">ID: {asset.assetId}</p>
                                    {asset.location && (
                                        <p className="text-sm text-gray-600 mb-2">📍 {asset.location}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            className={isOverdue ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}
                                        >
                                            {isOverdue ? `${Math.abs(daysUntil)} days overdue` :
                                                daysUntil === 0 ? 'Due today' : `Due in ${daysUntil} days`}
                                        </Badge>
                                        <Link href={`/assets/${asset.id}`}>
                                            <Button size="sm" variant="outline">
                                                <Eye className="w-3 h-3 mr-1" />
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}