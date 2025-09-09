"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertTriangle,
    Calendar,
    Clock,
    Download,
    Edit,
    Eye,
    Filter,
    MapPin,
    Package,
    Plus,
    Search,
    Utensils,
    Wrench
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

interface Asset {
    id: number;
    assetId: string;
    name: string;
    type: 'FIXED_ASSET' | 'UTENSIL';
    status: string;
    quantity: number;
    unit: string | null;
    purchasePrice: number;
    purchaseDate: string;
    maintenanceDate: string;
    maintenanceStatus: string;
    daysDiff: number;
    location: string | null;
    condition: string | null;
    category: {
        id: number;
        name: string;
        assetType: string;
    } | null;
    assignedTo: {
        id: number;
        name: string;
        fullName: string | null;
        department: string | null;
    } | null;
    _count: {
        maintenanceLogs: number;
    };
}

interface Category {
    id: number;
    name: string;
    assetType: string;
    _count: {
        assets: number;
    };
}

interface AssetsListResponse {
    assets: Asset[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    filters: {
        categories: Category[];
    };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AssetsListPage() {
    // State for filters and pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [assetTypeFilter, setAssetTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");

    // Build API URL with filters
    const buildApiUrl = () => {
        const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: itemsPerPage.toString(),
            search: searchQuery,
            assetType: assetTypeFilter === "all" ? "" : assetTypeFilter,
            status: statusFilter === "all" ? "" : statusFilter,
            categoryId: categoryFilter === "all" ? "" : categoryFilter,
            sortBy,
            sortOrder
        });

        return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/list?${params.toString()}`;
    };

    // SWR hook for data fetching
    const { data, error, isLoading, mutate } = useSWR<AssetsListResponse>(
        buildApiUrl(),
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Helper functions
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

    const getMaintenanceStatusColor = (maintenanceStatus: string) => {
        const colors = {
            'overdue': 'bg-red-100 text-red-800',
            'urgent': 'bg-orange-100 text-orange-800',
            'due-soon': 'bg-yellow-100 text-yellow-800',
            'scheduled': 'bg-green-100 text-green-800'
        };
        return colors[maintenanceStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getMaintenanceStatusText = (maintenanceStatus: string, daysDiff: number) => {
        if (maintenanceStatus === 'overdue') return `${Math.abs(daysDiff)} days overdue`;
        if (maintenanceStatus === 'urgent') return `Due in ${daysDiff} days`;
        if (maintenanceStatus === 'due-soon') return `Due in ${daysDiff} days`;
        return `Due in ${daysDiff} days`;
    };

    // Handle search with debounce
    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
        // Trigger SWR revalidation
        setTimeout(() => mutate(), 300);
    };

    // Handle filter changes
    const handleFilterChange = (filterType: string, value: string) => {
        switch (filterType) {
            case 'assetType':
                setAssetTypeFilter(value);
                break;
            case 'status':
                setStatusFilter(value);
                break;
            case 'category':
                setCategoryFilter(value);
                break;
        }
        setCurrentPage(1);
        mutate();
    };

    // Handle sort
    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
        mutate();
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("");
        setAssetTypeFilter("all");
        setStatusFilter("all");
        setCategoryFilter("all");
        setCurrentPage(1);
        mutate();
    };

    // Export functionality
    const handleExport = () => {
        const exportUrl = buildApiUrl() + '&export=true';
        window.open(exportUrl, '_blank');
        toast.success("Export started");
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Failed to load assets data</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assets Management</h1>
                    <p className="text-gray-600">
                        Manage fixed assets and utensils - search by item code or name
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Link href="/assets/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Asset
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Search & Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by asset ID, name, or description (e.g., 'FURN-001', '100 spoons', 'reception table')"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filter Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select value={assetTypeFilter} onValueChange={(value) => handleFilterChange('assetType', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Asset Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="FIXED_ASSET">Fixed Assets</SelectItem>
                                <SelectItem value="UTENSIL">Utensils</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                <SelectItem value="RETIRED">Retired</SelectItem>
                                <SelectItem value="DAMAGED">Damaged</SelectItem>
                                <SelectItem value="OUT_OF_ORDER">Out of Order</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoryFilter} onValueChange={(value) => handleFilterChange('category', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {data?.filters.categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name} ({category._count.assets})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>

                    {/* Active Filters */}
                    {(searchQuery || assetTypeFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all") && (
                        <div className="flex flex-wrap gap-2">
                            {searchQuery && (
                                <Badge variant="secondary">
                                    Search: {searchQuery}
                                </Badge>
                            )}
                            {assetTypeFilter !== "all" && (
                                <Badge variant="secondary">
                                    Type: {assetTypeFilter.replace('_', ' ')}
                                </Badge>
                            )}
                            {statusFilter !== "all" && (
                                <Badge variant="secondary">
                                    Status: {statusFilter}
                                </Badge>
                            )}
                            {categoryFilter !== "all" && data?.filters.categories && (
                                <Badge variant="secondary">
                                    Category: {data.filters.categories.find(c => c.id.toString() === categoryFilter)?.name}
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assets Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            Assets List
                            {data && (
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({data.pagination.totalItems} total)
                                </span>
                            )}
                        </CardTitle>
                        {isLoading && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleSort('assetId')}
                                    >
                                        Asset ID
                                        {sortBy === 'assetId' && (
                                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleSort('name')}
                                    >
                                        Name & Details
                                        {sortBy === 'name' && (
                                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleSort('purchasePrice')}
                                    >
                                        Purchase Price
                                        {sortBy === 'purchasePrice' && (
                                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => handleSort('maintenanceDate')}
                                    >
                                        Maintenance
                                        {sortBy === 'maintenanceDate' && (
                                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.assets.map((asset) => (
                                    <TableRow key={asset.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            <div>
                                                <p className="font-semibold">{asset.assetId}</p>
                                                {asset.category && (
                                                    <p className="text-xs text-gray-500">{asset.category.name}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{asset.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    {asset.location && (
                                                        <span className="flex items-center">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {asset.location}
                                                        </span>
                                                    )}
                                                    {asset.condition && (
                                                        <span>• {asset.condition}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={asset.type === 'FIXED_ASSET' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                                                {asset.type === 'FIXED_ASSET' ? (
                                                    <>
                                                        <Package className="w-3 h-3 mr-1" />
                                                        Fixed Asset
                                                    </>
                                                ) : (
                                                    <>
                                                        <Utensils className="w-3 h-3 mr-1" />
                                                        Utensil
                                                    </>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-center">
                                                <span className="font-semibold">{asset.quantity}</span>
                                                {asset.unit && (
                                                    <p className="text-xs text-gray-500">{asset.unit}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                
                                                <span className="font-medium">{formatCurrency(asset.purchasePrice)}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{formatDate(asset.purchaseDate)}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(asset.status)}>
                                                {asset.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <Badge className={getMaintenanceStatusColor(asset.maintenanceStatus)}>
                                                    {asset.maintenanceStatus === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                    {asset.maintenanceStatus === 'urgent' && <Clock className="w-3 h-3 mr-1" />}
                                                    {getMaintenanceStatusText(asset.maintenanceStatus, asset.daysDiff)}
                                                </Badge>
                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {formatDate(asset.maintenanceDate)}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Link href={`/assets/${asset.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/assets/${asset.id}/edit`}>
                                                    <Button size="sm" variant="outline">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/assets/maintenance/create?assetId=${asset.id}`}>
                                                    <Button
                                                        size="sm"
                                                        variant={asset.maintenanceStatus === 'overdue' ? 'default' : 'outline'}
                                                        className={asset.maintenanceStatus === 'overdue' ? 'bg-red-600 hover:bg-red-700' : ''}
                                                    >
                                                        <Wrench className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Empty State */}
                        {data?.assets.length === 0 && (
                            <div className="text-center py-12">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                                <p className="text-gray-500 mb-4">
                                    {searchQuery ?
                                        `No assets match "${searchQuery}"` :
                                        "Get started by adding your first asset"
                                    }
                                </p>
                                <Link href="/assets/create">
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Asset
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {data && data.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-gray-500">
                                Showing {((data.pagination.currentPage - 1) * data.pagination.itemsPerPage) + 1} to{' '}
                                {Math.min(data.pagination.currentPage * data.pagination.itemsPerPage, data.pagination.totalItems)} of{' '}
                                {data.pagination.totalItems} results
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setCurrentPage(currentPage - 1);
                                        mutate();
                                    }}
                                    disabled={!data.pagination.hasPreviousPage}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                                        const pageNum = Math.max(1, Math.min(
                                            data.pagination.totalPages - 4,
                                            data.pagination.currentPage - 2
                                        )) + i;

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pageNum === data.pagination.currentPage ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => {
                                                    setCurrentPage(pageNum);
                                                    mutate();
                                                }}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setCurrentPage(currentPage + 1);
                                        mutate();
                                    }}
                                    disabled={!data.pagination.hasNextPage}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}