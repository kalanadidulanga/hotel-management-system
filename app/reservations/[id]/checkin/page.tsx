"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
    UserCheck,
    ArrowLeft,
    Calculator,
    CreditCard,
    DollarSign,
    Receipt,
    Clock,
    AlertTriangle,
    CheckCircle,
    User,
    Home,
    Phone,
    Mail,
    Calendar,
    Star,
    Key,
    Shield,
    Eye,
    Loader2,
    FileText,
    AlertCircle,
    RefreshCw,
    MapPin,
    CreditCard as CreditCardIcon,
    Wifi,
    Tv,
    Coffee,
    Car,
    Gift,
    ClockIcon,
} from "lucide-react";

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
    frontIdUrl: string | null;
    backIdUrl: string | null;
    guestImageUrl: string | null;
    address: string;
    specialRequests: string | null;
    notes: string | null;
}

interface RoomFacility {
    id: number;
    name: string;
    category: string | null;
    isChargeable: boolean;
    chargeAmount: number;
    isWorking: boolean;
    notes: string | null;
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
    facilities: RoomFacility[];
}

interface RoomClass {
    id: number;
    name: string;
    ratePerNight: number;
    rateDayUse: number;
    maxOccupancy: number;
    amenities: string | null;
    specialFeatures: string | null;
}

interface ComplementaryItem {
    id: number;
    name: string;
    description: string | null;
    rate: number;
    isOptional: boolean;
}

interface CheckinReservation {
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
    complementaryItems: ComplementaryItem[];

    // Check-in calculations
    isEarlyCheckIn: boolean;
    isLateCheckIn: boolean;
    earlyCheckInFee: number;
    lateCheckInFee: number;
    currentDateTime: string;
}

interface CheckinFormData {
    earlyCheckInFee: number;
    lateCheckInFee: number;
    additionalCharges: number;
    paymentAmount: number;
    paymentMethod: string;
    paymentRemarks: string;
    staffNotes: string;
    guestConfirmation: boolean;
    identityVerified: boolean;
    keyCardIssued: boolean;
    roomInspected: boolean;
}

