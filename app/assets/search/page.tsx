"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Search,
    Filter,
    X,
    ChevronDown,
    Package,
    Settings,
    Eye,
    Loader2,
    ArrowLeft,
    Utensils,
    MapPin,
    Calendar,
    DollarSign,
    User,
    Tag,
    BarChart3,
    Download
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

// Types
interface AssetSearchResult {
    id: string;
    assetId: string;
    name: string;
    code: string;
    type: string;
    status: string;
    condition?: string;
    location?: string;
    purchasePrice: number;
    currentValue?: number;
    category: {
        id: number;
        name: string;
    } | null;
    assignedTo: {
        id: number;
        name: string;
        fullName?: string;
    } | null;
    brand?: string;
    model?: string;
    serialNumber?: string;
    description?: string;
    purchaseDate: string;
    warrantyExpiry?: string;
    maintenanceDate: string;
    lastMaintenanceDate?: string;
    relevance: number;
    tags: string[];
}

interface SearchFilters {
    searchTerm: string;
    assetType: string;
    status: string;
    condition: string;
    categoryId: string;
    assignedToId: string;
    location: string;
    dateRange: {
        from: string;
        to: string;
    };
    priceRange: {
        min: string;
        max: string;
    };
}

interface SearchStats {
    totalAssets: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    totalValue: number;
    averageValue: number;
}

