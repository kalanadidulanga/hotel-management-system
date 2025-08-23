"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Home,
    LogOut,
    User,
    Phone,
    Calendar,
    Bed,
    RefreshCw,
    CheckCircle,
    Search,
    AlertTriangle,
    X,
} from "lucide-react";
import { toast } from "sonner";

interface CheckoutRoom {
    roomId: number;
    roomNumber: number;
    roomType: string;
    isAvailable: boolean;
    reservation: {
        id: number;
        bookingNumber: string;
        checkInDate: string;
        checkOutDate: string;
        checkInTime: string;
        checkOutTime: string;
        total: number;
        advanceAmount: number;
        balanceAmount: number;
        customer: {
            id: number;
            firstName: string;
            lastName?: string;
            phone: string;
            email: string;
        };
    } | null;
}

export default function CheckOutPage() {
    const [checkoutRooms, setCheckoutRooms] = useState<CheckoutRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<CheckoutRoom | null>(null);

    // Fetch ongoing checkouts with search
    const fetchCheckouts = async (search: string = "") => {
        try {
            setLoading(true);
            const url = search
                ? `/api/room-reservation/check-out?search=${encodeURIComponent(search)}`
                : '/api/room-reservation/check-out';

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setCheckoutRooms(result.data);
                if (search && result.totalFound === 0) {
                    toast.info(`No results found for "${search}"`);
                }
            } else {
                toast.error('Failed to load checkout data');
            }
        } catch (error) {
            console.error('Error fetching checkouts:', error);
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCheckouts(searchQuery);
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery("");
        fetchCheckouts();
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (e.target.value === "") {
            fetchCheckouts();
        }
    };

    // Open confirmation dialog
    const openConfirmDialog = (room: CheckoutRoom) => {
        setSelectedRoom(room);
        setShowConfirmDialog(true);
    };

    // Handle room checkout with confirmation
    const handleCheckout = async () => {
        if (!selectedRoom) return;

        setCheckingOut(selectedRoom.roomNumber);
        try {
            const response = await fetch('/api/room-reservation/check-out', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomNumber: selectedRoom.roomNumber }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(`${result.guestName} checked out from Room ${selectedRoom.roomNumber}`);
                setShowConfirmDialog(false);
                setSelectedRoom(null);
                fetchCheckouts(searchQuery); // Refresh with current search
            } else {
                toast.error(result.message || 'Failed to checkout');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Error during checkout');
        } finally {
            setCheckingOut(null);
        }
    };

    useEffect(() => {
        fetchCheckouts();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <Breadcrumb className="mb-4">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
                                    <Home className="w-4 h-4" /> Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-reservation">
                                    Room Reservation
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-reservation/check-out">
                                    Check Out
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <LogOut className="w-8 h-8 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold">Room Check Out</h1>
                                <p className="text-muted-foreground">
                                    {checkoutRooms.length} rooms currently occupied
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => fetchCheckouts(searchQuery)} disabled={loading} className="gap-2">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Search by room number, guest name, phone, or booking number..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="pl-10"
                                />
                                {searchQuery && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                        onClick={clearSearch}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            <Button type="submit" disabled={loading}>
                                <Search className="w-4 h-4 mr-2" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Checkout List */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading checkout data...</span>
                    </div>
                ) : checkoutRooms.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            {searchQuery ? (
                                <>
                                    <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        No occupied rooms found matching "{searchQuery}"
                                    </p>
                                    <Button onClick={clearSearch} variant="outline">
                                        Clear Search
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">All Rooms Available</h3>
                                    <p className="text-muted-foreground">No guests currently checked in</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {checkoutRooms.map((room) => (
                            <Card key={room.roomId} className="border-2">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Bed className="w-5 h-5 text-primary" />
                                            <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
                                        </div>
                                        <Badge variant="destructive">Occupied</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{room.roomType}</p>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {room.reservation && (
                                        <>
                                            {/* Guest Info */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {room.reservation.customer.firstName}{' '}
                                                        {room.reservation.customer.lastName || ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm">{room.reservation.customer.phone}</span>
                                                </div>
                                            </div>

                                            {/* Booking Info */}
                                            <div className="space-y-2">
                                                <div className="text-sm">
                                                    <span className="font-medium">Booking:</span> {room.reservation.bookingNumber}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <span>
                                                        {new Date(room.reservation.checkInDate).toLocaleDateString()} - {' '}
                                                        {new Date(room.reservation.checkOutDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Payment Info */}
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Total:</span>
                                                        <p className="font-medium">Rs.{room.reservation.total.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Balance:</span>
                                                        <p className={`font-medium ${room.reservation.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'
                                                            }`}>
                                                            Rs.{room.reservation.balanceAmount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Checkout Button */}
                                            <Button
                                                onClick={() => openConfirmDialog(room)}
                                                disabled={checkingOut === room.roomNumber}
                                                className="w-full bg-green-600 hover:bg-green-700"
                                            >
                                                {checkingOut === room.roomNumber ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                        Checking Out...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Check Out
                                                    </>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Confirmation Dialog */}
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                Confirm Checkout
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to check out this guest? This action will make the room available for new bookings.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedRoom && selectedRoom.reservation && (
                            <div className="space-y-4 py-4">
                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Room:</span>
                                        <span>{selectedRoom.roomNumber} ({selectedRoom.roomType})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Guest:</span>
                                        <span>
                                            {selectedRoom.reservation.customer.firstName}{' '}
                                            {selectedRoom.reservation.customer.lastName || ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Booking:</span>
                                        <span>{selectedRoom.reservation.bookingNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Balance Due:</span>
                                        <span className={`font-bold ${selectedRoom.reservation.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                            Rs.{selectedRoom.reservation.balanceAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {selectedRoom.reservation.balanceAmount > 0 && (
                                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        <span className="text-sm text-yellow-800">
                                            Guest has a pending balance of Rs.{selectedRoom.reservation.balanceAmount.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmDialog(false)}
                                disabled={checkingOut !== null}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCheckout}
                                disabled={checkingOut !== null}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {checkingOut ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Confirm Checkout
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}