"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
    CalendarIcon,
    Users,
    CreditCard,
    MapPin,
    Phone,
    Mail,
    User,
    Home,
    Clock,
    DollarSign,
    Percent,
    Plus,
    Minus,
    Search,
    ArrowLeft,
    Loader2,
    Save,
    CheckCircle,
    AlertCircle,
    Star,
    X,
    UserPlus,
    IdCard,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Customer {
    id: number;
    customerID: string;
    firstName: string;
    lastName: string | null;
    fullName: string | null;
    phone: string;
    email: string;
    isVip: boolean;
    nationality: string;
    identityNumber: string; // NIC number
    gender: string;
    dateOfBirth: string;
    address: string;
}

interface Room {
    id: number;
    roomNumber: string;
    status: string;
    floor: {
        name: string;
        floorNumber: number;
    } | null;
}

interface RoomClass {
    id: number;
    name: string;
    description: string | null;
    ratePerNight: number;
    rateDayUse: number;
    hourlyRate: number | null;
    maxOccupancy: number;
    standardOccupancy: number;
    extraPersonCharge: number;
    childCharge: number;
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

interface ReservationFormData {
    // Customer Selection
    customerId: number | null;

    // Room Selection
    roomId: number | null;
    roomClassId: number | null;

    // Dates & Times
    checkInDate: Date | null;
    checkOutDate: Date | null;
    checkInTime: string;
    checkOutTime: string;

    // Guest Information
    adults: number;
    children: number;
    infants: number;

    // Booking Details
    bookingType: string;
    purposeOfVisit: string;
    arrivalFrom: string;
    specialRequests: string;
    remarks: string;

    // Billing
    billingType: string;
    baseRoomRate: number;
    totalRoomCharge: number;
    extraCharges: number;

    // Discount
    discountType: string | null;
    discountValue: number;
    discountReason: string;
    discountAmount: number;

    // Additional Charges
    serviceCharge: number;
    tax: number;
    commissionPercent: number;
    commissionAmount: number;

    // Payment
    paymentMethod: string;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    advanceRemarks: string;

