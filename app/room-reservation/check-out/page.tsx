"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
    Home,
    Search,
    LogOut,
    User,
    Calendar,
    Clock,
    DollarSign,
    MapPin,
    Phone,
    Mail,
    CreditCard,
    Receipt,
    CheckCircle,
    AlertCircle
} from "lucide-react";

interface CheckoutRoom {
    id: number;
    roomNumber: string;
    guestName: string;
    checkInDate: Date;
    checkOutDate: Date;
    roomType: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    services: string[];
    guestPhone: string;
    guestEmail: string;
    status: 'occupied' | 'cleaning' | 'ready';
}

const mockCheckoutRooms: CheckoutRoom[] = [
    {
        id: 115,
        roomNumber: "115",
        guestName: "Wemba",
        checkInDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        checkOutDate: new Date(),
        roomType: "VIP",
        totalAmount: 450.00,
        paidAmount: 300.00,
        remainingAmount: 150.00,
        services: ["Room Service", "Laundry", "Minibar"],
        guestPhone: "+1-555-0123",
        guestEmail: "wemba@email.com",
        status: 'occupied'
    },
    {
        id: 210,
        roomNumber: "210",
        guestName: "Kisembo",
        checkInDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        checkOutDate: new Date(),
        roomType: "Suite",
        totalAmount: 680.00,
        paidAmount: 680.00,
        remainingAmount: 0.00,
        services: ["Spa", "Room Service", "Parking"],
        guestPhone: "+1-555-0456",
        guestEmail: "kisembo@email.com",
        status: 'occupied'
    },
    {
        id: 106,
        roomNumber: "106",
        guestName: "Wemba Jr",
        checkInDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        checkOutDate: new Date(),
        roomType: "Standard",
        totalAmount: 220.00,
        paidAmount: 220.00,
        remainingAmount: 0.00,
        services: ["Breakfast"],
        guestPhone: "+1-555-0789",
        guestEmail: "wemba.jr@email.com",
        status: 'occupied'
    },
    {
        id: 187,
        roomNumber: "187",
        guestName: "Mehedi Hassan",
        checkInDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        checkOutDate: new Date(),
        roomType: "Deluxe",
        totalAmount: 540.00,
        paidAmount: 400.00,
        remainingAmount: 140.00,
        services: ["Room Service", "Gym", "WiFi Premium"],
        guestPhone: "+1-555-0321",
        guestEmail: "mehedi@email.com",
        status: 'occupied'
    },
    {
        id: 135,
        roomNumber: "135",
        guestName: "Mr Myson",
        checkInDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        checkOutDate: new Date(),
        roomType: "VIP",
        totalAmount: 750.00,
        paidAmount: 600.00,
        remainingAmount: 150.00,
        services: ["Concierge", "Room Service", "Valet Parking", "Spa"],
        guestPhone: "+1-555-0654",
        guestEmail: "myson@email.com",
        status: 'occupied'
    },
    {
        id: 113,
        roomNumber: "113",
        guestName: "Kisembo Family",
        checkInDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        checkOutDate: new Date(),
        roomType: "Family Suite",
        totalAmount: 890.00,
        paidAmount: 890.00,
        remainingAmount: 0.00,
        services: ["Kids Club", "Family Breakfast", "Pool Access"],
        guestPhone: "+1-555-0987",
        guestEmail: "kisembo.family@email.com",
        status: 'occupied'
    },
    {
        id: 114,
        roomNumber: "114",
        guestName: "Lana Mandela",
        checkInDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        checkOutDate: new Date(),
        roomType: "Standard",
        totalAmount: 320.00,
        paidAmount: 200.00,
        remainingAmount: 120.00,
        services: ["Room Service", "Laundry"],
        guestPhone: "+1-555-0147",
        guestEmail: "lana@email.com",
        status: 'occupied'
    }
];

