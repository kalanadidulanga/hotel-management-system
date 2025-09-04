"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import {
    ArrowLeft,
    Save,
    AlertTriangle,
    Loader2,
    User,
    DollarSign,
    Calendar,
    Star,
    CheckCircle,
    RotateCcw
} from "lucide-react";

// Types - Essential fields only
interface Customer {
    id: number;
    firstName: string;
    lastName: string | null;
    phone: string;
    email: string;
    isVip: boolean;
    nationality: string;
    identityType: string | null;
    identityNumber: string;
    gender: string;
    dateOfBirth: string | null;
    address: string;
    occupation: string | null;
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
    roomClass: {
        id: number;
        name: string;
        ratePerNight: number;
        rateDayUse: number;
    };
}

interface RoomClass {
    id: number;
    name: string;
    ratePerNight: number;
    rateDayUse: number;
    hourlyRate: number | null;
}

interface ReservationData {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    checkInTime: string;
    checkOutTime: string;
    numberOfNights: number;
    adults: number;
    children: number;
    infants: number;
    specialRequests: string | null;
    remarks: string | null;
    billingType: string;
    baseRoomRate: number;
    totalRoomCharge: number;
    extraCharges: number;
    discountType: string | null;
    discountValue: number;
    discountReason: string | null;
    discountAmount: number;
    serviceCharge: number;
    tax: number;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    reservationStatus: string;
    customer: Customer;
    room: {
        id: number;
        roomNumber: string;
        status: string;
    };
    roomClass: RoomClass;
}

interface FormData {
    customer: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        nationality: string;
        identityType: string;
        identityNumber: string;
        gender: string;
        dateOfBirth: string;
        address: string;
        occupation: string;
    };
    checkInDate: string;
    checkOutDate: string;
    checkInTime: string;
    checkOutTime: string;
    adults: number;
    children: number;
    infants: number;
    roomId: number;
    roomClassId: number;
    billingType: string;
    baseRoomRate: number;
    extraCharges: number;
    discountType: string;
    discountValue: number;
    discountReason: string;
    serviceCharge: number;
    tax: number;
    specialRequests: string;
    remarks: string;
}

