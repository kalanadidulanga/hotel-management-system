"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    ArrowUpDown,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    Edit,
    Eye,
    Filter,
    MoreHorizontal,
    Package,
    Plus,
    RefreshCw,
    Settings,
    User,
    Utensils,
    Wrench,
    XCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MaintenanceLog {
    id: number;
    maintenanceId: string;
    maintenanceDate: string;
    description: string;
    cost: number;
    partsCost: number;
    laborCost: number;
    status: string;
    priority: string;
    serviceType: string | null;
    serviceProvider: string | null;
    workOrderNumber: string | null;
    qualityRating: number | null;
    createdAt: string;
    asset: {
        id: number;
        assetId: string;
        name: string;
        type: string;
        location: string | null;
        imageUrl: string | null;
        status: string;
        category: {
            name: string;
        } | null;
    };
    staff: {
        id: number;
        name: string;
        fullName: string | null;
        department: string | null;
        staffClass: string | null;
    };
}

interface FilterOptions {
    statusDistribution: Array<{ status: string; _count: { status: number } }>;
    priorityDistribution: Array<{ priority: string; _count: { priority: number } }>;
    staffList: Array<{ id: number; name: string; fullName: string | null; department: string | null }>;
    assetsList: Array<{ id: number; assetId: string; name: string; type: string }>;
}

interface ListData {
    maintenanceLogs: MaintenanceLog[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    summary: {
        totalRecords: number;
        totalCost: number;
        averageCost: number;
    };
    filters: FilterOptions;
    appliedFilters: {
        search: string;
        status: string;
        priority: string;
        assetType: string;
        staffId: string;
        dateFrom: string;
        dateTo: string;
        sortBy: string;
        sortOrder: string;
    };
}

export default function MaintenanceListPage() {
    const [data, setData] = useState<ListData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);