export default function AssetSearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [stats, setStats] = useState<SearchStats>({
        totalAssets: 0,
        byType: {},
        byStatus: {},
        byCategory: {},
        totalValue: 0,
        averageValue: 0
    });

    const [filters, setFilters] = useState<SearchFilters>({
        searchTerm: searchParams.get("q") || "",
        assetType: "all",
        status: "all",
        condition: "all",
        categoryId: "all",
        assignedToId: "all",
        location: "",
        dateRange: {
            from: "",
            to: ""
        },
        priceRange: {
            min: "",
            max: ""
        }
    });

    const [categories, setCategories] = useState<Array<{ id: number, name: string }>>([]);
    const [users, setUsers] = useState<Array<{ id: number, name: string, fullName?: string }>>([]);

    // Fetch filter options
    useEffect(() => {
        fetchCategories();
        fetchUsers();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/assets/categories");
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/users");
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    // Debounced search function
    const performSearch = useCallback(async (searchFilters: SearchFilters) => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            Object.entries(searchFilters).forEach(([key, value]) => {
                if (value && typeof value === "string" && value !== "all" && value !== "") {
                    params.append(key, value);
                } else if (typeof value === "object" && value !== null) {
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        if (subValue && subValue !== "") {
                            params.append(`${key}.${subKey}`, subValue as string);
                        }
                    });
                }
            });

            const response = await fetch(`/api/assets/search?${params}`);

            if (!response.ok) {
                throw new Error("Search failed");
            }

            const data = await response.json();

            setSearchResults(data.assets || []);
            setStats(data.stats || {
                totalAssets: 0,
                byType: {},
                byStatus: {},
                byCategory: {},
                totalValue: 0,
                averageValue: 0
            });

            // Update URL with search parameters
            if (searchFilters.searchTerm) {
                router.push(`/assets/search?q=${encodeURIComponent(searchFilters.searchTerm)}`, { scroll: false });
            }

        } catch (error) {
            console.error("Search error:", error);
            toast.error("Failed to perform search");
            setSearchResults([]);
            setStats({
                totalAssets: 0,
                byType: {},
                byStatus: {},
                byCategory: {},
                totalValue: 0,
                averageValue: 0
            });
        } finally {
            setLoading(false);
        }
    }, [router]);

    // Effect for initial search from URL params
    useEffect(() => {
        const query = searchParams.get("q");
        if (query) {
            setFilters(prev => ({ ...prev, searchTerm: query }));
            performSearch({ ...filters, searchTerm: query });
        } else {
            // Load all assets if no search term
            performSearch(filters);
        }
    }, [searchParams]);

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            performSearch(filters);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters.searchTerm, performSearch]);

    const handleSearch = () => {
        performSearch(filters);
    };

    const clearFilters = () => {
        setFilters({
            searchTerm: "",
            assetType: "all",
            status: "all",
            condition: "all",
            categoryId: "all",
            assignedToId: "all",
            location: "",
            dateRange: { from: "", to: "" },
            priceRange: { min: "", max: "" }
        });
        router.push("/assets/search", { scroll: false });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active": return "bg-green-100 text-green-800";
            case "maintenance": return "bg-yellow-100 text-yellow-800";
            case "retired": return "bg-gray-100 text-gray-800";
            case "damaged": return "bg-red-100 text-red-800";
            case "out_of_order": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "FIXED_ASSET": return "bg-blue-100 text-blue-800";
            case "UTENSIL": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const exportSearchResults = () => {
        const csvContent = [
            ['Asset ID', 'Name', 'Code', 'Type', 'Status', 'Category', 'Location', 'Purchase Price', 'Purchase Date'].join(','),
            ...searchResults.map(asset => [
                asset.assetId,
                asset.name,
                asset.code,
                asset.type,
                asset.status,
                asset.category?.name || 'N/A',
                asset.location || 'N/A',
                asset.purchasePrice,
                formatDate(asset.purchaseDate)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asset-search-results-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/assets">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Assets
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Search className="w-8 h-8 text-blue-600 mr-3" />
                            Asset Search
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Search and filter through your asset inventory
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Button onClick={exportSearchResults} variant="outline" size="sm" disabled={searchResults.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Results
                    </Button>
                    <Button onClick={clearFilters} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Clear All
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Search assets by name, code, brand, model, location..."
                                value={filters.searchTerm}
                                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                className="pl-12 pr-12 h-12 text-lg"
                                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <Button
                                onClick={handleSearch}
                                disabled={loading}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                size="sm"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Search"
                                )}
                            </Button>
                        </div>

                        {/* Advanced Filters */}
                        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <Filter className="w-4 h-4 mr-2" />
                                    Advanced Filters
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <Label>Asset Type</Label>
                                        <Select
                                            value={filters.assetType}
                                            onValueChange={(value) => setFilters({ ...filters, assetType: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="FIXED_ASSET">
                                                    <div className="flex items-center">
                                                        <Package className="w-4 h-4 mr-2" />
                                                        Fixed Assets
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="UTENSIL">
                                                    <div className="flex items-center">
                                                        <Utensils className="w-4 h-4 mr-2" />
                                                        Utensils
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Status</Label>
                                        <Select
                                            value={filters.status}
                                            onValueChange={(value) => setFilters({ ...filters, status: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Status" />
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
                                    </div>

                                    <div>
                                        <Label>Category</Label>
                                        <Select
                                            value={filters.categoryId}
                                            onValueChange={(value) => setFilters({ ...filters, categoryId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Categories" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
                                                {categories.map(category => (
                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Assigned To</Label>
                                        <Select
                                            value={filters.assignedToId}
                                            onValueChange={(value) => setFilters({ ...filters, assignedToId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Users" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Users</SelectItem>
                                                {users.map(user => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.fullName || user.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Condition</Label>
                                        <Select
                                            value={filters.condition}
                                            onValueChange={(value) => setFilters({ ...filters, condition: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Conditions" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Conditions</SelectItem>
                                                <SelectItem value="Excellent">Excellent</SelectItem>
                                                <SelectItem value="Good">Good</SelectItem>
                                                <SelectItem value="Fair">Fair</SelectItem>
                                                <SelectItem value="Poor">Poor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Location</Label>
                                        <Input
                                            placeholder="Enter location..."
                                            value={filters.location}
                                            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Purchase Date Range</Label>
                                        <div className="flex space-x-2">
                                            <Input
                                                type="date"
                                                value={filters.dateRange.from}
                                                onChange={(e) => setFilters({
                                                    ...filters,
                                                    dateRange: { ...filters.dateRange, from: e.target.value }
                                                })}
                                            />
                                            <Input
                                                type="date"
                                                value={filters.dateRange.to}
                                                onChange={(e) => setFilters({
                                                    ...filters,
                                                    dateRange: { ...filters.dateRange, to: e.target.value }
                                                })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Price Range</Label>
                                        <div className="flex space-x-2">
                                            <Input
                                                type="number"
                                                placeholder="Min price"
                                                value={filters.priceRange.min}
                                                onChange={(e) => setFilters({
                                                    ...filters,
                                                    priceRange: { ...filters.priceRange, min: e.target.value }
                                                })}
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Max price"
                                                value={filters.priceRange.max}
                                                onChange={(e) => setFilters({
                                                    ...filters,
                                                    priceRange: { ...filters.priceRange, max: e.target.value }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                    <Button onClick={handleSearch}>
                                        Apply Filters
                                    </Button>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </CardContent>
            </Card>

            {/* Search Stats */}
            {stats.totalAssets > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Assets</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalAssets}</p>
                                </div>
                                <Package className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                                    <p className="text-xl font-bold text-green-600">{formatPrice(stats.totalValue)}</p>
                                </div>
                                <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Average Value</p>
                                    <p className="text-lg font-bold text-purple-600">{formatPrice(stats.averageValue)}</p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Fixed Assets</p>
                                    <p className="text-xl font-bold text-blue-600">{stats.byType.FIXED_ASSET || 0}</p>
                                </div>
                                <Package className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Utensils</p>
                                    <p className="text-xl font-bold text-green-600">{stats.byType.UTENSIL || 0}</p>
                                </div>
                                <Utensils className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search Results */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Search Results ({stats.totalAssets} assets)</span>
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-gray-600">Searching assets...</span>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Asset Info</TableHead>
                                        <TableHead>Type & Status</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Location & Assignment</TableHead>
                                        <TableHead>Purchase Info</TableHead>
                                        <TableHead>Maintenance</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {searchResults.map((asset) => (
                                        <TableRow key={asset.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{asset.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {asset.assetId} • {asset.code}
                                                    </div>
                                                    {asset.brand && (
                                                        <div className="text-xs text-gray-400">
                                                            {asset.brand} {asset.model && `• ${asset.model}`}
                                                        </div>
                                                    )}
                                                    {filters.searchTerm && (
                                                        <div className="text-xs text-blue-600">
                                                            Relevance: {Math.round(asset.relevance * 100)}%
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Badge className={getTypeColor(asset.type)} variant="outline">
                                                        {asset.type === 'FIXED_ASSET' ?
                                                            <><Package className="w-3 h-3 mr-1" />Fixed Asset</> :
                                                            <><Utensils className="w-3 h-3 mr-1" />Utensil</>
                                                        }
                                                    </Badge>
                                                    <Badge className={getStatusColor(asset.status)} variant="outline">
                                                        {asset.status}
                                                    </Badge>
                                                    {asset.condition && (
                                                        <div className="text-xs text-gray-500">
                                                            Condition: {asset.condition}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1">
                                                    {asset.category ? (
                                                        <Badge variant="secondary">
                                                            {asset.category.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">Uncategorized</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-2">
                                                    {asset.location && (
                                                        <div className="flex items-center text-sm">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {asset.location}
                                                        </div>
                                                    )}
                                                    {asset.assignedTo && (
                                                        <div className="flex items-center text-sm">
                                                            <User className="w-3 h-3 mr-1" />
                                                            {asset.assignedTo.fullName || asset.assignedTo.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium text-green-600">
                                                        {formatPrice(asset.purchasePrice)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDate(asset.purchaseDate)}
                                                    </div>
                                                    {asset.currentValue && asset.currentValue !== asset.purchasePrice && (
                                                        <div className="text-xs text-gray-500">
                                                            Current: {formatPrice(asset.currentValue)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-xs text-gray-500">
                                                        Next: {formatDate(asset.maintenanceDate)}
                                                    </div>
                                                    {asset.lastMaintenanceDate && (
                                                        <div className="text-xs text-gray-400">
                                                            Last: {formatDate(asset.lastMaintenanceDate)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle className="flex items-center">
                                                                    <Package className="w-5 h-5 mr-2" />
                                                                    {asset.name}
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Asset Details - {asset.assetId}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <Label>Asset ID</Label>
                                                                        <p className="font-medium">{asset.assetId}</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label>Code</Label>
                                                                        <p className="font-medium">{asset.code}</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label>Type</Label>
                                                                        <Badge className={getTypeColor(asset.type)}>
                                                                            {asset.type}
                                                                        </Badge>
                                                                    </div>
                                                                    <div>
                                                                        <Label>Status</Label>
                                                                        <Badge className={getStatusColor(asset.status)}>
                                                                            {asset.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                {asset.description && (
                                                                    <div>
                                                                        <Label>Description</Label>
                                                                        <p className="text-sm">{asset.description}</p>
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-wrap gap-1">
                                                                    {asset.tags.map((tag, index) => (
                                                                        <Badge key={index} variant="secondary" className="text-xs">
                                                                            <Tag className="w-3 h-3 mr-1" />
                                                                            {tag}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                    <Link href={`/assets/${asset.id}`}>
                                                        <Button size="sm">
                                                            View
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {filters.searchTerm ? "No assets found" : "Start your search"}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {filters.searchTerm
                                    ? "Try adjusting your search terms or filters."
                                    : "Enter a search term or apply filters to find assets."
                                }
                            </p>
                            {filters.searchTerm && (
                                <Button onClick={clearFilters} variant="outline">
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}