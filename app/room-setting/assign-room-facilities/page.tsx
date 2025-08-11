"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Home,
    Settings,
    Wifi,
    Plus,
    Search,
    CheckCircle2,
    Circle
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

// Interface for room types
interface RoomType {
    id: number;
    roomType: string;
    rate: number;
    capacity: number;
}

// Interface for facilities
interface Facility {
    id: number;
    facilityType: string;
    facility_name: string;
    description: string;
    facility_type: {
        name: string;
    };
}

// Interface for existing assignments
interface FacilityAssignment {
    id: number;
    roomId: number;
    facilityId: number;
    facility: Facility;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function AssignRoomFacilityPage() {
    const [selectedRoomType, setSelectedRoomType] = useState<string>("");
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [selectedFacilities, setSelectedFacilities] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [facilitySearchTerm, setFacilitySearchTerm] = useState("");
    const [roomTypeSearchTerm, setRoomTypeSearchTerm] = useState("");

    // Fetch room types data
    const { data: roomTypes = [], error: roomTypesError, isLoading: roomTypesLoading } = useSWR<RoomType[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/room-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Fetch facilities data
    const { data: facilities = [], error: facilitiesError, isLoading: facilitiesLoading } = useSWR<Facility[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-facilities/room-facilities-details-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Fetch existing facility assignments for selected room
    const { data: existingAssignments = [], error: assignmentsError, isLoading: assignmentsLoading, mutate } = useSWR<FacilityAssignment[]>(
        selectedRoomId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/assign-facility/${selectedRoomId}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Filter room types based on search
    const filteredRoomTypes = useMemo(() => {
        if (!roomTypeSearchTerm) return roomTypes;
        return roomTypes.filter(roomType =>
            roomType.roomType.toLowerCase().includes(roomTypeSearchTerm.toLowerCase())
        );
    }, [roomTypes, roomTypeSearchTerm]);

    // Filter facilities based on search
    const filteredFacilities = useMemo(() => {
        if (!facilitySearchTerm) return facilities;
        return facilities.filter(facility =>
            facility.facility_name.toLowerCase().includes(facilitySearchTerm.toLowerCase()) ||
            facility.facilityType.toLowerCase().includes(facilitySearchTerm.toLowerCase()) ||
            facility.description.toLowerCase().includes(facilitySearchTerm.toLowerCase())
        );
    }, [facilities, facilitySearchTerm]);

    // Group facilities by type
    const facilitiesByType = useMemo(() => {
        const grouped: Record<string, Facility[]> = {};
        filteredFacilities.forEach(facility => {
            const type = facility.facility_type?.name || facility.facilityType;
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(facility);
        });

        // Sort facilities within each type
        Object.keys(grouped).forEach(type => {
            grouped[type].sort((a, b) => a.facility_name.localeCompare(b.facility_name));
        });

        return grouped;
    }, [filteredFacilities]);

    // Get existing facility IDs for the selected room
    const existingFacilityIds = useMemo(() => {
        return existingAssignments.map(assignment => assignment.facilityId);
    }, [existingAssignments]);

    // Update selected facilities when existing assignments load
    useEffect(() => {
        if (existingFacilityIds.length > 0) {
            setSelectedFacilities(existingFacilityIds);
        }
    }, [existingFacilityIds]);

    // Handle room type selection
    const handleRoomTypeSelect = (roomTypeValue: string) => {
        setSelectedRoomType(roomTypeValue);
        const selectedRoom = roomTypes.find(room => room.roomType === roomTypeValue);
        setSelectedRoomId(selectedRoom?.id || null);
        setSelectedFacilities([]); // Reset facility selection
    };

    // Handle facility selection
    const handleFacilitySelect = (facilityId: number, checked: boolean) => {
        if (checked) {
            setSelectedFacilities(prev => [...prev, facilityId]);
        } else {
            setSelectedFacilities(prev => prev.filter(id => id !== facilityId));
        }
    };

    // Handle save assignments
    const handleSaveAssignments = async () => {
        if (!selectedRoomId) {
            toast.error("Please select a room type");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/assign-facility`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    roomId: selectedRoomId,
                    facilityIds: selectedFacilities,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to assign facilities");
            }

            const result = await response.json();
            await mutate(); // Refresh the assignments data
            toast.success(`Facilities assigned successfully to ${selectedRoomType}!`);
        } catch (error) {
            console.error("Assign facilities error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to assign facilities. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="space-y-6 p-4">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-80" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
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

                    {/* Title */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Wifi className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Assign Room Facilities</h1>
                                <p className="text-sm text-muted-foreground">Select room type and assign facilities</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleSaveAssignments}
                            disabled={!selectedRoomId || isSubmitting}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                            <Plus className="w-4 h-4" />
                            {isSubmitting ? "Adding..." : "Add"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6 space-y-6">
                    {/* Room Type Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Room Type Selection
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Room Type *
                                </Label>
                                <Select
                                    value={selectedRoomType}
                                    onValueChange={handleRoomTypeSelect}
                                    disabled={roomTypesLoading || isSubmitting}
                                >
                                    <SelectTrigger className="w-full md:w-80">
                                        <SelectValue placeholder={roomTypesLoading ? "Loading room types..." : "Select Room Type"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2">
                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search room types..."
                                                    value={roomTypeSearchTerm}
                                                    onChange={(e) => setRoomTypeSearchTerm(e.target.value)}
                                                    className="pl-8 h-8"
                                                />
                                            </div>
                                        </div>
                                        {filteredRoomTypes.map((roomType) => (
                                            <SelectItem key={roomType.id} value={roomType.roomType}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="font-medium">{roomType.roomType}</span>
                                                    <div className="flex items-center gap-4 ml-4 text-sm text-muted-foreground">
                                                        <span>Rs. {roomType.rate.toLocaleString()}</span>
                                                        <span>{roomType.capacity} guests</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                        {filteredRoomTypes.length === 0 && (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                No room types found
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {selectedRoomType && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Selected: <span className="font-medium">{selectedRoomType}</span>
                                        {selectedFacilities.length > 0 && (
                                            <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                                {selectedFacilities.length} facilit{selectedFacilities.length > 1 ? 'ies' : 'y'} selected
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Facility Checklist */}
                    {roomTypesLoading || facilitiesLoading || assignmentsLoading ? (
                        <LoadingSkeleton />
                    ) : selectedRoomType && Object.keys(facilitiesByType).length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Wifi className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">No Facilities Available</h3>
                                <p className="text-sm text-muted-foreground">No facilities found in the system</p>
                            </CardContent>
                        </Card>
                    ) : selectedRoomType ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Wifi className="w-5 h-5" />
                                        Facility Checklist
                                    </CardTitle>
                                    <div className="relative w-64">
                                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search facilities..."
                                            value={facilitySearchTerm}
                                            onChange={(e) => setFacilitySearchTerm(e.target.value)}
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {Object.keys(facilitiesByType).length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">No facilities match your search</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {Object.entries(facilitiesByType).map(([facilityType, facilities]) => (
                                            <div key={facilityType}>
                                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                                    {facilityType}
                                                </h3>
                                                <div className="space-y-2 ml-4">
                                                    {facilities.map(facility => {
                                                        const isSelected = selectedFacilities.includes(facility.id);
                                                        const wasPreAssigned = existingFacilityIds.includes(facility.id);

                                                        return (
                                                            <div
                                                                key={facility.id}
                                                                className={`
                                                                    flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer hover:bg-accent/50
                                                                    ${isSelected ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'}
                                                                `}
                                                                onClick={() => handleFacilitySelect(facility.id, !isSelected)}
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
                                                                        {wasPreAssigned && (
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
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => handleFacilitySelect(facility.id, !!checked)}
                                                                    disabled={isSubmitting}
                                                                    className="mt-0.5 pointer-events-none"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">Select Room Type</h3>
                                <p className="text-sm text-muted-foreground">Please select a room type to view and assign facilities</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Assignment Summary */}
                    {selectedRoomType && selectedFacilities.length > 0 && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                            <Wifi className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground">Facility Assignment Summary</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedFacilities.length} facilit{selectedFacilities.length > 1 ? 'ies' : 'y'} will be assigned to <strong>{selectedRoomType}</strong>
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSaveAssignments}
                                        disabled={isSubmitting}
                                        className="px-6 bg-green-600 hover:bg-green-700"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        {isSubmitting ? "Adding..." : "Confirm Assignment"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}