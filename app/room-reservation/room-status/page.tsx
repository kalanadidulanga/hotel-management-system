"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
    Home,
    Search,
    CalendarIcon,
    Building,
    Bed,
    Clock,
    Users,
    Wifi,
    Tv,
    Wind,
    MapPin,
    Timer,
    CheckCircle,
    XCircle,
    AlertCircle,
    Info
} from "lucide-react";

interface Room {
    id: number;
    roomNumber: string;
    floor: string;
    roomType: string;
    status: "Available" | "Booked" | "Checkin" | "Checkout" | "Cleaning" | "Maintenance";
    checkIn?: string;
    checkOut?: string;
    guestName?: string;
    timeRemaining?: string;
    image?: string;
    amenities?: string[];
}

const mockRooms: Room[] = [
    {
        id: 1,
        roomNumber: "101",
        floor: "First Floor",
        roomType: "VIP",
        status: "Booked",
        checkOut: "2025-07-18",
        guestName: "John Doe",
        timeRemaining: "20h 37m 51s",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV", "AC"]
    },
    {
        id: 2,
        roomNumber: "102",
        floor: "First Floor",
        roomType: "Standard",
        status: "Available",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV"]
    },
    {
        id: 3,
        roomNumber: "103",
        floor: "First Floor",
        roomType: "Deluxe",
        status: "Checkin",
        checkOut: "2025-08-02",
        guestName: "Jane Smith",
        timeRemaining: "12d 17h 52m",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV", "AC"]
    },
    {
        id: 4,
        roomNumber: "104",
        floor: "First Floor",
        roomType: "Standard",
        status: "Checkout",
        checkOut: "2025-07-17",
        guestName: "Mike Johnson",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV"]
    },
    {
        id: 5,
        roomNumber: "201",
        floor: "Second Floor",
        roomType: "VIP",
        status: "Available",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV", "AC"]
    },
    {
        id: 6,
        roomNumber: "202",
        floor: "Second Floor",
        roomType: "Standard",
        status: "Cleaning",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV"]
    },
    {
        id: 7,
        roomNumber: "203",
        floor: "Second Floor",
        roomType: "Deluxe",
        status: "Available",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV", "AC"]
    },
    {
        id: 8,
        roomNumber: "204",
        floor: "Second Floor",
        roomType: "Standard",
        status: "Maintenance",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV"]
    },
    {
        id: 9,
        roomNumber: "301",
        floor: "Third Floor",
        roomType: "VIP",
        status: "Available",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV", "AC"]
    },
    {
        id: 10,
        roomNumber: "302",
        floor: "Third Floor",
        roomType: "Standard",
        status: "Available",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV"]
    },
    {
        id: 11,
        roomNumber: "303",
        floor: "Third Floor",
        roomType: "Deluxe",
        status: "Available",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV", "AC"]
    },
    {
        id: 12,
        roomNumber: "304",
        floor: "Third Floor",
        roomType: "Standard",
        status: "Available",
        image: "/api/placeholder/300/200",
        amenities: ["Wifi", "TV"]
    }
];

const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Available", label: "Available" },
    { value: "Booked", label: "Booked" },
    { value: "Checkin", label: "Check In" },
    { value: "Checkout", label: "Check Out" },
    { value: "Cleaning", label: "Cleaning" },
    { value: "Maintenance", label: "Maintenance" }
];

