"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Home,
    Plus,
    Loader2,
    Building,
    CheckCircle,
    AlertTriangle,
    Users,
    DollarSign,
    Calendar
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RoomClass {
    id: number;
    name: string;
    ratePerNight: number;
    rateDayUse: number;
    maxOccupancy: number;
    cleaningFrequencyDays: number;
    description?: string;
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

export default function AddRoomPage() {
    const router = useRouter();

    const [roomClasses, setRoomClasses] = useState<RoomClass[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<RoomFormData>({
        roomNumber: '',
        roomClassId: '',
        floorId: '',
        status: 'AVAILABLE',
        hasBalcony: false,
        hasSeaView: false,
        hasKitchenette: false,
        specialNotes: '',
        cleaningNotes: '',
        isActive: true,
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setDataLoading(true);
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
            console.error('Error fetching initial data:', error);
            toast.error('Failed to load form data');
        } finally {
            setDataLoading(false);
        }
    };

    const handleInputChange = (field: keyof RoomFormData, value: any) => {
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

    const validateForm = () => {
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
            toast.error('Please fix the validation errors');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    roomNumber: formData.roomNumber.trim(),
                    roomClassId: parseInt(formData.roomClassId),
                    floorId: formData.floorId && formData.floorId !== 'none' ? parseInt(formData.floorId) : null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create room');
            }

            const data = await response.json();
            toast.success(`Room ${formData.roomNumber} created successfully!`);
            router.push('/rooms');

        } catch (error) {
            console.error('Room creation error:', error);
            toast.error('Failed to create room: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const selectedRoomClass = roomClasses.find(rc => rc.id === parseInt(formData.roomClassId));

    if (dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading form data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
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
                            <Plus className="w-8 h-8 text-green-600 mr-3" />
                            Add New Room
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Create a new room in the system
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Room Information */}
                    <div className="lg:col-span-2 space-y-6">
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
                                        <Label htmlFor="roomNumber">Room Number *</Label>
                                        <Input
                                            id="roomNumber"
                                            value={formData.roomNumber}
                                            onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                                            placeholder="Enter room number (e.g., 101, A-203)"
                                            className={errors.roomNumber ? 'border-red-500' : ''}
                                            required
                                        />
                                        {errors.roomNumber && (
                                            <p className="text-sm text-red-600 flex items-center">
                                                <AlertTriangle className="w-4 h-4 mr-1" />
                                                {errors.roomNumber}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500">
                                            Use alphanumeric characters and hyphens only
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="roomClass">Room Class *</Label>
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
                                                        {roomClass.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.roomClassId && (
                                            <p className="text-sm text-red-600 flex items-center">
                                                <AlertTriangle className="w-4 h-4 mr-1" />
                                                {errors.roomClassId}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="floor">Floor</Label>
                                        <Select
                                            value={formData.floorId || "none"}
                                            onValueChange={(value) => handleInputChange('floorId', value === "none" ? "" : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select floor (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No floor assignment</SelectItem>
                                                {floors.map((floor) => (
                                                    <SelectItem key={floor.id} value={floor.id.toString()}>
                                                        Floor {floor.floorNumber} - {floor.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Initial Status</Label>
                                        <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="AVAILABLE">Available</SelectItem>
                                                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                                <SelectItem value="CLEANING">Cleaning</SelectItem>
                                                <SelectItem value="OUT_OF_ORDER">Out of Order</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Room Features */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Room Features
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="hasBalcony"
                                            checked={formData.hasBalcony}
                                            onCheckedChange={(checked) => handleInputChange('hasBalcony', checked)}
                                        />
                                        <Label htmlFor="hasBalcony" className="font-medium">
                                            Has Balcony
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="hasSeaView"
                                            checked={formData.hasSeaView}
                                            onCheckedChange={(checked) => handleInputChange('hasSeaView', checked)}
                                        />
                                        <Label htmlFor="hasSeaView" className="font-medium">
                                            Sea View
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="hasKitchenette"
                                            checked={formData.hasKitchenette}
                                            onCheckedChange={(checked) => handleInputChange('hasKitchenette', checked)}
                                        />
                                        <Label htmlFor="hasKitchenette" className="font-medium">
                                            Has Kitchenette
                                        </Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Notes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="specialNotes">Special Notes</Label>
                                    <Textarea
                                        id="specialNotes"
                                        value={formData.specialNotes}
                                        onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                                        placeholder="Any special notes about this room..."
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cleaningNotes">Cleaning Notes</Label>
                                    <Textarea
                                        id="cleaningNotes"
                                        value={formData.cleaningNotes}
                                        onChange={(e) => handleInputChange('cleaningNotes', e.target.value)}
                                        placeholder="Special cleaning instructions..."
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Room Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                                    />
                                    <Label htmlFor="isActive" className="font-medium">
                                        Room is Active
                                    </Label>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    Inactive rooms won't be available for booking
                                </p>
                            </CardContent>
                        </Card>

                        {/* Room Class Preview */}
                        {selectedRoomClass && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                        <Building className="w-5 h-5 mr-2" />
                                        Class Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Room Class</Label>
                                        <p className="font-semibold">{selectedRoomClass.name}</p>
                                        {selectedRoomClass.description && (
                                            <p className="text-sm text-gray-600 mt-1">{selectedRoomClass.description}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Night Rate</Label>
                                            <p className="font-semibold text-green-600 flex items-center">
                                                <DollarSign className="w-4 h-4 mr-1" />
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'LKR',
                                                    minimumFractionDigits: 0
                                                }).format(selectedRoomClass.ratePerNight)}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Day Rate</Label>
                                            <p className="font-semibold text-blue-600 flex items-center">
                                                <DollarSign className="w-4 h-4 mr-1" />
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: 'LKR',
                                                    minimumFractionDigits: 0
                                                }).format(selectedRoomClass.rateDayUse)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Max Occupancy</Label>
                                            <p className="font-semibold flex items-center">
                                                <Users className="w-4 h-4 mr-1" />
                                                {selectedRoomClass.maxOccupancy} guests
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Cleaning Frequency</Label>
                                            <p className="font-semibold flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {selectedRoomClass.cleaningFrequencyDays} days
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Plus className="w-4 h-4 mr-2" />
                                        )}
                                        {loading ? 'Creating Room...' : 'Create Room'}
                                    </Button>

                                    <Link href="/rooms" className="block">
                                        <Button variant="outline" className="w-full" type="button" size="lg">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}