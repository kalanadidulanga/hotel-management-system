"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
import {
    CalendarIcon,
    Phone,
    Mail,
    User,
    Home,
    DollarSign,
    Edit,
    ArrowLeft,
    Star,
    IdCard,
    Building,
    UserCheck,
    LogOut,
    AlertTriangle,
    RefreshCw,
    FileText,
    ShoppingCart,
    XCircle,
    Loader2,
    Activity,
} from "lucide-react";

// Types based on your Prisma schema
interface ReservationDetails {
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
    guestCount: number;
    specialRequests: string | null;
    remarks: string | null;
    billingType: string;
    baseRoomRate: number;
    totalRoomCharge: number;
    extraCharges: number;
    discountAmount: number;
    serviceCharge: number;
    tax: number;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    reservationStatus: string;
    cancellationReason: string | null;
    cancellationDate: string | null;
    isOverdue: boolean;
    canCheckIn: boolean;
    canCheckOut: boolean;
    quickOrdersTotal: number;
    quickOrdersCount: number;
    grandTotal: number;
    createdAt: string;
    updatedAt: string;
    customer: {
        id: number;
        customerID: string;
        firstName: string;
        lastName: string | null;
        fullName: string | null;
        phone: string;
        email: string;
        isVip: boolean;
        vipLevel: string | null;
        nationality: string;
        identityType: string | null;
        identityNumber: string;
        gender: string;
        dateOfBirth: string;
        occupation: string | null;
        address: string;
        specialRequests: string | null;
        notes: string | null;
    };
    room: {
        id: number;
        roomNumber: string;
        status: string;
        hasBalcony: boolean;
        hasSeaView: boolean;
        hasKitchenette: boolean;
        floor: {
            id: number;
            name: string;
            floorNumber: number;
        } | null;
        facilities: Array<{
            id: number;
            isWorking: boolean;
            facility: {
                id: number;
                name: string;
                description: string | null;
                category: string | null;
                isChargeable: boolean;
                chargeAmount: number;
            };
        }>;
    };
    roomClass: {
        id: number;
        name: string;
        description: string | null;
        ratePerNight: number;
        maxOccupancy: number;
        standardOccupancy: number;
        roomSize: string | null;
        bedConfiguration: string | null;
        amenities: string | null;
    };
    bookedByStaff: {
        id: number;
        name: string;
        email: string;
        department: string | null;
    } | null;
    quickOrders: Array<{
        id: number;
        description: string;
        quantity: number;
        unitPrice: number;
        totalAmount: number;
        orderStatus: string;
        deliveredAt: string | null;
        createdAt: string;
        deliveredByStaff: {
            id: number;
            name: string;
        } | null;
    }>;
    complementaryItems: Array<{
        id: number;
        name: string;
        description: string | null;
        rate: number;
    }>;
}

