"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
    CalendarIcon,
    Search,
    Clock,
    User,
    Building2,
    Bed
} from "lucide-react";

interface Room {
    id: number;
    roomNumber: string;
    floor: string;
    roomType: string;
    status: 'available' | 'booked' | 'checkin';
    checkOutDate?: Date;
    checkOutTime?: string;
    guestName?: string;
}

const mockRooms: Room[] = [
    {
        id: 101,
        roomNumber: "101",
        floor: "First Floor",
        roomType: "VIP",
        status: "available"
    },
    {
        id: 102,
        roomNumber: "102",
        floor: "First Floor",
        roomType: "Standard",
        status: "checkin",
        checkOutDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        checkOutTime: "12:00",
        guestName: "John Doe"
    },
    {
        id: 103,
        roomNumber: "103",
        floor: "First Floor",
        roomType: "Deluxe",
        status: "booked",
        checkOutDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        checkOutTime: "11:00",
        guestName: "Jane Smith"
    },
    {
        id: 201,
        roomNumber: "201",
        floor: "Second Floor",
        roomType: "Suite",
        status: "available"
    },
    {
        id: 202,
        roomNumber: "202",
        floor: "Second Floor",
        roomType: "Standard",
        status: "checkin",
        checkOutDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        checkOutTime: "14:00",
        guestName: "Mike Wilson"
    },
    {
        id: 203,
        roomNumber: "203",
        floor: "Second Floor",
        roomType: "VIP",
        status: "booked",
        checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        checkOutTime: "10:00",
        guestName: "Sarah Johnson"
    }
];

