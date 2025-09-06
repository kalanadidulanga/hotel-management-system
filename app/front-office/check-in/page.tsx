"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    Eye,
    FileText,
    Filter,
    Loader2,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Search,
    User,
    UserCheck,
    Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CheckInReservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfNights: number;
    adults: number;
    children: number;
    totalAmount: number;
    balanceAmount: number;
    reservationStatus: string;
    paymentStatus: string;
    specialRequests?: string;
    customer: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        identityNumber: string;
        address: string;
        nationality: string;
    };
    room: {
        id: number;
        roomNumber: string;
        floor: {
            name: string;
        } | null;
    };
    roomClass: {
        name: string;
        maxOccupancy: number;
    };
}

interface CheckInFilters {
    searchTerm: string;
    paymentStatus: string;
    sortBy: string;
}

export default function TodayCheckInsPage() {
    const [reservations, setReservations] = useState<CheckInReservation[]>([]);
    const [filteredReservations, setFilteredReservations] = useState<CheckInReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState<number | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<CheckInReservation | null>(null);
    const [checkInNotes, setCheckInNotes] = useState("");

    const [filters, setFilters] = useState<CheckInFilters>({
        searchTerm: "",
        paymentStatus: "all",
        sortBy: "checkInDate",
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchTodayCheckIns();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, reservations]);

    const fetchTodayCheckIns = async () => {
        try {
            setLoading(true);
            console.log("Fetching today's check-ins...");

            const response = await fetch(`${apiBaseUrl}/api/front-office/check-ins/today`);
            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                // console.error("Response error:", errorText);
                // throw new Error(`Failed to fetch check-ins: ${response.status}`);
            }

            const data = await response.json();
            console.log("Received data:", data);

            if (data.success) {
                setReservations(data.reservations || []);
                console.log("Set reservations:", data.reservations?.length || 0);
            } else {
                throw new Error(data.error || 'Failed to load check-ins');
            }
        } catch (error) {
            // console.error("Error fetching check-ins:", error);
            toast.error("Failed to load today's check-ins");
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...reservations];

        // Search filter with null safety
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(reservation =>
                (reservation.bookingNumber || '').toLowerCase().includes(term) ||
                (reservation.customer?.firstName || '').toLowerCase().includes(term) ||
                (reservation.customer?.lastName || '').toLowerCase().includes(term) ||
                (reservation.customer?.phone || '').includes(term) ||
                (reservation.customer?.identityNumber || '').toLowerCase().includes(term) ||
                (reservation.room?.roomNumber || '').toLowerCase().includes(term)
            );
        }

        // Payment status filter
        if (filters.paymentStatus !== "all") {
            filtered = filtered.filter(reservation =>
                reservation.paymentStatus === filters.paymentStatus
            );
        }

        // Sorting with null safety
        filtered.sort((a, b) => {
            switch (filters.sortBy) {
                case "customerName":
                    return (a.customer?.firstName || '').localeCompare(b.customer?.firstName || '');
                case "roomNumber":
                    return (a.room?.roomNumber || '').localeCompare(b.room?.roomNumber || '');
                case "totalAmount":
                    return (b.totalAmount || 0) - (a.totalAmount || 0);
                default: // checkInDate
                    return new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime();
            }
        });

        setFilteredReservations(filtered);
    };

    const handleCheckIn = async (reservationId: number) => {
        try {
            setCheckingIn(reservationId);
            console.log("Starting check-in for reservation:", reservationId);
            console.log("API URL:", `${apiBaseUrl}/api/front-office/check-ins/${reservationId}`);

            const requestBody = {
                notes: checkInNotes,
            };
            console.log("Request body:", requestBody);

            const response = await fetch(`${apiBaseUrl}/api/front-office/check-ins/${reservationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log("Check-in response status:", response.status);
            console.log("Check-in response ok:", response.ok);

            // Get response text first to handle both JSON and non-JSON responses
            const responseText = await response.text();
            console.log("Raw response:", responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                // console.error("Failed to parse JSON response:", parseError);
                // console.error("Response text:", responseText);
                // throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 200)}`);
            }

            console.log("Parsed response data:", data);

            if (!response.ok) {
                // console.error("HTTP error:", response.status, response.statusText);
                // console.error("Error data:", data);
                // throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            if (data.success) {
                console.log("Check-in successful:", data.message);
                toast.success("Guest checked in successfully!");
                setSelectedReservation(null);
                setCheckInNotes("");
                await fetchTodayCheckIns(); // Refresh the list
            } else {
                console.error("Check-in failed:", data.error);
                toast.error(data.error || "Failed to check in guest");
                // throw new Error(data.error || 'Failed to check in guest');
            }
        } catch (error) {
            console.error("Error in handleCheckIn:", error);
            toast.error("An unexpected error occurred during check-in.");

            // More detailed error message
            let errorMessage = "Failed to check in guest";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            // console.error("Final error message:", errorMessage);
            toast.error(errorMessage);
        } finally {
            setCheckingIn(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const getPaymentStatusVariant = (status: string) => {
        if (!status) return 'outline';
        switch (status.toUpperCase()) {
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

    const getReservationStatusVariant = (status: string) => {
        if (!status) return 'outline';
        switch (status.toUpperCase()) {
            case 'CONFIRMED':
                return 'default';
            case 'CHECKED_IN':
                return 'secondary';
            case 'CANCELLED':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    // Safe filtering with null checks
    const pendingCheckIns = filteredReservations.filter(r => r?.reservationStatus === 'CONFIRMED');
    const checkedInToday = filteredReservations.filter(r => r?.reservationStatus === 'CHECKED_IN');
    const pendingPayments = filteredReservations.filter(r => r?.paymentStatus !== 'PAID');

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <UserCheck className="w-8 h-8 text-green-600 mr-3" />
                        Today's Check-ins
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage guest arrivals for {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={fetchTodayCheckIns} disabled={loading}>
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                    <Button asChild>
                        <Link href="/reservations/new">
                            <UserCheck className="w-4 h-4 mr-2" />
                            Walk-in Guest
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Debug Info - Remove this in production */}
            {/* <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                    <div className="text-sm text-yellow-800">
                        <strong>Debug Info:</strong><br />
                        API Base URL: {apiBaseUrl || "Not set"}<br />
                        Total Reservations: {reservations.length}<br />
                        Filtered Reservations: {filteredReservations.length}<br />
                        Pending Check-ins: {pendingCheckIns.length}<br />
                        Loading: {loading ? "Yes" : "No"}
                    </div>
                </CardContent>
            </Card> */}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Clock className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{pendingCheckIns.length}</p>
                                <p className="text-sm text-gray-600">Pending Check-ins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-green-600">{checkedInToday.length}</p>
                                <p className="text-sm text-gray-600">Checked In Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
                                <p className="text-sm text-gray-600">Pending Payments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card> */}

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Users className="w-8 h-8 text-purple-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-purple-600">{filteredReservations.length}</p>
                                <p className="text-sm text-gray-600">Total Arrivals</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Filters & Search
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, booking, phone, NIC, room..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Status</Label>
                            <Select
                                value={filters.paymentStatus}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All payments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Payments</SelectItem>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                    <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Sort By</Label>
                            <Select
                                value={filters.sortBy}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="checkInDate">Check-in Time</SelectItem>
                                    <SelectItem value="customerName">Customer Name</SelectItem>
                                    <SelectItem value="roomNumber">Room Number</SelectItem>
                                    <SelectItem value="totalAmount">Total Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="invisible">Actions</Label>
                            <Button
                                variant="outline"
                                onClick={() => setFilters({
                                    searchTerm: "",
                                    paymentStatus: "all",
                                    sortBy: "checkInDate",
                                })}
                                className="w-full"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Check-ins List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Check-in List ({filteredReservations.length})</span>
                        <Badge variant="outline">
                            {pendingCheckIns.length} Pending
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" />
                            <span>Loading check-ins...</span>
                        </div>
                    ) : filteredReservations.length === 0 ? (
                        <div className="text-center py-8">
                            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No check-ins found</h3>
                            <p className="text-gray-500">
                                {reservations.length === 0
                                    ? "No reservations found for today"
                                    : "No reservations match your current filters"
                                }
                            </p>
                            {reservations.length === 0 && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={fetchTodayCheckIns}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Try Again
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredReservations.map((reservation) => (
                                <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {/* Guest Information */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                        <h3 className="font-semibold text-lg">
                                                            {reservation.customer?.firstName || 'Unknown'} {reservation.customer?.lastName || ''}
                                                        </h3>
                                                    </div>
                                                    <div className="space-y-1 text-sm text-gray-600">
                                                        <div className="flex items-center">
                                                            <Phone className="w-3 h-3 mr-2" />
                                                            {reservation.customer?.phone || 'N/A'}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Mail className="w-3 h-3 mr-2" />
                                                            {reservation.customer?.email || 'N/A'}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <FileText className="w-3 h-3 mr-2" />
                                                            NIC: {reservation.customer?.identityNumber || 'N/A'}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <MapPin className="w-3 h-3 mr-2" />
                                                            {reservation.customer?.nationality === 'native' ? 'Sri Lankan' : 'Foreign'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Booking Information */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="w-4 h-4 text-gray-500" />
                                                        <h4 className="font-medium">Booking Details</h4>
                                                    </div>
                                                    <div className="space-y-1 text-sm text-gray-600">
                                                        <p><strong>Booking:</strong> {reservation.bookingNumber || 'N/A'}</p>
                                                        <p><strong>Room:</strong> {reservation.room?.roomNumber || 'N/A'} ({reservation.roomClass?.name || 'N/A'})</p>
                                                        <p><strong>Floor:</strong> {reservation.room?.floor?.name || 'Ground Floor'}</p>
                                                        <p><strong>Guests:</strong> {reservation.adults || 0} Adults, {reservation.children || 0} Children</p>
                                                        <p><strong>Nights:</strong> {reservation.numberOfNights || 0}</p>
                                                        <p><strong>Check-out:</strong> {format(new Date(reservation.checkOutDate), "MMM d, yyyy")}</p>
                                                    </div>
                                                </div>

                                                {/* Payment & Status */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <CreditCard className="w-4 h-4 text-gray-500" />
                                                        <h4 className="font-medium">Payment & Status</h4>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Badge variant={getReservationStatusVariant(reservation.reservationStatus)}>
                                                                {reservation.reservationStatus || 'Unknown'}
                                                            </Badge>
                                                            <Badge variant={getPaymentStatusVariant(reservation.paymentStatus)}>
                                                                {reservation.paymentStatus || 'Unknown'}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <p><strong>Total:</strong> {formatCurrency(reservation.totalAmount)}</p>
                                                            {(reservation.balanceAmount || 0) > 0 && (
                                                                <p className="text-red-600">
                                                                    <strong>Balance:</strong> {formatCurrency(reservation.balanceAmount)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {reservation.specialRequests && (
                                                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                                                <strong>Special Requests:</strong> {reservation.specialRequests}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col space-y-2 ml-6">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/reservations/${reservation.id}`}>
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View
                                                    </Link>
                                                </Button>

                                                {reservation.reservationStatus === 'CONFIRMED' && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedReservation(reservation);
                                                                    setCheckInNotes("");
                                                                }}
                                                            >
                                                                <UserCheck className="w-4 h-4 mr-1" />
                                                                Check In
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle>Check In Guest</DialogTitle>
                                                                <DialogDescription>
                                                                    Confirm check-in for {reservation.customer?.firstName || 'Unknown'} {reservation.customer?.lastName || ''}
                                                                </DialogDescription>
                                                            </DialogHeader>

                                                            <div className="space-y-4">
                                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                                        <span className="text-gray-600">Room:</span>
                                                                        <span className="font-medium">{reservation.room?.roomNumber || 'N/A'}</span>
                                                                        <span className="text-gray-600">Nights:</span>
                                                                        <span className="font-medium">{reservation.numberOfNights || 0}</span>
                                                                        <span className="text-gray-600">Guests:</span>
                                                                        <span className="font-medium">{(reservation.adults || 0) + (reservation.children || 0)}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label htmlFor="checkin-notes">Check-in Notes (Optional)</Label>
                                                                    <Textarea
                                                                        id="checkin-notes"
                                                                        placeholder="Any notes about the check-in process..."
                                                                        value={checkInNotes}
                                                                        onChange={(e) => setCheckInNotes(e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <DialogFooter>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setSelectedReservation(null)}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleCheckIn(reservation.id)}
                                                                    disabled={checkingIn === reservation.id}
                                                                >
                                                                    {checkingIn === reservation.id ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                            Checking In...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <UserCheck className="w-4 h-4 mr-2" />
                                                                            Confirm Check In
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}

                                                {reservation.reservationStatus === 'CHECKED_IN' && (
                                                    <Badge variant="secondary" className="justify-center">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Checked In
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}