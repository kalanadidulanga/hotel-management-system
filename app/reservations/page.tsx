"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    Building,
    CalendarIcon,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    Edit,
    Eye,
    Filter,
    Home,
    Loader2,
    Mail,
    MoreVertical,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Star,
    User,
    Users,
    X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Customer {
    id: number;
    customerID: string;
    firstName: string;
    lastName: string | null;
    fullName: string | null;
    phone: string;
    email: string;
    isVip: boolean;
    nationality: string;
}

interface Room {
    id: number;
    roomNumber: string;
    status: string;
    floor: {
        id: number;
        name: string;
        floorNumber: number;
    } | null;
}

interface RoomClass {
    id: number;
    name: string;
    ratePerNight: number;
    rateDayUse: number;
    hourlyRate: number | null;
    maxOccupancy: number;
}

interface QuickOrder {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    serviceType: string | null;
    orderStatus: string;
    deliveredAt: string | null;
    deliveredByStaff: {
        name: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

interface ComplementaryItem {
    id: number;
    name: string;
    description: string | null;
    rate: number;
    isOptional: boolean;
}

interface Reservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    checkInTime: string;
    checkOutTime: string;
    actualCheckIn: string | null;
    actualCheckOut: string | null;
    numberOfNights: number;
    adults: number;
    children: number;
    infants: number;
    guestCount: number; // Computed field
    bookingType: string | null;
    purposeOfVisit: string | null;
    arrivalFrom: string | null;
    specialRequests: string | null;
    remarks: string | null;
    billingType: string;
    baseRoomRate: number;
    totalRoomCharge: number;
    extraCharges: number;
    discountType: string | null;
    discountValue: number;
    discountReason: string | null;
    discountAmount: number;
    serviceCharge: number;
    tax: number;
    commissionPercent: number;
    commissionAmount: number;
    paymentMethod: string;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    paymentStatus: string;
    advanceRemarks: string | null;
    reservationStatus: string;
    cancellationReason: string | null;
    cancellationDate: string | null;
    createdAt: string;
    updatedAt: string;
    customer: Customer;
    room: Room;
    roomClass: RoomClass;
    bookedByStaff: {
        id: number;
        name: string;
        email: string;
    } | null;
    quickOrders: QuickOrder[];
    complementaryItems: ComplementaryItem[];
}

interface ReservationStats {
    totalReservations: number;
    activeReservations: number;
    todayCheckIns: number;
    todayCheckOuts: number;
    pendingReservations: number;
    cancelledReservations: number;
    monthlyRevenue: number;
    averageDailyRate: number;
    occupancyRate: number;
    revenueGrowth: number;
    totalRoomNights: number;
}

interface RoomClassOption {
    id: number;
    name: string;
}

interface ReservationFilters {
    status: string;
    roomClassId: string;
    dateFrom: string;
    dateTo: string;
    search: string;
}

interface DateRange {
    from: Date | undefined;
    to?: Date;
}

// Debounce utility function
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function ReservationsDashboard() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [roomClasses, setRoomClasses] = useState<RoomClassOption[]>([]);
    const [stats, setStats] = useState<ReservationStats>({
        totalReservations: 0,
        activeReservations: 0,
        todayCheckIns: 0,
        todayCheckOuts: 0,
        pendingReservations: 0,
        cancelledReservations: 0,
        monthlyRevenue: 0,
        averageDailyRate: 0,
        occupancyRate: 0,
        revenueGrowth: 0,
        totalRoomNights: 0,
    });

    const [filters, setFilters] = useState<ReservationFilters>({
        status: 'all',
        roomClassId: 'all',
        dateFrom: '',
        dateTo: '',
        search: '',
    });

    const [searchInput, setSearchInput] = useState('');
    const debouncedSearchTerm = useDebounce(searchInput, 500);

