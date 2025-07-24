"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
    Home,
    Plus,
    CalendarIcon,
    Building,
    User,
    CreditCard,
    Receipt,
    DollarSign,
    Edit,
    Trash2,
    Upload,
    Users,
    Clock,
    MapPin,
    Phone,
    Mail,
    IdCard,
    Camera,
    MessageCircle,
    List,
    Search,
    UserCheck
} from "lucide-react";

interface Customer {
    id: number;
    name: string;
    mobile: string;
    checkIn: string;
    checkOut: string;
    rent: number;
}

interface ExistingCustomer {
    id: number;
    name: string;
    mobile: string;
    email: string;
    address: string;
    nationality: string;
    identityType: string;
    identityNumber: string;
    isVip: boolean;
    dateOfBirth: string;
    gender: string;
    occupation: string;
}

interface NewCustomer {
    countryCode: string;
    mobile: string;
    title: string;
    firstName: string;
    lastName: string;
    fatherName: string;
    gender: string;
    occupation: string;
    dateOfBirth: Date | undefined;
    anniversary: Date | undefined;
    nationality: string;
    isVip: boolean;
    contactType: string;
    email: string;
    country: string;
    state: string;
    city: string;
    zipcode: string;
    address: string;
    identityType: string;
    identityNumber: string;
    frontSideImage: File | null;
    backSideImage: File | null;
    guestImage: File | null;
    comments: string;
}

const mockCustomers: Customer[] = [
    {
        id: 1,
        name: "John Doe",
        mobile: "+1234567890",
        checkIn: "2025-07-17 15:00",
        checkOut: "2025-07-17 03:00",
        rent: 35000
    }
];

// Mock existing customers database
const mockExistingCustomers: ExistingCustomer[] = [
    {
        id: 1,
        name: "Alice Johnson",
        mobile: "9876543210",
        email: "alice@example.com",
        address: "123 Main St, New York, NY",
        nationality: "American",
        identityType: "Passport",
        identityNumber: "A12345678",
        isVip: true,
        dateOfBirth: "1985-05-15",
        gender: "Female",
        occupation: "Software Engineer"
    },
    {
        id: 2,
        name: "Bob Wilson",
        mobile: "8765432109",
        email: "bob@example.com",
        address: "456 Oak Ave, Los Angeles, CA",
        nationality: "American",
        identityType: "Driver's License",
        identityNumber: "DL987654321",
        isVip: false,
        dateOfBirth: "1990-08-22",
        gender: "Male",
        occupation: "Doctor"
    },
    {
        id: 3,
        name: "Charlie Brown",
        mobile: "7654321098",
        email: "charlie@example.com",
        address: "789 Pine Rd, Chicago, IL",
        nationality: "American",
        identityType: "National ID",
        identityNumber: "N123456789",
        isVip: false,
        dateOfBirth: "1988-12-10",
        gender: "Male",
        occupation: "Teacher"
    }
];

