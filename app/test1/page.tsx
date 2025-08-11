"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { countries } from "@/data/countries";
import { differenceInDays, differenceInHours, format } from "date-fns";
import {
  Building,
  CalendarIcon,
  Camera,
  CreditCard,
  DollarSign,
  Edit,
  Gift,
  IdCard,
  List,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  Upload,
  User,
  UserCheck,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from 'swr';

interface Customer {
  id: number;
  name: string;
  mobile: string;
  checkIn: string;
  checkOut: string;
}

interface ExistingCustomer {
  id: number;
  firstName: string;
  phone: string;
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

interface Complimentary {
  id: string;
  roomType: string;
  complementary: string;
  rate: number;
}

interface BookingType {
  id: number;
  name: string;
}

interface BookingSource {
  id: number;
  bookingTypeId: number;
  bookingSource: string;
  commissionRate: number;
  totalBalance: number;
  paidAmount: number;
  dueAmount: number;
}

interface RoomType {
  id: number;
  roomType: string;
  rate: number;
  hourlyCharge: number;
}

const mockCustomers: Customer[] = [];

// Mock existing customers database
const mockExistingCustomers: ExistingCustomer[] = [];

// Room data with hourly rates (fallback)
const roomTypes = {
  "single": {
    name: "Single Room",
    nightlyRate: 25000,
    hourlyRate: 1500,
    rooms: ["101", "102", "103"]
  },
  "double": {
    name: "Double Room",
    nightlyRate: 35000,
    hourlyRate: 2000,
    rooms: ["201", "202", "203"]
  },
  "suite": {
    name: "Suite",
    nightlyRate: 75000,
    hourlyRate: 4500,
    rooms: ["301", "302", "303"]
  }
};

// Complimentary items (fallback)
const complimentaryItems: Complimentary[] = [
  { id: "welcome-drink", roomType: "single", complementary: "Welcome Drink", rate: 500 },
  { id: "breakfast", roomType: "double", complementary: "Breakfast", rate: 1200 },
  { id: "airport-transfer", roomType: "suite", complementary: "Airport Transfer", rate: 3000 },
  { id: "late-checkout", roomType: "single", complementary: "Late Checkout", rate: 1500 },
  { id: "early-checkin", roomType: "double", complementary: "Early Check-in", rate: 2000 },
];

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

export default function NewReservationPage() {
  // Form states
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [arrivalFrom, setArrivalFrom] = useState("");
  const [bookingType, setBookingType] = useState("");
  const [bookingSource, setBookingSource] = useState("");

  const [purposeOfVisit, setPurposeOfVisit] = useState("");
  const [remarks, setRemarks] = useState("");

  // Room details
  const [roomType, setRoomType] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [roomPrice, setRoomPrice] = useState(0);

  // Billing options
  const [billingType, setBillingType] = useState("nightly"); // "nightly" or "hourly"

  // Complimentary
  const [selectedComplimentary, setSelectedComplimentary] = useState<string[]>([]);

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

  // Fetch booking types
  const { data: bookingTypes = [], isLoading: isLoadingBookingTypes } = useSWR<BookingType[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-type-list`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onError: (error) => {
        console.error("Failed to load booking types:", error);
      }
    }
  );

  // Fetch booking sources based on selected booking type
  const { data: bookingSources = [], isLoading: isLoadingBookingSources } = useSWR<BookingSource[]>(
    bookingType ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-reservation/booking-sources?bookingType=${bookingType}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onError: (error) => {
        console.error("Failed to load booking sources:", error);
      }
    }
  );

  // Fetch room types
  const { data: roomTypesData = [], isLoading: isLoadingRoomTypes } = useSWR<RoomType[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/room-list`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onError: (error) => {
        console.error("Failed to load room types:", error);
      }
    }
  );

  // Fetch complimentary items from API
  const { data: apiComplimentaryItems = [], isLoading: isLoadingComplimentary } = useSWR<Complimentary[]>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/complementary-list`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onError: (error) => {
        console.error("Failed to load complementary items:", error);
      }
    }
  );

  // Use API data if available, otherwise fallback to mock/default data
  const availableComplimentaryItems = apiComplimentaryItems.length > 0 ? apiComplimentaryItems : complimentaryItems;
  const availableRoomTypes = roomTypesData.length > 0 ? roomTypesData : Object.entries(roomTypes).map(([key, value]) => ({
    id: key,
    roomType: value.name,
    rate: value.nightlyRate,
    hourlyCharge: value.hourlyRate
  }));

  // New customer form state
  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    countryCode: "+94",
    mobile: "",
    title: "Mr",
    firstName: "",
    lastName: "",
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

  // Handle booking type change - reset booking source when booking type changes
  const handleBookingTypeChange = (value: string) => {
    setBookingType(value);
    setBookingSource(""); // Reset booking source when booking type changes
  };

  // Calculate room price based on billing type and duration
  const calculateRoomPrice = () => {
    if (!roomType || !checkInDate || !checkOutDate) return 0;

    // Try API data first, then fallback to mock data
    let roomInfo;
    if (roomTypesData.length > 0) {
      roomInfo = roomTypesData.find(rt => rt.roomType === roomType);
    } else {
      const mockRoomKey = Object.keys(roomTypes).find(key =>
        roomTypes[key as keyof typeof roomTypes].name === roomType
      );
      if (mockRoomKey) {
        const mockRoom = roomTypes[mockRoomKey as keyof typeof roomTypes];
        roomInfo = {
          rate: mockRoom.nightlyRate,
          hourlyCharge: mockRoom.hourlyRate
        };
      }
    }

    if (!roomInfo) return 0;

    // Create full datetime objects
    const checkIn = new Date(checkInDate);
    const [checkInHour, checkInMinute] = checkInTime.split(':');
    checkIn.setHours(parseInt(checkInHour), parseInt(checkInMinute));

    const checkOut = new Date(checkOutDate);
    const [checkOutHour, checkOutMinute] = checkOutTime.split(':');
    checkOut.setHours(parseInt(checkOutHour), parseInt(checkOutMinute));

    if (billingType === "hourly") {
      const totalHours = differenceInHours(checkOut, checkIn);
      return Math.max(1, totalHours) * roomInfo.hourlyCharge; // Minimum 1 hour
    } else {
      const totalNights = differenceInDays(checkOut, checkIn);
      const nights = totalNights <= 0 ? 1 : totalNights; // Minimum 1 night
      return nights * roomInfo.rate;
    }
  };

  // Handle room type change
  const handleRoomTypeChange = (type: string) => {
    setRoomType(type);
    setRoomNumber(""); // Reset room number when type changes
  };

  // Update room price when dependencies change
  useEffect(() => {
    const newPrice = calculateRoomPrice();
    setRoomPrice(newPrice);
  }, [roomType, checkInDate, checkOutDate, checkInTime, checkOutTime, billingType, roomTypesData]);

  // Handle room number change
  const handleRoomNumberChange = (number: string) => {
    setRoomNumber(number);
  };

  // Handle complimentary selection
  const handleComplimentaryChange = (itemId: string, checked: boolean) => {
    if (!roomType) return; // Prevent selection if no room type is selected

    if (checked) {
      setSelectedComplimentary([...selectedComplimentary, itemId]);
    } else {
      setSelectedComplimentary(selectedComplimentary.filter(id => id !== itemId));
    }
  };

  // Calculate complimentary total
  const complimentaryTotal = selectedComplimentary.reduce((sum, itemId) => {
    const item = availableComplimentaryItems.find(c => c.id === itemId);
    return sum + (item ? item.rate : 0);
  }, 0);

  // Calculate totals
  const subtotal = customers.reduce((sum, customer) => sum + 0, 0) + roomPrice + complimentaryTotal;
  const total = subtotal + tax + serviceCharge - discountAmount - commissionAmount;

  // Get duration info for display
  const getDurationInfo = () => {
    if (!checkInDate || !checkOutDate) return "";

    const checkIn = new Date(checkInDate);
    const [checkInHour, checkInMinute] = checkInTime.split(':');
    checkIn.setHours(parseInt(checkInHour), parseInt(checkInMinute));

    const checkOut = new Date(checkOutDate);
    const [checkOutHour, checkOutMinute] = checkOutTime.split(':');
    checkOut.setHours(parseInt(checkOutHour), parseInt(checkOutMinute));

    if (billingType === "hourly") {
      const totalHours = Math.max(1, differenceInHours(checkOut, checkIn));
      return `${totalHours} hour${totalHours > 1 ? 's' : ''}`;
    } else {
      const totalNights = differenceInDays(checkOut, checkIn);
      const nights = totalNights <= 0 ? 1 : totalNights;
      return `${nights} night${nights > 1 ? 's' : ''}`;
    }
  };

  // Get available room numbers for selected room type
  const getAvailableRooms = (selectedRoomType: string) => {
    // Try to find in mock data first
    const mockRoomKey = Object.keys(roomTypes).find(key =>
      roomTypes[key as keyof typeof roomTypes].name === selectedRoomType
    );

    if (mockRoomKey) {
      return roomTypes[mockRoomKey as keyof typeof roomTypes].rooms;
    }

    // If not found in mock data, return some default rooms based on room type
    const mockRooms = {
      "Standard Room": ["101", "102", "103", "201", "202", "203"],
      "Deluxe Room": ["301", "302", "303", "401", "402"],
      "Executive Suite": ["501", "502", "601", "602"],
      "VIP Suite": ["701", "702", "801"],
      "Presidential Suite": ["901"]
    };
    return mockRooms[selectedRoomType as keyof typeof mockRooms] || [];
  };

  // Handle file upload
  const handleFileUpload = (field: keyof NewCustomer, file: File | null) => {
    setNewCustomer(prev => ({ ...prev, [field]: file }));
  };

  // Handle search customer by mobile
  const handleSearchCustomer = async () => {
    if (!searchMobile.trim()) {
      setSearchError("Please enter a mobile number");
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const response = await fetch(`/api/room-reservation/new-customer?mobile=${searchMobile.trim()}`);
      const data = await response.json();

      if (response.ok) {
        setFoundCustomer(data.customer);
      } else {
        setFoundCustomer(null);
        setSearchError(data.error || "Customer not found");
      }
    } catch (err) {
      console.error(err);
      setSearchError("Something went wrong");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle add existing customer to booking
  const handleAddExistingCustomer = () => {
    if (foundCustomer) {
      const customer: Customer = {
        id: customers.length + 1,
        name: foundCustomer.firstName,
        mobile: foundCustomer.phone,
        checkIn: checkInDate ? format(checkInDate, "yyyy-MM-dd") + " " + checkInTime : "",
        checkOut: checkOutDate ? format(checkOutDate, "yyyy-MM-dd") + " " + checkOutTime : "",
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
  const handleSaveNewCustomer = async () => {
    if (!newCustomer.firstName || !newCustomer.mobile) {
      alert("First name and mobile are required.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("countryCode", newCustomer.countryCode);
      formData.append("mobile", newCustomer.mobile);
      formData.append("title", newCustomer.title);
      formData.append("firstName", newCustomer.firstName);
      formData.append("lastName", newCustomer.lastName || "");
      formData.append("gender", newCustomer.gender);
      formData.append("occupation", newCustomer.occupation || "");
      if (newCustomer.dateOfBirth) {
        formData.append("dateOfBirth", newCustomer.dateOfBirth.toISOString());
      }
      if (newCustomer.anniversary) {
        formData.append("anniversary", newCustomer.anniversary.toISOString());
      }
      formData.append("nationality", newCustomer.nationality);
      formData.append("isVip", newCustomer.isVip.toString());
      formData.append("contactType", newCustomer.contactType);
      formData.append("email", newCustomer.email);
      formData.append("country", newCustomer.country);
      formData.append("state", newCustomer.state);
      formData.append("city", newCustomer.city);
      formData.append("zipcode", newCustomer.zipcode);
      formData.append("address", newCustomer.address);
      formData.append("identityType", newCustomer.identityType);
      formData.append("identityNumber", newCustomer.identityNumber);

      if (newCustomer.frontSideImage) {
        formData.append("frontSideImage", newCustomer.frontSideImage);
      }
      if (newCustomer.backSideImage) {
        formData.append("backSideImage", newCustomer.backSideImage);
      }
      if (newCustomer.guestImage) {
        formData.append("guestImage", newCustomer.guestImage);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-reservation/new-customer`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save customer.");

      const result = await res.json();
      console.log("Customer saved:", result);

      // You may update UI with result.customer if needed
      const customer: Customer = {
        id: result.customer.id,
        name: `${newCustomer.firstName} ${newCustomer.lastName}`,
        mobile: newCustomer.mobile,
        checkIn: checkInDate ? format(checkInDate, "yyyy-MM-dd") + " " + checkInTime : "",
        checkOut: checkOutDate ? format(checkOutDate, "yyyy-MM-dd") + " " + checkOutTime : "",
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
        comments: "",
      });
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer. See console for details.");
    }
  };

  const handleSaveNewReservation = async () => {
    // Implementation for saving reservation
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
            className="flex items-center text-sm font-medium text-secondary hover:text-primary gap-2"
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

                {/* Billing Type */}
                <div className="space-y-2">
                  <Label>Billing Type</Label>
                  <Select value={billingType} onValueChange={setBillingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nightly">Per Night</SelectItem>
                      <SelectItem value="hourly">Per Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Other fields */}
                <div className="space-y-2">
                  <Label>Arrival From</Label>
                  <Input value={arrivalFrom} onChange={(e) => setArrivalFrom(e.target.value)} placeholder="Enter arrival location" />
                </div>

                {/* Booking Type */}
                <div className="space-y-2">
                  <Label>Booking Type</Label>
                  <Select
                    value={bookingType}
                    onValueChange={handleBookingTypeChange}
                    disabled={isLoadingBookingTypes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingBookingTypes ? "Loading..." : "Select booking type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {bookingTypes.map(type => (
                        <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                      ))}
                      {/* Fallback options if API fails */}
                      {bookingTypes.length === 0 && !isLoadingBookingTypes && (
                        <>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="walk-in">Walk-in</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Booking Source - only show when booking type is selected */}
                <div className="space-y-2">
                  <Label>Booking Source</Label>
                  <Select
                    value={bookingSource}
                    onValueChange={setBookingSource}
                    disabled={!bookingType || isLoadingBookingSources}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !bookingType
                          ? "Select booking type first"
                          : isLoadingBookingSources
                            ? "Loading sources..."
                            : "Select booking source"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {bookingSources.map(source => (
                        <SelectItem key={source.id} value={source.bookingSource}>
                          {source.bookingSource}
                          {source.commissionRate > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({source.commissionRate}% commission)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                      {bookingSources.length === 0 && bookingType && !isLoadingBookingSources && (
                        <SelectItem value="" disabled>No sources available for this booking type</SelectItem>
                      )}
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
                  <Select
                    value={roomType}
                    onValueChange={handleRoomTypeChange}
                    disabled={isLoadingRoomTypes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingRoomTypes ? "Loading..." : "Select room type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoomTypes.map(type => (
                        <SelectItem key={type.id} value={type.roomType}>{type.roomType}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room No.</Label>
                  <Select
                    value={roomNumber}
                    onValueChange={handleRoomNumberChange}
                    disabled={!roomType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={roomType ? "Select room number" : "Select room type first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {roomType && getAvailableRooms(roomType).map(room => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                      ))}
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
              {roomType && availableRoomTypes.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <strong>Duration:</strong> {getDurationInfo()}
                    </div>
                    <div>
                      <strong>Billing:</strong> {billingType === "hourly" ? "Per Hour" : "Per Night"}
                    </div>
                    <div>
                      <strong>Rate:</strong> Rs. {billingType === "hourly"
                        ? availableRoomTypes.find(rt => rt.roomType === roomType)?.hourlyCharge?.toLocaleString()
                        : availableRoomTypes.find(rt => rt.roomType === roomType)?.rate?.toLocaleString()
                      }/{billingType === "hourly" ? "hour" : "night"}
                    </div>
                    <div>
                      <strong>Total Room Price:</strong> Rs. {roomPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complimentary Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Complimentary Services
                {!roomType && (
                  <span className="text-sm text-muted-foreground ml-2">(Select room type first)</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!roomType ? (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Please select a room type to view available complimentary services</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableComplimentaryItems.filter(item => item.roomType === roomType).map(item => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={item.id}
                          checked={selectedComplimentary.includes(item.id)}
                          onCheckedChange={(checked) => handleComplimentaryChange(item.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={item.id} className="font-medium cursor-pointer">
                            {item.complementary}
                          </Label>
                          <p className="text-sm text-muted-foreground">Rs. {item.rate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedComplimentary.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Complimentary Total:</strong> Rs. {complimentaryTotal.toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}
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
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer, index) => (
                    <TableRow key={customer.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.mobile}</TableCell>
                      <TableCell>{checkInDate ? format(checkInDate, "PPP p") : ""}</TableCell>
                      <TableCell>{checkOutDate ? format(checkOutDate, "PPP p") : ""}</TableCell>
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
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Room Price ({getDurationInfo()}): Rs. {roomPrice.toLocaleString()}</div>
                  <div>Complimentary: Rs. {complimentaryTotal.toLocaleString()}</div>
                  <div>Tax: Rs. {tax.toLocaleString()}</div>
                  <div>Service Charge: Rs. {serviceCharge.toLocaleString()}</div>
                  <div>Discount: -Rs. {discountAmount.toLocaleString()}</div>
                  <div>Commission: -Rs. {commissionAmount.toLocaleString()}</div>
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
            <Button onClick={handleSaveNewReservation} className="px-8">
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
                          <p className="font-medium">{foundCustomer.firstName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{foundCustomer.phone}</p>
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
                                                      <SelectItem value="+94">+44 (UK)</SelectItem>
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
                                              <Label>Gender</Label>
                                              <RadioGroup value={newCustomer.gender} onValueChange={(value) => setNewCustomer(prev => ({ ...prev, gender: value }))}>
                                                  <div className="flex items-center space-x-2">
                                                      <RadioGroupItem className="border border-gray-500" value="male" id="male" />
                                                      <Label htmlFor="male">Male</Label>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                      <RadioGroupItem className="border border-gray-500" value="female" id="female" />
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
      
                                              <RadioGroup value={newCustomer.nationality} onValueChange={(value) => setNewCustomer(prev => ({ ...prev, nationality: value }))}>
                                                  <div className="flex items-center space-x-2">
                                                      <RadioGroupItem className="border border-gray-500" value="native" id="native" />
                                                      <Label htmlFor="native">Native</Label>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                      <RadioGroupItem className="border border-gray-500" value="foreigner" id="foreigner" />
                                                      <Label htmlFor="foreigner">Foreigner</Label>
                                                  </div>
                                              </RadioGroup>
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
                                              <Textarea className="border border-gray-200" value={newCustomer.address} onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))} />
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