export default function ReservationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [reservation, setReservation] = useState<ReservationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");

    const reservationId = params.id as string;

    useEffect(() => {
        if (reservationId) {
            fetchReservation();
        }
    }, [reservationId]);

    const fetchReservation = async () => {
        try {
            setLoading(true);
            console.log(`Fetching reservation with ID: ${reservationId}`);
            
            // Use relative URL instead of environment variable
            const response = await fetch(`/api/reservations/${reservationId}`);
            
            console.log(`Response status: ${response.status}`);
            console.log(`Response ok: ${response.ok}`);

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error("Reservation not found");
                    router.push("/reservations");
                    return;
                }
                
                // Get error message from response
                let errorMessage = "Failed to fetch reservation";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error("Failed to parse error response:", e);
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("Reservation data received:", data);
            
            if (!data.success || !data.reservation) {
                throw new Error("Invalid response format");
            }
            
            setReservation(data.reservation);
        } catch (error) {
            console.error("Error fetching reservation:", error);
            toast.error(error instanceof Error ? error.message : "Failed to load reservation details");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!reservation) return;

        try {
            setUpdating(true);
            console.log(`Updating reservation ${reservation.id} to status: ${newStatus}`);
            
            const response = await fetch(`/api/reservations/${reservation.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reservationStatus: newStatus }),
            });

            if (!response.ok) {
                let errorMessage = "Failed to update reservation status";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error("Failed to parse error response:", e);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.success && data.reservation) {
                setReservation(data.reservation);
                toast.success(`Reservation ${newStatus.toLowerCase().replace('_', ' ')}`);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error("Error updating reservation:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update reservation");
        } finally {
            setUpdating(false);
        }
    };

    const handleCancelReservation = async () => {
        if (!reservation || !cancellationReason.trim()) return;

        try {
            setCancelling(true);
            console.log(`Cancelling reservation ${reservation.id} with reason: ${cancellationReason}`);
            
            const response = await fetch(
                `/api/reservations/${reservation.id}?reason=${encodeURIComponent(cancellationReason)}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                let errorMessage = "Failed to cancel reservation";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error("Failed to parse error response:", e);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.success) {
                toast.success("Reservation cancelled successfully");
                fetchReservation(); // Refresh data
                setCancellationReason("");
            } else {
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error("Error cancelling reservation:", error);
            toast.error(error instanceof Error ? error.message : "Failed to cancel reservation");
        } finally {
            setCancelling(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'CONFIRMED': 'bg-blue-100 text-blue-800',
            'CHECKED_IN': 'bg-green-100 text-green-800',
            'CHECKED_OUT': 'bg-gray-100 text-gray-800',
            'CANCELLED': 'bg-red-100 text-red-800',
        };
        return colors[status as keyof typeof colors] || 'bg-yellow-100 text-yellow-800';
    };

    const getPaymentStatusColor = (status: string) => {
        const colors = {
            'PAID': 'bg-green-100 text-green-800',
            'PARTIAL': 'bg-orange-100 text-orange-800',
            'PENDING': 'bg-red-100 text-red-800',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
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
                <span>Loading reservation details...</span>
            </div>
        );
    }

    if (!reservation) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Reservation Not Found</h3>
                <p className="text-gray-600 mb-4">The reservation you're looking for doesn't exist.</p>
                <Link href="/reservations">
                    <Button>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Reservations
                    </Button>
                </Link>
            </div>
        );
    }

    const paymentCompletion = reservation.totalAmount > 0
        ? Math.round((reservation.advanceAmount / reservation.totalAmount) * 100)
        : 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/reservations">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-3xl font-bold">{reservation.bookingNumber}</h1>
                            <Badge className={`${getStatusColor(reservation.reservationStatus)} border`}>
                                {reservation.reservationStatus.replace('_', ' ')}
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
                    <Button onClick={fetchReservation} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>

                    {reservation.canCheckIn && (
                        <Button
                            onClick={() => handleStatusUpdate('CHECKED_IN')}
                            disabled={updating}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                            Check In
                        </Button>
                    )}

                    {reservation.canCheckOut && (
                        <Button
                            onClick={() => handleStatusUpdate('CHECKED_OUT')}
                            disabled={updating}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                            Check Out
                        </Button>
                    )}

                    <Link href={`/reservations/${reservation.id}/edit`}>
                        <Button variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    </Link>

                    {['CONFIRMED', 'CHECKED_IN'].includes(reservation.reservationStatus) && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to cancel this reservation? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                    <Textarea
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        placeholder="Please provide a reason for cancellation..."
                                        rows={3}
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleCancelReservation}
                                        disabled={!cancellationReason.trim() || cancelling}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {cancelling ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelling...</>
                                        ) : (
                                            'Cancel Reservation'
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={reservation.reservationStatus === 'CHECKED_IN' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
                    <CardContent className="p-4 text-center">
                        <Activity className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <div className="text-sm font-medium">
                            {reservation.reservationStatus === 'CHECKED_IN' ? 'Currently Active' :
                                reservation.reservationStatus === 'CONFIRMED' ? 'Upcoming Stay' : 'Completed/Cancelled'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{reservation.numberOfNights}</div>
                        <div className="text-sm text-gray-600">
                            {reservation.numberOfNights === 1 ? 'Night' : 'Nights'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{reservation.guestCount}</div>
                        <div className="text-sm text-gray-600">Total Guests</div>
                    </CardContent>
                </Card>

                <Card className={paymentCompletion === 100 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{paymentCompletion}%</div>
                        <div className="text-sm text-gray-600">Payment Complete</div>
                        <Progress value={paymentCompletion} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Rest of your existing JSX remains the same... */}
            {/* I'll include the rest for completeness but it's unchanged */}
            
            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="customer">Customer</TabsTrigger>
                    <TabsTrigger value="room">Room</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CalendarIcon className="w-5 h-5 mr-2" />
                                    Reservation Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500">Check-in</div>
                                        <div className="font-medium">{formatDate(reservation.checkInDate)}</div>
                                        <div className="text-sm text-gray-600">{reservation.checkInTime}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Check-out</div>
                                        <div className="font-medium">{formatDate(reservation.checkOutDate)}</div>
                                        <div className="text-sm text-gray-600">{reservation.checkOutTime}</div>
                                    </div>
                                </div>

                                {reservation.actualCheckIn && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="font-medium text-green-800">Actually Checked In</div>
                                        <div className="text-sm text-green-700">{formatDateTime(reservation.actualCheckIn)}</div>
                                    </div>
                                )}

                                {reservation.actualCheckOut && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="font-medium text-blue-800">Actually Checked Out</div>
                                        <div className="text-sm text-blue-700">{formatDateTime(reservation.actualCheckOut)}</div>
                                    </div>
                                )}

                                <Separator />

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500">Adults</div>
                                        <div className="font-medium">{reservation.adults}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Children</div>
                                        <div className="font-medium">{reservation.children}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Infants</div>
                                        <div className="font-medium">{reservation.infants}</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-500">Billing Type</div>
                                    <Badge variant="outline">{reservation.billingType.replace('_', ' ')}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Financial Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Base Room Rate</span>
                                        <span className="font-medium">{formatCurrency(reservation.baseRoomRate)}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Total Room Charge</span>
                                        <span className="font-medium">{formatCurrency(reservation.totalRoomCharge)}</span>
                                    </div>

                                    {reservation.extraCharges > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Extra Charges</span>
                                            <span className="font-medium">{formatCurrency(reservation.extraCharges)}</span>
                                        </div>
                                    )}

                                    {reservation.discountAmount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span className="text-sm">Discount</span>
                                            <span className="font-medium">-{formatCurrency(reservation.discountAmount)}</span>
                                        </div>
                                    )}

                                    {reservation.serviceCharge > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Service Charge</span>
                                            <span className="font-medium">{formatCurrency(reservation.serviceCharge)}</span>
                                        </div>
                                    )}

                                    {reservation.tax > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Tax</span>
                                            <span className="font-medium">{formatCurrency(reservation.tax)}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Amount</span>
                                        <span>{formatCurrency(reservation.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>Advance Paid</span>
                                        <span className="font-medium">{formatCurrency(reservation.advanceAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                        <span>Balance Due</span>
                                        <span className="font-bold">{formatCurrency(reservation.balanceAmount)}</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Payment Status</span>
                                        <Badge className={getPaymentStatusColor(reservation.paymentStatus)}>
                                            {reservation.paymentStatus}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Method: {reservation.paymentMethod.replace('_', ' ')}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Customer Tab */}
                <TabsContent value="customer">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xl font-semibold flex items-center space-x-2">
                                        <span>{reservation.customer.firstName} {reservation.customer.lastName}</span>
                                        {reservation.customer.isVip && (
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                <Star className="w-3 h-3 mr-1" />
                                                VIP {reservation.customer.vipLevel || ''}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Customer ID: {reservation.customer.customerID}
                                    </div>
                                </div>
                                <Badge variant="outline">
                                    {reservation.customer.nationality === "native" ? "Sri Lankan" : "Foreign"}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
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

                                    <div className="flex items-center space-x-2">
                                        <IdCard className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <div className="text-sm text-gray-600">{reservation.customer.identityType || "ID"}</div>
                                            <div className="font-medium">{reservation.customer.identityNumber}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm text-gray-600">Gender</div>
                                        <div className="font-medium">{reservation.customer.gender}</div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600">Date of Birth</div>
                                        <div className="font-medium">
                                            {formatDate(reservation.customer.dateOfBirth)}
                                        </div>
                                    </div>

                                    {reservation.customer.occupation && (
                                        <div>
                                            <div className="text-sm text-gray-600">Occupation</div>
                                            <div className="font-medium">{reservation.customer.occupation}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-600 mb-2">Address</div>
                                <div className="p-3 bg-gray-50 border rounded-lg">
                                    {reservation.customer.address}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Room Tab */}
                <TabsContent value="room">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Home className="w-5 h-5 mr-2" />
                                    Room Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold">Room {reservation.room.roomNumber}</div>
                                        <div className="text-lg text-gray-600">{reservation.roomClass.name}</div>
                                    </div>
                                    <Badge variant={reservation.room.status === 'OCCUPIED' ? 'destructive' : 'default'}>
                                        {reservation.room.status}
                                    </Badge>
                                </div>

                                {reservation.room.floor && (
                                    <div className="flex items-center space-x-2">
                                        <Building className="w-4 h-4 text-gray-400" />
                                        <span>Floor {reservation.room.floor.floorNumber} - {reservation.room.floor.name}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600">Room Size</div>
                                        <div className="font-medium">{reservation.roomClass.roomSize || 'Not specified'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Bed Configuration</div>
                                        <div className="font-medium">{reservation.roomClass.bedConfiguration || 'Not specified'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Max Occupancy</div>
                                        <div className="font-medium">{reservation.roomClass.maxOccupancy} guests</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Standard Occupancy</div>
                                        <div className="font-medium">{reservation.roomClass.standardOccupancy} guests</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm font-medium mb-2">Room Features</div>
                                    <div className="flex flex-wrap gap-2">
                                        {reservation.room.hasBalcony && (
                                            <Badge variant="outline">🌅 Balcony</Badge>
                                        )}
                                        {reservation.room.hasSeaView && (
                                            <Badge variant="outline">🌊 Sea View</Badge>
                                        )}
                                        {reservation.room.hasKitchenette && (
                                            <Badge variant="outline">🍳 Kitchenette</Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Room Facilities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reservation.room.facilities.length > 0 ? (
                                    <div className="space-y-3">
                                        {reservation.room.facilities.map((facilityAssignment) => (
                                            <div key={facilityAssignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">{facilityAssignment.facility.name}</div>
                                                    {facilityAssignment.facility.description && (
                                                        <div className="text-sm text-gray-600">{facilityAssignment.facility.description}</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end space-y-1">
                                                    <Badge variant={facilityAssignment.isWorking ? "default" : "destructive"}>
                                                        {facilityAssignment.isWorking ? "Working" : "Out of Order"}
                                                    </Badge>
                                                    {facilityAssignment.facility.isChargeable && (
                                                        <div className="text-sm font-medium">
                                                            {formatCurrency(facilityAssignment.facility.chargeAmount)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        No facilities assigned to this room
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Detailed Billing Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <span>Room Rate ({reservation.billingType.replace('_', ' ')})</span>
                                    <span className="font-medium">{formatCurrency(reservation.baseRoomRate)}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span>× {reservation.numberOfNights} nights</span>
                                    <span>{formatCurrency(reservation.totalRoomCharge)}</span>
                                </div>

                                {reservation.extraCharges > 0 && (
                                    <div className="flex justify-between">
                                        <span>Extra Charges</span>
                                        <span>{formatCurrency(reservation.extraCharges)}</span>
                                    </div>
                                )}

                                {reservation.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount Applied</span>
                                        <span>-{formatCurrency(reservation.discountAmount)}</span>
                                    </div>
                                )}

                                {reservation.serviceCharge > 0 && (
                                    <div className="flex justify-between">
                                        <span>Service Charge</span>
                                        <span>{formatCurrency(reservation.serviceCharge)}</span>
                                    </div>
                                )}

                                {reservation.tax > 0 && (
                                    <div className="flex justify-between">
                                        <span>Tax</span>
                                        <span>{formatCurrency(reservation.tax)}</span>
                                    </div>
                                )}

                                <Separator />

                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total Amount</span>
                                    <span>{formatCurrency(reservation.totalAmount)}</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span>Advance Payment</span>
                                    <span className="font-medium text-green-600">{formatCurrency(reservation.advanceAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Remaining Balance</span>
                                    <span className="font-bold text-red-600">{formatCurrency(reservation.balanceAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Quick Orders Total</span>
                                    <span className="font-medium">{formatCurrency(reservation.quickOrdersTotal)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-xl font-bold">
                                    <span>Grand Total</span>
                                    <span>{formatCurrency(reservation.grandTotal)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Payment Method</div>
                                    <div className="font-medium">{reservation.paymentMethod.replace('_', ' ')}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Payment Status</div>
                                    <Badge className={getPaymentStatusColor(reservation.paymentStatus)}>
                                        {reservation.paymentStatus}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <ShoppingCart className="w-5 h-5 mr-2" />
                                    Quick Orders ({reservation.quickOrdersCount})
                                </div>
                                <div className="text-lg font-bold">
                                    Total: {formatCurrency(reservation.quickOrdersTotal)}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reservation.quickOrders.length > 0 ? (
                                <div className="space-y-3">
                                    {reservation.quickOrders.map((order) => (
                                        <div key={order.id} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-medium">{order.description}</div>
                                                <Badge variant={order.orderStatus === 'DELIVERED' ? 'default' : 'secondary'}>
                                                    {order.orderStatus}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                                                <div>Quantity: {order.quantity}</div>
                                                <div>Unit Price: {formatCurrency(order.unitPrice)}</div>
                                                <div className="font-medium">Total: {formatCurrency(order.totalAmount)}</div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 text-sm">
                                                <div>Ordered: {formatDateTime(order.createdAt)}</div>
                                                {order.deliveredAt && (
                                                    <div>Delivered: {formatDateTime(order.deliveredAt)}</div>
                                                )}
                                            </div>
                                            {order.deliveredByStaff && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    Delivered by: {order.deliveredByStaff.name}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No quick orders for this reservation</p>
                                </div>
                            )}

                            {reservation.complementaryItems.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-lg font-medium mb-3">Complementary Items</h4>
                                    <div className="space-y-2">
                                        {reservation.complementaryItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div>
                                                    <div className="font-medium">{item.name}</div>
                                                    {item.description && (
                                                        <div className="text-sm text-gray-600">{item.description}</div>
                                                    )}
                                                </div>
                                                <div className="font-medium text-green-600">
                                                    {formatCurrency(item.rate)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}