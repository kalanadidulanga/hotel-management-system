"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    AlertTriangle,
    Bell,
    Building2,
    Clock,
    DollarSign,
    Eye,
    Package,
    Plus,
    Search,
    TrendingUp,
    Utensils,
    Wrench
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DashboardData {
    summary: {
        totalAssets: number;
        totalFixedAssets: number;
        totalUtensils: number;
        maintenanceDue: number;
        maintenanceOverdue: number;
        unreadNotifications: number;
        monthlyMaintenanceCost: number;
        totalAssetValue: number;
        currentAssetValue: number;
    };
    assetsByStatus: Array<{ status: string; _count: { id: number } }>;
    topCategories: Array<{
        id: number;
        name: string;
        assetType: string;
        _count: { assets: number }
    }>;
    recentMaintenances: Array<{
        id: number;
        maintenanceId: string;
        description: string;
        cost: number;
        maintenanceDate: string;
        asset: { name: string; assetId: string; type: string };
        staff: { name: string; fullName: string | null };
    }>;
    criticalAssets: Array<{
        id: number;
        assetId: string;
        name: string;
        type: string;
        status: string;
        maintenanceDate: string;
        location: string | null;
    }>;
}

interface SearchResult {
    assets: Array<{
        id: number;
        assetId: string;
        name: string;
        type: string;
        quantity: number;
        unit: string | null;
        status: string;
        location: string | null;
        purchasePrice: number;
        maintenanceDate: string;
    }>;
}

