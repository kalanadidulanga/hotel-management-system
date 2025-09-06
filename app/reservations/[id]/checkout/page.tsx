"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Calculator,
    CheckCircle,
    Clock,
    Gift,
    Loader2,
    LogOut,
    Mail,
    Phone,
    Printer,
    Receipt,
    RefreshCw,
    ShoppingCart,
    Star,
    User
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Customer {
    id: number;
    customerID: string;
    firstName: string;
    lastName: string | null;
    phone: string;
    email: string;
    isVip: boolean;
    vipLevel: string | null;
    nationality: string;
    identityType: string | null;
    identityNumber: string;
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
    maxOccupancy: number;
}

interface QuickOrder {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    orderStatus: string;
    createdAt: string;
    deliveredAt: string | null;
    deliveredByStaff: {
        id: number;
        name: string;
    } | null;
}

interface ComplementaryItem {
    id: number;
    name: string;
    description: string | null;
    rate: number;
    isOptional: boolean;
}

interface CheckoutReservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    actualCheckIn: string | null;
    numberOfNights: number;
    adults: number;
    children: number;
    infants: number;
    baseRoomRate: number;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    reservationStatus: string;
    billingType: string;
    specialRequests: string | null;
    remarks: string | null;
    customer: Customer;
    room: Room;
    roomClass: RoomClass;
    quickOrders: QuickOrder[];
    complementaryItems: ComplementaryItem[];
    
    // Checkout calculations
    quickOrdersTotal: number;
    complementaryTotal: number;
    lateCheckoutFee: number;
    actualStayDays: number;
    updatedTotalAmount: number;
    finalBalanceAmount: number;
}