    // Complementary Items
    complementaryItemIds: number[];
}

// New Customer Form Data Interface
interface NewCustomerFormData {
    title: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: Date | null;
    nationality: string;
    identityType: string;
    identityNumber: string;
    phone: string;
    email: string;
    address: string;
    occupation: string;
    specialRequests: string;
}

export default function NewReservationForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [roomClasses, setRoomClasses] = useState<RoomClass[]>([]);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [complementaryItems, setComplementaryItems] = useState<ComplementaryItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedRoomClass, setSelectedRoomClass] = useState<RoomClass | null>(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);

    // New Customer Modal State
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
    const [creatingCustomer, setCreatingCustomer] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState<NewCustomerFormData>({
        title: "Mr",
        firstName: "",
        lastName: "",
        gender: "Male",
        dateOfBirth: null,
        nationality: "native",
        identityType: "NIC",
        identityNumber: "",
        phone: "",
        email: "",
        address: "",
        occupation: "",
        specialRequests: "",
    });

    const [formData, setFormData] = useState<ReservationFormData>({
        customerId: null,
        roomId: null,
        roomClassId: null,
        checkInDate: null,
        checkOutDate: null,
        checkInTime: "14:00",
        checkOutTime: "12:00",
        adults: 1,
        children: 0,
        infants: 0,
        bookingType: "Walk-in",
        purposeOfVisit: "Leisure",
        arrivalFrom: "",
        specialRequests: "",
        remarks: "",
        billingType: "NIGHT_STAY",
        baseRoomRate: 0,
        totalRoomCharge: 0,
        extraCharges: 0,
        discountType: null,
        discountValue: 0,
        discountReason: "",
        discountAmount: 0,
        serviceCharge: 0,
        tax: 0,
        commissionPercent: 0,
        commissionAmount: 0,
        paymentMethod: "CASH",
        totalAmount: 0,
        advanceAmount: 0,
        balanceAmount: 0,
        advanceRemarks: "",
        complementaryItemIds: [],
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    // Fetch initial data
    useEffect(() => {
        fetchCustomers();
        fetchRoomClasses();
    }, []);

    // Calculate dates effect
    useEffect(() => {
        if (formData.checkInDate && formData.checkOutDate && selectedRoomClass) {
            calculatePricing();
            fetchAvailableRooms();
        }
    }, [formData.checkInDate, formData.checkOutDate, selectedRoomClass, formData.billingType]);

    // Recalculate total when pricing components change
    useEffect(() => {
        calculateTotal();
    }, [
        formData.totalRoomCharge,
        formData.extraCharges,
        formData.discountAmount,
        formData.serviceCharge,
        formData.tax,
        formData.commissionAmount
    ]);

    // Calculate balance when advance changes
    useEffect(() => {
        const balance = Math.max(0, formData.totalAmount - formData.advanceAmount);
        setFormData(prev => ({ ...prev, balanceAmount: balance }));
    }, [formData.totalAmount, formData.advanceAmount]);

    // Recalculate discount when discount value changes
    useEffect(() => {
        calculateDiscount();
    }, [formData.discountType, formData.discountValue, formData.totalRoomCharge, formData.extraCharges]);

    const fetchCustomers = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/customers`);
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customers");
        }
    };

    const fetchRoomClasses = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/classes`);
            if (response.ok) {
                const data = await response.json();
                setRoomClasses(data.roomClasses || []);
            }
        } catch (error) {
            console.error("Error fetching room classes:", error);
            toast.error("Failed to load room classes");
        }
    };

    const fetchAvailableRooms = async () => {
        if (!formData.checkInDate || !formData.checkOutDate || !formData.roomClassId) return;

        try {
            const queryParams = new URLSearchParams({
                roomClassId: formData.roomClassId.toString(),
                checkInDate: formData.checkInDate.toISOString().split('T')[0],
                checkOutDate: formData.checkOutDate.toISOString().split('T')[0],
            });

            const response = await fetch(`${apiBaseUrl}/api/rooms/available?${queryParams}`);
            if (response.ok) {
                const data = await response.json();
                setAvailableRooms(data.rooms || []);
            }
        } catch (error) {
            console.error("Error fetching available rooms:", error);
            toast.error("Failed to fetch available rooms");
        }
    };

    const fetchComplementaryItems = async (roomClassId: number) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/classes/${roomClassId}/complementary`);
            if (response.ok) {
                const data = await response.json();
                setComplementaryItems(data.items || []);
            }
        } catch (error) {
            console.error("Error fetching complementary items:", error);
        }
    };

    // Create New Customer Function
    const createNewCustomer = async () => {
        // Validate required fields
        if (!newCustomerData.firstName || !newCustomerData.identityNumber || !newCustomerData.phone) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Validate NIC format (basic validation)
        if (newCustomerData.identityType === "NIC" && newCustomerData.identityNumber.length !== 10 && newCustomerData.identityNumber.length !== 12) {
            toast.error("Please enter a valid NIC number");
            return;
        }

        // Validate email format
        if (newCustomerData.email && !/\S+@\S+\.\S+/.test(newCustomerData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setCreatingCustomer(true);

        try {
            const response = await fetch(`${apiBaseUrl}/api/customers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...newCustomerData,
                    dateOfBirth: newCustomerData.dateOfBirth?.toISOString(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || "Failed to create customer");
            }

            // Success - add to customers list and select
            const newCustomer = data.customer;
            setCustomers(prev => [newCustomer, ...prev]);
            handleCustomerSelect(newCustomer);
            setShowNewCustomerModal(false);

            // Reset form
            setNewCustomerData({
                title: "Mr",
                firstName: "",
                lastName: "",
                gender: "Male",
                dateOfBirth: null,
                nationality: "native",
                identityType: "NIC",
                identityNumber: "",
                phone: "",
                email: "",
                address: "",
                occupation: "",
                specialRequests: "",
            });

            toast.success(`Customer ${newCustomer.customerID} created successfully!`);
        } catch (error) {
            console.error("Error creating customer:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create customer");
        } finally {
            setCreatingCustomer(false);
        }
    };

    const calculatePricing = () => {
        if (!formData.checkInDate || !formData.checkOutDate || !selectedRoomClass) return;

        const checkIn = new Date(formData.checkInDate);
        const checkOut = new Date(formData.checkOutDate);
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

        let baseRate = 0;
        let totalCharge = 0;

        switch (formData.billingType) {
            case "NIGHT_STAY":
                baseRate = selectedRoomClass.ratePerNight;
                totalCharge = baseRate * nights;
                break;
            case "DAY_USE":
                baseRate = selectedRoomClass.rateDayUse;
                totalCharge = baseRate;
                break;
            case "HOURLY":
                baseRate = selectedRoomClass.hourlyRate || selectedRoomClass.ratePerNight;
                totalCharge = baseRate * Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)));
                break;
        }

        // Add extra person charges
        const extraAdults = Math.max(0, formData.adults - selectedRoomClass.standardOccupancy);
        const extraPersonCharge = extraAdults * selectedRoomClass.extraPersonCharge;
        const childCharge = formData.children * selectedRoomClass.childCharge;

        totalCharge += extraPersonCharge + childCharge;

        setFormData(prev => ({
            ...prev,
            baseRoomRate: baseRate,
            totalRoomCharge: totalCharge,
            extraCharges: extraPersonCharge + childCharge,
        }));
    };

    const calculateDiscount = () => {
        if (!formData.discountType || formData.discountValue <= 0) {
            setFormData(prev => ({ ...prev, discountAmount: 0 }));
            return;
        }

        let discountAmount = 0;
        const baseAmount = formData.totalRoomCharge + formData.extraCharges;

        if (formData.discountType === "PERCENTAGE") {
            discountAmount = (baseAmount * formData.discountValue) / 100;
        } else if (formData.discountType === "FIXED_AMOUNT") {
            discountAmount = Math.min(formData.discountValue, baseAmount);
        }

        setFormData(prev => ({ ...prev, discountAmount }));
    };

    const calculateTotal = () => {
        const subtotal = formData.totalRoomCharge + formData.extraCharges - formData.discountAmount;
        const withService = subtotal + formData.serviceCharge;
        const withTax = withService + formData.tax;
        const total = withTax + formData.commissionAmount;

        setFormData(prev => ({ ...prev, totalAmount: Math.max(0, total) }));
    };

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData(prev => ({ ...prev, customerId: customer.id }));
        setShowCustomerSearch(false);
        setCustomerSearch(`${customer.firstName} ${customer.lastName || ''} - ${customer.phone} - ${customer.identityNumber}`);
    };

    const handleRoomClassSelect = (roomClassId: string) => {
        const roomClass = roomClasses.find(rc => rc.id.toString() === roomClassId);
        if (roomClass) {
            setSelectedRoomClass(roomClass);
            setFormData(prev => ({
                ...prev,
                roomClassId: roomClass.id,
                roomId: null // Reset room selection when class changes
            }));
            fetchComplementaryItems(roomClass.id);
            setAvailableRooms([]); // Clear available rooms until new search
        }
    };

    const handleComplementaryToggle = (itemId: number, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            complementaryItemIds: checked
                ? [...prev.complementaryItemIds, itemId]
                : prev.complementaryItemIds.filter(id => id !== itemId)
        }));
    };

    const validateForm = (): string[] => {
        const errors: string[] = [];

        if (!formData.customerId) errors.push("Please select a customer");
        if (!formData.roomClassId) errors.push("Please select a room class");
        if (!formData.roomId) errors.push("Please select a room");
        if (!formData.checkInDate) errors.push("Please select check-in date");
        if (!formData.checkOutDate) errors.push("Please select check-out date");
        if (formData.checkInDate && formData.checkOutDate && formData.checkInDate >= formData.checkOutDate) {
            errors.push("Check-out date must be after check-in date");
        }
        if (formData.adults < 1) errors.push("At least one adult is required");
        if (!formData.paymentMethod) errors.push("Please select payment method");
        if (formData.totalAmount <= 0) errors.push("Total amount must be greater than zero");

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = validateForm();
        if (errors.length > 0) {
            errors.forEach(error => toast.error(error));
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${apiBaseUrl}/api/reservations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    checkInDate: formData.checkInDate?.toISOString(),
                    checkOutDate: formData.checkOutDate?.toISOString(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || "Failed to create reservation");
            }

            toast.success(
                `Reservation ${data.reservation.bookingNumber} created successfully!`,
                {
                    description: `Check-in: ${format(new Date(data.reservation.checkInDate), "MMM dd, yyyy")}`,
                    duration: 5000,
                }
            );

            router.push(`/reservations/${data.reservation.id}`);
        } catch (error) {
            console.error("Error creating reservation:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to create reservation"
            );
        } finally {
            setLoading(false);
        }
    };

    // Enhanced customer search including NIC
    const filteredCustomers = customers.filter(customer =>
        customer.firstName.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (customer.lastName && customer.lastName.toLowerCase().includes(customerSearch.toLowerCase())) ||
        customer.phone.includes(customerSearch) ||
        customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.customerID.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.identityNumber.toLowerCase().includes(customerSearch.toLowerCase()) // NIC search
    );

    const numberOfNights = formData.checkInDate && formData.checkOutDate
        ? Math.max(1, Math.ceil((formData.checkOutDate.getTime() - formData.checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/reservations">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Reservations
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Plus className="w-8 h-8 text-blue-600 mr-3" />
                            New Reservation
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Create a new room reservation with complete booking details
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Enhanced Customer Selection with NIC Search */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <User className="w-5 h-5 mr-2" />
                            Customer Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Search & Select Customer *</Label>
                            <div className="flex space-x-2">
                                <div className="flex-1 relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <Input
                                        placeholder="Search by name, phone, email, customer ID, or NIC..."
                                        value={customerSearch}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            setShowCustomerSearch(true);
                                        }}
                                        onFocus={() => setShowCustomerSearch(true)}
                                        onBlur={() => {
                                            // Delay hiding to allow selection
                                            setTimeout(() => setShowCustomerSearch(false), 200);
                                        }}
                                        className="pl-10"
                                    />
                                    {selectedCustomer && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-2 top-1.5 h-7 w-7 p-0"
                                            onClick={() => {
                                                setSelectedCustomer(null);
                                                setFormData(prev => ({ ...prev, customerId: null }));
                                                setCustomerSearch("");
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* New Customer Button */}
                                <Dialog open={showNewCustomerModal} onOpenChange={setShowNewCustomerModal}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" className="shrink-0">
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            New Customer
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center">
                                                <UserPlus className="w-5 h-5 mr-2" />
                                                Create New Customer
                                            </DialogTitle>
                                            <DialogDescription>
                                                Add a new customer to the system and automatically select them for this reservation.
                                            </DialogDescription>
                                        </DialogHeader>

                                        {/* New Customer Form */}
                                        <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Title *</Label>
                                                    <Select
                                                        value={newCustomerData.title}
                                                        onValueChange={(value) => setNewCustomerData(prev => ({ ...prev, title: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Mr">Mr.</SelectItem>
                                                            <SelectItem value="Mrs">Mrs.</SelectItem>
                                                            <SelectItem value="Ms">Ms.</SelectItem>
                                                            <SelectItem value="Dr">Dr.</SelectItem>
                                                            <SelectItem value="Prof">Prof.</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>First Name *</Label>
                                                    <Input
                                                        value={newCustomerData.firstName}
                                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, firstName: e.target.value }))}
                                                        placeholder="First name"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Last Name</Label>
                                                    <Input
                                                        value={newCustomerData.lastName}
                                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, lastName: e.target.value }))}
                                                        placeholder="Last name"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Gender *</Label>
                                                    <Select
                                                        value={newCustomerData.gender}
                                                        onValueChange={(value) => setNewCustomerData(prev => ({ ...prev, gender: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Male">Male</SelectItem>
                                                            <SelectItem value="Female">Female</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Date of Birth *</Label>
                                                    <Input
                                                        type="date"
                                                        value={newCustomerData.dateOfBirth ? format(newCustomerData.dateOfBirth, "yyyy-MM-dd") : ""}
                                                        onChange={(e) => {
                                                            const date = e.target.value ? new Date(e.target.value) : null;
                                                            setNewCustomerData(prev => ({ ...prev, dateOfBirth: date }));
                                                        }}
                                                        max={format(new Date(), "yyyy-MM-dd")}
                                                        min="1900-01-01"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Nationality *</Label>
                                                    <Select
                                                        value={newCustomerData.nationality}
                                                        onValueChange={(value) => setNewCustomerData(prev => ({ ...prev, nationality: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="native">Sri Lankan</SelectItem>
                                                            <SelectItem value="foreigner">Foreigner</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Identity Type *</Label>
                                                    <Select
                                                        value={newCustomerData.identityType}
                                                        onValueChange={(value) => setNewCustomerData(prev => ({ ...prev, identityType: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="NIC">National ID (NIC)</SelectItem>
                                                            <SelectItem value="Passport">Passport</SelectItem>
                                                            <SelectItem value="Driver's License">Driver's License</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="flex items-center">
                                                    <IdCard className="w-4 h-4 mr-1" />
                                                    {newCustomerData.identityType} Number *
                                                </Label>
                                                <Input
                                                    value={newCustomerData.identityNumber}
                                                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, identityNumber: e.target.value }))}
                                                    placeholder={
                                                        newCustomerData.identityType === "NIC"
                                                            ? "Enter NIC number (e.g., 123456789V or 123456789012)"
                                                            : `Enter ${newCustomerData.identityType} number`
                                                    }
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="flex items-center">
                                                        <Phone className="w-4 h-4 mr-1" />
                                                        Phone Number *
                                                    </Label>
                                                    <Input
                                                        value={newCustomerData.phone}
                                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                                        placeholder="Phone number"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="flex items-center">
                                                        <Mail className="w-4 h-4 mr-1" />
                                                        Email
                                                    </Label>
                                                    <Input
                                                        type="email"
                                                        value={newCustomerData.email}
                                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                                                        placeholder="Email address"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Occupation</Label>
                                                <Input
                                                    value={newCustomerData.occupation}
                                                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, occupation: e.target.value }))}
                                                    placeholder="Occupation"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="flex items-center">
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    Address *
                                                </Label>
                                                <Textarea
                                                    value={newCustomerData.address}
                                                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                                                    placeholder="Full address"
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Special Requests</Label>
                                                <Textarea
                                                    value={newCustomerData.specialRequests}
                                                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, specialRequests: e.target.value }))}
                                                    placeholder="Any special requirements, dietary needs, accessibility requirements, etc."
                                                    rows={2}
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowNewCustomerModal(false)}
                                                disabled={creatingCustomer}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={createNewCustomer}
                                                disabled={creatingCustomer}
                                            >
                                                {creatingCustomer ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2" />
                                                        Create Customer
                                                    </>
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Customer Search Results */}
                            {showCustomerSearch && customerSearch && !selectedCustomer && (
                                <div className="absolute z-50 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.slice(0, 10).map((customer) => (
                                            <div
                                                key={customer.id}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                                                onMouseDown={() => handleCustomerSelect(customer)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium flex items-center">
                                                            {customer.firstName} {customer.lastName}
                                                            {customer.isVip && (
                                                                <Star className="w-4 h-4 text-yellow-500 ml-2" />
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <span className="flex items-center space-x-2">
                                                                <span>{customer.customerID}</span>
                                                                <span>•</span>
                                                                <span>{customer.phone}</span>
                                                                <span>•</span>
                                                                <span className="flex items-center">
                                                                    <IdCard className="w-3 h-3 mr-1" />
                                                                    {customer.identityNumber}
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {customer.email}
                                                        </div>
                                                    </div>
                                                    <Badge variant={customer.isVip ? "default" : "secondary"}>
                                                        {customer.nationality === "native" ? "Local" : "Foreign"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-gray-500 text-center">
                                            No customers found.
                                            <Button
                                                variant="link"
                                                className="h-auto p-0 ml-1"
                                                onClick={() => setShowNewCustomerModal(true)}
                                            >
                                                Create new customer
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedCustomer && (
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold flex items-center">
                                                {selectedCustomer.firstName} {selectedCustomer.lastName}
                                                {selectedCustomer.isVip && (
                                                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                                                        <Star className="w-3 h-3 mr-1" />
                                                        VIP
                                                    </Badge>
                                                )}
                                            </h4>
                                            <div className="text-sm text-gray-600 mt-1">
                                                <div>Customer ID: {selectedCustomer.customerID}</div>
                                                <div className="flex items-center space-x-4 mt-1">
                                                    <span className="flex items-center">
                                                        <Phone className="w-3 h-3 mr-1" />
                                                        {selectedCustomer.phone}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <IdCard className="w-3 h-3 mr-1" />
                                                        {selectedCustomer.identityNumber}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {selectedCustomer.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline">
                                                {selectedCustomer.nationality === "native" ? "Sri Lankan" : "Foreigner"}
                                            </Badge>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Age: {new Date().getFullYear() - new Date(selectedCustomer.dateOfBirth).getFullYear()}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>

     

                {/* Room Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Home className="w-5 h-5 mr-2" />
                            Room Selection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Room Class Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Room Class *</Label>
                                <Select
                                    value={formData.roomClassId?.toString() || ""}
                                    onValueChange={handleRoomClassSelect}
                                    disabled={!formData.customerId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select room class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomClasses.map((roomClass) => (
                                            <SelectItem key={roomClass.id} value={roomClass.id.toString()}>
                                                <div>
                                                    <div className="font-medium">{roomClass.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        LKR {roomClass.ratePerNight.toLocaleString()}/night •
                                                        Max {roomClass.maxOccupancy} guests
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!formData.customerId && (
                                    <p className="text-sm text-amber-600">Please select a customer first</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Billing Type *</Label>
                                <Select
                                    value={formData.billingType}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, billingType: value }))}
                                >
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
                        </div>

                        {/* Room Class Details */}
                        {selectedRoomClass && (
                            <Card className="bg-green-50 border-green-200">
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <h4 className="font-semibold">{selectedRoomClass.name}</h4>
                                            <p className="text-sm text-gray-600">{selectedRoomClass.description}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Night Rate</p>
                                            <p className="text-lg">LKR {selectedRoomClass.ratePerNight.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Day Use Rate</p>
                                            <p className="text-lg">LKR {selectedRoomClass.rateDayUse.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Occupancy</p>
                                            <p className="text-lg">{selectedRoomClass.standardOccupancy}-{selectedRoomClass.maxOccupancy} guests</p>
                                        </div>
                                    </div>
                                    {selectedRoomClass.amenities && (
                                        <div className="mt-3">
                                            <p className="text-sm font-medium mb-1">Amenities:</p>
                                            <p className="text-sm text-gray-600">{selectedRoomClass.amenities}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Date Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Check-in Date *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                            disabled={!selectedRoomClass}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.checkInDate ? format(formData.checkInDate, "PPP") : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.checkInDate || undefined}
                                            onSelect={(date) => setFormData(prev => ({ ...prev, checkInDate: date || null }))}
                                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>Check-out Date *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                            disabled={!formData.checkInDate}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.checkOutDate ? format(formData.checkOutDate, "PPP") : "Select date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.checkOutDate || undefined}
                                            onSelect={(date) => setFormData(prev => ({ ...prev, checkOutDate: date || null }))}
                                            disabled={(date) => !formData.checkInDate || date <= formData.checkInDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Time Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Check-in Time</Label>
                                <Input
                                    type="time"
                                    value={formData.checkInTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Check-out Time</Label>
                                <Input
                                    type="time"
                                    value={formData.checkOutTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Available Rooms */}
                        {availableRooms.length > 0 && (
                            <div className="space-y-2">
                                <Label>Available Rooms *</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {availableRooms.map((room) => (
                                        <div
                                            key={room.id}
                                            className={`border rounded-lg p-3 cursor-pointer transition-all ${formData.roomId === room.id
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                            onClick={() => setFormData(prev => ({ ...prev, roomId: room.id }))}
                                        >
                                            <div className="font-medium">{room.roomNumber}</div>
                                            {room.floor && (
                                                <div className="text-sm text-gray-500">{room.floor.name}</div>
                                            )}
                                            <Badge
                                                variant={room.status === "AVAILABLE" ? "default" : "secondary"}
                                                className="mt-1"
                                            >
                                                {room.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No rooms available message */}
                        {formData.checkInDate && formData.checkOutDate && selectedRoomClass && availableRooms.length === 0 && (
                            <Card className="bg-yellow-50 border-yellow-200">
                                <CardContent className="p-4 text-center">
                                    <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                    <p className="text-sm text-yellow-700">
                                        No rooms available for the selected dates in {selectedRoomClass.name} class.
                                        Please select different dates or room class.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Booking Summary */}
                        {formData.checkInDate && formData.checkOutDate && numberOfNights > 0 && (
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Duration:</span>
                                        <span>{numberOfNights} {numberOfNights === 1 ? 'night' : 'nights'}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="font-medium">Dates:</span>
                                        <span>
                                            {format(formData.checkInDate, "MMM dd")} - {format(formData.checkOutDate, "MMM dd, yyyy")}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>

                {/* Guest Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Users className="w-5 h-5 mr-2" />
                            Guest Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Adults *</Label>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, adults: Math.max(1, prev.adults - 1) }))}
                                        disabled={formData.adults <= 1}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        value={formData.adults}
                                        onChange={(e) => setFormData(prev => ({ ...prev, adults: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        min="1"
                                        className="text-center w-16"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, adults: prev.adults + 1 }))}
                                        disabled={selectedRoomClass ? formData.adults >= selectedRoomClass.maxOccupancy : false}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Children</Label>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
                                        disabled={formData.children <= 0}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        value={formData.children}
                                        onChange={(e) => setFormData(prev => ({ ...prev, children: Math.max(0, parseInt(e.target.value) || 0) }))}
                                        min="0"
                                        className="text-center w-16"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, children: prev.children + 1 }))}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Infants</Label>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, infants: Math.max(0, prev.infants - 1) }))}
                                        disabled={formData.infants <= 0}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        value={formData.infants}
                                        onChange={(e) => setFormData(prev => ({ ...prev, infants: Math.max(0, parseInt(e.target.value) || 0) }))}
                                        min="0"
                                        className="text-center w-16"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, infants: prev.infants + 1 }))}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Occupancy Warning */}
                        {selectedRoomClass && (formData.adults + formData.children) > selectedRoomClass.maxOccupancy && (
                            <Card className="bg-red-50 border-red-200">
                                <CardContent className="p-3">
                                    <div className="flex items-center">
                                        <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                                        <p className="text-sm text-red-700">
                                            Total guests ({formData.adults + formData.children}) exceeds room capacity ({selectedRoomClass.maxOccupancy})
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Extra Charges Preview */}
                        {selectedRoomClass && formData.adults > selectedRoomClass.standardOccupancy && (
                            <Card className="bg-amber-50 border-amber-200">
                                <CardContent className="p-3">
                                    <p className="text-sm text-amber-700">
                                        Extra person charge will apply:
                                        {formData.adults - selectedRoomClass.standardOccupancy} × LKR {selectedRoomClass.extraPersonCharge.toLocaleString()}
                                        = LKR {((formData.adults - selectedRoomClass.standardOccupancy) * selectedRoomClass.extraPersonCharge).toLocaleString()}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </Card>

                {/* Booking Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <MapPin className="w-5 h-5 mr-2" />
                            Booking Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Booking Type</Label>
                                <Select
                                    value={formData.bookingType}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, bookingType: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                                        <SelectItem value="Phone">Phone</SelectItem>
                                        <SelectItem value="Online">Online</SelectItem>
                                        <SelectItem value="Agent">Travel Agent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Purpose of Visit</Label>
                                <Select
                                    value={formData.purposeOfVisit}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, purposeOfVisit: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Leisure">Leisure</SelectItem>
                                        <SelectItem value="Business">Business</SelectItem>
                                        <SelectItem value="Event">Event/Wedding</SelectItem>
                                        <SelectItem value="Transit">Transit</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Arrival From</Label>
                            <Input
                                value={formData.arrivalFrom}
                                onChange={(e) => setFormData(prev => ({ ...prev, arrivalFrom: e.target.value }))}
                                placeholder="Airport, City, Hotel, etc."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Special Requests</Label>
                            <Textarea
                                value={formData.specialRequests}
                                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                                placeholder="Late check-in, early check-out, room preferences, etc."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Remarks</Label>
                            <Textarea
                                value={formData.remarks}
                                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                placeholder="Additional notes about this booking"
                                rows={2}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Complementary Items */}
                {complementaryItems.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Complementary Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {complementaryItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`item-${item.id}`}
                                                checked={formData.complementaryItemIds.includes(item.id)}
                                                onCheckedChange={(checked) => handleComplementaryToggle(item.id, checked as boolean)}
                                            />
                                            <div>
                                                <Label htmlFor={`item-${item.id}`} className="font-medium">
                                                    {item.name}
                                                </Label>
                                                {item.description && (
                                                    <p className="text-sm text-gray-600">{item.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">LKR {item.rate.toLocaleString()}</p>
                                            {!item.isOptional && (
                                                <p className="text-xs text-gray-500">Mandatory</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pricing & Discount */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <DollarSign className="w-5 h-5 mr-2" />
                            Pricing & Charges
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Room Charges */}
                            <div className="space-y-3">
                                <h4 className="font-medium">Room Charges</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Base Rate ({formData.billingType.replace('_', ' ')}):</span>
                                        <span>LKR {formData.baseRoomRate.toLocaleString()}</span>
                                    </div>
                                    {numberOfNights > 0 && formData.billingType === "NIGHT_STAY" && (
                                        <div className="flex justify-between">
                                            <span>× {numberOfNights} nights:</span>
                                            <span>LKR {(formData.baseRoomRate * numberOfNights).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {formData.extraCharges > 0 && (
                                        <div className="flex justify-between">
                                            <span>Extra Charges:</span>
                                            <span>LKR {formData.extraCharges.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-medium border-t pt-2">
                                        <span>Room Total:</span>
                                        <span>LKR {formData.totalRoomCharge.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Discount Section */}
                            <div className="space-y-3">
                                <h4 className="font-medium">Discount</h4>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select
                                            value={formData.discountType === null ? "NO_DISCOUNT" : formData.discountType}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value === "NO_DISCOUNT" ? null : value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Discount Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NO_DISCOUNT">No Discount</SelectItem>
                                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                                <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Input
                                            type="number"
                                            placeholder={formData.discountType === "PERCENTAGE" ? "%" : "Amount"}
                                            value={formData.discountValue || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                                            disabled={!formData.discountType}
                                        />
                                    </div>

                                    <Input
                                        placeholder="Discount reason"
                                        value={formData.discountReason}
                                        onChange={(e) => setFormData(prev => ({ ...prev, discountReason: e.target.value }))}
                                        disabled={!formData.discountType}
                                    />

                                    {formData.discountAmount > 0 && (
                                        <div className="text-sm text-green-600 font-medium">
                                            Discount: -LKR {formData.discountAmount.toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Charges */}
                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Additional Charges</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Service Charge</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.serviceCharge || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, serviceCharge: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tax</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.tax || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Commission (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.commissionPercent || ""}
                                        onChange={(e) => {
                                            const percent = parseFloat(e.target.value) || 0;
                                            const amount = (formData.totalRoomCharge * percent) / 100;
                                            setFormData(prev => ({
                                                ...prev,
                                                commissionPercent: percent,
                                                commissionAmount: amount
                                            }));
                                        }}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Total Summary */}
                        <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Room Charges:</span>
                                        <span>LKR {formData.totalRoomCharge.toLocaleString()}</span>
                                    </div>
                                    {formData.discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Discount:</span>
                                            <span>-LKR {formData.discountAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {formData.serviceCharge > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span>Service Charge:</span>
                                            <span>LKR {formData.serviceCharge.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {formData.tax > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span>Tax:</span>
                                            <span>LKR {formData.tax.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {formData.commissionAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span>Commission ({formData.commissionPercent}%):</span>
                                            <span>LKR {formData.commissionAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Total Amount:</span>
                                        <span>LKR {formData.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <CreditCard className="w-5 h-5 mr-2" />
                            Payment Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Payment Method *</Label>
                                <Select
                                    value={formData.paymentMethod}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="CARD">Card</SelectItem>
                                        <SelectItem value="ONLINE">Online Transfer</SelectItem>
                                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Advance Payment</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.advanceAmount || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, advanceAmount: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                    max={formData.totalAmount}
                                />
                            </div>
                        </div>

                        {formData.advanceAmount > 0 && (
                            <div className="space-y-2">
                                <Label>Advance Payment Remarks</Label>
                                <Textarea
                                    value={formData.advanceRemarks}
                                    onChange={(e) => setFormData(prev => ({ ...prev, advanceRemarks: e.target.value }))}
                                    placeholder="Notes about advance payment"
                                    rows={2}
                                />
                            </div>
                        )}

                        {/* Payment Summary */}
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Total Amount:</span>
                                        <span className="font-semibold">LKR {formData.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Advance Payment:</span>
                                        <span>LKR {formData.advanceAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Balance Due:</span>
                                        <span>LKR {formData.balanceAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6">
                    <Link href="/reservations">
                        <Button type="button" variant="outline" disabled={loading}>
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading || !formData.customerId || !formData.roomId}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Reservation...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Create Reservation
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}