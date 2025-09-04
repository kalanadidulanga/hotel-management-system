"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    UserX,
    Calendar,
    Users,
    Phone,
    Mail,
    CreditCard,
    Clock,
    AlertTriangle,
    CheckCircle,
    Eye,
    Search,
    Filter,
    RefreshCw,
    Loader2,
    User,
    MapPin,
    FileText,
    DollarSign,
    Receipt,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface CheckOutReservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    actualCheckIn: string | null;
    actualCheckOut: string | null;
    numberOfNights: number;
    adults: number;
    children: number;
    totalAmount: number;
    balanceAmount: number;
    paidAmount: number;
    reservationStatus: string;
    paymentStatus: string;
    specialRequests?: string;
    remarks?: string;
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
        status: string;
        floor: {
            name: string;
        } | null;
    };
    roomClass: {
        name: string;
        maxOccupancy: number;
    };
}

interface CheckOutFilters {
    searchTerm: string;
    paymentStatus: string;
    sortBy: string;
}

interface CheckOutData {
    extraCharges: number;
    minibarCharges: number;
    damageCharges: number;
    lateCheckoutFee: number;
    notes: string;
}

export default function TodayCheckOutsPage() {
    const [reservations, setReservations] = useState<CheckOutReservation[]>([]);
    const [filteredReservations, setFilteredReservations] = useState<CheckOutReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState<number | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<CheckOutReservation | null>(null);
    const [checkOutData, setCheckOutData] = useState<CheckOutData>({
        extraCharges: 0,
        minibarCharges: 0,
        damageCharges: 0,
        lateCheckoutFee: 0,
        notes: "",
    });

    const [filters, setFilters] = useState<CheckOutFilters>({
        searchTerm: "",
        paymentStatus: "all",
        sortBy: "checkOutDate",
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchTodayCheckOuts();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, reservations]);

    const fetchTodayCheckOuts = async () => {
        try {
            setLoading(true);
            console.log("Fetching today's check-outs...");

            const response = await fetch(`${apiBaseUrl}/api/front-office/check-outs/today`);
            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error:", errorText);
                throw new Error(`Failed to fetch check-outs: ${response.status}`);
            }

            const data = await response.json();
            console.log("Received data:", data);

            if (data.success) {
                setReservations(data.reservations || []);
                console.log("Set reservations:", data.reservations?.length || 0);
            } else {
                throw new Error(data.error || 'Failed to load check-outs');
            }
        } catch (error) {
            console.error("Error fetching check-outs:", error);
            toast.error("Failed to load today's check-outs");
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
                default: // checkOutDate
                    return new Date(a.checkOutDate).getTime() - new Date(b.checkOutDate).getTime();
            }
        });

        setFilteredReservations(filtered);
    };

    const handleCheckOut = async (reservationId: number) => {
        try {
            setCheckingOut(reservationId);
            console.log("Starting check-out for reservation:", reservationId);
            console.log("API URL:", `${apiBaseUrl}/api/front-office/check-outs/${reservationId}`);

            const requestBody = checkOutData;
            console.log("Request body:", requestBody);

            const response = await fetch(`${apiBaseUrl}/api/front-office/check-outs/${reservationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log("Check-out response status:", response.status);
            console.log("Check-out response ok:", response.ok);

            // Get response text first to handle both JSON and non-JSON responses
            const responseText = await response.text();
            console.log("Raw response:", responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Failed to parse JSON response:", parseError);
                console.error("Response text:", responseText);
                throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 200)}`);
            }

            console.log("Parsed response data:", data);

            if (!response.ok) {
                console.error("HTTP error:", response.status, response.statusText);
                console.error("Error data:", data);
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            if (data.success) {
                console.log("Check-out successful:", data.message);
                toast.success("Guest checked out successfully!");
                setSelectedReservation(null);
                setCheckOutData({
                    extraCharges: 0,
                    minibarCharges: 0,
                    damageCharges: 0,
                    lateCheckoutFee: 0,
                    notes: "",
                });
                await fetchTodayCheckOuts(); // Refresh the list
            } else {
                console.error("Check-out failed:", data.error);
                throw new Error(data.error || 'Failed to check out guest');
            }
        } catch (error) {
            console.error("Error in handleCheckOut:", error);

            // More detailed error message
            let errorMessage = "Failed to check out guest";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            console.error("Final error message:", errorMessage);
            toast.error(errorMessage);
        } finally {
            setCheckingOut(null);
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
            case 'CHECKED_IN':
                return 'default';
            case 'CHECKED_OUT':
                return 'secondary';
            case 'CONFIRMED':
                return 'outline';
            case 'CANCELLED':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const calculateTotalCharges = () => {
        return (
            (checkOutData.extraCharges || 0) +
            (checkOutData.minibarCharges || 0) +
            (checkOutData.damageCharges || 0) +
            (checkOutData.lateCheckoutFee || 0)
        );
    };

    const calculateFinalAmount = () => {
        if (!selectedReservation) return 0;
        return (selectedReservation.balanceAmount || 0) + calculateTotalCharges();
    };

    const isOverdue = (reservation: CheckOutReservation) => {
        if (!reservation.checkOutDate || reservation.reservationStatus !== 'CHECKED_IN') return false;
        const checkoutDate = new Date(reservation.checkOutDate);
        const now = new Date();
        checkoutDate.setHours(12, 0, 0, 0); // Assuming 12 PM checkout time
        return now > checkoutDate;
    };

    // Safe filtering with null checks
    const pendingCheckOuts = filteredReservations.filter(r => r?.reservationStatus === 'CHECKED_IN');
    const checkedOutToday = filteredReservations.filter(r => r?.reservationStatus === 'CHECKED_OUT');
    const overdueCheckouts = filteredReservations.filter(r => isOverdue(r));
    const pendingPayments = filteredReservations.filter(r => (r?.balanceAmount || 0) > 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <UserX className="w-8 h-8 text-red-600 mr-3" />
                        Today's Check-outs
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage guest departures for {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={fetchTodayCheckOuts} disabled={loading}>
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Debug Info - Uncomment for debugging */}
            {/* <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                    <div className="text-sm text-yellow-800">
                        <strong>Debug Info:</strong><br />
                        API Base URL: {apiBaseUrl || "Not set"}<br />
                        Total Reservations: {reservations.length}<br />
                        Filtered Reservations: {filteredReservations.length}<br />
                        Pending Check-outs: {pendingCheckOuts.length}<br />
                        Loading: {loading ? "Yes" : "No"}
                        <br />
                        Sample statuses: {reservations.slice(0, 3).map(r => r.reservationStatus).join(', ')}
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
                                <p className="text-2xl font-bold text-blue-600">{pendingCheckOuts.length}</p>
                                <p className="text-sm text-gray-600">Pending Check-outs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-green-600">{checkedOutToday.length}</p>
                                <p className="text-sm text-gray-600">Checked Out Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-red-600">{overdueCheckouts.length}</p>
                                <p className="text-sm text-gray-600">Overdue Check-outs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <DollarSign className="w-8 h-8 text-purple-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-purple-600">{pendingPayments.length}</p>
                                <p className="text-sm text-gray-600">Pending Payments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card> */}
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
                                    <SelectItem value="checkOutDate">Check-out Time</SelectItem>
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
                                    sortBy: "checkOutDate",
                                })}
                                className="w-full"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Check-outs List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Check-out List ({filteredReservations.length})</span>
                        <Badge variant="outline">
                            {pendingCheckOuts.length} Pending
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" />
                            <span>Loading check-outs...</span>
                        </div>
                    ) : filteredReservations.length === 0 ? (
                        <div className="text-center py-8">
                            <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No check-outs found</h3>
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
                                    onClick={fetchTodayCheckOuts}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Try Again
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredReservations.map((reservation) => (
                                <Card key={reservation.id} className={`hover:shadow-md transition-shadow ${isOverdue(reservation) ? 'border-red-200 bg-red-50' : ''}`}>
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
                                                        {isOverdue(reservation) && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                OVERDUE
                                                            </Badge>
                                                        )}
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
                                                        <p><strong>Check-in:</strong> {
                                                            reservation.actualCheckIn
                                                                ? format(new Date(reservation.actualCheckIn), "MMM d, yyyy HH:mm")
                                                                : 'Not checked in'
                                                        }</p>
                                                        <p><strong>Check-out Due:</strong> {format(new Date(reservation.checkOutDate), "MMM d, yyyy")}</p>
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
                                                            <p><strong>Paid:</strong> {formatCurrency(reservation.paidAmount || 0)}</p>
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

                                                {reservation.reservationStatus === 'CHECKED_IN' && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    setSelectedReservation(reservation);
                                                                    setCheckOutData({
                                                                        extraCharges: 0,
                                                                        minibarCharges: 0,
                                                                        damageCharges: 0,
                                                                        lateCheckoutFee: 0,
                                                                        notes: "",
                                                                    });
                                                                }}
                                                            >
                                                                <UserX className="w-4 h-4 mr-1" />
                                                                Check Out
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-lg">
                                                            <DialogHeader>
                                                                <DialogTitle>Check Out Guest</DialogTitle>
                                                                <DialogDescription>
                                                                    Process check-out for {reservation.customer?.firstName || 'Unknown'} {reservation.customer?.lastName || ''}
                                                                </DialogDescription>
                                                            </DialogHeader>

                                                            <div className="space-y-4">
                                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                                        <span className="text-gray-600">Room:</span>
                                                                        <span className="font-medium">{reservation.room?.roomNumber || 'N/A'}</span>
                                                                        <span className="text-gray-600">Current Balance:</span>
                                                                        <span className="font-medium">{formatCurrency(reservation.balanceAmount)}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Additional Charges */}
                                                                <div className="space-y-3">
                                                                    <h4 className="font-medium">Additional Charges</h4>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div>
                                                                            <Label htmlFor="extra-charges">Extra Services</Label>
                                                                            <Input
                                                                                id="extra-charges"
                                                                                type="number"
                                                                                placeholder="0"
                                                                                value={checkOutData.extraCharges || ''}
                                                                                onChange={(e) => setCheckOutData(prev => ({
                                                                                    ...prev,
                                                                                    extraCharges: parseFloat(e.target.value) || 0
                                                                                }))}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor="minibar-charges">Minibar</Label>
                                                                            <Input
                                                                                id="minibar-charges"
                                                                                type="number"
                                                                                placeholder="0"
                                                                                value={checkOutData.minibarCharges || ''}
                                                                                onChange={(e) => setCheckOutData(prev => ({
                                                                                    ...prev,
                                                                                    minibarCharges: parseFloat(e.target.value) || 0
                                                                                }))}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor="damage-charges">Damage</Label>
                                                                            <Input
                                                                                id="damage-charges"
                                                                                type="number"
                                                                                placeholder="0"
                                                                                value={checkOutData.damageCharges || ''}
                                                                                onChange={(e) => setCheckOutData(prev => ({
                                                                                    ...prev,
                                                                                    damageCharges: parseFloat(e.target.value) || 0
                                                                                }))}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor="late-checkout">Late Checkout</Label>
                                                                            <Input
                                                                                id="late-checkout"
                                                                                type="number"
                                                                                placeholder="0"
                                                                                value={checkOutData.lateCheckoutFee || ''}
                                                                                onChange={(e) => setCheckOutData(prev => ({
                                                                                    ...prev,
                                                                                    lateCheckoutFee: parseFloat(e.target.value) || 0
                                                                                }))}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Final Amount */}
                                                                <div className="bg-blue-50 p-4 rounded-lg">
                                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                                        <span>Additional Charges:</span>
                                                                        <span className="font-medium">{formatCurrency(calculateTotalCharges())}</span>
                                                                        <span className="font-semibold">Final Amount Due:</span>
                                                                        <span className="font-semibold text-blue-600">{formatCurrency(calculateFinalAmount())}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label htmlFor="checkout-notes">Check-out Notes (Optional)</Label>
                                                                    <Textarea
                                                                        id="checkout-notes"
                                                                        placeholder="Any notes about the check-out process..."
                                                                        value={checkOutData.notes}
                                                                        onChange={(e) => setCheckOutData(prev => ({
                                                                            ...prev,
                                                                            notes: e.target.value
                                                                        }))}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <DialogFooter>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedReservation(null);
                                                                        setCheckOutData({
                                                                            extraCharges: 0,
                                                                            minibarCharges: 0,
                                                                            damageCharges: 0,
                                                                            lateCheckoutFee: 0,
                                                                            notes: "",
                                                                        });
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleCheckOut(reservation.id)}
                                                                    disabled={checkingOut === reservation.id}
                                                                    variant="destructive"
                                                                >
                                                                    {checkingOut === reservation.id ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                            Processing...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <UserX className="w-4 h-4 mr-2" />
                                                                            Process Check Out
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}

                                                {reservation.reservationStatus === 'CHECKED_OUT' && (
                                                    <Badge variant="outline" className="justify-center">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Checked Out
                                                    </Badge>
                                                )}

                                                {reservation.reservationStatus === 'CONFIRMED' && (
                                                    <Badge variant="outline" className="justify-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Not Checked In
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