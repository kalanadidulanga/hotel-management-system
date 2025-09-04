"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    User,
    Phone,
    Mail,
    FileText,
    MapPin,
    Calendar,
    Home,
    Users,
    CreditCard,
    Clock,
    Eye,
    UserCheck,
    UserX,
    CheckCircle,
    XCircle,
    Loader2,
    AlertTriangle,
    RefreshCw,
    Star,
    Crown,
    Award,
    Building,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { debounce } from "lodash";

interface Customer {
    id: number;
    customerID: string;
    title?: string;
    firstName: string;
    lastName?: string;
    fullName?: string;
    gender: string;
    dateOfBirth?: string;
    anniversary?: string;
    nationality: 'native' | 'foreigner';
    isVip: boolean;
    vipLevel?: string;
    occupation?: string;
    email: string;
    countryCode?: string;
    phone: string;
    alternatePhone?: string;
    contactType?: string;
    country?: string;
    state?: string;
    city?: string;
    zipcode?: string;
    address: string;
    identityType?: string;
    identityNumber: string;
    frontIdUrl?: string;
    backIdUrl?: string;
    guestImageUrl?: string;
    specialRequests?: string;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    reservations: Reservation[];
}

interface Reservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    actualCheckIn: string | null;
    actualCheckOut: string | null;
    numberOfNights: number;
    adults: number;
    children: number;
    infants: number;
    bookingType?: string;
    purposeOfVisit?: string;
    arrivalFrom?: string;
    specialRequests?: string;
    remarks?: string;
    billingType: 'NIGHT_STAY' | 'DAY_USE' | 'HOURLY';
    baseRoomRate: number;
    totalRoomCharge: number;
    extraCharges: number;
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    discountReason?: string;
    discountAmount: number;
    discountApprovedBy?: string;
    serviceCharge: number;
    tax: number;
    commissionPercent: number;
    commissionAmount: number;
    paymentMethod: string;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    paymentStatus: string;
    advanceRemarks?: string;
    bookedBy?: number;
    reservationStatus: string;
    cancellationReason?: string;
    cancellationDate?: string;
    createdAt: string;
    updatedAt: string;
    customer?: {
        id: number;
        customerID: string;
        firstName: string;
        lastName?: string;
        fullName?: string;
        email: string;
        phone: string;
        identityNumber: string;
        nationality: 'native' | 'foreigner';
        isVip: boolean;
        vipLevel?: string;
    };
    room: {
        id: number;
        roomNumber: string;
        status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING' | 'OUT_OF_ORDER';
        floor: {
            name: string;
        } | null;
    };
    roomClass: {
        name: string;
        maxOccupancy: number;
    };
}

interface SearchResult {
    customers: Customer[];
    reservations: Reservation[];
    query: string;
    type: string;
    stats: {
        customersFound: number;
        reservationsFound: number;
        totalResults: number;
    };
}

