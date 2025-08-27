"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Settings, Wifi, Plus, Search, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

interface RoomType {
    id: number;
    roomType: string;
    rate?: number;
    capacity?: number;
}

interface Facility {
    id: number;
    facilityType: string;
    facility_name: string;
    description?: string;
}

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function AssignRoomFacilities() {
    const { data: roomTypes = [], error: roomTypesError, isLoading: roomTypesLoading } = useSWR<RoomType[]>(
        "/api/room-setting/room-list",
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    const { data: facilities = [], error: facilitiesError, isLoading: facilitiesLoading } = useSWR<Facility[]>(
        "/api/room-facilities/room-facilities-details-list",
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const { data: assignedFacilities = [], isLoading: assignedLoading, mutate } = useSWR<number[]>(
        selectedRoomId ? `/api/room-setting/assign-facility?roomId=${selectedRoomId}` : null,
        fetcher
    );

    const [selectedFacilities, setSelectedFacilities] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Sync selectedFacilities with assigned facilities - Fixed with proper dependency
    useEffect(() => {
        if (assignedFacilities && Array.isArray(assignedFacilities)) {
            setSelectedFacilities([...assignedFacilities]);
        }
    }, [selectedRoomId, assignedFacilities.length]); // Only depend on selectedRoomId and array length

    // Reset selectedFacilities when room changes
    useEffect(() => {
        if (selectedRoomId) {
            setSelectedFacilities([]);
        }
    }, [selectedRoomId]);

    // Filter facilities based on search
    const filteredFacilities = useMemo(() => {
        if (!searchQuery) return facilities;
        return facilities.filter(facility =>
            facility.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            facility.facilityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (facility.description?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, facilities]);

    // Group facilities by type
    const facilitiesByType = useMemo(() => {
        const grouped: Record<string, Facility[]> = {};
        filteredFacilities.forEach(facility => {
            const type = facility.facilityType;
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(facility);
        });

        Object.keys(grouped).forEach(type => {
            grouped[type].sort((a, b) => a.facility_name.localeCompare(b.facility_name));
        });

        return grouped;
    }, [filteredFacilities]);

    // Handle room selection
    const handleRoomChange = useCallback((roomId: string) => {
        setSelectedRoomId(Number(roomId));
        setSelectedFacilities([]); // Reset facilities when room changes
    }, []);

    // Handle facility toggle
    const handleFacilityToggle = useCallback((facilityId: number) => {
        setSelectedFacilities(prev => {
            if (prev.includes(facilityId)) {
                return prev.filter(id => id !== facilityId);
            } else {
                return [...prev, facilityId];
            }
        });
    }, []);

    // Handle assign/unassign
    const handleSave = async () => {
        if (!selectedRoomId) {
            toast.error("Please select a room type");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/room-setting/assign-facility", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId: selectedRoomId, facilityIds: selectedFacilities })
            });

            if (!response.ok) {
                throw new Error("Failed to save assignments");
            }

            await mutate();
            toast.success("Facility assignments saved successfully!");
        } catch (error) {
            toast.error("Failed to save assignments. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="space-y-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                </div>
            ))}
        </div>
    );

    // Error state
    if (roomTypesError || facilitiesError) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">Failed to load room types or facilities</p>
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
                                <BreadcrumbLink href="/room-setting/assign-room-facilities" className="text-sm font-medium">
                                    Assign Room Facilities
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Save Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Wifi className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Assign Room Facilities</h1>
                                <p className="text-sm text-muted-foreground">Select room type and assign facilities</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleSave}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                            disabled={!selectedRoomId || loading}
                        >
                            <Plus className="w-4 h-4" />
                            {loading ? "Saving..." : "Save Assignments"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="flex-shrink-0 bg-white shadow-lg border-b border-border/50">
                <div className="px-4 py-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Room Type Selection */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Room Type:</span>
                            <Select
                                value={selectedRoomId ? String(selectedRoomId) : ""}
                                onValueChange={handleRoomChange}
                                disabled={roomTypesLoading || loading}
                            >
                                <SelectTrigger className="w-64 h-9 text-sm rounded-lg border-border/50 shadow-sm">
                                    <SelectValue placeholder={roomTypesLoading ? "Loading..." : "Select Room Type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomTypes.map(room => (
                                        <SelectItem key={room.id} value={String(room.id)}>
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-medium">{room.roomType}</span>
                                                {room.rate && room.capacity && (
                                                    <div className="flex items-center gap-2 ml-4 text-sm text-muted-foreground">
                                                        <span>Rs. {room.rate.toLocaleString()}</span>
                                                        <span>{room.capacity} guests</span>
                                                    </div>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Bar */}
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm font-medium text-muted-foreground">Search:</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search facilities..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-9 w-64 text-sm rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
                                    disabled={facilitiesLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Assignment Summary */}
                    {selectedRoomId && (
                        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                <Wifi className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">
                                    {selectedFacilities.length === 0
                                        ? "No facilities will be assigned (all will be unassigned)"
                                        : `${selectedFacilities.length} facilit${selectedFacilities.length > 1 ? 'ies' : 'y'} will be assigned`
                                    }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Check/uncheck facilities to assign/unassign them
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Facilities Section */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
                    <div className="bg-white shadow-lg p-6">
                        {!selectedRoomId ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Settings className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">Select Room Type</h3>
                                <p className="text-sm text-muted-foreground">Please select a room type to view and assign facilities</p>
                            </div>
                        ) : facilitiesLoading || assignedLoading ? (
                            <LoadingSkeleton />
                        ) : Object.keys(facilitiesByType).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Wifi className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">No Facilities Available</h3>
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery ? "No facilities match your search" : "No facilities found in the system"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(facilitiesByType).map(([facilityType, facilities]) => (
                                    <div key={facilityType}>
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 border-b pb-2">
                                            {facilityType}
                                        </h3>
                                        <div className="space-y-2 ml-4">
                                            {facilities.map(facility => {
                                                const isSelected = selectedFacilities.includes(facility.id);
                                                const wasAssigned = assignedFacilities.includes(facility.id);

                                                return (
                                                    <div
                                                        key={facility.id}
                                                        className={`
                                                            flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer hover:bg-accent/50
                                                            ${isSelected ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'}
                                                        `}
                                                        onClick={() => handleFacilityToggle(facility.id)}
                                                    >
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            {isSelected ? (
                                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                                            ) : (
                                                                <Circle className="w-5 h-5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <Label
                                                                className={`text-sm cursor-pointer block ${isSelected ? 'font-semibold text-primary' : 'font-medium'
                                                                    }`}
                                                            >
                                                                {facility.facility_name}
                                                                {wasAssigned && (
                                                                    <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                                        Previously assigned
                                                                    </span>
                                                                )}
                                                            </Label>
                                                            {facility.description && (
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {facility.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}