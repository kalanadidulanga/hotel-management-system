"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft,
    Save,
    Loader2,
    Home,
    Building,
    MapPin,
    AlertTriangle,
    Eye,
    Calendar,
    Users,
    Activity,
    Clock,
    Sparkles,
    Trash2,
    History,
    Settings
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

interface Room {
    id: number;
    roomNumber: string;
    status: string;
    isActive: boolean;
    lastCleaned: string | null;
    nextCleaningDue: string | null;
    cleaningNotes: string | null;
    hasBalcony: boolean;
    hasSeaView: boolean;
    hasKitchenette: boolean;
    specialNotes: string | null;
    createdAt: string;
    updatedAt: string;
    roomClass: {
        id: number;
        name: string;
        ratePerNight: number;
        rateDayUse: number;
        maxOccupancy: number;
        cleaningFrequencyDays: number;
    };
    floor: {
        id: number;
        name: string;
        floorNumber: number;
    } | null;
    facilities: Array<{
        facility: {
            id: number;
            name: string;
            category: string;
        };
    }>;
    reservations: Array<{
        id: number;
        checkInDate: string;
        checkOutDate: string;
        status: string;
        customer: {
            firstName: string;
            lastName: string;
            phone: string;
        };
    }>;
    _count: {
        reservations: number;
        facilities: number;
    };
}

interface RoomClass {
    id: number;
    name: string;
    ratePerNight: number;
    maxOccupancy: number;
}

interface Floor {
    id: number;
    name: string;
    floorNumber: number;
}

interface RoomFormData {
    roomNumber: string;
    roomClassId: string;
    floorId: string;
    status: string;
    hasBalcony: boolean;
    hasSeaView: boolean;
    hasKitchenette: boolean;
    specialNotes: string;
    cleaningNotes: string;
    isActive: boolean;
}

