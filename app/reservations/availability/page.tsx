"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
    Bed,
    Calendar as CalendarCheck,
    CalendarIcon,
    CheckCircle,
    Clock,
    Eye,
    Filter,
    Home,
    Loader2,
    MapPin,
    RefreshCw,
    Search,
    Users,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RoomClass {
    id: number;
    name: string;
    description: string | null;
    ratePerNight: number;
    rateDayUse: number;
    maxOccupancy: number;
    standardOccupancy: number;
    amenities: string | null;
    specialFeatures: string | null;
}

interface Room {
    id: number;
    roomNumber: string;
    status: string;
    isActive: boolean;
    hasBalcony: boolean;
    hasSeaView: boolean;
    hasKitchenette: boolean;
    specialNotes: string | null;
    floor: {
        name: string;
        floorNumber: number;
    } | null;
    roomClass: RoomClass;
}

interface AvailabilityFilters {
    checkInDate: Date | null;
    checkOutDate: Date | null;
    roomClassId: string; // Changed to string
    guests: number;
    roomNumber: string;
    floor: string;
    status: string;
}

export default function RoomAvailabilityPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomClasses, setRoomClasses] = useState<RoomClass[]>([]);
    const [floors, setFloors] = useState<{ id: number; name: string; floorNumber: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const [filters, setFilters] = useState<AvailabilityFilters>({
        checkInDate: null,
        checkOutDate: null,
        roomClassId: "all", // Changed to "all"
        guests: 1,
        roomNumber: "",
        floor: "all", // Changed to "all"
        status: "all",
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchInitialData();
        checkAvailability(); // Load all rooms initially
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [roomClassesRes, floorsRes] = await Promise.all([
                fetch(`${apiBaseUrl}/api/rooms/settings/classes`),
                fetch(`${apiBaseUrl}/api/rooms/settings/floors`),
            ]);

            if (roomClassesRes.ok) {
                const roomClassesData = await roomClassesRes.json();
                setRoomClasses(roomClassesData.roomClasses || []);
            }

            if (floorsRes.ok) {
                const floorsData = await floorsRes.json();
                setFloors(floorsData.floors || []);
            }
        } catch (error) {
            // console.error("Error fetching initial data:", error);
            toast.error("Failed to load initial data");
        } finally {
            setLoading(false);
        }
    };

    const checkAvailability = async () => {
        setSearchLoading(true);
        try {
            const queryParams = new URLSearchParams();

            if (filters.checkInDate) {
                queryParams.append('checkInDate', filters.checkInDate.toISOString().split('T')[0]);
            }
            if (filters.checkOutDate) {
                queryParams.append('checkOutDate', filters.checkOutDate.toISOString().split('T')[0]);
            }
            if (filters.roomClassId && filters.roomClassId !== 'all') {
                queryParams.append('roomClassId', filters.roomClassId);
            }
            if (filters.guests > 0) {
                queryParams.append('guests', filters.guests.toString());
            }
            if (filters.roomNumber.trim()) {
                queryParams.append('roomNumber', filters.roomNumber.trim());
            }
            if (filters.floor && filters.floor !== 'all') {
                queryParams.append('floor', filters.floor);
            }
            if (filters.status && filters.status !== 'all') {
                queryParams.append('status', filters.status);
            }

            const response = await fetch(`${apiBaseUrl}/api/rooms/availability?${queryParams}`);

            if (!response.ok) {
                throw new Error('Failed to check availability');
            }

            const data = await response.json();
            if (data.success) {
                setRooms(data.rooms || []);
            } else {
                throw new Error(data.error || 'Failed to check availability');
            }
        } catch (error) {
            // console.error("Error checking availability:", error);
            toast.error("Failed to check room availability");
            setRooms([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleFilterChange = (key: keyof AvailabilityFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            checkInDate: null,
            checkOutDate: null,
            roomClassId: "all",
            guests: 1,
            roomNumber: "",
            floor: "all",
            status: "all",
        });
        // Auto-search after clearing
        setTimeout(() => checkAvailability(), 100);
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return 'default';
            case 'OCCUPIED':
                return 'destructive';
            case 'MAINTENANCE':
                return 'secondary';
            case 'CLEANING':
                return 'outline';
            case 'OUT_OF_ORDER':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <CheckCircle className="w-4 h-4" />;
            case 'OCCUPIED':
                return <XCircle className="w-4 h-4" />;
            case 'MAINTENANCE':
            case 'CLEANING':
                return <Clock className="w-4 h-4" />;
            case 'OUT_OF_ORDER':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const availableRooms = rooms.filter(room => room.status === 'AVAILABLE').length;
    const occupiedRooms = rooms.filter(room => room.status === 'OCCUPIED').length;
    const maintenanceRooms = rooms.filter(room => ['MAINTENANCE', 'CLEANING', 'OUT_OF_ORDER'].includes(room.status)).length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <CalendarCheck className="w-8 h-8 text-blue-600 mr-3" />
                        Room Availability Check
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Check room availability and status in real-time
                    </p>
                </div>
                <Button onClick={checkAvailability} disabled={searchLoading}>
                    {searchLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-green-600">{availableRooms}</p>
                                <p className="text-sm text-gray-600">Available</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <XCircle className="w-8 h-8 text-red-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-red-600">{occupiedRooms}</p>
                                <p className="text-sm text-gray-600">Occupied</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-yellow-600">{maintenanceRooms}</p>
                                <p className="text-sm text-gray-600">Maintenance</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Home className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{rooms.length}</p>
                                <p className="text-sm text-gray-600">Total Rooms</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Search Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Date Range */}
                        <div className="space-y-2">
                            <Label>Check-in Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.checkInDate ? format(filters.checkInDate, "PPP") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.checkInDate || undefined}
                                        onSelect={(date) => handleFilterChange('checkInDate', date || null)}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Check-out Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                        disabled={!filters.checkInDate}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.checkOutDate ? format(filters.checkOutDate, "PPP") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={filters.checkOutDate || undefined}
                                        onSelect={(date) => handleFilterChange('checkOutDate', date || null)}
                                        disabled={(date) => !filters.checkInDate || date <= filters.checkInDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Room Class - FIXED */}
                        <div className="space-y-2">
                            <Label>Room Class</Label>
                            <Select
                                value={filters.roomClassId}
                                onValueChange={(value) => handleFilterChange('roomClassId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All room classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Room Classes</SelectItem>
                                    {roomClasses.map((roomClass) => (
                                        <SelectItem key={roomClass.id} value={roomClass.id.toString()}>
                                            {roomClass.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Guests */}
                        <div className="space-y-2">
                            <Label>Guests</Label>
                            <Select
                                value={filters.guests.toString()}
                                onValueChange={(value) => handleFilterChange('guests', parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                        <SelectItem key={num} value={num.toString()}>
                                            {num} {num === 1 ? 'Guest' : 'Guests'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Room Number */}
                        <div className="space-y-2">
                            <Label>Room Number</Label>
                            <Input
                                placeholder="Search room number"
                                value={filters.roomNumber}
                                onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
                            />
                        </div>

                        {/* Floor - FIXED */}
                        <div className="space-y-2">
                            <Label>Floor</Label>
                            <Select
                                value={filters.floor}
                                onValueChange={(value) => handleFilterChange('floor', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All floors" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Floors</SelectItem>
                                    {floors.map((floor) => (
                                        <SelectItem key={floor.id} value={floor.floorNumber.toString()}>
                                            {floor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => handleFilterChange('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="AVAILABLE">Available</SelectItem>
                                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                    <SelectItem value="CLEANING">Cleaning</SelectItem>
                                    <SelectItem value="OUT_OF_ORDER">Out of Order</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <Label className="invisible">Actions</Label>
                            <div className="flex space-x-2">
                                <Button onClick={checkAvailability} className="flex-1" disabled={searchLoading}>
                                    {searchLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4 mr-2" />
                                    )}
                                    Search
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <Home className="w-5 h-5 mr-2" />
                            Room Availability Results
                        </span>
                        <Badge variant="outline">
                            {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'} Found
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" />
                            <span>Loading rooms...</span>
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center py-8">
                            <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No rooms found</h3>
                            <p className="text-gray-500">
                                Try adjusting your search filters or check different dates
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rooms.map((room) => (
                                <Card key={room.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-semibold">{room.roomNumber}</h3>
                                                <p className="text-sm text-gray-600">{room.roomClass.name}</p>
                                                {room.floor && (
                                                    <p className="text-xs text-gray-500 flex items-center mt-1">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {room.floor.name}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge
                                                variant={getStatusBadgeVariant(room.status)}
                                                className="flex items-center"
                                            >
                                                {getStatusIcon(room.status)}
                                                <span className="ml-1">{room.status}</span>
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Users className="w-4 h-4 mr-2" />
                                                Max {room.roomClass.maxOccupancy} guests
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Bed className="w-4 h-4 mr-2" />
                                                LKR {room.roomClass.ratePerNight.toLocaleString()}/night
                                            </div>
                                        </div>

                                        {/* Room Features */}
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {room.hasBalcony && (
                                                <Badge variant="outline" className="text-xs">Balcony</Badge>
                                            )}
                                            {room.hasSeaView && (
                                                <Badge variant="outline" className="text-xs">Sea View</Badge>
                                            )}
                                            {room.hasKitchenette && (
                                                <Badge variant="outline" className="text-xs">Kitchenette</Badge>
                                            )}
                                        </div>

                                        {room.specialNotes && (
                                            <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                                                {room.specialNotes}
                                            </p>
                                        )}

                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                asChild
                                            >
                                                <Link href={`/rooms/${room.id}`}>
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View Details
                                                </Link>
                                            </Button>
                                            {room.status === 'AVAILABLE' && (
                                                <Button
                                                    size="sm"
                                                    className="flex-1"
                                                    asChild
                                                >
                                                    <Link href={`/reservations/new?roomId=${room.id}`}>
                                                        Book Now
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}