export default function QuickSearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState("all");
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (query: string, type: string) => {
            if (!query.trim() || query.length < 2) {
                setSearchResults(null);
                setHasSearched(false);
                return;
            }

            await performSearch(query, type);
        }, 500),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery, searchType);
    }, [searchQuery, searchType, debouncedSearch]);

    const performSearch = async (query: string, type: string) => {
        try {
            setLoading(true);
            const response = await fetch(
                `${apiBaseUrl}/api/front-office/quick-search?q=${encodeURIComponent(query)}&type=${type}`
            );

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            if (data.success) {
                setSearchResults(data);
                setHasSearched(true);
            } else {
                throw new Error(data.error || 'Search failed');
            }
        } catch (error) {
            console.error("Search error:", error);
            toast.error("Failed to perform search");
            setSearchResults(null);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const getStatusVariant = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED':
                return 'default';
            case 'CHECKED_IN':
                return 'secondary';
            case 'CHECKED_OUT':
                return 'outline';
            case 'CANCELLED':
                return 'destructive';
            case 'PAID':
                return 'default';
            case 'PARTIAL':
                return 'secondary';
            case 'PENDING':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getCustomerTypeLabel = (nationality: 'native' | 'foreigner') => {
        return nationality === 'native' ? 'Local' : 'Foreign';
    };

    const getVipIcon = (vipLevel?: string) => {
        if (!vipLevel) return null;

        switch (vipLevel.toLowerCase()) {
            case 'platinum':
                return <Crown className="w-4 h-4 text-purple-600" />;
            case 'gold':
                return <Award className="w-4 h-4 text-yellow-600" />;
            case 'silver':
                return <Star className="w-4 h-4 text-gray-600" />;
            default:
                return <Star className="w-4 h-4 text-blue-600" />;
        }
    };

    const isReservationActive = (reservation: Reservation) => {
        return ['CONFIRMED', 'CHECKED_IN'].includes(reservation.reservationStatus);
    };

    const getReservationStatusIcon = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED':
                return <Clock className="w-4 h-4 text-blue-600" />;
            case 'CHECKED_IN':
                return <UserCheck className="w-4 h-4 text-green-600" />;
            case 'CHECKED_OUT':
                return <UserX className="w-4 h-4 text-gray-600" />;
            case 'CANCELLED':
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
        }
    };

    const getCustomerDisplayName = (customer: Customer) => {
        if (customer.fullName) return customer.fullName;
        return `${customer.firstName} ${customer.lastName || ''}`.trim();
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Search className="w-8 h-8 text-blue-600 mr-3" />
                        Quick Search
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Search customers by NIC, phone, email, name, or booking number
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => {
                        setSearchQuery("");
                        setSearchResults(null);
                        setHasSearched(false);
                    }}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Search
                </Button>
            </div>

            {/* Search Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Search Customers & Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="search-query">Search Query</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search-query"
                                    placeholder="Enter NIC, phone, email, name, or booking number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Search Type</Label>
                            <Select value={searchType} onValueChange={setSearchType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Fields</SelectItem>
                                    <SelectItem value="nic">NIC/ID Number</SelectItem>
                                    <SelectItem value="phone">Phone Number</SelectItem>
                                    <SelectItem value="email">Email Address</SelectItem>
                                    <SelectItem value="name">Customer Name</SelectItem>
                                    <SelectItem value="booking">Booking Number</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Search Tips */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">Search Tips:</h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Enter at least 2 characters to start searching</li>
                            <li>• Use partial matches (e.g., "123" will find "1234567890")</li>
                            <li>• Select specific search type for better results</li>
                            <li>• Search is case-insensitive</li>
                            <li>• VIP customers are highlighted with special badges</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
                <Card>
                    <CardContent className="p-8">
                        <div className="flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" />
                            <span>Searching...</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search Results */}
            {hasSearched && searchResults && !loading && (
                <>
                    {/* Results Summary */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">
                                        Search Results for "{searchResults.query}"
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Found {searchResults.stats.customersFound} customers and {searchResults.stats.reservationsFound} reservations
                                    </p>
                                </div>
                                <Badge variant="outline">
                                    {searchResults.stats.totalResults} total results
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Customers Results */}
                    {searchResults.customers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Customers ({searchResults.customers.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {searchResults.customers.map((customer) => (
                                        <Card key={customer.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Customer Info */}
                                                        <div className="space-y-3">
                                                            <div className="flex items-center space-x-2">
                                                                <h3 className="text-lg font-semibold">
                                                                    {customer.title && `${customer.title} `}
                                                                    {getCustomerDisplayName(customer)}
                                                                </h3>
                                                                <Badge variant="outline">
                                                                    {getCustomerTypeLabel(customer.nationality)}
                                                                </Badge>
                                                                {customer.isVip && (
                                                                    <Badge variant="secondary" className="flex items-center space-x-1">
                                                                        {getVipIcon(customer.vipLevel)}
                                                                        <span>{customer.vipLevel || 'VIP'}</span>
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div className="space-y-2 text-sm text-gray-600">
                                                                <div className="flex items-center">
                                                                    <FileText className="w-4 h-4 mr-2" />
                                                                    <span className="font-medium">Customer ID:</span>
                                                                    <span className="ml-1">{customer.customerID}</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <FileText className="w-4 h-4 mr-2" />
                                                                    <span className="font-medium">NIC:</span>
                                                                    <span className="ml-1">{customer.identityNumber}</span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Phone className="w-4 h-4 mr-2" />
                                                                    <span className="font-medium">Phone:</span>
                                                                    <span className="ml-1">{customer.phone}</span>
                                                                    {customer.alternatePhone && (
                                                                        <span className="ml-1 text-gray-400">/ {customer.alternatePhone}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Mail className="w-4 h-4 mr-2" />
                                                                    <span className="font-medium">Email:</span>
                                                                    <span className="ml-1">{customer.email}</span>
                                                                </div>
                                                                {customer.occupation && (
                                                                    <div className="flex items-center">
                                                                        <Building className="w-4 h-4 mr-2" />
                                                                        <span className="font-medium">Occupation:</span>
                                                                        <span className="ml-1">{customer.occupation}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center">
                                                                    <MapPin className="w-4 h-4 mr-2" />
                                                                    <span className="font-medium">Address:</span>
                                                                    <span className="ml-1">{customer.address}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Recent Reservations */}
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium flex items-center">
                                                                <Calendar className="w-4 h-4 mr-2" />
                                                                Recent Reservations ({customer.reservations.length})
                                                            </h4>

                                                            {customer.reservations.length === 0 ? (
                                                                <p className="text-sm text-gray-500">No reservations found</p>
                                                            ) : (
                                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                                    {customer.reservations.map((reservation) => (
                                                                        <div key={reservation.id} className="p-2 border rounded text-xs">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <div className="flex items-center space-x-2">
                                                                                    {getReservationStatusIcon(reservation.reservationStatus)}
                                                                                    <span className="font-medium">{reservation.bookingNumber}</span>
                                                                                    <Badge size="sm" variant={getStatusVariant(reservation.reservationStatus)}>
                                                                                        {reservation.reservationStatus}
                                                                                    </Badge>
                                                                                </div>
                                                                                {isReservationActive(reservation) && (
                                                                                    <Badge size="sm" variant="default">Active</Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-gray-600">
                                                                                <p>Room {reservation.room.roomNumber} • {reservation.roomClass.name}</p>
                                                                                <p>
                                                                                    {format(new Date(reservation.checkInDate), "MMM dd")} - {format(new Date(reservation.checkOutDate), "MMM dd, yyyy")}
                                                                                </p>
                                                                                <p>{formatCurrency(reservation.totalAmount)} • {reservation.paymentStatus}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex flex-col space-y-2 ml-6">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/customers/${customer.id}`}>
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View Profile
                                                            </Link>
                                                        </Button>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/reservations/new?customerId=${customer.id}`}>
                                                                <Calendar className="w-4 h-4 mr-1" />
                                                                New Booking
                                                            </Link>
                                                        </Button>
                                                        {customer.isVip && (
                                                            <Badge variant="secondary" className="text-center">
                                                                VIP Customer
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Direct Reservation Results */}
                    {searchResults.reservations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Reservations ({searchResults.reservations.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {searchResults.reservations.map((reservation) => (
                                        <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        {/* Booking Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                {getReservationStatusIcon(reservation.reservationStatus)}
                                                                <h3 className="font-semibold">{reservation.bookingNumber}</h3>
                                                                <Badge variant={getStatusVariant(reservation.reservationStatus)}>
                                                                    {reservation.reservationStatus}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                <p><strong>Room:</strong> {reservation.room.roomNumber} ({reservation.roomClass.name})</p>
                                                                <p><strong>Floor:</strong> {reservation.room.floor?.name || 'Ground'}</p>
                                                                <p><strong>Guests:</strong> {reservation.adults} Adults, {reservation.children} Children</p>
                                                                <p><strong>Nights:</strong> {reservation.numberOfNights}</p>
                                                                <p><strong>Billing:</strong> {reservation.billingType}</p>
                                                            </div>
                                                        </div>

                                                        {/* Customer Info */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                <User className="w-4 h-4" />
                                                                <h4 className="font-medium">Guest Information</h4>
                                                                {reservation.customer?.isVip && (
                                                                    <Badge variant="secondary" className="flex items-center space-x-1">
                                                                        {getVipIcon(reservation.customer.vipLevel)}
                                                                        <span>{reservation.customer.vipLevel || 'VIP'}</span>
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                <p><strong>Name:</strong> {reservation.customer?.fullName || `${reservation.customer?.firstName} ${reservation.customer?.lastName || ''}`}</p>
                                                                <p><strong>Customer ID:</strong> {reservation.customer?.customerID}</p>
                                                                <p><strong>Phone:</strong> {reservation.customer?.phone}</p>
                                                                <p><strong>Email:</strong> {reservation.customer?.email}</p>
                                                                <p><strong>NIC:</strong> {reservation.customer?.identityNumber}</p>
                                                            </div>
                                                        </div>

                                                        {/* Dates & Payment */}
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium flex items-center">
                                                                <CreditCard className="w-4 h-4 mr-2" />
                                                                Booking Details
                                                            </h4>
                                                            <div className="text-sm text-gray-600">
                                                                <p><strong>Check-in:</strong> {format(new Date(reservation.checkInDate), "MMM dd, yyyy")}</p>
                                                                <p><strong>Check-out:</strong> {format(new Date(reservation.checkOutDate), "MMM dd, yyyy")}</p>
                                                                <p><strong>Total:</strong> {formatCurrency(reservation.totalAmount)}</p>
                                                                <p><strong>Advance:</strong> {formatCurrency(reservation.advanceAmount)}</p>
                                                                <p><strong>Balance:</strong> {formatCurrency(reservation.balanceAmount)}</p>
                                                                <Badge variant={getStatusVariant(reservation.paymentStatus)}>
                                                                    {reservation.paymentStatus}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex flex-col space-y-2 ml-6">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/reservations/${reservation.id}`}>
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View Details
                                                            </Link>
                                                        </Button>

                                                        {reservation.reservationStatus === 'CONFIRMED' && (
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/front-office/check-ins/${reservation.id}`}>
                                                                    <UserCheck className="w-4 h-4 mr-1" />
                                                                    Check In
                                                                </Link>
                                                            </Button>
                                                        )}

                                                        {reservation.reservationStatus === 'CHECKED_IN' && (
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/front-office/check-outs/${reservation.id}`}>
                                                                    <UserX className="w-4 h-4 mr-1" />
                                                                    Check Out
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* No Results */}
                    {searchResults.stats.totalResults === 0 && (
                        <Card>
                            <CardContent className="p-8">
                                <div className="text-center">
                                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No results found</h3>
                                    <p className="text-gray-500 mb-4">
                                        No customers or reservations match your search query "{searchResults.query}"
                                    </p>
                                    <div className="space-y-2 text-sm text-gray-500">
                                        <p>Try:</p>
                                        <ul className="space-y-1">
                                            <li>• Using different search terms</li>
                                            <li>• Checking for typos</li>
                                            <li>• Using partial matches</li>
                                            <li>• Selecting a different search type</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* No Search Yet */}
            {!hasSearched && !loading && (
                <Card>
                    <CardContent className="p-8">
                        <div className="text-center">
                            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready to search</h3>
                            <p className="text-gray-500">
                                Enter a search term above to find customers and reservations
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}