export default function EditReservationPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [reservation, setReservation] = useState<ReservationData | null>(null);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [roomClasses, setRoomClasses] = useState<RoomClass[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    const reservationId = params.id as string;

    const [formData, setFormData] = useState<FormData>({
        customer: {
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            nationality: "native",
            identityType: "NIC",
            identityNumber: "",
            gender: "male",
            dateOfBirth: "",
            address: "",
            occupation: "",
        },
        checkInDate: "",
        checkOutDate: "",
        checkInTime: "14:00",
        checkOutTime: "12:00",
        adults: 1,
        children: 0,
        infants: 0,
        roomId: 0,
        roomClassId: 0,
        billingType: "NIGHT_STAY",
        baseRoomRate: 0,
        extraCharges: 0,
        discountType: "NONE", // Default to NONE for frontend
        discountValue: 0,
        discountReason: "",
        serviceCharge: 0,
        tax: 0,
        specialRequests: "",
        remarks: "",
    });

    useEffect(() => {
        if (reservationId) {
            fetchReservationData();
        }
    }, [reservationId]);

    const fetchReservationData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservations/${reservationId}/edit`);

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
                throw new Error("Failed to fetch reservation data");
            }

            const data = await response.json();
            setReservation(data.reservation);
            setAvailableRooms(data.availableRooms);
            setRoomClasses(data.roomClasses);

            // Populate form data
            const res = data.reservation;
            setFormData({
                customer: {
                    firstName: res.customer.firstName || "",
                    lastName: res.customer.lastName || "",
                    phone: res.customer.phone || "",
                    email: res.customer.email || "",
                    nationality: res.customer.nationality || "native",
                    identityType: res.customer.identityType || "NIC",
                    identityNumber: res.customer.identityNumber || "",
                    gender: res.customer.gender || "male",
                    dateOfBirth: res.customer.dateOfBirth || "",
                    address: res.customer.address || "",
                    occupation: res.customer.occupation || "",
                },
                checkInDate: res.checkInDate || "",
                checkOutDate: res.checkOutDate || "",
                checkInTime: res.checkInTime || "14:00",
                checkOutTime: res.checkOutTime || "12:00",
                adults: res.adults || 1,
                children: res.children || 0,
                infants: res.infants || 0,
                roomId: res.room.id || 0,
                roomClassId: res.roomClass.id || 0,
                billingType: res.billingType || "NIGHT_STAY",
                baseRoomRate: res.baseRoomRate || 0,
                extraCharges: res.extraCharges || 0,
                discountType: res.discountType || "NONE", // Default to NONE if null
                discountValue: res.discountValue || 0,
                discountReason: res.discountReason || "",
                serviceCharge: res.serviceCharge || 0,
                tax: res.tax || 0,
                specialRequests: res.specialRequests || "",
                remarks: res.remarks || "",
            });
        } catch (error) {
            console.error("Error fetching reservation data:", error);
            toast.error("Failed to load reservation data");
        } finally {
            setLoading(false);
        }
    };

    const calculateNights = (checkIn: string, checkOut: string) => {
        if (!checkIn || !checkOut) return 0;
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        return Math.max(0, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    };

    const calculateTotalAmount = () => {
        const nights = calculateNights(formData.checkInDate, formData.checkOutDate);
        const roomCharge = formData.baseRoomRate * (formData.billingType === "NIGHT_STAY" ? nights : 1);
        const subtotal = roomCharge + formData.extraCharges;
        const afterDiscount = subtotal - calculateDiscountAmount(subtotal);
        return afterDiscount + formData.serviceCharge + formData.tax;
    };

    const calculateDiscountAmount = (subtotal: number) => {
        if (formData.discountType === "PERCENTAGE") {
            return (subtotal * formData.discountValue) / 100;
        } else if (formData.discountType === "FIXED_AMOUNT") {
            return formData.discountValue;
        }
        return 0;
    };

    const handleInputChange = (field: string, value: any, section?: string) => {
        setHasChanges(true);

        if (section === "customer") {
            setFormData(prev => ({
                ...prev,
                customer: {
                    ...prev.customer,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }

        // Auto-calculate room rate when room class changes
        if (field === "roomClassId") {
            const selectedRoomClass = roomClasses.find(rc => rc.id === parseInt(value));
            if (selectedRoomClass) {
                const rate = formData.billingType === "NIGHT_STAY" ? selectedRoomClass.ratePerNight : selectedRoomClass.rateDayUse;
                setFormData(prev => ({
                    ...prev,
                    baseRoomRate: rate
                }));
            }
        }

        // Auto-calculate room rate when billing type changes
        if (field === "billingType") {
            const selectedRoomClass = roomClasses.find(rc => rc.id === formData.roomClassId);
            if (selectedRoomClass) {
                const rate = value === "NIGHT_STAY" ? selectedRoomClass.ratePerNight : selectedRoomClass.rateDayUse;
                setFormData(prev => ({
                    ...prev,
                    baseRoomRate: rate
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasChanges) {
            toast.info("No changes to save");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservations/${reservationId}/edit`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update reservation");
            }

            const data = await response.json();
            toast.success(data.message);
            setHasChanges(false);

            // Redirect to reservation details
            router.push(`/reservations/${reservationId}`);
        } catch (error) {
            console.error("Error updating reservation:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update reservation");
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        if (reservation) {
            fetchReservationData();
            setHasChanges(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading reservation data...</span>
            </div>
        );
    }

    if (!reservation) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Reservation Not Found</h3>
                <p className="text-gray-600 mb-4">The reservation you're trying to edit doesn't exist.</p>
                <Link href="/reservations">
                    <Button>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Reservations
                    </Button>
                </Link>
            </div>
        );
    }

    const totalAmount = calculateTotalAmount();
    const discountAmount = calculateDiscountAmount(formData.baseRoomRate * calculateNights(formData.checkInDate, formData.checkOutDate) + formData.extraCharges);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/reservations/${reservationId}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-3xl font-bold">Edit Reservation</h1>
                            <Badge variant="outline">
                                {reservation.bookingNumber}
                            </Badge>
                            <Badge className={reservation.reservationStatus === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                {reservation.reservationStatus.replace('_', ' ')}
                            </Badge>
                            {reservation.customer.isVip && (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                    <Star className="w-3 h-3 mr-1" />
                                    VIP
                                </Badge>
                            )}
                        </div>
                        <p className="text-gray-600 mt-1">
                            {reservation.customer.firstName} {reservation.customer.lastName} •
                            Room {reservation.room.roomNumber}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {hasChanges && (
                        <Button onClick={resetForm} variant="outline" size="sm">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset Changes
                        </Button>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button disabled={!hasChanges || saving}>
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Save Changes?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to save these changes to the reservation?
                                    This will update the booking details and may affect pricing.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSubmit}>
                                    Save Changes
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.customer.firstName}
                                        onChange={(e) => handleInputChange("firstName", e.target.value, "customer")}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.customer.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value, "customer")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    value={formData.customer.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value, "customer")}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.customer.email}
                                    onChange={(e) => handleInputChange("email", e.target.value, "customer")}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nationality">Nationality</Label>
                                    <Select value={formData.customer.nationality} onValueChange={(value) => handleInputChange("nationality", value, "customer")}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="native">Sri Lankan</SelectItem>
                                            <SelectItem value="foreigner">Foreign</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={formData.customer.gender} onValueChange={(value) => handleInputChange("gender", value, "customer")}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="identityType">ID Type</Label>
                                    <Select value={formData.customer.identityType} onValueChange={(value) => handleInputChange("identityType", value, "customer")}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NIC">NIC</SelectItem>
                                            <SelectItem value="PASSPORT">Passport</SelectItem>
                                            <SelectItem value="DRIVING_LICENSE">Driving License</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="identityNumber">ID Number *</Label>
                                    <Input
                                        id="identityNumber"
                                        value={formData.customer.identityNumber}
                                        onChange={(e) => handleInputChange("identityNumber", e.target.value, "customer")}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.customer.dateOfBirth}
                                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value, "customer")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address *</Label>
                                <Textarea
                                    id="address"
                                    value={formData.customer.address}
                                    onChange={(e) => handleInputChange("address", e.target.value, "customer")}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="occupation">Occupation</Label>
                                <Input
                                    id="occupation"
                                    value={formData.customer.occupation}
                                    onChange={(e) => handleInputChange("occupation", e.target.value, "customer")}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reservation Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="w-5 h-5 mr-2" />
                                Reservation Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="checkInDate">Check-in Date *</Label>
                                    <Input
                                        id="checkInDate"
                                        type="date"
                                        value={formData.checkInDate}
                                        onChange={(e) => handleInputChange("checkInDate", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="checkOutDate">Check-out Date *</Label>
                                    <Input
                                        id="checkOutDate"
                                        type="date"
                                        value={formData.checkOutDate}
                                        onChange={(e) => handleInputChange("checkOutDate", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="checkInTime">Check-in Time</Label>
                                    <Input
                                        id="checkInTime"
                                        type="time"
                                        value={formData.checkInTime}
                                        onChange={(e) => handleInputChange("checkInTime", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="checkOutTime">Check-out Time</Label>
                                    <Input
                                        id="checkOutTime"
                                        type="time"
                                        value={formData.checkOutTime}
                                        onChange={(e) => handleInputChange("checkOutTime", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="text-sm font-medium text-blue-800">
                                    Duration: {calculateNights(formData.checkInDate, formData.checkOutDate)} nights
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="adults">Adults *</Label>
                                    <Input
                                        id="adults"
                                        type="number"
                                        min="1"
                                        value={formData.adults}
                                        onChange={(e) => handleInputChange("adults", parseInt(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="children">Children</Label>
                                    <Input
                                        id="children"
                                        type="number"
                                        min="0"
                                        value={formData.children}
                                        onChange={(e) => handleInputChange("children", parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="infants">Infants</Label>
                                    <Input
                                        id="infants"
                                        type="number"
                                        min="0"
                                        value={formData.infants}
                                        onChange={(e) => handleInputChange("infants", parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="roomClassId">Room Class *</Label>
                                <Select value={formData.roomClassId.toString()} onValueChange={(value) => handleInputChange("roomClassId", parseInt(value))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomClasses.map((roomClass) => (
                                            <SelectItem key={roomClass.id} value={roomClass.id.toString()}>
                                                {roomClass.name} - LKR {roomClass.ratePerNight.toLocaleString()}/night
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="roomId">Room *</Label>
                                <Select value={formData.roomId.toString()} onValueChange={(value) => handleInputChange("roomId", parseInt(value))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRooms.map((room) => (
                                            <SelectItem key={room.id} value={room.id.toString()}>
                                                Room {room.roomNumber} - {room.roomClass.name}
                                                {room.floor && ` (Floor ${room.floor.floorNumber})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="billingType">Billing Type</Label>
                                <Select value={formData.billingType} onValueChange={(value) => handleInputChange("billingType", value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NIGHT_STAY">Night Stay</SelectItem>
                                        <SelectItem value="DAY_USE">Day Use</SelectItem>
                                        {/* <SelectItem value="HOURLY">Hourly</SelectItem> */}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="specialRequests">Special Requests</Label>
                                <Textarea
                                    id="specialRequests"
                                    value={formData.specialRequests}
                                    onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                                    rows={3}
                                    placeholder="Any special requests or preferences..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="remarks">Internal Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    value={formData.remarks}
                                    onChange={(e) => handleInputChange("remarks", e.target.value)}
                                    rows={3}
                                    placeholder="Internal notes about this reservation..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing & Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <DollarSign className="w-5 h-5 mr-2" />
                                Pricing & Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="baseRoomRate">Base Room Rate *</Label>
                                <Input
                                    id="baseRoomRate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.baseRoomRate}
                                    onChange={(e) => handleInputChange("baseRoomRate", parseFloat(e.target.value))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="extraCharges">Extra Charges</Label>
                                <Input
                                    id="extraCharges"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.extraCharges}
                                    onChange={(e) => handleInputChange("extraCharges", parseFloat(e.target.value))}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="discountType">Discount Type</Label>
                                    <Select value={formData.discountType} onValueChange={(value) => handleInputChange("discountType", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NONE">No Discount</SelectItem>
                                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                            <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.discountType !== "NONE" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="discountValue">
                                                Discount {formData.discountType === "PERCENTAGE" ? "Percentage" : "Amount"}
                                            </Label>
                                            <Input
                                                id="discountValue"
                                                type="number"
                                                min="0"
                                                step={formData.discountType === "PERCENTAGE" ? "0.1" : "0.01"}
                                                value={formData.discountValue}
                                                onChange={(e) => handleInputChange("discountValue", parseFloat(e.target.value))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="discountReason">Discount Reason</Label>
                                            <Input
                                                id="discountReason"
                                                value={formData.discountReason}
                                                onChange={(e) => handleInputChange("discountReason", e.target.value)}
                                                placeholder="Reason for discount..."
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="serviceCharge">Service Charge</Label>
                                    <Input
                                        id="serviceCharge"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.serviceCharge}
                                        onChange={(e) => handleInputChange("serviceCharge", parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax">Tax</Label>
                                    <Input
                                        id="tax"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.tax}
                                        onChange={(e) => handleInputChange("tax", parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Pricing Summary */}
                            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium">Pricing Summary</h4>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Room Rate ({formData.billingType === "NIGHT_STAY" ? `${calculateNights(formData.checkInDate, formData.checkOutDate)} nights` : formData.billingType === "DAY_USE" ? "Day Use" : "Hourly"}):</span>
                                        <span>LKR {(formData.baseRoomRate * (formData.billingType === "NIGHT_STAY" ? calculateNights(formData.checkInDate, formData.checkOutDate) : 1)).toLocaleString()}</span>
                                    </div>

                                    {formData.extraCharges > 0 && (
                                        <div className="flex justify-between">
                                            <span>Extra Charges:</span>
                                            <span>LKR {formData.extraCharges.toLocaleString()}</span>
                                        </div>
                                    )}

                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount:</span>
                                            <span>-LKR {discountAmount.toLocaleString()}</span>
                                        </div>
                                    )}

                                    {formData.serviceCharge > 0 && (
                                        <div className="flex justify-between">
                                            <span>Service Charge:</span>
                                            <span>LKR {formData.serviceCharge.toLocaleString()}</span>
                                        </div>
                                    )}

                                    {formData.tax > 0 && (
                                        <div className="flex justify-between">
                                            <span>Tax:</span>
                                            <span>LKR {formData.tax.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total Amount:</span>
                                    <span>LKR {totalAmount.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between text-green-600">
                                    <span>Advance Paid:</span>
                                    <span>LKR {reservation.advanceAmount.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between font-medium text-red-600">
                                    <span>Balance Due:</span>
                                    <span>LKR {Math.max(0, totalAmount - reservation.advanceAmount).toLocaleString()}</span>
                                </div>
                            </div>

                            {hasChanges && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center text-orange-800">
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        <span className="text-sm font-medium">You have unsaved changes</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-white border-t p-4 mt-8">
                    <div className="flex items-center justify-between max-w-6xl mx-auto">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            {hasChanges ? (
                                <span className="flex items-center text-orange-600">
                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                    You have unsaved changes
                                </span>
                            ) : (
                                <span className="flex items-center text-green-600">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    All changes saved
                                </span>
                            )}
                        </div>

                        <div className="flex items-center space-x-3">
                            <Link href={`/reservations/${reservationId}`}>
                                <Button variant="outline">Cancel</Button>
                            </Link>

                            {hasChanges && (
                                <Button onClick={resetForm} variant="outline">
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset
                                </Button>
                            )}

                            <Button
                                type="submit"
                                disabled={!hasChanges || saving}
                                className="min-w-[120px]"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}