export default function AssetsDashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult>({ assets: [] });
    const [searchLoading, setSearchLoading] = useState(false);

    // Fetch dashboard data
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/dashboard`);
            if (!response.ok) throw new Error("Failed to fetch dashboard data");

            const data = await response.json();
            setDashboardData(data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (!query || query.length < 2) {
            setSearchResults({ assets: [] });
            return;
        }

        setSearchLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("Search failed");

            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search error:", error);
            toast.error("Search failed");
        } finally {
            setSearchLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'ACTIVE': 'bg-green-100 text-green-800',
            'MAINTENANCE': 'bg-yellow-100 text-yellow-800',
            'RETIRED': 'bg-gray-100 text-gray-800',
            'DAMAGED': 'bg-red-100 text-red-800',
            'OUT_OF_ORDER': 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getMaintenanceUrgency = (maintenanceDate: string) => {
        const date = new Date(maintenanceDate);
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (diffDays < 0) return 'overdue';
        if (diffDays <= 7) return 'urgent';
        if (diffDays <= 30) return 'due-soon';
        return 'scheduled';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Failed to load dashboard data</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assets Dashboard</h1>
                    <p className="text-gray-600">Manage and monitor your hotel assets</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/assets/notifications">
                        <Button variant="outline" className="relative">
                            <Bell className="w-4 h-4 mr-2" />
                            Notifications
                            {dashboardData.summary.unreadNotifications > 0 && (
                                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500">
                                    {dashboardData.summary.unreadNotifications}
                                </Badge>
                            )}
                        </Button>
                    </Link>
                    <Link href="/assets/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Asset
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Quick search by asset ID, name, or description (e.g., '100 spoons', 'FURN-001')"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Search Results */}
                    {searchQuery && (
                        <div className="mt-4">
                            {searchLoading ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                </div>
                            ) : searchResults.assets.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                        Found {searchResults.assets.length} assets:
                                    </p>
                                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                                        {searchResults.assets.map((asset) => (
                                            <Link key={asset.id} href={`/assets/${asset.id}`}>
                                                <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">
                                                                {asset.name}
                                                                {asset.quantity > 1 && (
                                                                    <span className="text-gray-500 ml-1">
                                                                        ({asset.quantity} {asset.unit || 'units'})
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {asset.assetId} • {asset.type} • {asset.location || 'No location'}
                                                            </p>
                                                        </div>
                                                        <Badge className={getStatusColor(asset.status)}>
                                                            {asset.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">
                                    No assets found matching "{searchQuery}"
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Assets */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.summary.totalAssets}</div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Package className="w-3 h-3 mr-1" />
                            {dashboardData.summary.totalFixedAssets} Fixed Assets
                            <Utensils className="w-3 h-3 ml-3 mr-1" />
                            {dashboardData.summary.totalUtensils} Utensils
                        </div>
                    </CardContent>
                </Card>

                {/* Maintenance Due */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Maintenance Alerts</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {dashboardData.summary.maintenanceDue}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                            {dashboardData.summary.maintenanceOverdue} overdue
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Maintenance Cost */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Maintenance</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(dashboardData.summary.monthlyMaintenanceCost)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Current month spending
                        </p>
                    </CardContent>
                </Card>

                {/* Asset Value */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(dashboardData.summary.totalAssetValue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Purchase value
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Critical Assets Requiring Attention */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                            Critical Assets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dashboardData.criticalAssets.length > 0 ? (
                            <div className="space-y-3">
                                {dashboardData.criticalAssets.map((asset) => (
                                    <div key={asset.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                                        <div>
                                            <p className="font-medium">{asset.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {asset.assetId} • {asset.location || 'No location'}
                                            </p>
                                            {asset.status === 'DAMAGED' || asset.status === 'OUT_OF_ORDER' ? (
                                                <Badge className={getStatusColor(asset.status)}>
                                                    {asset.status.replace('_', ' ')}
                                                </Badge>
                                            ) : (
                                                <p className="text-xs text-red-600">
                                                    Maintenance overdue: {formatDate(asset.maintenanceDate)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/assets/${asset.id}`}>
                                                <Button size="sm" variant="outline">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/assets/maintenance/create?assetId=${asset.id}`}>
                                                <Button size="sm">
                                                    <Wrench className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <AlertTriangle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="text-green-600 font-medium">All assets are in good condition!</p>
                                <p className="text-sm text-gray-500">No critical issues detected</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Maintenance Activities */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center">
                                <Wrench className="w-5 h-5 mr-2" />
                                Recent Maintenance
                            </CardTitle>
                            <Link href="/assets/maintenance/history">
                                <Button variant="outline" size="sm">View All</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {dashboardData.recentMaintenances.length > 0 ? (
                            <div className="space-y-3">
                                {dashboardData.recentMaintenances.slice(0, 5).map((maintenance) => (
                                    <div key={maintenance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{maintenance.asset.name}</p>
                                            <p className="text-sm text-gray-600">{maintenance.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                                <span>{maintenance.staff.fullName || maintenance.staff.name}</span>
                                                <span>{formatDate(maintenance.maintenanceDate)}</span>
                                                <span className="font-medium">{formatCurrency(maintenance.cost)}</span>
                                            </div>
                                        </div>
                                        <Badge className={`${maintenance.asset.type === 'FIXED_ASSET' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                            {maintenance.asset.type === 'FIXED_ASSET' ? 'Fixed Asset' : 'Utensil'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No recent maintenance activities</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Asset Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Asset Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {dashboardData.topCategories.map((category) => (
                                <div key={category.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{category.name}</p>
                                        <p className="text-sm text-gray-600">{category.assetType.replace('_', ' ')}</p>
                                    </div>
                                    <Badge variant="secondary">
                                        {category._count.assets} items
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/assets/list">
                                <Button variant="outline" className="w-full h-20 flex flex-col">
                                    <Package className="w-6 h-6 mb-2" />
                                    View All Assets
                                </Button>
                            </Link>
                            <Link href="/assets/create">
                                <Button variant="outline" className="w-full h-20 flex flex-col">
                                    <Plus className="w-6 h-6 mb-2" />
                                    Add New Asset
                                </Button>
                            </Link>
                            <Link href="/assets/maintenance">
                                <Button variant="outline" className="w-full h-20 flex flex-col">
                                    <Wrench className="w-6 h-6 mb-2" />
                                    Maintenance
                                </Button>
                            </Link>
                            <Link href="/assets/reports">
                                <Button variant="outline" className="w-full h-20 flex flex-col">
                                    <TrendingUp className="w-6 h-6 mb-2" />
                                    Reports
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}