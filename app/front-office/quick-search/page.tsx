"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Crown, Eye, Home, Loader2, Package, RefreshCw, Search, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Type definitions
interface Customer {
    id: number;
    customerID: string;
    firstName: string;
    lastName?: string;
    fullName?: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    identityNumber: string;
    nationality: "native" | "foreigner";
    isVip: boolean;
    vipLevel?: string;
    reservations: Reservation[];
}

interface Reservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfNights: number;
    adults: number;
    children: number;
    totalAmount: number;
    reservationStatus: string;
    paymentStatus: string;
    customer?: {
        id: number;
        customerID: string;
        firstName: string;
        lastName?: string;
        fullName?: string;
        email: string;
        phone: string;
        identityNumber: string;
        nationality: "native" | "foreigner";
        isVip: boolean;
        vipLevel?: string;
    };
    room: {
        id: number;
        roomNumber: string;
        status: string;
        floor?: { name: string };
    };
    roomClass: {
        name: string;
        maxOccupancy: number;
    };
}

interface Room {
    id: number;
    roomNumber: string;
    status: string;
    isActive: boolean;
    hasBalcony: boolean;
    hasSeaView: boolean;
    hasKitchenette: boolean;
    roomClass: {
        name: string;
        maxOccupancy: number;
        ratePerNight: number;
    };
    floor?: { name: string };
    reservations: Array<{
        id: number;
        reservationStatus: string;
        checkInDate: string;
        checkOutDate: string;
        customer: {
            firstName: string;
            lastName?: string;
            fullName?: string;
        };
    }>;
}

interface Asset {
    id: number;
    assetId: string;
    name: string;
    code: string;
    type: string;
    status: string;
    purchasePrice: number;
    currentValue?: number;
    location?: string;
    serialNumber?: string;
    category?: {
        name: string;
        assetType: string;
    };
    assignedTo?: {
        name: string;
        department?: string;
    };
}

interface SearchResult {
    customers: Customer[];
    reservations: Reservation[];
    rooms: Room[];
    assets: Asset[];
    query: string;
    type: string;
    stats: {
        customersFound: number;
        reservationsFound: number;
        roomsFound: number;
        assetsFound: number;
        totalResults: number;
    };
    success: boolean;
}

