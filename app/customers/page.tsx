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
    Users,
    Crown,
    Search,
    Filter,
    Plus,
    RefreshCw,
    UserCheck,
    Globe,
    TrendingUp,
    SortAsc,
    SortDesc
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CustomerCard from "./components/CustomerCard";

interface Customer {
    id: number;
    customerID: string;
    firstName: string;
    lastName: string | null;
    fullName: string | null;
    email: string;
    phone: string;
    identityNumber: string;
    nationality: string;
    isVip: boolean;
    vipLevel: string | null;
    occupation: string | null;
    country: string | null;
    city: string | null;
    guestImageUrl: string | null;
    createdAt: string;
    _count: {
        reservations: number;
    };
}

interface CustomerStats {
    total: number;
    vip: number;
    recent: number;
    nationality: {
        native: number;
        foreigner: number;
    };
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [stats, setStats] = useState<CustomerStats>({
        total: 0,
        vip: 0,
        recent: 0,
        nationality: { native: 0, foreigner: 0 }
    });
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        vip: "all",
        nationality: "all",
        sortBy: "createdAt",
        sortOrder: "desc"
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    // Fetch customers when filters change
    useEffect(() => {
        fetchCustomers();
    }, [filters, pagination.currentPage]);

    // Search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== undefined) {
                setPagination(prev => ({ ...prev, currentPage: 1 }));
                fetchCustomers();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: pagination.itemsPerPage.toString(),
                search: searchTerm,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([, value]) => value !== "all")
                )
            });

            const response = await fetch(`${apiBaseUrl}/api/customers?${params}`);
            if (!response.ok) throw new Error("Failed to fetch customers");

            const data = await response.json();
            setCustomers(data.customers || []);
            setStats(data.stats || {});
            setPagination(data.pagination || {});
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    if (loading && customers.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Users className="w-8 h-8 text-blue-600 mr-3" />
                        Customer Management
                        <Badge variant="outline" className="ml-3 text-xs">
                            Module 03
                        </Badge>
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage customer records with VIP highlighting and quick NIC search
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Link href="/customers/search">
                        <Button variant="outline" size="sm">
                            <Search className="w-4 h-4 mr-2" />
                            Quick NIC Search
                        </Button>
                    </Link>
                    <Button onClick={fetchCustomers} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Link href="/customers/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Customer
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">VIP Customers</p>
                                <p className="text-2xl font-bold text-purple-800">{stats.vip}</p>
                            </div>
                            <Crown className="w-8 h-8 text-purple-600 animate-pulse" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">New This Month</p>
                                <p className="text-2xl font-bold text-green-600">{stats.recent}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Local vs Foreign</p>
                                <p className="text-lg font-bold text-gray-900">
                                    🇱🇰 {stats.nationality.native} | 🌍 {stats.nationality.foreigner}
                                </p>
                            </div>
                            <Globe className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <Filter className="w-5 h-5 mr-2" />
                        Search & Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name, email, phone, NIC, or customer ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* VIP Filter */}
                        <Select
                            value={filters.vip}
                            onValueChange={(value) => handleFilterChange("vip", value)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Customers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Customers</SelectItem>
                                <SelectItem value="true">
                                    <div className="flex items-center">
                                        <Crown className="w-4 h-4 mr-2 text-purple-600" />
                                        VIP Only
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Nationality Filter */}
                        <Select
                            value={filters.nationality}
                            onValueChange={(value) => handleFilterChange("nationality", value)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Nations" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Nations</SelectItem>
                                <SelectItem value="native">🇱🇰 Local</SelectItem>
                                <SelectItem value="foreigner">🌍 Foreign</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort By */}
                        <Select
                            value={filters.sortBy}
                            onValueChange={(value) => handleFilterChange("sortBy", value)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="createdAt">Date Added</SelectItem>
                                <SelectItem value="firstName">Name</SelectItem>
                                <SelectItem value="isVip">VIP Status</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort Order */}
                        <Button
                            variant="outline"
                            onClick={() => handleFilterChange("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
                            className="w-auto"
                        >
                            {filters.sortOrder === "asc" ? (
                                <SortAsc className="w-4 h-4" />
                            ) : (
                                <SortDesc className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Customer List */}
            <div className="space-y-4">
                {customers.length > 0 ? (
                    <>
                        {customers.map((customer) => (
                            <CustomerCard key={customer.id} customer={customer} />
                        ))}
                    </>
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {searchTerm ? 'No customers found' : 'No customers yet'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm
                                    ? 'Try adjusting your search terms or filters'
                                    : 'Get started by adding your first customer'
                                }
                            </p>
                            {!searchTerm && (
                                <Link href="/customers/new">
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Customer
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                                {pagination.totalItems} customers
                            </p>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                >
                                    Previous
                                </Button>

                                {/* Page Numbers */}
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    const pageNumber = pagination.currentPage - 2 + i;
                                    if (pageNumber > 0 && pageNumber <= pagination.totalPages) {
                                        return (
                                            <Button
                                                key={pageNumber}
                                                variant={pageNumber === pagination.currentPage ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNumber)}
                                            >
                                                {pageNumber}
                                            </Button>
                                        );
                                    }
                                    return null;
                                })}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}