export default function NewReservationPage() {
    // Form states
    const [checkInDate, setCheckInDate] = useState<Date>();
    const [checkOutDate, setCheckOutDate] = useState<Date>();
    const [checkInTime, setCheckInTime] = useState("15:00");
    const [checkOutTime, setCheckOutTime] = useState("12:00");
    const [arrivalFrom, setArrivalFrom] = useState("");
    const [bookingType, setBookingType] = useState("");
    const [bookingReference, setBookingReference] = useState("");
    const [purposeOfVisit, setPurposeOfVisit] = useState("");
    const [remarks, setRemarks] = useState("");

    // Room details
    const [roomType, setRoomType] = useState("");
    const [roomNumber, setRoomNumber] = useState("116");
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);

    // Customer data
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

    // Payment details
    const [discountReason, setDiscountReason] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);
    const [commissionPercent, setCommissionPercent] = useState(0);
    const [commissionAmount, setCommissionAmount] = useState(0);
    const [bookingCharge, setBookingCharge] = useState(0);
    const [tax, setTax] = useState(1750);
    const [serviceCharge, setServiceCharge] = useState(700);
    const [paymentMode, setPaymentMode] = useState("");
    const [advanceRemarks, setAdvanceRemarks] = useState("");
    const [advanceAmount, setAdvanceAmount] = useState(0);

    // Modal states
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
    const [isOldCustomerModalOpen, setIsOldCustomerModalOpen] = useState(false);

    // Old customer search states
    const [searchMobile, setSearchMobile] = useState("");
    const [foundCustomer, setFoundCustomer] = useState<ExistingCustomer | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState("");

    // New customer form state
    const [newCustomer, setNewCustomer] = useState<NewCustomer>({
        countryCode: "+1",
        mobile: "",
        title: "Mr",
        firstName: "",
        lastName: "",
        fatherName: "",
        gender: "male",
        occupation: "",
        dateOfBirth: undefined,
        anniversary: undefined,
        nationality: "",
        isVip: false,
        contactType: "",
        email: "",
        country: "",
        state: "",
        city: "",
        zipcode: "",
        address: "",
        identityType: "",
        identityNumber: "",
        frontSideImage: null,
        backSideImage: null,
        guestImage: null,
        comments: ""
    });

    // Calculate totals
    const subtotal = customers.reduce((sum, customer) => sum + customer.rent, 0);
    const total = subtotal + tax + serviceCharge - discountAmount - commissionAmount;

    // Handle file upload
    const handleFileUpload = (field: keyof NewCustomer, file: File | null) => {
        setNewCustomer(prev => ({ ...prev, [field]: file }));
    };

    // Handle search customer by mobile
    const handleSearchCustomer = () => {
        if (!searchMobile.trim()) {
            setSearchError("Please enter a mobile number");
            return;
        }

        setIsSearching(true);
        setSearchError("");

        // Simulate API call delay
        setTimeout(() => {
            const customer = mockExistingCustomers.find(c => c.mobile === searchMobile.trim());
            if (customer) {
                setFoundCustomer(customer);
                setSearchError("");
            } else {
                setFoundCustomer(null);
                setSearchError("Customer not found with this mobile number");
            }
            setIsSearching(false);
        }, 500);
    };

    // Handle add existing customer to booking
    const handleAddExistingCustomer = () => {
        if (foundCustomer) {
            const customer: Customer = {
                id: customers.length + 1,
                name: foundCustomer.name,
                mobile: foundCustomer.mobile,
                checkIn: checkInDate ? format(checkInDate, "yyyy-MM-dd") + " " + checkInTime : "",
                checkOut: checkOutDate ? format(checkOutDate, "yyyy-MM-dd") + " " + checkOutTime : "",
                rent: 35000 // Default rent
            };
            setCustomers([...customers, customer]);
            setIsOldCustomerModalOpen(false);
            // Reset search
            setSearchMobile("");
            setFoundCustomer(null);
            setSearchError("");
        }
    };

    // Handle new customer save
    const handleSaveNewCustomer = () => {
        if (newCustomer.firstName && newCustomer.mobile) {
            const customer: Customer = {
                id: customers.length + 1,
                name: `${newCustomer.firstName} ${newCustomer.lastName}`,
                mobile: newCustomer.mobile,
                checkIn: checkInDate ? format(checkInDate, "yyyy-MM-dd") + " " + checkInTime : "",
                checkOut: checkOutDate ? format(checkOutDate, "yyyy-MM-dd") + " " + checkOutTime : "",
                rent: 35000 // Default rent
            };
            setCustomers([...customers, customer]);
            setIsNewCustomerModalOpen(false);
            // Reset form
            setNewCustomer({
                countryCode: "+1",
                mobile: "",
                title: "Mr",
                firstName: "",
                lastName: "",
                fatherName: "",
                gender: "male",
                occupation: "",
                dateOfBirth: undefined,
                anniversary: undefined,
                nationality: "",
                isVip: false,
                contactType: "",
                email: "",
                country: "",
                state: "",
                city: "",
                zipcode: "",
                address: "",
                identityType: "",
                identityNumber: "",
                frontSideImage: null,
                backSideImage: null,
                guestImage: null,
                comments: ""
            });
        }
    };

    // Handle delete customer
    const handleDeleteCustomer = (id: number) => {
        setCustomers(customers.filter(c => c.id !== id));
    };

    // Reset old customer modal
    const handleCloseOldCustomerModal = () => {
        setIsOldCustomerModalOpen(false);
        setSearchMobile("");
        setFoundCustomer(null);
        setSearchError("");
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header Section */}
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
                <div className="px-4 py-4 space-y-4">
                    {/* Back Button */}
                    <button
                        onClick={() => history.back()}
                        className="flex items-center text-sm font-medium text-secondary hover:text-secondary gap-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    {/* Title & Booking List Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Building className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">New Reservation</h1>
                                <p className="text-sm text-muted-foreground">Create a new hotel reservation</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                        >
                            <List className="w-4 h-4" />
                            Booking List
                        </Button>
                    </div>
                </div>
            </div>


            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6 space-y-6">
                    {/* Reservation Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5" />
                                Reservation Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Check In Date & Time */}
                                <div className="space-y-2">
                                    <Label>Check In Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {checkInDate ? format(checkInDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={checkInDate} onSelect={setCheckInDate} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Check In Time</Label>
                                    <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
                                </div>

                                {/* Check Out Date & Time */}
                                <div className="space-y-2">
                                    <Label>Check Out Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {checkOutDate ? format(checkOutDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={checkOutDate} onSelect={setCheckOutDate} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Check Out Time</Label>
                                    <Input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
                                </div>

                                {/* Other fields */}
                                <div className="space-y-2">
                                    <Label>Arrival From</Label>
                                    <Input value={arrivalFrom} onChange={(e) => setArrivalFrom(e.target.value)} placeholder="Enter arrival location" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Booking Type</Label>
                                    <Select value={bookingType} onValueChange={setBookingType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select booking type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="walk-in">Walk-in</SelectItem>
                                            <SelectItem value="phone">Phone</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Booking Reference</Label>
                                    <Select value={bookingReference} onValueChange={setBookingReference}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose reference" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="direct">Direct</SelectItem>
                                            <SelectItem value="booking.com">Booking.com</SelectItem>
                                            <SelectItem value="expedia">Expedia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Purpose of Visit</Label>
                                    <Input value={purposeOfVisit} onChange={(e) => setPurposeOfVisit(e.target.value)} placeholder="Enter purpose" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Remarks</Label>
                                    <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter remarks" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Room Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="w-5 h-5" />
                                Room Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Room Type</Label>
                                    <Select value={roomType} onValueChange={setRoomType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select room type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single Room</SelectItem>
                                            <SelectItem value="double">Double Room</SelectItem>
                                            <SelectItem value="suite">Suite</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Room No.</Label>
                                    <Select value={roomNumber} onValueChange={setRoomNumber}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="116">116</SelectItem>
                                            <SelectItem value="117">117</SelectItem>
                                            <SelectItem value="118">118</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>#Adults</Label>
                                    <Input type="number" value={adults} onChange={(e) => setAdults(Number(e.target.value))} min="1" />
                                </div>
                                <div className="space-y-2">
                                    <Label>#Children</Label>
                                    <Input type="number" value={children} onChange={(e) => setChildren(Number(e.target.value))} min="0" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Customer Info
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setIsNewCustomerModalOpen(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        New Customer
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsOldCustomerModalOpen(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Users className="w-4 h-4" />
                                        Old Customer
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SL</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Mobile No</TableHead>
                                        <TableHead>Check In</TableHead>
                                        <TableHead>Check Out</TableHead>
                                        <TableHead>Rent</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map((customer, index) => (
                                        <TableRow key={customer.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{customer.name}</TableCell>
                                            <TableCell>{customer.mobile}</TableCell>
                                            <TableCell>{customer.checkIn}</TableCell>
                                            <TableCell>{customer.checkOut}</TableCell>
                                            <TableCell>{customer.rent.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleDeleteCustomer(customer.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Payment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Payment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Discount Reason</Label>
                                    <Input value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} placeholder="Enter discount reason" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Discount Amount</Label>
                                    <Input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Commission (%)</Label>
                                    <Input type="number" value={commissionPercent} onChange={(e) => setCommissionPercent(Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Commission Amount</Label>
                                    <Input type="number" value={commissionAmount} onChange={(e) => setCommissionAmount(Number(e.target.value))} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Billing Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="w-5 h-5" />
                                Billing Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Booking Charge</Label>
                                    <Input type="number" value={bookingCharge} onChange={(e) => setBookingCharge(Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tax</Label>
                                    <Input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Service Charge</Label>
                                    <Input type="number" value={serviceCharge} onChange={(e) => setServiceCharge(Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total</Label>
                                    <Input type="number" value={total} readOnly className="bg-muted" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Advance Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Advance Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Payment Mode</Label>
                                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="card">Card</SelectItem>
                                            <SelectItem value="upi">UPI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Advance Remarks</Label>
                                    <Input value={advanceRemarks} onChange={(e) => setAdvanceRemarks(e.target.value)} placeholder="Enter remarks" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Advance Amount</Label>
                                    <Input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="text-lg font-semibold">Total Amount: Rs.{total.toLocaleString()}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button className="px-8">
                            Save Reservation
                        </Button>
                    </div>
                </div>
            </div>

            {/* Old Customer Modal */}
            <Dialog open={isOldCustomerModalOpen} onOpenChange={handleCloseOldCustomerModal}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Find Existing Customer
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        {/* Search Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Search className="w-5 h-5" />
                                    Search Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex-1 space-y-2">
                                        <Label>Mobile Number</Label>
                                        <Input
                                            value={searchMobile}
                                            onChange={(e) => setSearchMobile(e.target.value)}
                                            placeholder="Enter mobile number"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            onClick={handleSearchCustomer}
                                            disabled={isSearching}
                                            className="px-6"
                                        >
                                            {isSearching ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                    Searching...
                                                </>
                                            ) : (
                                                <>
                                                    <Search className="w-4 h-4 mr-2" />
                                                    Search
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                {searchError && (
                                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                                        {searchError}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Customer Details Section */}
                        {foundCustomer && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <UserCheck className="w-5 h-5" />
                                        Customer Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Name</p>
                                                    <p className="font-medium">{foundCustomer.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Mobile</p>
                                                    <p className="font-medium">{foundCustomer.mobile}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Email</p>
                                                    <p className="font-medium">{foundCustomer.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Address</p>
                                                    <p className="font-medium">{foundCustomer.address}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <IdCard className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Identity</p>
                                                    <p className="font-medium">{foundCustomer.identityType}</p>
                                                    <p className="text-sm text-muted-foreground">{foundCustomer.identityNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Gender</p>
                                                    <p className="font-medium">{foundCustomer.gender}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Building className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Occupation</p>
                                                    <p className="font-medium">{foundCustomer.occupation}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {foundCustomer.isVip && (
                                                    <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                                        VIP Customer
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={handleCloseOldCustomerModal}>
                                Cancel
                            </Button>
                            {foundCustomer && (
                                <Button onClick={handleAddExistingCustomer}>
                                    Add to Booking
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* New Customer Modal */}
            <Dialog open={isNewCustomerModalOpen} onOpenChange={setIsNewCustomerModalOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            New Customer
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        {/* Guest Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <User className="w-5 h-5" />
                                    Guest Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Country Code</Label>
                                        <Select value={newCustomer.countryCode} onValueChange={(value) => setNewCustomer(prev => ({ ...prev, countryCode: value }))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="+1">+1 (US)</SelectItem>
                                                <SelectItem value="+91">+91 (India)</SelectItem>
                                                <SelectItem value="+44">+44 (UK)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mobile No</Label>
                                        <Input value={newCustomer.mobile} onChange={(e) => setNewCustomer(prev => ({ ...prev, mobile: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Select value={newCustomer.title} onValueChange={(value) => setNewCustomer(prev => ({ ...prev, title: value }))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Mr">Mr</SelectItem>
                                                <SelectItem value="Mrs">Mrs</SelectItem>
                                                <SelectItem value="Ms">Ms</SelectItem>
                                                <SelectItem value="Dr">Dr</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>First Name *</Label>
                                        <Input value={newCustomer.firstName} onChange={(e) => setNewCustomer(prev => ({ ...prev, firstName: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Last Name</Label>
                                        <Input value={newCustomer.lastName} onChange={(e) => setNewCustomer(prev => ({ ...prev, lastName: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Father Name</Label>
                                        <Input value={newCustomer.fatherName} onChange={(e) => setNewCustomer(prev => ({ ...prev, fatherName: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gender</Label>
                                        <RadioGroup value={newCustomer.gender} onValueChange={(value) => setNewCustomer(prev => ({ ...prev, gender: value }))}>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="male" id="male" />
                                                <Label htmlFor="male">Male</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="female" id="female" />
                                                <Label htmlFor="female">Female</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Occupation</Label>
                                        <Input value={newCustomer.occupation} onChange={(e) => setNewCustomer(prev => ({ ...prev, occupation: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date of Birth</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {newCustomer.dateOfBirth ? format(newCustomer.dateOfBirth, "PPP") : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={newCustomer.dateOfBirth} onSelect={(date) => setNewCustomer(prev => ({ ...prev, dateOfBirth: date }))} />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Anniversary</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {newCustomer.anniversary ? format(newCustomer.anniversary, "PPP") : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={newCustomer.anniversary} onSelect={(date) => setNewCustomer(prev => ({ ...prev, anniversary: date }))} />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nationality</Label>
                                        <Input value={newCustomer.nationality} onChange={(e) => setNewCustomer(prev => ({ ...prev, nationality: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="vip"
                                                checked={newCustomer.isVip}
                                                onCheckedChange={(checked) => setNewCustomer(prev => ({ ...prev, isVip: checked as boolean }))}
                                            />
                                            <Label htmlFor="vip">VIP?</Label>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Phone className="w-5 h-5" />
                                    Contact Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Contact Type</Label>
                                        <Select value={newCustomer.contactType} onValueChange={(value) => setNewCustomer(prev => ({ ...prev, contactType: value }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select contact type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="home">Home</SelectItem>
                                                <SelectItem value="work">Work</SelectItem>
                                                <SelectItem value="mobile">Mobile</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input value={newCustomer.country} onChange={(e) => setNewCustomer(prev => ({ ...prev, country: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input value={newCustomer.state} onChange={(e) => setNewCustomer(prev => ({ ...prev, state: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input value={newCustomer.city} onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Zipcode</Label>
                                        <Input value={newCustomer.zipcode} onChange={(e) => setNewCustomer(prev => ({ ...prev, zipcode: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                        <Label>Address</Label>
                                        <Textarea value={newCustomer.address} onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Identity Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <IdCard className="w-5 h-5" />
                                    Identity Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Identity Type</Label>
                                        <Select value={newCustomer.identityType} onValueChange={(value) => setNewCustomer(prev => ({ ...prev, identityType: value }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select identity type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="passport">Passport</SelectItem>
                                                <SelectItem value="driver-license">Driver's License</SelectItem>
                                                <SelectItem value="national-id">National ID</SelectItem>
                                                <SelectItem value="aadhar">Aadhar Card</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ID #</Label>
                                        <Input value={newCustomer.identityNumber} onChange={(e) => setNewCustomer(prev => ({ ...prev, identityNumber: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Front Side</Label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm text-gray-600">Upload front side</p>
                                            <p className="text-xs text-gray-400">JPG, JPEG, PNG, SVG</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="mt-2"
                                                onChange={(e) => handleFileUpload('frontSideImage', e.target.files?.[0] || null)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Back Side</Label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm text-gray-600">Upload back side</p>
                                            <p className="text-xs text-gray-400">JPG, JPEG, PNG, SVG</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="mt-2"
                                                onChange={(e) => handleFileUpload('backSideImage', e.target.files?.[0] || null)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Guest Image */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Camera className="w-5 h-5" />
                                    Guest Image
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-lg font-medium text-gray-600 mb-2">Drag and Drop</p>
                                    <p className="text-sm text-gray-400 mb-4">or click to upload guest photo</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload('guestImage', e.target.files?.[0] || null)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Comments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MessageCircle className="w-5 h-5" />
                                    Comments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={newCustomer.comments}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, comments: e.target.value }))}
                                    placeholder="Enter any additional comments or remarks..."
                                    rows={4}
                                />
                            </CardContent>
                        </Card>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsNewCustomerModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveNewCustomer}>
                                Save Customer
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}