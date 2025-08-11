"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Home,
    Building2,
    MapPin,
    Users,
    Hash,
    Save,
    Settings,
    CheckCircle2,
    AlertCircle,
    X
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

// Interface for room data
interface Room {
    id: number;
    roomNumber: number;
    floorListId: number;
    isAvailable: boolean;
    roomType?: string;
    floorList: {
        id: number;
        floorName: string;
        floor: {
            name: string;
        };
    };
    roomList?: {
        roomType: string;
        rate: number;
        capacity: number;
    };
}

// Interface for room types
interface RoomType {
    roomType: string;
    rate: number;
    capacity: number;
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function AssignRoomPage() {
    const [selectedRoomType, setSelectedRoomType] = useState<string>("");
    const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
    const [roomsToUnassign, setRoomsToUnassign] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mode, setMode] = useState<'assign' | 'unassign'>('assign');

    // Fetch rooms data
    const { data: rooms = [], error: roomsError, isLoading: roomsLoading, mutate } = useSWR<Room[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/assign-room`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Fetch room types data
    const { data: roomTypes = [], error: roomTypesError, isLoading: roomTypesLoading } = useSWR<RoomType[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/room-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Group rooms by floor and categorize them
    const roomsByFloor = useMemo(() => {
        if (!rooms?.length) return {};

        const grouped: Record<string, Room[]> = {};
        rooms.forEach(room => {
            const floorName = room.floorList.floor.name;
            if (!grouped[floorName]) {
                grouped[floorName] = [];
            }
            grouped[floorName].push(room);
        });

        // Sort rooms within each floor by room number
        Object.keys(grouped).forEach(floor => {
            grouped[floor].sort((a, b) => a.roomNumber - b.roomNumber);
        });

        return grouped;
    }, [rooms]);

    // Get room statistics
    const roomStats = useMemo(() => {
        if (!rooms?.length) return { total: 0, assigned: 0, unassigned: 0, selectedForAction: 0 };

        const total = rooms.length;
        const assigned = rooms.filter(room => room.roomType).length;
        const unassigned = rooms.filter(room => !room.roomType).length;
        const selectedForAction = mode === 'assign' ? selectedRooms.length : roomsToUnassign.length;

        return { total, assigned, unassigned, selectedForAction };
    }, [rooms, selectedRooms, roomsToUnassign, mode]);

    // Handle room selection
    const handleRoomSelect = (roomId: number, checked: boolean) => {
        if (mode === 'assign') {
            if (checked) {
                setSelectedRooms([...selectedRooms, roomId]);
            } else {
                setSelectedRooms(selectedRooms.filter(id => id !== roomId));
            }
        } else {
            if (checked) {
                setRoomsToUnassign([...roomsToUnassign, roomId]);
            } else {
                setRoomsToUnassign(roomsToUnassign.filter(id => id !== roomId));
            }
        }
    };

    // Handle room card click (entire card is clickable)
    const handleRoomCardClick = (room: Room) => {
        if (mode === 'assign') {
            const isAlreadyAssigned = !!room.roomType;
            const isDisabled = !selectedRoomType || isAlreadyAssigned || !room.isAvailable;

            if (!isDisabled) {
                const isSelected = selectedRooms.includes(room.id);
                handleRoomSelect(room.id, !isSelected);
            }
        } else {
            const isAssigned = !!room.roomType;

            if (isAssigned) {
                const isSelected = roomsToUnassign.includes(room.id);
                handleRoomSelect(room.id, !isSelected);
            }
        }
    };

    // Handle room type change
    const handleRoomTypeChange = (roomType: string) => {
        setSelectedRoomType(roomType);
        setSelectedRooms([]);
    };

    // Handle mode change
    const handleModeChange = (newMode: 'assign' | 'unassign') => {
        setMode(newMode);
        setSelectedRooms([]);
        setRoomsToUnassign([]);
        if (newMode === 'unassign') {
            setSelectedRoomType("");
        }
    };

    // Handle save assignment
    const handleSaveAssignment = async () => {
        if (mode === 'assign') {
            if (!selectedRoomType) {
                toast.error("Please select a room type");
                return;
            }

            if (selectedRooms.length === 0) {
                toast.error("Please select at least one room");
                return;
            }
        } else {
            if (roomsToUnassign.length === 0) {
                toast.error("Please select at least one room to unassign");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            let response;

            if (mode === 'assign') {
                response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/assign-room`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        roomType: selectedRoomType,
                        roomIds: selectedRooms,
                    }),
                });
            } else {
                response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/assign-room`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        roomIds: roomsToUnassign,
                    }),
                });
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to ${mode} rooms`);
            }

            const result = await response.json();
            await mutate(); // Refresh the data
            setSelectedRooms([]);
            setRoomsToUnassign([]);

            if (mode === 'assign') {
                toast.success(`${result.assignedCount || selectedRooms.length} room(s) assigned successfully to ${selectedRoomType}!`);
            } else {
                toast.success(`${result.updatedCount || roomsToUnassign.length} room(s) unassigned successfully!`);
            }
        } catch (error) {
            console.error(`${mode} rooms error:`, error);
            toast.error(error instanceof Error ? error.message : `Failed to ${mode} rooms. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle bulk select/deselect for floor
    const handleFloorSelect = (floorRooms: Room[], selectAll: boolean) => {
        if (mode === 'assign') {
            const availableRoomsInFloor = floorRooms.filter(room => !room.roomType && selectedRoomType);
            const roomIdsInFloor = availableRoomsInFloor.map(room => room.id);

            if (selectAll) {
                const newSelection = [...selectedRooms, ...roomIdsInFloor.filter(id => !selectedRooms.includes(id))];
                setSelectedRooms(newSelection);
            } else {
                setSelectedRooms(selectedRooms.filter(id => !roomIdsInFloor.includes(id)));
            }
        } else {
            const assignedRoomsInFloor = floorRooms.filter(room => room.roomType);
            const roomIdsInFloor = assignedRoomsInFloor.map(room => room.id);

            if (selectAll) {
                const newSelection = [...roomsToUnassign, ...roomIdsInFloor.filter(id => !roomsToUnassign.includes(id))];
                setRoomsToUnassign(newSelection);
            } else {
                setRoomsToUnassign(roomsToUnassign.filter(id => !roomIdsInFloor.includes(id)));
            }
        }
    };

    // Get floor icon
    const getFloorIcon = (floorName: string) => {
        const lowerName = floorName.toLowerCase();
        if (lowerName.includes('ground') || lowerName.includes('first')) return <Building2 className="w-4 h-4 text-primary" />;
        if (lowerName.includes('terrace') || lowerName.includes('roof')) return <Building2 className="w-4 h-4 text-chart-1" />;
        return <Building2 className="w-4 h-4 text-muted-foreground" />;
    };

    // Get room status info
    const getRoomStatus = (room: Room) => {
        if (room.roomType) {
            return {
                status: 'assigned',
                label: `Assigned to ${room.roomType}`,
                className: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: <CheckCircle2 className="w-3 h-3" />
            };
        }
        if (!room.isAvailable) {
            return {
                status: 'occupied',
                label: 'Occupied',
                className: 'bg-red-100 text-red-700 border-red-200',
                icon: <AlertCircle className="w-3 h-3" />
            };
        }
        return {
            status: 'available',
            label: 'Available',
            className: 'bg-green-100 text-green-700 border-green-200',
            icon: <CheckCircle2 className="w-3 h-3" />
        };
    };

    // Check if room is selectable based on mode
    const isRoomSelectable = (room: Room) => {
        if (mode === 'assign') {
            return !room.roomType && room.isAvailable && selectedRoomType;
        } else {
            return !!room.roomType;
        }
    };

    // Check if room is selected
    const isRoomSelected = (room: Room) => {
        if (mode === 'assign') {
            return selectedRooms.includes(room.id);
        } else {
            return roomsToUnassign.includes(room.id);
        }
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="space-y-6 p-4">
            {Array.from({ length: 3 }).map((_, floorIdx) => (
                <Card key={floorIdx}>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {Array.from({ length: 8 }).map((_, roomIdx) => (
                                <div key={roomIdx} className="flex items-center space-x-2 p-3 border rounded-lg">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    // Error state
    if (roomsError || roomTypesError) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">Failed to load rooms or room types</p>
                        <Button onClick={() => mutate()} variant="outline">
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
                                <BreadcrumbLink href="/room-setting/assign-room" className="text-sm font-medium">
                                    Assign Room
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">
                                    {mode === 'assign' ? 'Assign Room' : 'Unassign Room'}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {mode === 'assign'
                                        ? 'Select room type and assign rooms'
                                        : 'Select rooms to unassign from room types'
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-full">
                                Total: {roomStats.total} | Assigned: {roomStats.assigned} | Available: {roomStats.unassigned}
                            </div>
                            <Button
                                onClick={handleSaveAssignment}
                                disabled={
                                    (mode === 'assign' && (!selectedRoomType || selectedRooms.length === 0)) ||
                                    (mode === 'unassign' && roomsToUnassign.length === 0) ||
                                    isSubmitting
                                }
                                className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                            >
                                {mode === 'assign' ? <Save className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                {isSubmitting
                                    ? (mode === 'assign' ? "Assigning..." : "Unassigning...")
                                    : (mode === 'assign' ? "Save Assignment" : "Unassign Rooms")
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6 space-y-6">
                    {/* Mode Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Action Mode
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button
                                    variant={mode === 'assign' ? 'default' : 'outline'}
                                    onClick={() => handleModeChange('assign')}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Assign Rooms
                                </Button>
                                <Button
                                    variant={mode === 'unassign' ? 'default' : 'outline'}
                                    onClick={() => handleModeChange('unassign')}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Unassign Rooms
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Room Type Selection - Only show in assign mode */}
                    {mode === 'assign' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
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
                                        onValueChange={handleRoomTypeChange}
                                        disabled={roomTypesLoading || isSubmitting}
                                    >
                                        <SelectTrigger className="w-full md:w-80">
                                            <SelectValue placeholder={roomTypesLoading ? "Loading room types..." : "Select Room Type"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomTypes.map((roomType) => (
                                                <SelectItem key={roomType.roomType} value={roomType.roomType}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="font-medium">{roomType.roomType}</span>
                                                        <div className="flex items-center gap-4 ml-4 text-sm text-muted-foreground">
                                                            <span>Rs. {roomType.rate.toLocaleString()}</span>
                                                            <span>{roomType.capacity} guests</span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedRoomType && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Selected: <span className="font-medium">{selectedRoomType}</span>
                                            {selectedRooms.length > 0 && (
                                                <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                                    {selectedRooms.length} room{selectedRooms.length > 1 ? 's' : ''} selected
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Room Listing by Floor */}
                    {roomsLoading ? (
                        <LoadingSkeleton />
                    ) : Object.keys(roomsByFloor).length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">No Rooms Available</h3>
                                <p className="text-sm text-muted-foreground">No rooms found in the system</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(roomsByFloor).map(([floorName, floorRooms]) => {
                                const availableRoomsInFloor = floorRooms.filter(room => !room.roomType);
                                const assignedRoomsInFloor = floorRooms.filter(room => room.roomType);
                                const selectedRoomsInFloor = floorRooms.filter(room =>
                                    mode === 'assign'
                                        ? selectedRooms.includes(room.id)
                                        : roomsToUnassign.includes(room.id)
                                );

                                const selectableRooms = mode === 'assign'
                                    ? availableRoomsInFloor.filter(room => selectedRoomType)
                                    : assignedRoomsInFloor;

                                const canSelectAll = selectableRooms.length > 0;
                                const allSelected = selectableRooms.length > 0 &&
                                    selectableRooms.every(room =>
                                        mode === 'assign'
                                            ? selectedRooms.includes(room.id)
                                            : roomsToUnassign.includes(room.id)
                                    );

                                return (
                                    <Card key={floorName}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                        {getFloorIcon(floorName)}
                                                    </div>
                                                    <div>
                                                        <span className="text-lg font-semibold">{floorName}</span>
                                                        <p className="text-sm text-muted-foreground font-normal">
                                                            {floorRooms.length} rooms •
                                                            {assignedRoomsInFloor.length} assigned •
                                                            {availableRoomsInFloor.length} available •
                                                            {selectedRoomsInFloor.length} selected
                                                        </p>
                                                    </div>
                                                </div>
                                                {canSelectAll && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleFloorSelect(floorRooms, !allSelected)}
                                                        disabled={isSubmitting}
                                                        className="text-xs"
                                                    >
                                                        {allSelected ? 'Deselect All' : `Select All ${mode === 'assign' ? 'Available' : 'Assigned'}`}
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                {floorRooms.map(room => {
                                                    const isSelected = isRoomSelected(room);
                                                    const isSelectable = isRoomSelectable(room);
                                                    const roomStatus = getRoomStatus(room);

                                                    return (
                                                        <div
                                                            key={room.id}
                                                            onClick={() => handleRoomCardClick(room)}
                                                            className={`
                                                                flex items-center space-x-2 p-3 border rounded-lg transition-all duration-200
                                                                ${isSelected
                                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                                    : room.roomType && mode === 'assign'
                                                                        ? 'border-blue-200 bg-blue-50'
                                                                        : !isSelectable
                                                                            ? 'border-muted bg-muted/30 opacity-50'
                                                                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                                                                }
                                                                ${isSelectable ? 'cursor-pointer' : 'cursor-not-allowed'}
                                                            `}
                                                        >
                                                            <Checkbox
                                                                id={`room-${room.id}`}
                                                                checked={isSelected}
                                                                onChange={() => { }} // Controlled by card click
                                                                disabled={!isSelectable || isSubmitting}
                                                                className={isSelected ? 'border-primary' : ''}
                                                            />
                                                            <div className="flex-1 pointer-events-none">
                                                                <Label
                                                                    htmlFor={`room-${room.id}`}
                                                                    className="text-sm font-medium flex items-center gap-2"
                                                                >
                                                                    <Hash className="w-3 h-3" />
                                                                    Room {room.roomNumber}
                                                                </Label>
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                                    <span className={`
                                                                        px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1
                                                                        ${roomStatus.className}
                                                                    `}>
                                                                        {roomStatus.icon}
                                                                        {roomStatus.label}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Action Summary */}
                    {((mode === 'assign' && selectedRooms.length > 0 && selectedRoomType) ||
                        (mode === 'unassign' && roomsToUnassign.length > 0)) && (
                            <Card className={`border-primary/20 ${mode === 'assign' ? 'bg-primary/5' : 'bg-red-50 border-red-200'}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'assign' ? 'bg-primary/20' : 'bg-red-100'
                                                }`}>
                                                {mode === 'assign'
                                                    ? <Users className="w-4 h-4 text-primary" />
                                                    : <X className="w-4 h-4 text-red-600" />
                                                }
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-foreground">
                                                    {mode === 'assign' ? 'Assignment Summary' : 'Unassignment Summary'}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {mode === 'assign'
                                                        ? `${selectedRooms.length} room${selectedRooms.length > 1 ? 's' : ''} will be assigned to ${selectedRoomType}`
                                                        : `${roomsToUnassign.length} room${roomsToUnassign.length > 1 ? 's' : ''} will be unassigned`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleSaveAssignment}
                                            disabled={isSubmitting}
                                            className="px-6"
                                            variant={mode === 'assign' ? 'default' : 'destructive'}
                                        >
                                            {mode === 'assign' ? <Save className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
                                            {isSubmitting
                                                ? (mode === 'assign' ? "Assigning..." : "Unassigning...")
                                                : (mode === 'assign' ? "Confirm Assignment" : "Confirm Unassignment")
                                            }
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