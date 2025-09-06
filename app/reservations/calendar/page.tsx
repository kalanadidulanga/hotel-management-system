"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    Home,
    Loader2,
    Plus,
    RefreshCw,
    Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Reservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfNights: number;
    adults: number;
    children: number;
    reservationStatus: string;
    totalAmount: number;
    customer: {
        firstName: string;
        lastName: string;
        phone: string;
    };
    room: {
        roomNumber: string;
    };
    roomClass: {
        name: string;
    };
}

interface RoomClass {
    id: number;
    name: string;
}

interface CalendarFilters {
    roomClassId: string;
    status: string;
}

interface CalendarData {
    month: number;
    year: number;
    reservations: Reservation[];
    stats: {
        totalReservations: number;
        checkedIn: number;
        checkingOut: number;
        arriving: number;
    };
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MonthlyCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
    const [roomClasses, setRoomClasses] = useState<RoomClass[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDateReservations, setSelectedDateReservations] = useState<Reservation[]>([]);

    const [filters, setFilters] = useState<CalendarFilters>({
        roomClassId: "all",
        status: "all",
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchRoomClasses();
        fetchCalendarData();
    }, [currentDate, filters]);

    const fetchRoomClasses = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/classes`);
            if (response.ok) {
                const data = await response.json();
                setRoomClasses(data.roomClasses || []);
            }
        } catch (error) {
            // console.error("Error fetching room classes:", error);
        }
    };

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                month: (currentDate.getMonth() + 1).toString(),
                year: currentDate.getFullYear().toString(),
            });

            if (filters.roomClassId !== "all") {
                queryParams.append("roomClassId", filters.roomClassId);
            }
            if (filters.status !== "all") {
                queryParams.append("status", filters.status);
            }

            const response = await fetch(`${apiBaseUrl}/api/reservations/calendar?${queryParams}`);

            if (!response.ok) {
                throw new Error('Failed to fetch calendar data');
            }

            const data = await response.json();
            if (data.success) {
                setCalendarData(data.calendar);
            } else {
                throw new Error(data.error || 'Failed to load calendar');
            }
        } catch (error) {
            // console.error("Error fetching calendar data:", error);
            toast.error("Failed to load calendar data");
        } finally {
            setLoading(false);
        }
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            days.push(day);
        }

        return days;
    };

    const getDateReservations = (date: Date) => {
        if (!calendarData) return [];

        const dateStr = date.toISOString().split('T')[0];
        return calendarData.reservations.filter(reservation => {
            const checkIn = new Date(reservation.checkInDate).toISOString().split('T')[0];
            const checkOut = new Date(reservation.checkOutDate).toISOString().split('T')[0];
            return dateStr >= checkIn && dateStr < checkOut;
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth();
    };

    const handleDateClick = (date: Date, reservations: Reservation[]) => {
        setSelectedDate(date);
        setSelectedDateReservations(reservations);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CHECKED_IN':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'CHECKED_OUT':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const days = getDaysInMonth(currentDate);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <CalendarIcon className="w-8 h-8 text-blue-600 mr-3" />
                        Reservation Calendar
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Monthly view of all reservations and bookings
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={goToToday}>
                        Today
                    </Button>
                    <Button onClick={fetchCalendarData} disabled={loading}>
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                    <Button asChild>
                        <Link href="/reservations/new">
                            <Plus className="w-4 h-4 mr-2" />
                            New Booking
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {calendarData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <CalendarIcon className="w-8 h-8 text-blue-600 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {calendarData.stats.totalReservations}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Reservations</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <Users className="w-8 h-8 text-green-600 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-green-600">
                                        {calendarData.stats.checkedIn}
                                    </p>
                                    <p className="text-sm text-gray-600">Currently Checked In</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <Home className="w-8 h-8 text-yellow-600 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {calendarData.stats.arriving}
                                    </p>
                                    <p className="text-sm text-gray-600">Arriving Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <CalendarIcon className="w-8 h-8 text-orange-600 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {calendarData.stats.checkingOut}
                                    </p>
                                    <p className="text-sm text-gray-600">Checking Out Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <Select
                                value={filters.roomClassId}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, roomClassId: value }))}
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

                        <div className="flex-1">
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                    <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                                    <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" />
                            <span>Loading calendar...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 gap-2">
                                {WEEKDAYS.map(day => (
                                    <div key={day} className="p-2 text-center font-semibold text-gray-600 bg-gray-50 rounded">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-2">
                                {days.map((day, index) => {
                                    const dayReservations = getDateReservations(day);
                                    const isCurrentMonthDay = isCurrentMonth(day);
                                    const isTodayDate = isToday(day);

                                    return (
                                        <div
                                            key={index}
                                            className={`
                                                min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors
                                                ${isCurrentMonthDay ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                                                ${isTodayDate ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                                                ${dayReservations.length > 0 ? 'border-blue-200' : 'border-gray-200'}
                                            `}
                                            onClick={() => handleDateClick(day, dayReservations)}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-sm font-medium ${isTodayDate ? 'text-blue-600' : ''}`}>
                                                    {day.getDate()}
                                                </span>
                                                {dayReservations.length > 0 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {dayReservations.length}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                {dayReservations.slice(0, 2).map((reservation, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`text-xs p-1 rounded border ${getStatusColor(reservation.reservationStatus)}`}
                                                        title={`${reservation.customer.firstName} ${reservation.customer.lastName} - Room ${reservation.room.roomNumber}`}
                                                    >
                                                        <div className="font-medium truncate">
                                                            {reservation.room.roomNumber}
                                                        </div>
                                                        <div className="truncate">
                                                            {reservation.customer.firstName} {reservation.customer.lastName}
                                                        </div>
                                                    </div>
                                                ))}
                                                {dayReservations.length > 2 && (
                                                    <div className="text-xs text-gray-500 text-center">
                                                        +{dayReservations.length - 2} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Date Details Dialog */}
            <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Reservations for {selectedDate?.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedDateReservations.length} reservation(s) found
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {selectedDateReservations.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">
                                No reservations for this date
                            </p>
                        ) : (
                            selectedDateReservations.map((reservation) => (
                                <Card key={reservation.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="font-semibold">
                                                        {reservation.customer.firstName} {reservation.customer.lastName}
                                                    </h4>
                                                    <Badge className={getStatusColor(reservation.reservationStatus)}>
                                                        {reservation.reservationStatus}
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p><strong>Booking:</strong> {reservation.bookingNumber}</p>
                                                    <p><strong>Room:</strong> {reservation.room.roomNumber} ({reservation.roomClass.name})</p>
                                                    <p><strong>Phone:</strong> {reservation.customer.phone}</p>
                                                    <p><strong>Guests:</strong> {reservation.adults} Adults, {reservation.children} Children</p>
                                                    <p><strong>Duration:</strong> {reservation.numberOfNights} nights</p>
                                                    <p><strong>Check-in:</strong> {new Date(reservation.checkInDate).toLocaleDateString()}</p>
                                                    <p><strong>Check-out:</strong> {new Date(reservation.checkOutDate).toLocaleDateString()}</p>
                                                    <p><strong>Amount:</strong> {formatCurrency(reservation.totalAmount)}</p>
                                                </div>
                                            </div>

                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/reservations/${reservation.id}`}>
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}