export default function CheckinPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [reservation, setReservation] = useState<CheckinReservation | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const reservationId = params.id as string;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    const [checkinData, setCheckinData] = useState<CheckinFormData>({
        earlyCheckInFee: 0,
        lateCheckInFee: 0,
        additionalCharges: 0,
        paymentAmount: 0,
        paymentMethod: "CASH",
        paymentRemarks: "",
        staffNotes: "",
        guestConfirmation: false,
        identityVerified: false,
        keyCardIssued: false,
        roomInspected: false,
    });

    useEffect(() => {
        if (reservationId) {
            fetchCheckinData();
        }
    }, [reservationId]);

    const fetchCheckinData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/reservations/${reservationId}/checkin`);

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
                throw new Error("Failed to fetch check-in data");
            }

            const data = await response.json();
            setReservation(data.reservation);

            // Auto-populate fees
            setCheckinData(prev => ({
                ...prev,
                earlyCheckInFee: data.reservation.earlyCheckInFee || 0,
                lateCheckInFee: data.reservation.lateCheckInFee || 0,
            }));

        } catch (error) {
            console.error("Error fetching check-in data:", error);
            toast.error("Failed to load check-in data");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof CheckinFormData, value: any) => {
        setCheckinData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const calculateFinalTotal = () => {
        if (!reservation) return 0;
        return reservation.totalAmount +
            checkinData.earlyCheckInFee +
            checkinData.lateCheckInFee +
            checkinData.additionalCharges;
    };

    const calculateFinalBalance = () => {
        if (!reservation) return 0;
        const finalTotal = calculateFinalTotal();
        return Math.max(0, finalTotal - reservation.advanceAmount - checkinData.paymentAmount);
    };

    const canProceedCheckin = () => {
        return checkinData.guestConfirmation && checkinData.identityVerified;
    };

    const handleCheckin = async () => {
        if (!reservation) return;

        try {
            setProcessing(true);

            const response = await fetch(`${apiBaseUrl}/api/reservations/${reservationId}/checkin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...checkinData,
                    checkedInBy: 1, // You should get this from auth context
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to process check-in");
            }

            const data = await response.json();
            toast.success("Guest checked in successfully!");

            // Redirect to reservation details
            router.push(`/reservations/${reservationId}`);

        } catch (error) {
            console.error("Check-in error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to process check-in");
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

    const getFacilityIcon = (category: string | null) => {
        switch (category?.toLowerCase()) {
            case 'electronics':
                return <Tv className="w-4 h-4" />;
            case 'internet':
                return <Wifi className="w-4 h-4" />;
            case 'refreshments':
                return <Coffee className="w-4 h-4" />;
            case 'transport':
                return <Car className="w-4 h-4" />;
            default:
                return <Gift className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading check-in data...</span>
            </div>
        );
    }

    if (!reservation) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Check-in Not Available</h3>
                <p className="text-gray-600 mb-4">This reservation is not available for check-in.</p>
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
                            <span className="font-medium">Check-in</span>
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
                                    <UserCheck className="w-8 h-8 text-green-600 mr-3" />
                                    Guest Check-in
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
                        <Button onClick={fetchCheckinData} variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Check-in Status Alerts */}
            <div className="space-y-3">
                {reservation.isEarlyCheckIn && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center text-blue-800">
                            <ClockIcon className="w-5 h-5 mr-2" />
                            <div>
                                <span className="font-medium">Early Check-in</span>
                                <p className="text-sm mt-1">
                                    Guest is checking in before the scheduled date. Early check-in fee: {formatCurrency(reservation.earlyCheckInFee)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {reservation.isLateCheckIn && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center text-orange-800">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            <div>
                                <span className="font-medium">Late Check-in</span>
                                <p className="text-sm mt-1">
                                    Guest is checking in after the scheduled date. Late check-in fee: {formatCurrency(reservation.lateCheckInFee)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Check-in Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                            <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        </div>
                        <div className="text-sm font-medium">Ready for Check-in</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{reservation.numberOfNights}</div>
                        <div className="text-sm text-gray-600">Booked Nights</div>
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
                        <div className="text-sm text-gray-600">Remaining Balance</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Guest Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Guest Information
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Nationality</Label>
                                <div className="font-medium capitalize">{reservation.customer.nationality}</div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Identity</Label>
                                <div className="font-medium">
                                    {reservation.customer.identityType}: {reservation.customer.identityNumber}
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-500">Address</Label>
                            <div className="font-medium">{reservation.customer.address}</div>
                        </div>

                        {reservation.customer.specialRequests && (
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Special Requests</Label>
                                <div className="text-sm p-2 bg-blue-50 border border-blue-200 rounded">
                                    {reservation.customer.specialRequests}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Room Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Home className="w-5 h-5 mr-2" />
                            Room Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Room Number</Label>
                                <div className="font-medium text-lg">{reservation.room.roomNumber}</div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Room Type</Label>
                                <div className="font-medium">{reservation.roomClass.name}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Floor</Label>
                                <div className="font-medium">
                                    {reservation.room.floor?.name || 'Not specified'}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Max Occupancy</Label>
                                <div className="font-medium">{reservation.roomClass.maxOccupancy} guests</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Rate per Night</Label>
                                <div className="font-medium">{formatCurrency(reservation.roomClass.ratePerNight)}</div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Room Status</Label>
                                <Badge variant={reservation.room.status === 'AVAILABLE' ? 'default' : 'secondary'}>
                                    {reservation.room.status}
                                </Badge>
                            </div>
                        </div>

                        {reservation.room.facilities.length > 0 && (
                            <div>
                                <Label className="text-sm font-medium text-gray-500 mb-2 block">Room Facilities</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {reservation.room.facilities.slice(0, 6).map((facility) => (
                                        <div key={facility.id} className="flex items-center space-x-2 text-sm">
                                            {getFacilityIcon(facility.category)}
                                            <span className={facility.isWorking ? '' : 'line-through text-gray-400'}>
                                                {facility.name}
                                            </span>
                                            {facility.isChargeable && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{formatCurrency(facility.chargeAmount)}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {reservation.room.facilities.length > 6 && (
                                    <div className="text-sm text-gray-500 mt-2">
                                        +{reservation.room.facilities.length - 6} more facilities
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Stay Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Stay Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Check-in Date</Label>
                            <div className="font-medium">{formatDate(reservation.checkInDate)}</div>
                            <div className="text-sm text-green-600">
                                Current: {formatDateTime(reservation.currentDateTime)}
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Check-out Date</Label>
                            <div className="font-medium">{formatDate(reservation.checkOutDate)}</div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Guests</Label>
                            <div className="font-medium">
                                {reservation.adults} Adults
                                {reservation.children > 0 && `, ${reservation.children} Children`}
                                {reservation.infants > 0 && `, ${reservation.infants} Infants`}
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Billing Type</Label>
                            <div className="font-medium">{reservation.billingType.replace('_', ' ')}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Check-in Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Calculator className="w-5 h-5 mr-2" />
                        Check-in Process
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Verification Checklist */}
                    <div>
                        <Label className="text-lg font-medium mb-4 block">Verification Checklist</Label>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="identityVerified"
                                    checked={checkinData.identityVerified}
                                    onCheckedChange={(checked) => handleInputChange("identityVerified", checked)}
                                />
                                <Label htmlFor="identityVerified" className="flex items-center">
                                    <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                    Identity document verified and matches guest
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="guestConfirmation"
                                    checked={checkinData.guestConfirmation}
                                    onCheckedChange={(checked) => handleInputChange("guestConfirmation", checked)}
                                />
                                <Label htmlFor="guestConfirmation" className="flex items-center">
                                    <User className="w-4 h-4 mr-2 text-green-600" />
                                    Guest confirmed booking details and rates
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="roomInspected"
                                    checked={checkinData.roomInspected}
                                    onCheckedChange={(checked) => handleInputChange("roomInspected", checked)}
                                />
                                <Label htmlFor="roomInspected" className="flex items-center">
                                    <Eye className="w-4 h-4 mr-2 text-purple-600" />
                                    Room inspected and ready for occupancy
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="keyCardIssued"
                                    checked={checkinData.keyCardIssued}
                                    onCheckedChange={(checked) => handleInputChange("keyCardIssued", checked)}
                                />
                                <Label htmlFor="keyCardIssued" className="flex items-center">
                                    <Key className="w-4 h-4 mr-2 text-orange-600" />
                                    Key card(s) issued to guest
                                </Label>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Financial Details */}
                    <div className="space-y-4">
                        <Label className="text-lg font-medium">Financial Details</Label>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="additionalCharges">Additional Charges</Label>
                                <Input
                                    id="additionalCharges"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={checkinData.additionalCharges}
                                    onChange={(e) => handleInputChange("additionalCharges", parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentAmount">Check-in Payment</Label>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={checkinData.paymentAmount}
                                    onChange={(e) => handleInputChange("paymentAmount", parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {checkinData.paymentAmount > 0 && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentMethod">Payment Method</Label>
                                    <Select
                                        value={checkinData.paymentMethod}
                                        onValueChange={(value) => handleInputChange("paymentMethod", value)}
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
                                        value={checkinData.paymentRemarks}
                                        onChange={(e) => handleInputChange("paymentRemarks", e.target.value)}
                                        placeholder="Payment notes..."
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="staffNotes">Check-in Notes</Label>
                            <Textarea
                                id="staffNotes"
                                value={checkinData.staffNotes}
                                onChange={(e) => handleInputChange("staffNotes", e.target.value)}
                                placeholder="Any notes about the check-in process..."
                                rows={3}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Receipt className="w-5 h-5 mr-2" />
                        Financial Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Original Booking</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Room Rate ({reservation.numberOfNights} nights):</span>
                                    <span>{formatCurrency(reservation.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>Advance Paid:</span>
                                    <span>{formatCurrency(reservation.advanceAmount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Check-in Charges</h4>
                            <div className="space-y-2 text-sm">
                                {checkinData.earlyCheckInFee > 0 && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>Early Check-in Fee:</span>
                                        <span>{formatCurrency(checkinData.earlyCheckInFee)}</span>
                                    </div>
                                )}
                                {checkinData.lateCheckInFee > 0 && (
                                    <div className="flex justify-between text-orange-600">
                                        <span>Late Check-in Fee:</span>
                                        <span>{formatCurrency(checkinData.lateCheckInFee)}</span>
                                    </div>
                                )}
                                {checkinData.additionalCharges > 0 && (
                                    <div className="flex justify-between">
                                        <span>Additional Charges:</span>
                                        <span>{formatCurrency(checkinData.additionalCharges)}</span>
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
                            <span>Already Paid:</span>
                            <span>{formatCurrency(reservation.advanceAmount)}</span>
                        </div>
                        {checkinData.paymentAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Check-in Payment:</span>
                                <span>{formatCurrency(checkinData.paymentAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold">
                            <span>Remaining Balance:</span>
                            <span className={finalBalance === 0 ? 'text-green-600' : 'text-orange-600'}>
                                {formatCurrency(finalBalance)}
                            </span>
                        </div>
                    </div>

                    {finalBalance > 0 && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center text-orange-800">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">
                                    Remaining balance of {formatCurrency(finalBalance)} to be paid during stay or checkout
                                </span>
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
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <div className="text-lg font-bold">Total: {formatCurrency(finalTotal)}</div>
                            <div className="text-sm text-gray-600">
                                Balance: {formatCurrency(finalBalance)}
                            </div>
                        </div>

                        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="lg"
                                    className="min-w-[150px]"
                                    disabled={!canProceedCheckin()}
                                >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Check In Guest
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center">
                                        <UserCheck className="w-5 h-5 mr-2 text-green-600" />
                                        Confirm Guest Check-in
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to check in this guest? This will:
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>Mark the reservation as checked in</li>
                                            <li>Set Room {reservation.room.roomNumber} as occupied</li>
                                            <li>Finalize the bill with total amount: {formatCurrency(finalTotal)}</li>
                                            {finalBalance > 0 && <li className="text-orange-600">Remaining balance: {formatCurrency(finalBalance)}</li>}
                                            {checkinData.paymentAmount > 0 && <li>Process check-in payment: {formatCurrency(checkinData.paymentAmount)}</li>}
                                            {checkinData.keyCardIssued && <li>Key card issued to guest</li>}
                                        </ul>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleCheckin}
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Confirm Check-in
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