    // Filter states - Fixed staffId initialization
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [priority, setPriority] = useState("all");
    const [assetType, setAssetType] = useState("all");
    const [staffId, setStaffId] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // Pagination states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        fetchMaintenanceLogs();
    }, [page, limit, search, status, priority, assetType, staffId, dateFrom, dateTo, sortBy, sortOrder]);

    const fetchMaintenanceLogs = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                status,
                priority,
                assetType,
                staffId,
                dateFrom,
                dateTo,
                sortBy,
                sortOrder
            });

            // Handle API base URL - use empty string if undefined (for relative URLs)
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
            const response = await fetch(
                `${baseUrl}/api/assets/maintenance/list?${params}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
            }

            const listData = await response.json();

            // Ensure data structure is correct
            if (listData && listData.summary && listData.pagination && listData.filters) {
                setData(listData);
            } else {
                throw new Error("Invalid data structure received");
            }
        } catch (error) {
            console.error("Error fetching maintenance logs:", error);
            toast.error(`Failed to load maintenance logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Set empty data structure to prevent undefined errors
            setData({
                maintenanceLogs: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    totalCount: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                },
                summary: {
                    totalRecords: 0,
                    totalCost: 0,
                    averageCost: 0
                },
                filters: {
                    statusDistribution: [],
                    priorityDistribution: [],
                    staffList: [],
                    assetsList: []
                },
                appliedFilters: {
                    search: "",
                    status: "",
                    priority: "",
                    assetType: "",
                    staffId: "",
                    dateFrom: "",
                    dateTo: "",
                    sortBy: "createdAt",
                    sortOrder: "desc"
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    const clearFilters = () => {
        setSearch("");
        setStatus("all");
        setPriority("all");
        setAssetType("all");
        setStaffId("all");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const exportData = () => {
        toast.info("Export functionality would be implemented here");
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR'
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'IN_PROGRESS':
                return <Settings className="w-4 h-4 text-blue-600" />;
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

    const getSortIcon = (field: string) => {
        if (sortBy !== field) {
            return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
        }
        return sortOrder === "asc" ?
            <ArrowUp className="w-4 h-4 text-blue-600" /> :
            <ArrowDown className="w-4 h-4 text-blue-600" />;
    };

    const renderStarRating = (rating: number | null) => {
        if (!rating) return null;
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= rating ? "text-yellow-400" : "text-gray-300"}>
                        ⭐
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data || !data.summary || !data.pagination || !data.filters) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
                    <p className="text-gray-600 mb-4">Unable to load maintenance logs. Please try again.</p>
                    <Button onClick={fetchMaintenanceLogs}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/assets/maintenance">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Wrench className="w-8 h-8 text-blue-600 mr-3" />
                            Maintenance Logs
                        </h1>
                        <p className="text-gray-600 mt-1">View and manage all maintenance records</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Button onClick={fetchMaintenanceLogs} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    {/* <Button onClick={exportData} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button> */}
                    <Link href="/assets/maintenance/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Log
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Records</p>
                                <p className="text-2xl font-bold text-gray-900">{data.summary.totalRecords}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Wrench className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(data.summary.totalCost)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                              LKR
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Average Cost</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(data.summary.averageCost)}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                LKR
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <Filter className="w-5 h-5 mr-2" />
                            Filters
                        </span>
                        <Button onClick={clearFilters} variant="outline" size="sm">
                            Clear All
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <Input
                                placeholder="Search maintenance logs..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={status} onValueChange={(value) => {
                            setStatus(value);
                            setPage(1);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {data.filters.statusDistribution.map((item) => (
                                    <SelectItem key={item.status} value={item.status.toLowerCase()}>
                                        <div className="flex items-center justify-between w-full">
                                            <span>{item.status}</span>
                                            <Badge variant="outline" className="ml-2">
                                                {item._count.status}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Priority Filter */}
                        <Select value={priority} onValueChange={(value) => {
                            setPriority(value);
                            setPage(1);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Priorities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                {data.filters.priorityDistribution.map((item) => (
                                    <SelectItem key={item.priority} value={item.priority.toLowerCase()}>
                                        <div className="flex items-center justify-between w-full">
                                            <span>{item.priority}</span>
                                            <Badge variant="outline" className="ml-2">
                                                {item._count.priority}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Asset Type Filter */}
                        <Select value={assetType} onValueChange={(value) => {
                            setAssetType(value);
                            setPage(1);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Asset Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Asset Types</SelectItem>
                                <SelectItem value="fixed_asset">Fixed Assets</SelectItem>
                                <SelectItem value="utensil">Utensils</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Staff Filter */}
                        <Select value={staffId} onValueChange={(value) => {
                            setStaffId(value);
                            setPage(1);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Staff" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Staff</SelectItem>
                                {data.filters.staffList.map((staff) => (
                                    <SelectItem key={staff.id} value={staff.id.toString()}>
                                        {staff.fullName || staff.name}
                                        {staff.department && ` (${staff.department})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Date From */}
                        <Input
                            type="date"
                            placeholder="From Date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                setPage(1);
                            }}
                        />

                        {/* Date To */}
                        <Input
                            type="date"
                            placeholder="To Date"
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value);
                                setPage(1);
                            }}
                        />

                        {/* Records Per Page */}
                        <Select value={limit.toString()} onValueChange={(value) => {
                            setLimit(parseInt(value));
                            setPage(1);
                        }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5 per page</SelectItem>
                                <SelectItem value="10">10 per page</SelectItem>
                                <SelectItem value="25">25 per page</SelectItem>
                                <SelectItem value="50">50 per page</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 hover:bg-transparent"
                                            onClick={() => handleSort('maintenanceId')}
                                        >
                                            ID {getSortIcon('maintenanceId')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 hover:bg-transparent"
                                            onClick={() => handleSort('assetName')}
                                        >
                                            Asset {getSortIcon('assetName')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 hover:bg-transparent"
                                            onClick={() => handleSort('staffName')}
                                        >
                                            Staff {getSortIcon('staffName')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 hover:bg-transparent"
                                            onClick={() => handleSort('maintenanceDate')}
                                        >
                                            Date {getSortIcon('maintenanceDate')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>Status & Priority</TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 hover:bg-transparent"
                                            onClick={() => handleSort('cost')}
                                        >
                                            Cost {getSortIcon('cost')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.maintenanceLogs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            <div className="text-sm">
                                                {log.maintenanceId}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                {log.asset.imageUrl ? (
                                                    <div className="w-8 h-8 rounded overflow-hidden">
                                                        <Image
                                                            src={log.asset.imageUrl}
                                                            alt={log.asset.name}
                                                            width={32}
                                                            height={32}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                        {getAssetTypeIcon(log.asset.type)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm">{log.asset.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {log.asset.assetId}
                                                        {log.asset.location && ` • ${log.asset.location}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {log.staff.fullName || log.staff.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {log.staff.department}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p className="font-medium">{formatDate(log.maintenanceDate)}</p>
                                                <p className="text-xs text-gray-500">
                                                    Created: {formatDateTime(log.createdAt)}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <Badge className={getStatusColor(log.status)} variant="outline">
                                                    {getStatusIcon(log.status)}
                                                    <span className="ml-1">{log.status}</span>
                                                </Badge>
                                                <br />
                                                <Badge className={getPriorityColor(log.priority)} variant="outline">
                                                    {log.priority}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p className="font-semibold text-green-600">
                                                    {formatCurrency(log.cost)}
                                                </p>
                                                {(log.partsCost > 0 || log.laborCost > 0) && (
                                                    <p className="text-xs text-gray-500">
                                                        Parts: {formatCurrency(log.partsCost)} |
                                                        Labor: {formatCurrency(log.laborCost)}
                                                    </p>
                                                )}
                                                {log.qualityRating && (
                                                    <div className="mt-1">
                                                        {renderStarRating(log.qualityRating)}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs">
                                                <p className="text-sm text-gray-900 line-clamp-2">
                                                    {log.description}
                                                </p>
                                                {log.serviceType && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {log.serviceType}
                                                    </p>
                                                )}
                                                {log.workOrderNumber && (
                                                    <p className="text-xs text-blue-600 mt-1">
                                                        WO: {log.workOrderNumber}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => setSelectedLog(log)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Log
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <Link
                                                            href={`/assets/${log.asset.id}`}
                                                            className="flex items-center w-full"
                                                        >
                                                            <Package className="mr-2 h-4 w-4" />
                                                            View Asset
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {data.maintenanceLogs.length === 0 && (
                        <div className="text-center py-12">
                            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance logs found</h3>
                            <p className="text-gray-600 mb-4">Try adjusting your filters or create a new maintenance log.</p>
                            <Link href="/assets/maintenance/create">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create First Log
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination.totalCount)} of{' '}
                        {data.pagination.totalCount} results
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => setPage(page - 1)}
                            disabled={!data.pagination.hasPrev}
                            variant="outline"
                            size="sm"
                        >
                            Previous
                        </Button>

                        <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                                let pageNumber;
                                if (data.pagination.totalPages <= 5) {
                                    pageNumber = i + 1;
                                } else if (page <= 3) {
                                    pageNumber = i + 1;
                                } else if (page >= data.pagination.totalPages - 2) {
                                    pageNumber = data.pagination.totalPages - 4 + i;
                                } else {
                                    pageNumber = page - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNumber}
                                        onClick={() => setPage(pageNumber)}
                                        variant={page === pageNumber ? "default" : "outline"}
                                        size="sm"
                                        className="w-10"
                                    >
                                        {pageNumber}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            onClick={() => setPage(page + 1)}
                            disabled={!data.pagination.hasNext}
                            variant="outline"
                            size="sm"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <Wrench className="w-5 h-5 mr-2" />
                            Maintenance Log Details
                        </DialogTitle>
                        <DialogDescription>
                            {selectedLog?.maintenanceId} - {selectedLog?.asset.name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-3">Asset Information</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            {getAssetTypeIcon(selectedLog.asset.type)}
                                            <span className="font-medium">{selectedLog.asset.name}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">ID: {selectedLog.asset.assetId}</p>
                                        {selectedLog.asset.location && (
                                            <p className="text-sm text-gray-600">📍 {selectedLog.asset.location}</p>
                                        )}
                                        {selectedLog.asset.category && (
                                            <p className="text-sm text-gray-600">Category: {selectedLog.asset.category.name}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-3">Staff Information</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <User className="w-4 h-4" />
                                            <span className="font-medium">
                                                {selectedLog.staff.fullName || selectedLog.staff.name}
                                            </span>
                                        </div>
                                        {selectedLog.staff.department && (
                                            <p className="text-sm text-gray-600">Department: {selectedLog.staff.department}</p>
                                        )}
                                        {selectedLog.staff.staffClass && (
                                            <p className="text-sm text-gray-600">Class: {selectedLog.staff.staffClass}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status and Dates */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-3">Status & Priority</h3>
                                    <div className="space-y-2">
                                        <Badge className={getStatusColor(selectedLog.status)}>
                                            {getStatusIcon(selectedLog.status)}
                                            <span className="ml-1">{selectedLog.status}</span>
                                        </Badge>
                                        <br />
                                        <Badge className={getPriorityColor(selectedLog.priority)}>
                                            {selectedLog.priority} PRIORITY
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-3">Dates</h3>
                                    <div className="space-y-2">
                                        <p className="text-sm">
                                            <strong>Maintenance Date:</strong> {formatDate(selectedLog.maintenanceDate)}
                                        </p>
                                        <p className="text-sm">
                                            <strong>Created:</strong> {formatDateTime(selectedLog.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Service Details */}
                            <div>
                                <h3 className="font-semibold mb-3">Service Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedLog.serviceType && (
                                        <p className="text-sm">
                                            <strong>Service Type:</strong> {selectedLog.serviceType}
                                        </p>
                                    )}
                                    {selectedLog.serviceProvider && (
                                        <p className="text-sm">
                                            <strong>Service Provider:</strong> {selectedLog.serviceProvider}
                                        </p>
                                    )}
                                    {selectedLog.workOrderNumber && (
                                        <p className="text-sm">
                                            <strong>Work Order:</strong> {selectedLog.workOrderNumber}
                                        </p>
                                    )}
                                    {selectedLog.qualityRating && (
                                        <div className="text-sm">
                                            <strong>Quality Rating:</strong>
                                            <div className="mt-1">{renderStarRating(selectedLog.qualityRating)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div>
                                <h3 className="font-semibold mb-3">Cost Breakdown</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Total Cost</p>
                                        <p className="text-lg font-semibold text-green-600">
                                            {formatCurrency(selectedLog.cost)}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Parts Cost</p>
                                        <p className="text-lg font-semibold text-blue-600">
                                            {formatCurrency(selectedLog.partsCost)}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Labor Cost</p>
                                        <p className="text-lg font-semibold text-purple-600">
                                            {formatCurrency(selectedLog.laborCost)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="font-semibold mb-3">Description</h3>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    {selectedLog.description}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}