export default function EditRoomPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;

    const [room, setRoom] = useState<Room | null>(null);
    const [roomClasses, setRoomClasses] = useState<RoomClass[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [formData, setFormData] = useState<RoomFormData>({
        roomNumber: '',
        roomClassId: '',
        floorId: 'none',
        status: 'AVAILABLE',
        hasBalcony: false,
        hasSeaView: false,
        hasKitchenette: false,
        specialNotes: '',
        cleaningNotes: '',
        isActive: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchRoomData();
        fetchFormOptions();
    }, [roomId]);

    const fetchRoomData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/rooms/${roomId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch room data');
            }

            const data = await response.json();
            const roomData = data.room;

            setRoom(roomData);
            setFormData({
                roomNumber: roomData.roomNumber || '',
                roomClassId: roomData.roomClass?.id?.toString() || '',
                floorId: roomData.floor?.id?.toString() || 'none',
                status: roomData.status || 'AVAILABLE',
                hasBalcony: roomData.hasBalcony || false,
                hasSeaView: roomData.hasSeaView || false,
                hasKitchenette: roomData.hasKitchenette || false,
                specialNotes: roomData.specialNotes || '',
                cleaningNotes: roomData.cleaningNotes || '',
                isActive: roomData.isActive !== false
            });
        } catch (error) {
            // console.error('Error fetching room data:', error);
            toast.error('Failed to load room data');
            router.push('/rooms');
        } finally {
            setLoading(false);
        }
    };

    const fetchFormOptions = async () => {
        try {
            const [classesRes, floorsRes] = await Promise.all([
                fetch(`${apiBaseUrl}/api/rooms/settings/classes`),
                fetch(`${apiBaseUrl}/api/floors`)
            ]);

            if (classesRes.ok) {
                const classesData = await classesRes.json();
                setRoomClasses(classesData.roomClasses || []);
            }

            if (floorsRes.ok) {
                const floorsData = await floorsRes.json();
                setFloors(floorsData.floors || []);
            }
        } catch (error) {
            // console.error('Error fetching form options:', error);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.roomNumber.trim()) {
            newErrors.roomNumber = 'Room number is required';
        } else if (!/^[A-Za-z0-9-]+$/.test(formData.roomNumber.trim())) {
            newErrors.roomNumber = 'Room number can only contain letters, numbers, and hyphens';
        }

        if (!formData.roomClassId) {
            newErrors.roomClassId = 'Room class is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the form errors');
            return;
        }

        setSaving(true);
        try {
            const submitData = {
                ...formData,
                roomClassId: parseInt(formData.roomClassId),
                floorId: formData.floorId === 'none' ? null : parseInt(formData.floorId),
            };

            const response = await fetch(`${apiBaseUrl}/api/rooms/${roomId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update room');
            }

            toast.success(data.message || 'Room updated successfully');
            router.push('/rooms');
        } catch (error) {
            // console.error('Error updating room:', error);
            toast.error('Failed to update room: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!room) return;

        setDeleteLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/${roomId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete room');
            }

            toast.success(data.message || 'Room deleted successfully');
            router.push('/rooms');
        } catch (error) {
            // console.error('Error deleting room:', error);
            toast.error('Failed to delete room: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleInputChange = (field: keyof RoomFormData, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'OCCUPIED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'MAINTENANCE':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'CLEANING':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'OUT_OF_ORDER':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading room data...</span>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Room Not Found</h2>
                    <p className="text-gray-600 mb-4">The room you're looking for doesn't exist.</p>
                    <Link href="/rooms">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Rooms
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/rooms">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Rooms
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Settings className="w-8 h-8 text-blue-600 mr-3" />
                            Edit Room {room.roomNumber}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Update room details, status, and settings
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Link href={`/rooms/${roomId}`}>
                        <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Home className="w-5 h-5 mr-2" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="roomNumber">
                                            Room Number <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="roomNumber"
                                            value={formData.roomNumber}
                                            onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                                            className={errors.roomNumber ? 'border-red-500' : ''}
                                        />
                                        {errors.roomNumber && (
                                            <p className="text-sm text-red-500">{errors.roomNumber}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>
                                            Room Class <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.roomClassId}
                                            onValueChange={(value) => handleInputChange('roomClassId', value)}
                                        >
                                            <SelectTrigger className={errors.roomClassId ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select room class" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roomClasses.map((roomClass) => (
                                                    <SelectItem key={roomClass.id} value={roomClass.id.toString()}>
                                                        <div className="flex items-center justify-between w-full">
                                                            <span>{roomClass.name}</span>
                                                            <span className="text-sm text-gray-500 ml-2">
                                                                {formatCurrency(roomClass.ratePerNight)}/night
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.roomClassId && (
                                            <p className="text-sm text-red-500">{errors.roomClassId}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Floor</Label>
                                        <Select
                                            value={formData.floorId}
                                            onValueChange={(value) => handleInputChange('floorId', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select floor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Floor Assigned</SelectItem>
                                                {floors.map((floor) => (
                                                    <SelectItem key={floor.id} value={floor.id.toString()}>
                                                        Floor {floor.floorNumber} - {floor.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => handleInputChange('status', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="AVAILABLE">Available</SelectItem>
                                                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                                                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                                <SelectItem value="CLEANING">Cleaning</SelectItem>
                                                <SelectItem value="OUT_OF_ORDER">Out of Order</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Features & Amenities */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Building className="w-5 h-5 mr-2" />
                                    Features & Amenities
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="hasBalcony"
                                            checked={formData.hasBalcony}
                                            onCheckedChange={(checked) => handleInputChange('hasBalcony', Boolean(checked))}
                                        />
                                        <Label htmlFor="hasBalcony">Has Balcony</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="hasSeaView"
                                            checked={formData.hasSeaView}
                                            onCheckedChange={(checked) => handleInputChange('hasSeaView', Boolean(checked))}
                                        />
                                        <Label htmlFor="hasSeaView">Sea View</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="hasKitchenette"
                                            checked={formData.hasKitchenette}
                                            onCheckedChange={(checked) => handleInputChange('hasKitchenette', Boolean(checked))}
                                        />
                                        <Label htmlFor="hasKitchenette">Has Kitchenette</Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    Additional Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="specialNotes">Special Notes</Label>
                                    <Textarea
                                        id="specialNotes"
                                        placeholder="Any special notes about this room..."
                                        value={formData.specialNotes}
                                        onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cleaningNotes">Cleaning Instructions</Label>
                                    <Textarea
                                        id="cleaningNotes"
                                        placeholder="Special cleaning instructions..."
                                        value={formData.cleaningNotes}
                                        onChange={(e) => handleInputChange('cleaningNotes', e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => handleInputChange('isActive', Boolean(checked))}
                                    />
                                    <Label htmlFor="isActive">Room is Active (available for booking)</Label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        disabled={saving || room._count.reservations > 0}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {room._count.reservations > 0 ? 'Has Reservations' : 'Delete Room'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center">
                                            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                                            Delete Room
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete Room {room.roomNumber}?
                                            This action cannot be undone and will remove all room data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            disabled={deleteLoading}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            {deleteLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 mr-2" />
                                            )}
                                            {deleteLoading ? 'Deleting...' : 'Delete Room'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <div className="flex items-center space-x-4">
                                <Link href="/rooms">
                                    <Button variant="outline" disabled={saving}>
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={saving}>
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    {saving ? 'Updating...' : 'Update Room'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Sidebar - Room Info & Activity */}
                <div className="space-y-6">
                    {/* Current Room Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Home className="w-5 h-5 mr-2" />
                                Room {room.roomNumber}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Status:</span>
                                <Badge className={`text-xs border ${getStatusColor(room.status)}`}>
                                    {room.status.replace('_', ' ')}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Class:</span>
                                <span className="text-sm font-medium">{room.roomClass.name}</span>
                            </div>

                            {room.floor && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Floor:</span>
                                    <span className="text-sm font-medium">Floor {room.floor.floorNumber}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Max Occupancy:</span>
                                <span className="text-sm font-medium">{room.roomClass.maxOccupancy} guests</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Rate per Night:</span>
                                <span className="text-sm font-medium">{formatCurrency(room.roomClass.ratePerNight)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Day Rate:</span>
                                <span className="text-sm font-medium">{formatCurrency(room.roomClass.rateDayUse)}</span>
                            </div>

                            {!room.isActive && (
                                <div className="p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                                    Room is currently inactive
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Room Features */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Building className="w-5 h-5 mr-2" />
                                Room Features
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${room.hasBalcony ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className="text-sm">Balcony</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${room.hasSeaView ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className="text-sm">Sea View</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${room.hasKitchenette ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className="text-sm">Kitchenette</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cleaning Schedule */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Sparkles className="w-5 h-5 mr-2" />
                                Cleaning Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Last Cleaned:</span>
                                <span className="text-sm">{formatDate(room.lastCleaned)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Next Due:</span>
                                <span className="text-sm">{formatDate(room.nextCleaningDue)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Frequency:</span>
                                <span className="text-sm">{room.roomClass.cleaningFrequencyDays} days</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Activity className="w-5 h-5 mr-2" />
                                Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Bookings:</span>
                                <span className="text-sm font-medium">{room._count.reservations}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Facilities:</span>
                                <span className="text-sm font-medium">{room._count.facilities}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Created:</span>
                                <span className="text-sm">{formatDate(room.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Last Updated:</span>
                                <span className="text-sm">{formatDate(room.updatedAt)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Reservations */}
                    {room.reservations && room.reservations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <History className="w-5 h-5 mr-2" />
                                    Recent Reservations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {room.reservations.slice(0, 5).map((reservation) => (
                                        <div key={reservation.id} className="text-sm">
                                            <div className="font-medium">
                                                {reservation.customer.firstName} {reservation.customer.lastName}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                                            </div>
                                            <Badge variant="outline" className="text-xs mt-1">
                                                {reservation.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}