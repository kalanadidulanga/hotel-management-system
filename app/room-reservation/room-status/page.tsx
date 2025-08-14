"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    Home,
    Search,
    Eye,
    Copy,
    FileText,
    Printer,
    Loader2,
    User,
    Calendar,
    Phone,
    Clock,
    Bed,
    Users,
    Building,
    RotateCcw
} from "lucide-react";

import useSWR from 'swr';

// TypeScript interfaces
interface Customer {
    id: number;
    firstName: string;
    lastName?: string;
    phone: string;
    email: string;
}

interface BedType {
    name: string;
}

interface RoomList {
    roomType: string;
    rate: number;
    roomDescription?: string;
    capacity: number;
    bedType?: BedType;
}

interface Floor {
    id: number;
    name: string;
}

interface FloorList {
    id: number;
    floorName: string;
    floor: Floor;
}

interface Reservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    checkInTime: string;
    checkOutTime: string;
    roomType: string;
    roomNumber: number;
    purposeOfVisit: string;
    adults?: number;
    children?: number;
    roomPrice: number;
    total: number;
    balanceAmount: number;
    billingType: string;
    customer: Customer;
}

interface Room {
    id: number;
    roomNumber: number;
    floorList?: FloorList;
    isAvailable: boolean;
    roomType?: string;
    roomList?: RoomList;
    reservations: Reservation[];
}