export default function RoomStatusPage() {
    const [rooms, setRooms] = useState<Room[]>(mockRooms);
    const [filteredRooms, setFilteredRooms] = useState<Room[]>(mockRooms);
    const [searchDate, setSearchDate] = useState<Date>();
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [floorFilter, setFloorFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [countdowns, setCountdowns] = useState<{ [key: number]: string }>({});

    // Calculate countdown timer
    const calculateCountdown = (checkOutDate: Date, checkOutTime: string) => {
        const now = new Date();
        const checkOut = new Date(checkOutDate);
        const [hours, minutes] = checkOutTime.split(':');
        checkOut.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const diff = checkOut.getTime() - now.getTime();

        if (diff <= 0) return "Overdue";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const remainingHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
            return `${days}d ${remainingHours}h ${remainingMinutes}m ${seconds}s`;
        } else {
            return `${remainingHours}h ${remainingMinutes}m ${seconds}s`;
        }
    };

    // Update countdown every second
    useEffect(() => {
        const interval = setInterval(() => {
            const newCountdowns: { [key: number]: string } = {};
            rooms.forEach(room => {
                if (room.checkOutDate && room.checkOutTime && (room.status === 'checkin' || room.status === 'booked')) {
                    newCountdowns[room.id] = calculateCountdown(room.checkOutDate, room.checkOutTime);
                }
            });
            setCountdowns(newCountdowns);
        }, 1000);

        return () => clearInterval(interval);
    }, [rooms]);

    // Filter rooms based on search criteria
    useEffect(() => {
        let filtered = rooms;

        if (statusFilter && statusFilter !== "All") {
            filtered = filtered.filter(room => room.status === statusFilter);
        }

        if (floorFilter && floorFilter !== "All") {
            filtered = filtered.filter(room => room.floor === floorFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(room =>
                room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.roomType.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredRooms(filtered);
    }, [statusFilter, floorFilter, searchQuery, rooms]);

    const handleSearch = () => {
        // Implement additional search logic if needed
        console.log("Search triggered");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-green-500 hover:bg-green-600';
            case 'checkin':
                return 'bg-yellow-500 hover:bg-yellow-600';
            case 'booked':
                return 'bg-blue-500 hover:bg-blue-600';
            default:
                return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'available':
                return 'Available';
            case 'checkin':
                return 'Check In';
            case 'booked':
                return 'Booked';
            default:
                return 'Unknown';
        }
    };

    const uniqueFloors = Array.from(new Set(rooms.map(room => room.floor)));

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
            {/* Header Section */}
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200">
                <div className="px-6 py-4 space-y-4">
                    {/* Page Title */}
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Room Status</h1>
                            <p className="text-sm text-gray-600">Monitor room availability and occupancy</p>
                        </div>
                    </div>

                    {/* Search & Filter Controls */}
                    <div className="flex flex-wrap items-end gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        {/* Search Date */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Search Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[200px] justify-start border border-gray-300">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {searchDate ? format(searchDate, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={searchDate} onSelect={setSearchDate} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Search Status */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Search Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px] border border-gray-300">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Status</SelectItem>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="checkin">Check In</SelectItem>
                                    <SelectItem value="booked">Booked</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Floor Name */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Floor Name</Label>
                            <Select value={floorFilter} onValueChange={setFloorFilter}>
                                <SelectTrigger className="w-[150px] border border-gray-300">
                                    <SelectValue placeholder="All Floors" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Floors</SelectItem>
                                    {uniqueFloors.map(floor => (
                                        <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Button */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium invisible">Search</Label>
                            <Button
                                onClick={handleSearch}
                                className="bg-green-600 hover:bg-green-700 text-white px-6"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Search
                            </Button>
                        </div>

                        {/* Search Field */}
                        <div className="space-y-2 ml-auto">
                            <Label className="text-sm font-medium">Search</Label>
                            <Input
                                placeholder="Room number, guest name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-[250px] border border-gray-300"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Room Cards Grid */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredRooms.map((room) => (
                            <Card
                                key={room.id}
                                className="overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer h-fit"
                            >
                                <div className="relative">
                                    {/* Room Image with Gradient Overlay */}
                                    <div
                                        className="h-48 bg-cover bg-center relative flex items-center justify-center"
                                        style={{
                                            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url(https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop&crop=center)`
                                        }}
                                    >
                                        {/* Floor Name */}
                                        <div className="absolute top-3 left-3">
                                            <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                                                {room.floor}
                                            </span>
                                        </div>

                                        {/* Room Info Overlay - Centered */}
                                        <div className="text-center text-white">
                                            <h3 className="text-2xl font-bold mb-1">Room No. {room.roomNumber}</h3>
                                            <p className="text-sm opacity-90 font-medium">{room.roomType}</p>
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="p-4">
                                    <div className="space-y-3 h-full flex flex-col">
                                        {/* Guest Info - Fixed height container */}
                                        <div className="h-6 flex items-center justify-center">
                                            {room.guestName && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-700 font-medium">{room.guestName}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Check Out Info - Fixed height container */}
                                        <div className="h-5 flex items-center justify-between text-sm">
                                            <span className="text-gray-600 font-medium">Check Out:</span>
                                            <span className="font-semibold text-gray-800">
                                                {room.checkOutDate
                                                    ? format(room.checkOutDate, "MMM dd, yyyy")
                                                    : "None"
                                                }
                                            </span>
                                        </div>

                                        {/* Countdown Timer - Fixed height container */}
                                        <div className="h-8 flex items-center justify-center">
                                            {countdowns[room.id] && (
                                                <div className="flex items-center gap-2 text-sm bg-orange-50 p-2 rounded-lg border border-orange-200 w-full justify-center">
                                                    <Clock className="w-4 h-4 text-orange-500" />
                                                    <span className="font-mono text-orange-700 font-bold">
                                                        {countdowns[room.id]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Button */}
                                        <div className="mt-auto">
                                            <Button
                                                className={`w-full text-white font-semibold ${getStatusColor(room.status)} py-2`}
                                                size="sm"
                                            >
                                                {getStatusText(room.status)}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* No Results */}
                    {filteredRooms.length === 0 && (
                        <div className="text-center py-12">
                            <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No rooms found</h3>
                            <p className="text-gray-600">Try adjusting your search criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}