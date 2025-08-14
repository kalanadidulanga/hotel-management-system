"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Home,
    Calendar,
    User,
    CreditCard,
    MapPin,
    Phone,
    Mail,
    Users,
    Bed,
    Clock,
    AlertCircle,
    RefreshCw,
    Eye
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import Link from "next/link";

// Interfaces based on your Prisma models
interface Customer {
    id: number;
    title?: string;
    firstName: string;
    lastName?: string;
    gender: string;
    dateOfBirth: string;
    anniversary?: string;
    nationality: "native" | "foreigner";
    isVip: boolean;
    occupation?: string;
    email: string;
    countryCode: string;
    phone: string;
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
    createdAt: string;
    updatedAt: string;
}

interface ComplementaryItem {
    id: number;
    roomType: string;
    complementary: string;
    rate: number;
}

interface Reservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    checkInTime: string;
    checkOutTime: string;
    arrivalFrom?: string;
    bookingType?: string;
    purposeOfVisit: string;
    remarks?: string;
    roomType: string;
    roomNumber: number;
    adults?: number;
    children?: number;
    roomPrice: number;
    billingType: string;
    customerId: number;
    customer: Customer;
    discountReason?: string;
    discountAmount: number;
    commissionPercent: number;
    commissionAmount: number;
    bookingCharge: number;
    tax: number;
    serviceCharge: number;
    paymentMode: string;
    advanceRemarks?: string;
    advanceAmount: number;
    total: number;
    balanceAmount: number;
    complementaryItems: ComplementaryItem[];
    createdAt: string;
    updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch reservation details');
    return res.json();
});

export default function ReservationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const reservationId = params.id as string;

    // Fetch reservation details with SWR
    const {
        data: reservation,
        error: reservationError,
        isLoading: isLoadingReservation,
        mutate
    } = useSWR<Reservation>(
        reservationId ? `/api/room-reservation/booking-info/${reservationId}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            onError: (error) => {
                toast.error("Failed to load reservation details");
                console.error("Error loading reservation:", error);
            }
        }
    );

    // Helper functions
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return amount.toFixed(2);
    };

    const calculateTotalComplementaryPrice = () => {
        return reservation?.complementaryItems?.reduce((total, item) => total + item.rate, 0) || 0;
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // Error state
    if (reservationError) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Reservation</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Reservation with ID #{reservationId} could not be found or loaded.
                        </p>
                        <div className="flex gap-2 justify-center">
                            <Button onClick={() => mutate()} variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Link href="/reservations">
                                <Button>Back to Reservations</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoadingReservation) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
                    <div className="px-4 py-4 space-y-4">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        <Home className="w-4 h-4" /> Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/reservations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        Reservations
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <span className="text-sm font-medium">Reservation Details</span>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center gap-3">
                            <Eye className="w-6 h-6 text-primary" />
                            <div>
                                <Skeleton className="h-6 w-32 mb-1" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <LoadingSkeleton />
                </div>
            </div>
        );
    }

    if (!reservation) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Reservation Not Found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            The reservation you're looking for doesn't exist.
                        </p>
                        <Link href="/reservations">
                            <Button>Back to Reservations</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                                <BreadcrumbLink href="/reservations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Reservations
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <span className="text-sm font-medium">Reservation Details</span>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Eye className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Reservation Details</h1>
                                <p className="text-sm text-muted-foreground">
                                    Booking #{reservation.bookingNumber} • {reservation.customer.firstName} {reservation.customer.lastName || ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/reservations">
                                <Button variant="outline" className="h-10 px-6 rounded-full shadow-md flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    All Reservations
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-6xl mx-auto p-6 space-y-6">

                    {/* Booking Information Section */}
                    <Card className="shadow-lg border border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Booking Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Column 1 */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Booking Number</Label>
                                        <Input
                                            value={reservation.bookingNumber}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700 font-mono"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Adults</Label>
                                        <Input
                                            value={reservation.adults || 0}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Check In</Label>
                                        <Input
                                            value={formatDateTime(reservation.checkInDate)}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Children</Label>
                                        <Input
                                            value={reservation.children || 0}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Paid Amount</Label>
                                        <Input
                                            value={formatCurrency(reservation.advanceAmount)}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Room Type</Label>
                                        <Input
                                            value={reservation.roomType}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">No of Room</Label>
                                        <Input
                                            value="1"
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Check Out</Label>
                                        <Input
                                            value={formatDateTime(reservation.checkOutDate)}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Room No.</Label>
                                        <Input
                                            value={reservation.roomNumber}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Discount</Label>
                                        <Input
                                            value={formatCurrency(reservation.discountAmount)}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Column 3 */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Room Rate</Label>
                                        <Input
                                            value={formatCurrency(reservation.roomPrice)}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Total Extra Price</Label>
                                        <Input
                                            value={formatCurrency(reservation.serviceCharge + reservation.tax + reservation.bookingCharge)}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Total Complementary Price</Label>
                                        <Input
                                            value={formatCurrency(calculateTotalComplementaryPrice())}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Total Price</Label>
                                        <Input
                                            value={formatCurrency(reservation.total)}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700 font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Full Guest Name</Label>
                                        <Input
                                            value={`${reservation.customer.firstName} ${reservation.customer.lastName || ''}`.trim()}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Special Requests */}
                            <div className="mt-6 space-y-2">
                                <Label className="text-sm font-medium">Special Requests</Label>
                                <Textarea
                                    value={reservation.remarks || ''}
                                    readOnly
                                    placeholder="No special requests"
                                    className="bg-gray-50 border-gray-200 text-gray-700 min-h-[80px] resize-none"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Information Section */}
                    <Card className="shadow-lg border border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Left Column */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Account Name
                                        </Label>
                                        <Input
                                            value={`${reservation.customer.firstName} ${reservation.customer.lastName || ''}`.trim()}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </Label>
                                        <Input
                                            value={reservation.customer.email}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Address
                                        </Label>
                                        <Input
                                            value={reservation.customer.address}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Phone
                                        </Label>
                                        <Input
                                            value={`${reservation.customer.countryCode} ${reservation.customer.phone}`}
                                            readOnly
                                            className="bg-gray-50 border-gray-200 text-gray-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* VIP Badge */}
                            {reservation.customer.isVip && (
                                <div className="mt-6 pt-6 border-t">
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-sm px-3 py-1">
                                        VIP Customer
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}