type RoomStatus = "Available" | "Booked" | "Check-in" | "Maintenance";

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function RoomStatusPage() {
    // State for client-only timestamp
    const [currentTime, setCurrentTime] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    // Fetch rooms
    const { data: rooms = [], error, isLoading, mutate } = useSWR<Room[]>(
        "/api/room-reservation/room-status",
        fetcher,
        {
            refreshInterval: 30000,
            onError: () => {
                toast.error("Failed to load room status data.");
            }
        }
    );

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<RoomStatus | "all">("all");
    const [floor, setFloor] = useState<string>("all");
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

    // Handle client-side mounting and time updates
    useEffect(() => {
        setMounted(true);
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString());
        };

        updateTime(); // Initial time
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    // Get room status based on reservations
    const getRoomStatus = (room: Room): RoomStatus => {
        if (!room.reservations || room.reservations.length === 0) {
            return room.isAvailable ? "Available" : "Maintenance";
        }

        const now = new Date();
        const activeReservation = room.reservations.find((res: Reservation) => {
            const checkIn = new Date(res.checkInDate);
            const checkOut = new Date(res.checkOutDate);
            return checkIn <= now && checkOut >= now;
        });

        if (activeReservation) return "Check-in";

        const futureReservation = room.reservations.find((res: Reservation) => {
            const checkIn = new Date(res.checkInDate);
            return checkIn > now;
        });

        return futureReservation ? "Booked" : (room.isAvailable ? "Available" : "Maintenance");
    };

    // Get unique floors from the data
    const floors: string[] = [...new Set(rooms.map((room: Room) => room.floorList?.floor?.name).filter((name): name is string => Boolean(name)))];

    // Filtering with null check
    const filtered = useMemo(() => {
        if (!rooms || rooms.length === 0) return [];
        return rooms.filter(room => {
            const roomStatus = getRoomStatus(room);

            // Status filter
            if (status !== "all" && roomStatus !== status) return false;

            // Floor filter
            if (floor !== "all" && room.floorList?.floor?.name !== floor) return false;

            // Search filter
            if (search) {
                const searchTerm = search.toLowerCase();
                if (
                    !String(room.roomNumber).includes(searchTerm) &&
                    !(room.roomType || room.roomList?.roomType || "").toLowerCase().includes(searchTerm) &&
                    !(room.floorList?.floor?.name || "").toLowerCase().includes(searchTerm)
                ) return false;
            }

            return true;
        });
    }, [search, rooms, status, floor]);

    // Status color schemes
    const getStatusColor = (status: RoomStatus): string => {
        switch (status) {
            case "Available": return "bg-green-100 border-green-400 text-green-800";
            case "Booked": return "bg-blue-100 border-blue-400 text-blue-800";
            case "Check-in": return "bg-yellow-100 border-yellow-400 text-yellow-800";
            case "Maintenance": return "bg-red-100 border-red-400 text-red-800";
            default: return "bg-gray-100 border-gray-400 text-gray-800";
        }
    };

    const getBadgeColor = (status: RoomStatus): string => {
        switch (status) {
            case "Available": return "bg-green-500 text-white";
            case "Booked": return "bg-blue-500 text-white";
            case "Check-in": return "bg-yellow-500 text-black";
            case "Maintenance": return "bg-red-500 text-white";
            default: return "bg-gray-500 text-white";
        }
    };

    // Get the most relevant reservation (active or next)
    const getRelevantReservation = (room: Room): Reservation | null => {
        if (!room.reservations || room.reservations.length === 0) return null;

        const now = new Date();
        const activeReservation = room.reservations.find((res: Reservation) => {
            const checkIn = new Date(res.checkInDate);
            const checkOut = new Date(res.checkOutDate);
            return checkIn <= now && checkOut >= now;
        });

        if (activeReservation) return activeReservation;

        const futureReservations = room.reservations
            .filter((res: Reservation) => new Date(res.checkInDate) > now)
            .sort((a: Reservation, b: Reservation) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

        return futureReservations[0] || null;
    };

    // Fixed Countdown component
    const Countdown = ({ endDate }: { endDate: string }) => {
        const [time, setTime] = useState<number>(0);

        useEffect(() => {
            const calculateTime = (): number => {
                const now = new Date().getTime();
                const end = new Date(endDate).getTime();
                const difference = end - now;
                return Math.max(0, difference);
            };

            setTime(calculateTime());

            const interval = setInterval(() => {
                setTime(calculateTime());
            }, 1000);

            return () => clearInterval(interval);
        }, [endDate]);

        if (time <= 0) return <span className="text-red-500 text-xs font-medium">Overdue</span>;

        const days = Math.floor(time / (1000 * 60 * 60 * 24));
        const hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));

        return (
            <span className="text-xs font-mono text-blue-600">
                {days > 0 && `${days}d `}
                {hours.toString().padStart(2, '0')}:
                {minutes.toString().padStart(2, '0')}
            </span>
        );
    };

    // Export/Print handlers
    const handleExport = (type: string) => {
        toast.info(`Exporting room status as ${type}...`);
        // Implement actual export logic here
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 p-4 border rounded-lg">
                    <Skeleton className="h-32 w-full mb-3" />
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            ))}
        </div>
    );

    if (error) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-red-500 mb-4">Error loading room status: {error.message}</p>
                    <Button onClick={() => mutate()}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
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
                                <BreadcrumbLink href="/room-reservation" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Room Reservation
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-reservation/room-status" className="text-sm font-medium">
                                    Room Status
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Building className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Room Status Dashboard</h1>
                                <p className="text-sm text-muted-foreground">
                                    {filtered.length > 0 ? `${filtered.length} rooms found` : 'Real-time view of all room statuses and reservations'}
                                </p>
                            </div>
                        </div>
                       
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="flex-shrink-0 bg-white shadow-lg border-b border-border/50">
                <div className="px-4 py-4 space-y-4">
                    {/* Top Controls */}
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Status Filter */}
                        <Select value={status} onValueChange={(value: string) => setStatus(value as RoomStatus | "all")}>
                            <SelectTrigger className="w-40 h-9 text-sm rounded-lg border-border/50 shadow-sm">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Booked">Booked</SelectItem>
                                <SelectItem value="Check-in">Check-in</SelectItem>
                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Floor Filter */}
                        <Select value={floor} onValueChange={setFloor}>
                            <SelectTrigger className="w-40 h-9 text-sm rounded-lg border-border/50 shadow-sm">
                                <SelectValue placeholder="All Floors" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Floors</SelectItem>
                                {floors.map((floorName: string) => (
                                    <SelectItem key={floorName} value={floorName}>
                                        {floorName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Search Bar */}
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm font-medium text-muted-foreground">Search:</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search rooms..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 h-9 w-64 text-sm rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setSearch("");
                                setStatus("all");
                                setFloor("all");
                            }}
                            className="h-9 px-4 rounded-lg text-sm shadow-sm"
                            disabled={isLoading}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset Filters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Room Cards Section */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto p-4">
                    {isLoading && !rooms?.length ? (
                        <LoadingSkeleton />
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <Building className="w-12 h-12 text-muted-foreground" />
                                <p className="text-base text-muted-foreground">
                                    {search || status !== "all" || floor !== "all" ? "No rooms found" : "No rooms available"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {search || status !== "all" || floor !== "all"
                                        ? "Try adjusting your search criteria"
                                        : "Rooms will appear here when available"
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                            {filtered.map((room: Room) => {
                                const roomStatus = getRoomStatus(room);
                                const reservation = getRelevantReservation(room);

                                return (
                                    <Card
                                        key={room.id}
                                        className={`${getStatusColor(roomStatus)} border-2 cursor-pointer hover:shadow-lg transition-all duration-200 ${reservation ? 'hover:scale-105' : ''} h-80 flex flex-col relative overflow-hidden`}
                                        onClick={() => reservation && setSelectedReservation(reservation)}
                                    >
                                        <CardContent className="p-0 flex flex-col h-full">
                                            {/* Background Image */}
                                           

                                            {/* Room Info - Takes remaining space */}
                                            <div className="p-4 flex flex-col flex-grow justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-lg font-bold">Room {room.roomNumber}</h3>
                                                    </div>

                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        <p className="font-medium flex items-center gap-1">
                                                            <span>📍</span>
                                                            {room.floorList?.floor?.name || 'Unknown Floor'}
                                                        </p>
                                                        <p className="truncate">{room.roomType || room.roomList?.roomType || 'Standard Room'}</p>
                                                        {room.roomList && (
                                                            <div className="flex items-center gap-3 text-xs">
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3" />
                                                                    {room.roomList.capacity}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Bed className="w-3 h-3" />
                                                                    {room.roomList.bedType?.name || 'Standard'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Reservation Info - Always positioned at bottom */}
                                                {reservation && mounted ? (
                                                    <div className="mt-3 p-3 bg-white/60 rounded-lg space-y-2 border border-white/40">
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <User className="w-3 h-3" />
                                                            <span className="font-medium truncate">
                                                                {reservation.customer.firstName} {reservation.customer.lastName || ''}
                                                            </span>
                                                        </div>

                                                        {roomStatus === "Check-in" ? (
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <Calendar className="w-3 h-3" />
                                                                <span className="truncate">Check-out: {new Date(reservation.checkOutDate).toLocaleDateString()}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <Calendar className="w-3 h-3" />
                                                                <span className="truncate">Check-in: {new Date(reservation.checkInDate).toLocaleDateString()}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2 text-xs">
                                                            <Clock className="w-3 h-3" />
                                                            <Countdown
                                                                endDate={roomStatus === "Check-in" ? reservation.checkOutDate : reservation.checkInDate}
                                                            />
                                                        </div>

                                                        <div className="text-xs text-gray-500">
                                                            Click for details
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 h-20 flex items-center justify-center text-xs text-gray-400">
                                                        No active reservation
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Reservation Details Modal */}
            <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Reservation Details</DialogTitle>
                    </DialogHeader>
                    {selectedReservation && (
                        <div className="space-y-4">
                            {/* Header Info */}
                            <div className="border-b pb-3">
                                <h4 className="font-bold text-lg text-blue-600">{selectedReservation.bookingNumber}</h4>
                                <p className="text-sm text-gray-600">Room {selectedReservation.roomNumber} • {selectedReservation.roomType}</p>
                            </div>

                            {/* Guest Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Guest Name</label>
                                    <p className="font-medium">
                                        {selectedReservation.customer.firstName} {selectedReservation.customer.lastName || ''}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Phone</label>
                                    <p className="font-medium">{selectedReservation.customer.phone}</p>
                                </div>
                            </div>

                            {/* Dates & Times */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Check-in</label>
                                    <p className="font-medium">
                                        {new Date(selectedReservation.checkInDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600">{selectedReservation.checkInTime}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Check-out</label>
                                    <p className="font-medium">
                                        {new Date(selectedReservation.checkOutDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600">{selectedReservation.checkOutTime}</p>
                                </div>
                            </div>

                            {/* Booking Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Guests</label>
                                    <p className="font-medium">
                                        {selectedReservation.adults || 1} Adults
                                        {selectedReservation.children ? `, ${selectedReservation.children} Children` : ''}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Billing Type</label>
                                    <p className="font-medium capitalize">{selectedReservation.billingType}</p>
                                </div>
                            </div>

                            {/* Purpose */}
                            <div>
                                <label className="text-sm font-medium text-gray-500">Purpose of Visit</label>
                                <p className="font-medium">{selectedReservation.purposeOfVisit}</p>
                            </div>

                            {/* Financial Info */}
                            <div className="border-t pt-4 bg-gray-50 p-3 rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">Room Price:</span>
                                    <span className="font-medium">Rs.{selectedReservation.roomPrice}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">Total Amount:</span>
                                    <span className="font-bold text-lg">Rs.{selectedReservation.total}</span>
                                </div>
                                {/* <div className="flex justify-between items-center">
                                    <span className="font-medium">Balance Amount:</span>
                                    <span className={`font-bold ${selectedReservation.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        Rs.{selectedReservation.balanceAmount}
                                    </span>
                                </div> */}
                            </div>

                            {/* Contact Info */}
                            <div className="border-t pt-4">
                                <label className="text-sm font-medium text-gray-500 block mb-2">Contact Information</label>
                                <div className="space-y-1">
                                    <p className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4" />
                                        {selectedReservation.customer.phone}
                                    </p>
                                    {selectedReservation.customer.email && (
                                        <p className="flex items-center gap-2 text-sm">
                                            <span>📧</span>
                                            {selectedReservation.customer.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}