export default function CheckoutPage() {
    const [checkoutRooms, setCheckoutRooms] = useState<CheckoutRoom[]>(mockCheckoutRooms);
    const [filteredRooms, setFilteredRooms] = useState<CheckoutRoom[]>(mockCheckoutRooms);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [selectedRoom, setSelectedRoom] = useState<CheckoutRoom | null>(null);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [checkoutNotes, setCheckoutNotes] = useState<string>("");

    // Filter rooms based on search query
    useEffect(() => {
        const filtered = checkoutRooms.filter(room =>
            room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.guestName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredRooms(filtered);
    }, [searchQuery, checkoutRooms]);

    const handleRoomSelection = (roomId: number) => {
        setSelectedRooms(prev =>
            prev.includes(roomId)
                ? prev.filter(id => id !== roomId)
                : [...prev, roomId]
        );
    };

    const handleSelectAll = () => {
        if (selectedRooms.length === filteredRooms.length) {
            setSelectedRooms([]);
        } else {
            setSelectedRooms(filteredRooms.map(room => room.id));
        }
    };

    const handleGoAction = () => {
        if (selectedRooms.length > 0) {
            console.log("Processing checkout for rooms:", selectedRooms);
            // You can add navigation or other actions here
        }
    };

    const handleIndividualCheckout = (room: CheckoutRoom) => {
        setSelectedRoom(room);
        setPaymentAmount(room.remainingAmount.toString());
        setIsCheckoutModalOpen(true);
    };

    const handleCheckoutComplete = () => {
        if (selectedRoom) {
            // Update room status and remove from checkout list
            setCheckoutRooms(prev => prev.filter(room => room.id !== selectedRoom.id));
            setSelectedRooms(prev => prev.filter(id => id !== selectedRoom.id));
            setIsCheckoutModalOpen(false);
            setSelectedRoom(null);
            setPaymentAmount("");
            setCheckoutNotes("");
        }
    };

    const getTotalSelected = () => {
        return selectedRooms.reduce((total, roomId) => {
            const room = checkoutRooms.find(r => r.id === roomId);
            return total + (room?.totalAmount || 0);
        }, 0);
    };

    const getTotalRemaining = () => {
        return selectedRooms.reduce((total, roomId) => {
            const room = checkoutRooms.find(r => r.id === roomId);
            return total + (room?.remainingAmount || 0);
        }, 0);
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header Section */}
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
                <div className="px-4 py-4 space-y-4">
                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <Home className="w-4 h-4" /> Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/check-out" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Check Out
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/check-out" className="text-sm font-medium">
                                    Guest Checkout
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Page Title */}
                    <div className="flex items-center gap-3">
                        <LogOut className="w-6 h-6 text-primary" />
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Guest Checkout</h1>
                            <p className="text-sm text-muted-foreground">Process guest departures and final billing</p>
                        </div>
                    </div>

                    {/* Room Selection Controls */}
                    <Card className="border border-border/50 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                {/* Room Selection Dropdown */}
                                <div className="flex-1 space-y-2">
                                    <Label className="text-sm font-medium">Room No.:</Label>
                                    <div className="relative">
                                        <div
                                            className="border border-border/50 rounded-lg bg-white shadow-sm cursor-pointer"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            <div className="flex items-center gap-2 p-3">
                                                <Search className="w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search rooms or guests..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onFocus={() => setIsDropdownOpen(true)}
                                                    className="border-none shadow-none focus-visible:ring-0 p-0"
                                                />
                                            </div>
                                        </div>

                                        {/* Dropdown List */}
                                        {isDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border/50 rounded-lg shadow-lg z-20">
                                                <div className="p-3 border-b border-border/50">
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={selectedRooms.length === filteredRooms.length && filteredRooms.length > 0}
                                                            onCheckedChange={handleSelectAll}
                                                        />
                                                        <span className="text-sm font-medium">Select All ({filteredRooms.length})</span>
                                                    </div>
                                                </div>
                                                <ScrollArea className="max-h-64">
                                                    {filteredRooms.map((room) => (
                                                        <div
                                                            key={room.id}
                                                            className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                                                            onClick={() => handleRoomSelection(room.id)}
                                                        >
                                                            <Checkbox
                                                                checked={selectedRooms.includes(room.id)}
                                                                onCheckedChange={() => handleRoomSelection(room.id)}
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">{room.roomNumber}</span>
                                                                    <span className="text-muted-foreground">-</span>
                                                                    <span className="text-foreground">{room.guestName}</span>
                                                                    {room.remainingAmount > 0 && (
                                                                        <Badge variant="destructive" className="text-xs">
                                                                            ${room.remainingAmount} due
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">{room.roomType}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </ScrollArea>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Button
                                    onClick={handleGoAction}
                                    disabled={selectedRooms.length === 0}
                                    className="h-10 px-8 rounded-full shadow-md"
                                >
                                    Go ({selectedRooms.length})
                                </Button>
                            </div>

                            {/* Selected Rooms Summary */}
                            {selectedRooms.length > 0 && (
                                <div className="mt-4 p-3 bg-accent/20 rounded-lg border border-border/50">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {selectedRooms.map(roomId => {
                                            const room = checkoutRooms.find(r => r.id === roomId);
                                            return room ? (
                                                <Badge key={roomId} variant="secondary" className="bg-accent text-accent-foreground">
                                                    {room.roomNumber} - {room.guestName}
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Total Amount: <strong>${getTotalSelected().toFixed(2)}</strong></span>
                                        <span>Remaining Due: <strong className="text-destructive">${getTotalRemaining().toFixed(2)}</strong></span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Checkout Rooms Grid */}
            <div className="flex-1 overflow-auto">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRooms.map((room) => (
                            <Card key={room.id} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-semibold">Room {room.roomNumber}</CardTitle>
                                        <Badge variant={room.remainingAmount > 0 ? "destructive" : "default"}>
                                            {room.remainingAmount > 0 ? "Payment Due" : "Paid"}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground font-medium">{room.roomType}</p>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Guest Information */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{room.guestName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="w-4 h-4" />
                                            <span>{room.guestPhone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="w-4 h-4" />
                                            <span>{room.guestEmail}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Stay Information */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                Check-in:
                                            </span>
                                            <span>{room.checkInDate.toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                Check-out:
                                            </span>
                                            <span>{room.checkOutDate.toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Billing Information */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Total Amount:</span>
                                            <span className="font-semibold">${room.totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Paid Amount:</span>
                                            <span className="text-green-600">${room.paidAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm font-semibold">
                                            <span>Remaining:</span>
                                            <span className={room.remainingAmount > 0 ? "text-destructive" : "text-green-600"}>
                                                ${room.remainingAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Services */}
                                    {room.services.length > 0 && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="text-sm font-medium mb-2">Services Used:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {room.services.map((service, index) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {service}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Checkout Button */}
                                    <Button
                                        onClick={() => handleIndividualCheckout(room)}
                                        variant="destructive"
                                        className="w-full mt-4 rounded-full shadow-sm"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Process Checkout
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* No Results */}
                    {filteredRooms.length === 0 && (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No pending checkouts</h3>
                            <p className="text-muted-foreground">All guests have been checked out or no rooms match your search</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Checkout Modal */}
            <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Checkout - Room {selectedRoom?.roomNumber}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedRoom && (
                        <div className="space-y-6">
                            {/* Guest Summary */}
                            <Card className="border border-border/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">{selectedRoom.guestName}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Room Type:</span>
                                            <p className="font-medium">{selectedRoom.roomType}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Stay Duration:</span>
                                            <p className="font-medium">
                                                {Math.ceil((selectedRoom.checkOutDate.getTime() - selectedRoom.checkInDate.getTime()) / (1000 * 60 * 60 * 24))} nights
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Final Bill */}
                            <Card className="border border-border/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <DollarSign className="w-5 h-5" />
                                        Final Bill
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Total Amount:</span>
                                            <span className="font-semibold">${selectedRoom.totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-green-600">
                                            <span>Amount Paid:</span>
                                            <span>${selectedRoom.paidAmount.toFixed(2)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Amount Due:</span>
                                            <span className={selectedRoom.remainingAmount > 0 ? "text-destructive" : "text-green-600"}>
                                                ${selectedRoom.remainingAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedRoom.remainingAmount > 0 && (
                                        <div className="space-y-2">
                                            <Label>Payment Amount</Label>
                                            <Input
                                                type="number"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                placeholder="Enter payment amount"
                                                className="border border-border/50"
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Checkout Notes */}
                            <div className="space-y-2">
                                <Label>Checkout Notes (Optional)</Label>
                                <Textarea
                                    value={checkoutNotes}
                                    onChange={(e) => setCheckoutNotes(e.target.value)}
                                    placeholder="Add any checkout notes or special instructions..."
                                    rows={3}
                                    className="border border-border/50"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCheckoutModalOpen(false)}
                                    className="rounded-full"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCheckoutComplete}
                                    className="rounded-full shadow-md"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Complete Checkout
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}