export default function RoomStatusPage() {
    const [searchDate, setSearchDate] = useState<Date>();
    const [searchStatus, setSearchStatus] = useState("all");
    const [floorName, setFloorName] = useState("");
    const [generalSearch, setGeneralSearch] = useState("");
    const [rooms, setRooms] = useState<Room[]>(mockRooms);

    // Timer effect for countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setRooms(prevRooms => 
                prevRooms.map(room => {
                    if (room.timeRemaining && (room.status === "Booked" || room.status === "Checkin")) {
                        // This is a simplified countdown - in real app, calculate from actual dates
                        return room;
                    }
                    return room;
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Filtering logic
    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            const matchesStatus = searchStatus === "all" || room.status === searchStatus;
            const matchesFloor = floorName === "" || room.floor.toLowerCase().includes(floorName.toLowerCase());
            const matchesSearch = generalSearch === "" || 
                room.roomNumber.toLowerCase().includes(generalSearch.toLowerCase()) ||
                room.roomType.toLowerCase().includes(generalSearch.toLowerCase()) ||
                room.guestName?.toLowerCase().includes(generalSearch.toLowerCase());
            
            return matchesStatus && matchesFloor && matchesSearch;
        });
    }, [rooms, searchStatus, floorName, generalSearch]);

    // Get status badge variant and icon
    const getStatusConfig = (status: string) => {
        switch (status) {
            case "Available":
                return { 
                    variant: "default" as const, 
                    className: "bg-green-100 text-green-800 border-green-200",
                    icon: <CheckCircle className="w-3 h-3" />
                };
            case "Booked":
                return { 
                    variant: "secondary" as const, 
                    className: "bg-blue-100 text-blue-800 border-blue-200",
                    icon: <Clock className="w-3 h-3" />
                };
            case "Checkin":
                return { 
                    variant: "outline" as const, 
                    className: "bg-orange-100 text-orange-800 border-orange-200",
                    icon: <Info className="w-3 h-3" />
                };
            case "Checkout":
                return { 
                    variant: "outline" as const, 
                    className: "bg-purple-100 text-purple-800 border-purple-200",
                    icon: <XCircle className="w-3 h-3" />
                };
            case "Cleaning":
                return { 
                    variant: "outline" as const, 
                    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
                    icon: <AlertCircle className="w-3 h-3" />
                };
            case "Maintenance":
                return { 
                    variant: "destructive" as const, 
                    className: "bg-red-100 text-red-800 border-red-200",
                    icon: <XCircle className="w-3 h-3" />
                };
            default:
                return { 
                    variant: "outline" as const, 
                    className: "bg-gray-100 text-gray-800 border-gray-200",
                    icon: <Info className="w-3 h-3" />
                };
        }
    };

    // Get amenity icon
    const getAmenityIcon = (amenity: string) => {
        switch (amenity.toLowerCase()) {
            case "wifi":
                return <Wifi className="w-3 h-3" />;
            case "tv":
                return <Tv className="w-3 h-3" />;
            case "ac":
                return <Wind className="w-3 h-3" />;
            default:
                return <Info className="w-3 h-3" />;
        }
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
                                <BreadcrumbLink href="/room-status" className="text-sm font-medium">
                                    Room Status
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title */}
                    <div className="flex items-center gap-3">
                        <Building className="w-6 h-6 text-primary" />
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Room Status</h1>
                            <p className="text-sm text-muted-foreground">Monitor real-time room availability and occupancy</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Filters */}
            <div className="flex-shrink-0 bg-white shadow-lg border-b border-border/50">
                <div className="px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search Date */}
                        <div className="space-y-2">
                            <Label htmlFor="searchDate" className="text-sm font-medium">
                                Search Date
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="searchDate"
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal h-9 rounded-lg border-border/50 shadow-sm"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {searchDate ? format(searchDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={searchDate}
                                        onSelect={setSearchDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Search Status */}
                        <div className="space-y-2">
                            <Label htmlFor="searchStatus" className="text-sm font-medium">
                                Search Status
                            </Label>
                            <Select value={searchStatus} onValueChange={setSearchStatus}>
                                <SelectTrigger id="searchStatus" className="h-9 rounded-lg border-border/50 shadow-sm">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Floor Name */}
                        <div className="space-y-2">
                            <Label htmlFor="floorName" className="text-sm font-medium">
                                Floor Name
                            </Label>
                            <Input
                                id="floorName"
                                value={floorName}
                                onChange={(e) => setFloorName(e.target.value)}
                                placeholder="Enter floor name..."
                                className="h-9 rounded-lg border-border/50 shadow-sm"
                            />
                        </div>

                        {/* Search Button */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium opacity-0">Search</Label>
                            <Button 
                                className="w-full h-9 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm"
                                onClick={() => {
                                    // Trigger search/filter
                                    console.log("Search triggered");
                                }}
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Search
                            </Button>
                        </div>

                        {/* General Search */}
                        <div className="space-y-2">
                            <Label htmlFor="generalSearch" className="text-sm font-medium">
                                General Search
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="generalSearch"
                                    value={generalSearch}
                                    onChange={(e) => setGeneralSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="pl-10 h-9 rounded-lg border-border/50 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Room Status Cards Grid */}
            <div className="flex-1 overflow-auto">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredRooms.map((room) => {
                            const statusConfig = getStatusConfig(room.status);
                            return (
                                <Card key={room.id} className="relative overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                    {/* Room Image */}
                                    <div className="relative h-32 bg-muted">
                                        <img 
                                            src={room.image} 
                                            alt={`Room ${room.roomNumber}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Status Badge */}
                                        <div className="absolute top-2 right-2">
                                            <Badge 
                                                variant={statusConfig.variant}
                                                className={`${statusConfig.className} flex items-center gap-1`}
                                            >
                                                {statusConfig.icon}
                                                {room.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="p-4 space-y-3">
                                        {/* Room Info */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-foreground">
                                                    Room No. {room.roomNumber}
                                                </h3>
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                    {room.roomType}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <MapPin className="w-3 h-3" />
                                                {room.floor}
                                            </div>
                                        </div>

                                        {/* Guest Info */}
                                        {room.guestName && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Users className="w-3 h-3" />
                                                    {room.guestName}
                                                </div>
                                            </div>
                                        )}

                                        {/* Check-in/Check-out Info */}
                                        {room.checkOut && (
                                            <div className="space-y-1">
                                                <div className="text-sm text-muted-foreground">
                                                    Check Out: {room.checkOut}
                                                </div>
                                            </div>
                                        )}

                                        {/* Time Remaining */}
                                        {room.timeRemaining && (
                                            <div className="flex items-center gap-1 text-sm font-medium text-primary">
                                                <Timer className="w-3 h-3" />
                                                {room.timeRemaining}
                                            </div>
                                        )}

                                        {/* Amenities */}
                                        {room.amenities && room.amenities.length > 0 && (
                                            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                                {room.amenities.map((amenity, index) => (
                                                    <div 
                                                        key={index}
                                                        className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                                                    >
                                                        {getAmenityIcon(amenity)}
                                                        {amenity}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* No Results */}
                    {filteredRooms.length === 0 && (
                        <div className="text-center py-12">
                            <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No rooms found</h3>
                            <p className="text-muted-foreground">
                                Try adjusting your search filters to find rooms.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}