    const [dateRange, setDateRange] = useState<DateRange>({
        from: undefined,
        to: undefined
    });

    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
    });

    // Fix API base URL - handle different environments
    const getApiBaseUrl = () => {
        if (typeof window !== 'undefined') {
            // Client-side: use window.location
            return `${window.location.protocol}//${window.location.host}`;
        }
        // Fallback for server-side
        return process.env.NEXT_PUBLIC_API_BASE_URL;
    };

    const apiBaseUrl = getApiBaseUrl();

    // Update search filter when debounced search term changes
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            search: debouncedSearchTerm
        }));
        setPage(1);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchReservations();
        fetchRoomClasses();
    }, []);

    useEffect(() => {
        fetchReservations();
    }, [filters, page]);

    useEffect(() => {
        // Update date filters when date range changes
        if (dateRange.from || dateRange.to) {
            setFilters(prev => ({
                ...prev,
                dateFrom: dateRange.from ? dateRange.from.toISOString().split('T')[0] : '',
                dateTo: dateRange.to ? dateRange.to.toISOString().split('T')[0] : '',
            }));
            setPage(1);
        } else {
            setFilters(prev => ({
                ...prev,
                dateFrom: '',
                dateTo: '',
            }));
        }
    }, [dateRange]);

    const fetchReservations = async () => {
        try {
            // Show search loading only if it's a search operation
            if (filters.search && filters.search.length > 0) {
                setSearchLoading(true);
            } else {
                setLoading(true);
            }

            setError(null);

            const queryParams = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all' && value.trim() !== '') {
                    queryParams.append(key, value.trim());
                }
            });

            queryParams.append('page', page.toString());
            queryParams.append('limit', '20');

            const url = `${apiBaseUrl}/api/reservations?${queryParams.toString()}`;
            console.log('Fetching from URL:', url);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.details || errorData?.error || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Unknown error occurred');
            }

            setReservations(data.reservations || []);
            setStats(data.stats || {});
            setPagination(data.pagination || {
                totalCount: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            });

        } catch (error) {
            // console.error('Error fetching reservations:', error);

            let errorMessage = 'Unknown error occurred';

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = 'Request timed out. Please try again.';
                } else {
                    errorMessage = error.message;
                }
            }

            setError(errorMessage);
            toast.error(`Failed to load reservations: ${errorMessage}`);
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    };

    const fetchRoomClasses = async () => {
        try {
            const url = `${apiBaseUrl}/api/rooms/settings/classes`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRoomClasses(data.roomClasses || []);
            }
        } catch (error) {
            // console.error('Error fetching room classes:', error);
            // Don't show error toast for room classes as it's not critical
        }
    };

    const handleFilterChange = (key: keyof Omit<ReservationFilters, 'search'>, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
    };

    const clearFilters = () => {
        setFilters({
            status: 'all',
            roomClassId: 'all',
            dateFrom: '',
            dateTo: '',
            search: '',
        });
        setSearchInput('');
        setDateRange({ from: undefined, to: undefined });
        setPage(1);
        setError(null);
    };

    const handleRetry = () => {
        setError(null);
        fetchReservations();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return <CheckCircle className="w-4 h-4" />;
            case 'CHECKED_IN':
                return <User className="w-4 h-4" />;
            case 'CHECKED_OUT':
                return <Home className="w-4 h-4" />;
            case 'CANCELLED':
                return <X className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CHECKED_IN':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'CHECKED_OUT':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'PAID':
                return 'bg-green-100 text-green-800';
            case 'PARTIAL':
                return 'bg-orange-100 text-orange-800';
            case 'PENDING':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
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
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && reservations.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading reservations...</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <CalendarIcon className="w-8 h-8 text-blue-600 mr-3" />
                        Reservations Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Track bookings, check-ins, and revenue performance
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button onClick={fetchReservations} variant="outline" size="sm" disabled={loading || searchLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${(loading || searchLoading) ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {/* <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button> */}
                    <Link href="/reservations/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Reservation
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-medium text-red-800">Error loading reservations</h4>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                <div className="mt-3 flex items-center space-x-2">
                                    <Button
                                        onClick={handleRetry}
                                        variant="outline"
                                        size="sm"
                                        className="border-red-300 text-red-700 hover:bg-red-100"
                                        disabled={loading || searchLoading}
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${(loading || searchLoading) ? 'animate-spin' : ''}`} />
                                        Try Again
                                    </Button>
                                    <Button
                                        onClick={() => setError(null)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-700 hover:bg-red-100"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.totalReservations}</div>
                        <div className="text-xs text-gray-600">Total Bookings</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">{stats.activeReservations}</div>
                        <div className="text-xs text-gray-600">Currently Active</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-700">{stats.todayCheckIns}</div>
                        <div className="text-xs text-gray-600">Check-ins Today</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-700">{stats.todayCheckOuts}</div>
                        <div className="text-xs text-gray-600">Check-outs Today</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-700">{stats.pendingReservations}</div>
                        <div className="text-xs text-gray-600">Pending</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{stats.cancelledReservations}</div>
                        <div className="text-xs text-gray-600">Cancelled</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-700">{stats.occupancyRate}%</div>
                        <div className="text-xs text-gray-600">Occupancy Rate</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center">
                            <span className="text-2xl font-bold text-indigo-700">{Math.abs(stats.revenueGrowth)}%</span>
                            {stats.revenueGrowth >= 0 ? (
                                <ArrowUpRight className="w-4 h-4 ml-1 text-green-600" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4 ml-1 text-red-600" />
                            )}
                        </div>
                        <div className="text-xs text-gray-600">Revenue Growth</div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <DollarSign className="w-5 h-5 mr-2" />
                            Monthly Revenue Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div>
                                    <div className="text-2xl font-bold text-blue-900">
                                        {formatCurrency(stats.monthlyRevenue)}
                                    </div>
                                    <div className="text-sm text-blue-700">This Month's Revenue</div>
                                </div>
                                <div className="text-right">
                                    <div className={`flex items-center ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {stats.revenueGrowth >= 0 ? (
                                            <ArrowUpRight className="w-4 h-4 mr-1" />
                                        ) : (
                                            <ArrowDownRight className="w-4 h-4 mr-1" />
                                        )}
                                        <span className="font-semibold">{Math.abs(stats.revenueGrowth)}%</span>
                                    </div>
                                    <div className="text-sm text-gray-600">vs last month</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-500">Average Daily Rate</Label>
                                <div className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(stats.averageDailyRate)}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Across {stats.totalRoomNights} room nights
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Activity className="w-5 h-5 mr-2" />
                            Today's Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Check-ins:</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                {stats.todayCheckIns}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Check-outs:</span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {stats.todayCheckOuts}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Active guests:</span>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                {stats.activeReservations}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Occupancy:</span>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                                {stats.occupancyRate}%
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Filter className="w-5 h-5 mr-2" />
                            Filter & Search Reservations
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                            <X className="w-4 h-4 mr-2" />
                            Clear All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <Input
                                    placeholder="Booking ID, customer name, phone..."
                                    value={searchInput}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10"
                                />
                                {searchLoading && (
                                    <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-gray-400" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                    <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                                    <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Room Class</Label>
                            <Select value={filters.roomClassId} onValueChange={(value) => handleFilterChange('roomClassId', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {roomClasses.map((roomClass) => (
                                        <SelectItem key={roomClass.id} value={roomClass.id.toString()}>
                                            {roomClass.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="justify-start text-left font-normal w-full">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange.from}
                                        selected={dateRange}
                                        onSelect={(range) => setDateRange(range ?? { from: undefined, to: undefined })}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reservations List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Building className="w-5 h-5 mr-2" />
                            Reservations ({pagination.totalCount})
                            {searchLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                            <Link href="/reservations/calendar">
                                <Button variant="outline" size="sm">
                                    <CalendarIcon className="w-4 h-4 mr-2" />
                                    Calendar View
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading && reservations.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mr-2" />
                            <span>Loading reservations...</span>
                        </div>
                    ) : reservations.length > 0 ? (
                        <>
                            <div className="space-y-4">
                                {reservations.map((reservation) => (
                                    <div
                                        key={reservation.id}
                                        className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    {getStatusIcon(reservation.reservationStatus)}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h3 className="font-semibold text-lg">
                                                            {reservation.bookingNumber}
                                                        </h3>
                                                        <Badge className={`text-xs border ${getStatusColor(reservation.reservationStatus)}`}>
                                                            {reservation.reservationStatus.replace('_', ' ')}
                                                        </Badge>
                                                        {reservation.customer.isVip && (
                                                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                                                <Star className="w-3 h-3 mr-1" />
                                                                VIP
                                                            </Badge>
                                                        )}
                                                        <Badge className={`text-xs ${getPaymentStatusColor(reservation.paymentStatus)}`}>
                                                            {reservation.paymentStatus}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center">
                                                                <User className="w-3 h-3 mr-1" />
                                                                {reservation.customer.firstName} {reservation.customer.lastName}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Home className="w-3 h-3 mr-1" />
                                                                Room {reservation.room.roomNumber}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Building className="w-3 h-3 mr-1" />
                                                                {reservation.roomClass.name}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <CalendarIcon className="w-3 h-3 mr-1" />
                                                                {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Users className="w-3 h-3 mr-1" />
                                                                {reservation.guestCount} guests
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <div className="flex items-center">
                                                                <Phone className="w-3 h-3 mr-1" />
                                                                {reservation.customer.phone}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Mail className="w-3 h-3 mr-1" />
                                                                {reservation.customer.email}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <DollarSign className="w-3 h-3 mr-1" />
                                                                Total: {formatCurrency(reservation.totalAmount)}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Activity className="w-3 h-3 mr-1" />
                                                                Advance: {formatCurrency(reservation.advanceAmount)}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                {reservation.numberOfNights} nights
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <div className="text-right">
                                                    <div className="font-semibold text-lg">
                                                        {formatCurrency(reservation.totalAmount)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {reservation.numberOfNights} nights
                                                    </div>
                                                    {reservation.balanceAmount > 0 && (
                                                        <div className="text-sm text-red-600 font-medium">
                                                            Balance: {formatCurrency(reservation.balanceAmount)}
                                                        </div>
                                                    )}
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/reservations/${reservation.id}`}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {reservation.reservationStatus === 'CONFIRMED' && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/room-reservation/check-in`}>
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Check In
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {reservation.reservationStatus === 'CHECKED_IN' && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/room-reservation/check-out`}>
                                                                    <Home className="w-4 h-4 mr-2" />
                                                                    Check Out
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit Booking
                                                        </DropdownMenuItem>
                                                        {reservation.reservationStatus === 'CONFIRMED' && (
                                                            <DropdownMenuItem className="text-red-600">
                                                                <X className="w-4 h-4 mr-2" />
                                                                Cancel Booking
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {/* Special Requests & Notes */}
                                        {(reservation.specialRequests || reservation.remarks) && (
                                            <div className="mt-3 pt-3 border-t space-y-2">
                                                {reservation.specialRequests && (
                                                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                                        <strong className="text-blue-800">Special Requests:</strong>
                                                        <p className="text-blue-700 mt-1">{reservation.specialRequests}</p>
                                                    </div>
                                                )}
                                                {reservation.remarks && (
                                                    <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                                                        <strong className="text-gray-800">Remarks:</strong>
                                                        <p className="text-gray-700 mt-1">{reservation.remarks}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Quick Orders */}
                                        {reservation.quickOrders.length > 0 && (
                                            <div className="mt-3 pt-3 border-t">
                                                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Orders ({reservation.quickOrders.length})</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {reservation.quickOrders.slice(0, 4).map((order) => (
                                                        <div key={order.id} className="text-sm p-2 bg-yellow-50 rounded border">
                                                            <div className="font-medium">{order.description}</div>
                                                            <div className="text-gray-600">
                                                                Qty: {order.quantity} × {formatCurrency(order.unitPrice)} = {formatCurrency(order.totalAmount)}
                                                            </div>
                                                            <div className="flex justify-between text-xs text-gray-500">
                                                                <span>{order.orderStatus}</span>
                                                                <span>{formatDate(order.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Complementary Items */}
                                        {reservation.complementaryItems.length > 0 && (
                                            <div className="mt-3 pt-3 border-t">
                                                <h4 className="text-sm font-medium text-gray-900 mb-2">Complementary Items</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {reservation.complementaryItems.map((item) => (
                                                        <Badge key={item.id} variant="outline" className="text-xs">
                                                            {item.name} ({formatCurrency(item.rate)})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.totalCount)} of {pagination.totalCount} results
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            onClick={() => setPage(page - 1)}
                                            disabled={!pagination.hasPrev || loading || searchLoading}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm font-medium">
                                            Page {page} of {pagination.totalPages}
                                        </span>
                                        <Button
                                            onClick={() => setPage(page + 1)}
                                            disabled={!pagination.hasNext || loading || searchLoading}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reservations Found</h3>
                            <p className="text-gray-600 mb-4">
                                {Object.values(filters).some(f => f && f !== 'all' && f.trim() !== '')
                                    ? "No reservations match your current filters"
                                    : "No reservations have been made yet"
                                }
                            </p>
                            <div className="flex items-center justify-center space-x-3">
                                {Object.values(filters).some(f => f && f !== 'all' && f.trim() !== '') && (
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                )}
                                <Link href="/room-reservation/room-booking">
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Reservation
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}