interface CheckoutFormData {
    additionalCharges: number;
    lateCheckoutFee: number;
    finalPaymentMethod: string;
    paymentAmount: number;
    paymentRemarks: string;
    damageFee: number;
    damageDescription: string;
    staffNotes: string;
}

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [reservation, setReservation] = useState<CheckoutReservation | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const reservationId = params.id as string;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    const [checkoutData, setCheckoutData] = useState<CheckoutFormData>({
        additionalCharges: 0,
        lateCheckoutFee: 0,
        finalPaymentMethod: "CASH",
        paymentAmount: 0,
        paymentRemarks: "",
        damageFee: 0,
        damageDescription: "",
        staffNotes: "",
    });

    useEffect(() => {
        if (reservationId) {
            fetchCheckoutData();
        }
    }, [reservationId]);

    const fetchCheckoutData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/reservations/${reservationId}/checkout`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    toast.error("Reservation not found");
                    router.push("/reservations");
                    return;
                }
                if (response.status === 400) {
                    const data = await response.json();
                    toast.error(data.error);
                    router.push(`/reservations/${reservationId}`);
                    return;
                }
                throw new Error("Failed to fetch checkout data");
            }

            const data = await response.json();
            setReservation(data.reservation);
            
            // Auto-calculate late checkout fee
            setCheckoutData(prev => ({
                ...prev,
                lateCheckoutFee: data.reservation.lateCheckoutFee || 0,
            }));

        } catch (error) {
            // console.error("Error fetching checkout data:", error);
            toast.error("Failed to load checkout data");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof CheckoutFormData, value: any) => {
        setCheckoutData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const calculateFinalTotal = () => {
        if (!reservation) return 0;
        return reservation.updatedTotalAmount + 
               checkoutData.additionalCharges + 
               checkoutData.lateCheckoutFee + 
               checkoutData.damageFee;
    };

    const calculateFinalBalance = () => {
        if (!reservation) return 0;
        const finalTotal = calculateFinalTotal();
        return Math.max(0, finalTotal - reservation.advanceAmount - checkoutData.paymentAmount);
    };

    const handleCheckout = async () => {
        if (!reservation) return;

        try {
            setProcessing(true);
            
            const response = await fetch(`${apiBaseUrl}/api/reservations/${reservationId}/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(checkoutData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to process checkout");
            }

            const data = await response.json();
            toast.success("Guest checked out successfully!");
            
            // Redirect to invoice or reservation details
            router.push(`/reservations/${reservationId}/invoice`);

        } catch (error) {
            // console.error("Checkout error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to process checkout");
        } finally {
            setProcessing(false);
            setShowConfirmDialog(false);
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
        return format(new Date(dateString), "PPP");
    };

    const formatDateTime = (dateString: string) => {
        return format(new Date(dateString), "PPP 'at' p");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading checkout data...</span>
            </div>
        );
    }

    if (!reservation) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Checkout Not Available</h3>
                <p className="text-gray-600 mb-4">This reservation is not available for checkout.</p>
                <Link href="/reservations">
                    <Button>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Reservations
                    </Button>
                </Link>
            </div>
        );
    }

    const finalTotal = calculateFinalTotal();
    const finalBalance = calculateFinalBalance();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/reservations">Reservations</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href={`/reservations/${reservationId}`}>
                                Reservation Details
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <span className="font-medium">Checkout</span>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href={`/reservations/${reservationId}`}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Details
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-3xl font-bold tracking-tight flex items-center">
                                    <LogOut className="w-8 h-8 text-blue-600 mr-3" />
                                    Guest Checkout
                                </h1>
                                <Badge variant="outline">
                                    {reservation.bookingNumber}
                                </Badge>
                                {reservation.customer.isVip && (
                                    <Badge className="bg-yellow-100 text-yellow-800">
                                        <Star className="w-3 h-3 mr-1" />
                                        VIP {reservation.customer.vipLevel || 'Guest'}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-gray-600 mt-1">
                                {reservation.customer.firstName} {reservation.customer.lastName} • 
                                Room {reservation.room.roomNumber} • {reservation.roomClass.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Button onClick={fetchCheckoutData} variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Checkout Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        </div>
                        <div className="text-sm font-medium">Ready for Checkout</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{reservation.actualStayDays}</div>
                        <div className="text-sm text-gray-600">Actual Stay Days</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{reservation.adults + reservation.children + reservation.infants}</div>
                        <div className="text-sm text-gray-600">Total Guests</div>
                    </CardContent>
                </Card>

                <Card className={`${finalBalance === 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{formatCurrency(finalBalance)}</div>
                        <div className="text-sm text-gray-600">Final Balance</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Guest & Stay Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Guest & Stay Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Guest Name</Label>
                                <div className="font-medium">
                                    {reservation.customer.firstName} {reservation.customer.lastName}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Customer ID</Label>
                                <div className="font-medium">{reservation.customer.customerID}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <div>
                                    <div className="text-sm text-gray-600">Phone</div>
                                    <div className="font-medium">{reservation.customer.phone}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <div>
                                    <div className="text-sm text-gray-600">Email</div>
                                    <div className="font-medium">{reservation.customer.email}</div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Room</Label>
                                <div className="font-medium">
                                    {reservation.room.roomNumber} - {reservation.roomClass.name}
                                    {reservation.room.floor && (
                                        <div className="text-sm text-gray-600">
                                            Floor {reservation.room.floor.floorNumber}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Billing Type</Label>
                                <div className="font-medium">{reservation.billingType.replace('_', ' ')}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Check-in Date</Label>
                                <div className="font-medium">{formatDate(reservation.checkInDate)}</div>
                                {reservation.actualCheckIn && (
                                    <div className="text-sm text-green-600">
                                        Actually: {formatDateTime(reservation.actualCheckIn)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Expected Check-out</Label>
                                <div className="font-medium">{formatDate(reservation.checkOutDate)}</div>
                                <div className="text-sm text-blue-600">
                                    Now: {formatDateTime(new Date().toISOString())}
                                </div>
                            </div>
                        </div>

                        {(reservation.specialRequests || reservation.remarks) && (
                            <>
                                <Separator />
                                {reservation.specialRequests && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Special Requests</Label>
                                        <div className="text-sm p-2 bg-blue-50 border border-blue-200 rounded">
                                            {reservation.specialRequests}
                                        </div>
                                    </div>
                                )}
                                {reservation.remarks && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Staff Remarks</Label>
                                        <div className="text-sm p-2 bg-gray-50 border rounded">
                                            {reservation.remarks}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Checkout Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calculator className="w-5 h-5 mr-2" />
                            Checkout Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="additionalCharges">Additional Charges</Label>
                                <Input
                                    id="additionalCharges"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={checkoutData.additionalCharges}
                                    onChange={(e) => handleInputChange("additionalCharges", parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lateCheckoutFee">Late Checkout Fee</Label>
                                <Input
                                    id="lateCheckoutFee"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={checkoutData.lateCheckoutFee}
                                    onChange={(e) => handleInputChange("lateCheckoutFee", parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="damageFee">Damage Fee</Label>
                                <Input
                                    id="damageFee"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={checkoutData.damageFee}
                                    onChange={(e) => handleInputChange("damageFee", parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentAmount">Checkout Payment</Label>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={checkoutData.paymentAmount}
                                    onChange={(e) => handleInputChange("paymentAmount", parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {checkoutData.damageFee > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="damageDescription">Damage Description</Label>
                                <Textarea
                                    id="damageDescription"
                                    value={checkoutData.damageDescription}
                                    onChange={(e) => handleInputChange("damageDescription", e.target.value)}
                                    placeholder="Describe the damage..."
                                    rows={3}
                                />
                            </div>
                        )}

                        {checkoutData.paymentAmount > 0 && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="finalPaymentMethod">Payment Method</Label>
                                    <Select 
                                        value={checkoutData.finalPaymentMethod} 
                                        onValueChange={(value) => handleInputChange("finalPaymentMethod", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CASH">Cash</SelectItem>
                                            <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                                            <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                            <SelectItem value="MOBILE_PAYMENT">Mobile Payment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentRemarks">Payment Remarks</Label>
                                    <Input
                                        id="paymentRemarks"
                                        value={checkoutData.paymentRemarks}
                                        onChange={(e) => handleInputChange("paymentRemarks", e.target.value)}
                                        placeholder="Payment notes..."
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="staffNotes">Checkout Notes</Label>
                            <Textarea
                                id="staffNotes"
                                value={checkoutData.staffNotes}
                                onChange={(e) => handleInputChange("staffNotes", e.target.value)}
                                placeholder="Any notes about the checkout process..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Orders & Services */}
            {(reservation.quickOrders.length > 0 || reservation.complementaryItems.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Orders & Services Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {reservation.quickOrders.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-3">Quick Orders ({reservation.quickOrders.length})</h4>
                                <div className="space-y-2">
                                    {reservation.quickOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <div className="font-medium">{order.description}</div>
                                                <div className="text-sm text-gray-600">
                                                    Qty: {order.quantity} • {formatDate(order.createdAt)}
                                                    {order.deliveredByStaff && ` • By: ${order.deliveredByStaff.name}`}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                                                <Badge variant={order.orderStatus === 'DELIVERED' ? 'default' : 'secondary'}>
                                                    {order.orderStatus}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {reservation.complementaryItems.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-3">Complementary Items ({reservation.complementaryItems.length})</h4>
                                <div className="space-y-2">
                                    {reservation.complementaryItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <div className="font-medium flex items-center">
                                                    <Gift className="w-4 h-4 mr-2 text-green-600" />
                                                    {item.name}
                                                </div>
                                                {item.description && (
                                                    <div className="text-sm text-gray-600">{item.description}</div>
                                                )}
                                            </div>
                                            <div className="font-medium">{formatCurrency(item.rate)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Final Bill Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Receipt className="w-5 h-5 mr-2" />
                        Final Bill Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Original Charges</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Room Charges ({reservation.numberOfNights} nights):</span>
                                    <span>{formatCurrency(reservation.totalAmount)}</span>
                                </div>
                                {reservation.quickOrdersTotal > 0 && (
                                    <div className="flex justify-between">
                                        <span>Room Service Orders:</span>
                                        <span>{formatCurrency(reservation.quickOrdersTotal)}</span>
                                    </div>
                                )}
                                {reservation.complementaryTotal > 0 && (
                                    <div className="flex justify-between">
                                        <span>Complementary Services:</span>
                                        <span>{formatCurrency(reservation.complementaryTotal)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Checkout Charges</h4>
                            <div className="space-y-2 text-sm">
                                {checkoutData.additionalCharges > 0 && (
                                    <div className="flex justify-between">
                                        <span>Additional Charges:</span>
                                        <span>{formatCurrency(checkoutData.additionalCharges)}</span>
                                    </div>
                                )}
                                {checkoutData.lateCheckoutFee > 0 && (
                                    <div className="flex justify-between text-orange-600">
                                        <span>Late Checkout Fee:</span>
                                        <span>{formatCurrency(checkoutData.lateCheckoutFee)}</span>
                                    </div>
                                )}
                                {checkoutData.damageFee > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Damage Fee:</span>
                                        <span>{formatCurrency(checkoutData.damageFee)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount:</span>
                            <span>{formatCurrency(finalTotal)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span>Advance Paid:</span>
                            <span>{formatCurrency(reservation.advanceAmount)}</span>
                        </div>
                        {checkoutData.paymentAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Checkout Payment:</span>
                                <span>{formatCurrency(checkoutData.paymentAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold">
                            <span>Final Balance:</span>
                            <span className={finalBalance === 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(finalBalance)}
                            </span>
                        </div>
                    </div>

                    {finalBalance > 0 && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center text-orange-800">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Outstanding Balance: {formatCurrency(finalBalance)}</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t p-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center space-x-4">
                        <Link href={`/reservations/${reservationId}`}>
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Details
                            </Button>
                        </Link>
                        
                        <Button variant="outline">
                            <Printer className="w-4 h-4 mr-2" />
                            Print Bill
                        </Button>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <div className="text-lg font-bold">Final Balance: {formatCurrency(finalBalance)}</div>
                            <div className="text-sm text-gray-600">
                                {finalBalance === 0 ? 'Fully Paid' : 'Payment Required'}
                            </div>
                        </div>

                        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                            <AlertDialogTrigger asChild>
                                <Button size="lg" className="min-w-[150px]">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Process Checkout
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center">
                                        <LogOut className="w-5 h-5 mr-2 text-blue-600" />
                                        Confirm Guest Checkout
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to check out this guest? This will:
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>Mark the reservation as checked out</li>
                                            <li>Make Room {reservation.room.roomNumber} available</li>
                                            <li>Finalize the bill with total amount: {formatCurrency(finalTotal)}</li>
                                            {finalBalance > 0 && <li className="text-red-600">Outstanding balance: {formatCurrency(finalBalance)}</li>}
                                            {checkoutData.paymentAmount > 0 && <li>Process checkout payment: {formatCurrency(checkoutData.paymentAmount)}</li>}
                                        </ul>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleCheckout}
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Confirm Checkout
                                            </>
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>
        </div>
    );
}