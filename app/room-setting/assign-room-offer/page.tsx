"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, Settings, Tag, Save, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

interface RoomType {
    id: number;
    roomType: string;
    rate: number;
}

interface RoomOffer {
    id?: number;
    roomType: string;
    date: string;
    originalRate: number;
    offerDiscount: number | null; // This will be percentage
    offerTitle: string | null;
    offerText: string | null;
}

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AssignRoomOffer() {
    const { data: roomTypes = [], error: roomTypesError, isLoading: roomTypesLoading } = useSWR<RoomType[]>(
        "/api/room-setting/room-list",
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    const [selectedRoomType, setSelectedRoomType] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [offers, setOffers] = useState<Record<string, RoomOffer>>({});

    // Calculate discounted amount from percentage
    const calculateDiscountedRate = useCallback((originalRate: number, discountPercentage: number | null) => {
        if (!discountPercentage || discountPercentage <= 0) return originalRate;
        const discountAmount = (originalRate * discountPercentage) / 100;
        return originalRate - discountAmount;
    }, []);

    // Generate month options for next 12 months
    const monthOptions = useMemo(() => {
        const options = [];
        const currentDate = new Date();

        for (let i = 0; i < 12; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
            options.push({ value, label });
        }

        return options;
    }, []);

    // Generate calendar days for selected month
    const calendarDays = useMemo(() => {
        if (!selectedMonth) return [];

        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const days = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateString = date.toISOString().split('T')[0];
            const dayName = dayNames[date.getDay()];
            const dayFormatted = String(day).padStart(2, '0');
            const monthFormatted = monthNames[date.getMonth()];
            const yearFormatted = String(year).slice(-2);

            days.push({
                date: dateString,
                display: `${dayName}-${dayFormatted}-${monthFormatted}-${yearFormatted}`,
                day: day
            });
        }

        return days;
    }, [selectedMonth]);

    // Fetch existing offers when room type and month are selected
    const { data: existingOffers = [], mutate } = useSWR<RoomOffer[]>(
        selectedRoomType && selectedMonth ?
            `/api/room-setting/room-offers?roomType=${selectedRoomType}&month=${selectedMonth}` : null,
        fetcher
    );

    // Reset offers when room type changes
    useEffect(() => {
        setOffers({});
    }, [selectedRoomType]);

    // Reset offers when month changes
    useEffect(() => {
        setOffers({});
    }, [selectedMonth]);

    // Update offers state when existing offers are loaded
    useEffect(() => {
        if (existingOffers && existingOffers.length > 0) {
            const offersMap: Record<string, RoomOffer> = {};
            existingOffers.forEach(offer => {
                offersMap[offer.date] = offer;
            });
            setOffers(offersMap);
        }
    }, [existingOffers.length]);

    // Initialize default offers when we have all required data
    useEffect(() => {
        if (selectedRoomType && selectedMonth && calendarDays.length > 0 && roomTypes.length > 0 && Object.keys(offers).length === 0) {
            const selectedRoom = roomTypes.find(room => room.roomType === selectedRoomType);
            if (selectedRoom) {
                const defaultOffers: Record<string, RoomOffer> = {};
                calendarDays.forEach(day => {
                    defaultOffers[day.date] = {
                        roomType: selectedRoomType,
                        date: day.date,
                        originalRate: selectedRoom.rate,
                        offerDiscount: null,
                        offerTitle: null,
                        offerText: null
                    };
                });
                setOffers(defaultOffers);
            }
        }
    }, [selectedRoomType, selectedMonth, calendarDays.length, roomTypes.length]);

    // Handle offer field changes
    const handleOfferChange = useCallback((date: string, field: keyof RoomOffer, value: string | number) => {
        setOffers(prev => ({
            ...prev,
            [date]: {
                ...prev[date],
                [field]: field === 'offerDiscount' ? (value === '' ? null : Number(value)) : (value === '' ? null : value)
            }
        }));
    }, []);

    // Handle room type change
    const handleRoomTypeChange = useCallback((roomType: string) => {
        setSelectedRoomType(roomType);
    }, []);

    // Handle month change
    const handleMonthChange = useCallback((month: string) => {
        setSelectedMonth(month);
    }, []);

    // Save offers
    const handleSave = async () => {
        if (!selectedRoomType || !selectedMonth) {
            toast.error("Please select both room type and month");
            return;
        }

        const offersToSave = Object.values(offers).filter(offer =>
            offer.offerDiscount !== null || offer.offerTitle !== null || offer.offerText !== null
        );

        if (offersToSave.length === 0) {
            toast.error("Please add at least one offer");
            return;
        }

        // Validate discount percentages
        const invalidDiscounts = offersToSave.filter(offer =>
            offer.offerDiscount !== null && (offer.offerDiscount < 0 || offer.offerDiscount > 100)
        );

        if (invalidDiscounts.length > 0) {
            toast.error("Discount percentage must be between 0 and 100");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/room-setting/room-offers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ offers: offersToSave })
            });

            if (!response.ok) {
                throw new Error("Failed to save offers");
            }

            await mutate();
            toast.success("Room offers saved successfully!");
        } catch (error) {
            toast.error("Failed to save offers. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="space-y-4 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
            ))}
        </div>
    );

    // Error state
    if (roomTypesError) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">Failed to load room types</p>
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Try Again
                        </Button>
                    </div>
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
                                <BreadcrumbLink href="/room-setting" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Room Setting
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-setting/assign-room-offer" className="text-sm font-medium">
                                    Assign Room Offer
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Save Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Tag className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Assign Room Offer</h1>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Info className="w-4 h-4" />
                                    Room offer will be displayed to user from current date to next 12 months
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleSave}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                            disabled={!selectedRoomType || !selectedMonth || loading}
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Saving..." : "Save Offers"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="flex-shrink-0 bg-white shadow-lg border-b border-border/50">
                <div className="px-4 py-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-6">
                        {/* Room Type Selection */}
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-muted-foreground">Room Type:</Label>
                            <Select
                                value={selectedRoomType}
                                onValueChange={handleRoomTypeChange}
                                disabled={roomTypesLoading || loading}
                            >
                                <SelectTrigger className="w-64 h-9 text-sm rounded-lg border-border/50 shadow-sm">
                                    <SelectValue placeholder={roomTypesLoading ? "Loading..." : "Select Room Type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomTypes.map(room => (
                                        <SelectItem key={room.id} value={room.roomType}>
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-medium">{room.roomType}</span>
                                                <span className="ml-4 text-sm text-muted-foreground">
                                                    Rs. {room.rate.toLocaleString()}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Month Selection */}
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-muted-foreground">Select Month/Year:</Label>
                            <Select
                                value={selectedMonth}
                                onValueChange={handleMonthChange}
                                disabled={loading}
                            >
                                <SelectTrigger className="w-48 h-9 text-sm rounded-lg border-border/50 shadow-sm">
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
                    <div className="bg-white shadow-lg">
                        {!selectedRoomType || !selectedMonth ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Tag className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">Select Room Type and Month</h3>
                                <p className="text-sm text-muted-foreground">Please select both room type and month to configure offers</p>
                            </div>
                        ) : roomTypesLoading ? (
                            <LoadingSkeleton />
                        ) : (
                            <Table>
                                <TableHeader className="sticky top-0 bg-white z-10">
                                    <TableRow className="border-b border-border/50">
                                        <TableHead className="text-sm font-medium text-muted-foreground border-b border-border/50 whitespace-nowrap h-12 w-32">
                                            Date
                                        </TableHead>
                                        <TableHead className="text-sm font-medium text-muted-foreground border-b border-border/50 whitespace-nowrap h-12 w-32">
                                            Original Rate
                                        </TableHead>
                                        <TableHead className="text-sm font-medium text-muted-foreground border-b border-border/50 whitespace-nowrap h-12 w-32">
                                            Discount %
                                        </TableHead>
                                        <TableHead className="text-sm font-medium text-muted-foreground border-b border-border/50 whitespace-nowrap h-12 w-32">
                                            Discounted Rate
                                        </TableHead>
                                        <TableHead className="text-sm font-medium text-muted-foreground border-b border-border/50 whitespace-nowrap h-12 w-48">
                                            Offer Title
                                        </TableHead>
                                        <TableHead className="text-sm font-medium text-muted-foreground border-b border-border/50 whitespace-nowrap h-12">
                                            Offer Text
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {calendarDays.map(day => {
                                        const offer = offers[day.date];
                                        const discountedRate = offer ? calculateDiscountedRate(offer.originalRate, offer.offerDiscount) : 0;

                                        return (
                                            <TableRow key={day.date} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {day.display}
                                                </TableCell>
                                                <TableCell className="text-sm text-foreground py-3">
                                                    <div className="font-medium">
                                                        Rs. {offer?.originalRate?.toLocaleString() || '0'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={offer?.offerDiscount || ''}
                                                            onChange={(e) => handleOfferChange(day.date, 'offerDiscount', e.target.value)}
                                                            className="w-24 h-8 text-sm pr-6"
                                                            min="0"
                                                            max="100"
                                                            step="0.1"
                                                        />
                                                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                                            %
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="font-medium text-green-600">
                                                        {offer?.offerDiscount && offer.offerDiscount > 0 ? (
                                                            <>Rs. {discountedRate.toLocaleString()}</>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Input
                                                        placeholder="e.g., Summer Deal"
                                                        value={offer?.offerTitle || ''}
                                                        onChange={(e) => handleOfferChange(day.date, 'offerTitle', e.target.value)}
                                                        className="w-48 h-8 text-sm"
                                                        maxLength={50}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Input
                                                        placeholder="e.g., Limited time offer with complimentary breakfast"
                                                        value={offer?.offerText || ''}
                                                        onChange={(e) => handleOfferChange(day.date, 'offerText', e.target.value)}
                                                        className="min-w-96 h-8 text-sm"
                                                        maxLength={200}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}