export default function QuickSearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState("all");
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeTab, setActiveTab] = useState("customers");

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performSearch();
            } else {
                setSearchResults(null);
                setHasSearched(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, searchType]);

    const performSearch = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/front-office/quick-search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`
            );

            if (!response.ok) {
                throw new Error("Search failed");
            }

            const data: SearchResult = await response.json();
            if (data.success) {
                setSearchResults(data);
                setHasSearched(true);

                // Auto-switch to tab with results
                if (data.stats.customersFound > 0) setActiveTab("customers");
                else if (data.stats.reservationsFound > 0) setActiveTab("reservations");
                else if (data.stats.roomsFound > 0) setActiveTab("rooms");
                else if (data.stats.assetsFound > 0) setActiveTab("assets");
            } else {
                throw new Error("Search failed");
            }
        } catch (error) {
            console.error("Search error:", error);
            toast.error("Failed to perform search");
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults(null);
        setHasSearched(false);
        setActiveTab("customers");
    };

    const formatCurrency = (amount: number | undefined): string => {
        if (!amount) return "LKR 0";
        return `LKR ${amount.toLocaleString()}`;
    };

    const getStatusColor = (status: string): string => {
        const statusColors: { [key: string]: string } = {
            'CONFIRMED': 'bg-blue-100 text-blue-800',
            'CHECKED_IN': 'bg-green-100 text-green-800',
            'CHECKED_OUT': 'bg-gray-100 text-gray-800',
            'AVAILABLE': 'bg-green-100 text-green-800',
            'OCCUPIED': 'bg-blue-100 text-blue-800',
            'MAINTENANCE': 'bg-yellow-100 text-yellow-800',
            'ACTIVE': 'bg-green-100 text-green-800',
            'RETIRED': 'bg-gray-100 text-gray-800',
            'CANCELLED': 'bg-red-100 text-red-800',
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const getCustomerDisplayName = (customer: Customer): string => {
        if (customer.fullName) return customer.fullName;
        return `${customer.firstName} ${customer.lastName || ''}`.trim();
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <Search className="w-8 h-8 text-blue-600 mr-3" />
                        Quick Search
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Search customers, reservations, rooms, and assets
                    </p>
                </div>
                <Button variant="outline" onClick={clearSearch}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear
                </Button>
            </div>

            {/* Search Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label>Search Query</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Enter customer name, NIC, phone, booking number, room number..."
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
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="nic">NIC Number</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="booking">Booking</SelectItem>
                                    <SelectItem value="room">Room</SelectItem>
                                    <SelectItem value="asset">Asset</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Loading */}
            {loading && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Searching...</p>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {hasSearched && searchResults && !loading && (
                <>
                    {/* Summary */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">
                                    Search Results for &quot;{searchResults.query}&quot;
                                </h3>
                                <Badge variant="outline">
                                    {searchResults.stats.totalResults} results
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="customers">
                                <User className="w-4 h-4 mr-2" />
                                Customers ({searchResults.stats.customersFound})
                            </TabsTrigger>
                            <TabsTrigger value="reservations">
                                <Calendar className="w-4 h-4 mr-2" />
                                Bookings ({searchResults.stats.reservationsFound})
                            </TabsTrigger>
                            <TabsTrigger value="rooms">
                                <Home className="w-4 h-4 mr-2" />
                                Rooms ({searchResults.stats.roomsFound})
                            </TabsTrigger>
                            <TabsTrigger value="assets">
                                <Package className="w-4 h-4 mr-2" />
                                Assets ({searchResults.stats.assetsFound})
                            </TabsTrigger>
                        </TabsList>

                        {/* Customers Tab */}
                        <TabsContent value="customers" className="space-y-4">
                            {searchResults.customers.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <p className="text-gray-500">No customers found</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                searchResults.customers.map((customer) => (
                                    <Card key={customer.id}>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <h3 className="font-semibold text-lg">
                                                            {getCustomerDisplayName(customer)}
                                                        </h3>
                                                        {customer.isVip && (
                                                            <Badge className="bg-yellow-100 text-yellow-800 flex items-center">
                                                                <Crown className="w-3 h-3 mr-1" />
                                                                VIP {customer.vipLevel || ''}
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline">
                                                            {customer.nationality === 'native' ? 'Local' : 'Foreign'}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                        <div>
                                                            <p><strong>ID:</strong> {customer.customerID}</p>
                                                            <p><strong>NIC:</strong> {customer.identityNumber}</p>
                                                            <p><strong>Phone:</strong> {customer.phone}</p>
                                                            {customer.alternatePhone && (
                                                                <p><strong>Alt Phone:</strong> {customer.alternatePhone}</p>
                                                            )}
                                                            <p><strong>Email:</strong> {customer.email}</p>
                                                        </div>
                                                        <div>
                                                            <p><strong>Recent Bookings:</strong> {customer.reservations.length}</p>
                                                            {customer.reservations.slice(0, 2).map((res) => (
                                                                <p key={res.id} className="text-xs">
                                                                    {res.bookingNumber} - Room {res.room.roomNumber}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/customers/${customer.id}`}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/reservations/new?customerId=${customer.id}`}>
                                                            New Booking
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        {/* Reservations Tab */}
                        <TabsContent value="reservations" className="space-y-4">
                            {searchResults.reservations.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <p className="text-gray-500">No reservations found</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                searchResults.reservations.map((reservation) => (
                                    <Card key={reservation.id}>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between">
                                                <div className="flex-1 grid grid-cols-3 gap-4">
                                                    <div>
                                                        <h3 className="font-semibold mb-2">{reservation.bookingNumber}</h3>
                                                        <div className={`inline-flex px-2 py-1 rounded-full text-xs ${getStatusColor(reservation.reservationStatus)}`}>
                                                            {reservation.reservationStatus}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            Room {reservation.room.roomNumber} - {reservation.roomClass.name}
                                                        </p>
                                                        {reservation.room.floor && (
                                                            <p className="text-sm text-gray-600">
                                                                Floor: {reservation.room.floor.name}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h4 className="font-medium mb-2">Guest</h4>
                                                        {reservation.customer && (
                                                            <>
                                                                <p className="text-sm">
                                                                    {reservation.customer.fullName || `${reservation.customer.firstName} ${reservation.customer.lastName || ''}`}
                                                                </p>
                                                                <p className="text-sm text-gray-600">{reservation.customer.phone}</p>
                                                                <p className="text-sm text-gray-600">{reservation.customer.email}</p>
                                                                {reservation.customer.isVip && (
                                                                    <Badge className="bg-yellow-100 text-yellow-800 mt-1">
                                                                        <Crown className="w-3 h-3 mr-1" />
                                                                        VIP
                                                                    </Badge>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h4 className="font-medium mb-2">Stay Details</h4>
                                                        <p className="text-sm">
                                                            {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                                                        </p>
                                                        <p className="text-sm">{reservation.numberOfNights} nights</p>
                                                        <p className="text-sm">Guests: {reservation.adults} adults, {reservation.children} children</p>
                                                        <p className="text-sm font-medium">{formatCurrency(reservation.totalAmount)}</p>
                                                        <div className={`inline-flex px-2 py-1 rounded-full text-xs mt-1 ${getStatusColor(reservation.paymentStatus)}`}>
                                                            {reservation.paymentStatus}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/reservations/${reservation.id}`}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        {/* Rooms Tab */}
                        <TabsContent value="rooms" className="space-y-4">
                            {searchResults.rooms.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <p className="text-gray-500">No rooms found</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                searchResults.rooms.map((room) => (
                                    <Card key={room.id}>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between">
                                                <div className="flex-1 grid grid-cols-3 gap-4">
                                                    <div>
                                                        <h3 className="font-semibold mb-2">Room {room.roomNumber}</h3>
                                                        <div className={`inline-flex px-2 py-1 rounded-full text-xs ${getStatusColor(room.status)}`}>
                                                            {room.status}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            {room.roomClass.name}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-medium mb-2">Details</h4>
                                                        <p className="text-sm">Floor: {room.floor?.name || 'Ground'}</p>
                                                        <p className="text-sm">Capacity: {room.roomClass.maxOccupancy} guests</p>
                                                        <p className="text-sm">{formatCurrency(room.roomClass.ratePerNight)}/night</p>

                                                        {/* Room Features */}
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {room.hasBalcony && <Badge variant="outline" className="text-xs">Balcony</Badge>}
                                                            {room.hasSeaView && <Badge variant="outline" className="text-xs">Sea View</Badge>}
                                                            {room.hasKitchenette && <Badge variant="outline" className="text-xs">Kitchenette</Badge>}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-medium mb-2">Current Guest</h4>
                                                        {room.reservations.length > 0 ? (
                                                            <div>
                                                                <p className="text-sm">
                                                                    {room.reservations[0].customer.fullName ||
                                                                        `${room.reservations[0].customer.firstName} ${room.reservations[0].customer.lastName || ''}`}
                                                                </p>
                                                                <div className={`inline-flex px-2 py-1 rounded-full text-xs ${getStatusColor(room.reservations[0].reservationStatus)}`}>
                                                                    {room.reservations[0].reservationStatus}
                                                                </div>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    {formatDate(room.reservations[0].checkInDate)} - {formatDate(room.reservations[0].checkOutDate)}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500">No current guest</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/rooms/${room.id}`}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                    {room.status === 'AVAILABLE' && (
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/reservations/new?roomId=${room.id}`}>
                                                                Book Room
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        {/* Assets Tab */}
                        <TabsContent value="assets" className="space-y-4">
                            {searchResults.assets.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <p className="text-gray-500">No assets found</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                searchResults.assets.map((asset) => (
                                    <Card key={asset.id}>
                                        <CardContent className="p-6">
                                            <div className="flex justify-between">
                                                <div className="flex-1 grid grid-cols-3 gap-4">
                                                    <div>
                                                        <h3 className="font-semibold mb-2">{asset.name}</h3>
                                                        <div className={`inline-flex px-2 py-1 rounded-full text-xs ${getStatusColor(asset.status)}`}>
                                                            {asset.status}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            Code: {asset.code}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            ID: {asset.assetId}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-medium mb-2">Details</h4>
                                                        <p className="text-sm">Type: {asset.type}</p>
                                                        <p className="text-sm">Category: {asset.category?.name || 'N/A'}</p>
                                                        <p className="text-sm">Location: {asset.location || 'N/A'}</p>
                                                        {asset.serialNumber && (
                                                            <p className="text-sm">Serial: {asset.serialNumber}</p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h4 className="font-medium mb-2">Financial</h4>
                                                        <p className="text-sm">Purchase: {formatCurrency(asset.purchasePrice)}</p>
                                                        {asset.currentValue && (
                                                            <p className="text-sm">Current: {formatCurrency(asset.currentValue)}</p>
                                                        )}
                                                        <p className="text-sm">
                                                            Assigned: {asset.assignedTo?.name || 'Unassigned'}
                                                        </p>
                                                        {asset.assignedTo?.department && (
                                                            <p className="text-sm text-gray-600">
                                                                Dept: {asset.assignedTo.department}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/assets/${asset.id}`}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* No Results */}
                    {searchResults.stats.totalResults === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                                <p className="text-gray-500">
                                    No matches found for &quot;{searchResults.query}&quot;
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Initial State */}
            {!hasSearched && !loading && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Ready to Search</h3>
                        <p className="text-gray-500">
                            Enter at least 2 characters to start searching
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="text-center p-3">
                                <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                <p className="text-sm font-medium">Customers</p>
                                <p className="text-xs text-gray-500">Name, NIC, Phone</p>
                            </div>
                            <div className="text-center p-3">
                                <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <p className="text-sm font-medium">Bookings</p>
                                <p className="text-xs text-gray-500">Booking Numbers</p>
                            </div>
                            <div className="text-center p-3">
                                <Home className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                <p className="text-sm font-medium">Rooms</p>
                                <p className="text-xs text-gray-500">Room Numbers</p>
                            </div>
                            <div className="text-center p-3">
                                <Package className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                                <p className="text-sm font-medium">Assets</p>
                                <p className="text-xs text-gray-500">Asset Codes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}