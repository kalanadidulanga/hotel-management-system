"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft,
    Edit,
    Loader2,
    Home,
    Building,
    MapPin,
    AlertTriangle,
    Calendar,
    Users,
    Activity,
    Clock,
    Sparkles,
    Trash2,
    History,
    MoreVertical,
    CheckCircle,
    Wrench,
    Ban,
    Phone,
    Mail,
    DollarSign,
    Star,
    Shield,
    Wifi,
    Car,
    Coffee,
    Tv,
    Wind,
    Bath,
    Bed,
    Eye,
    Settings,
    TrendingUp,
    Calendar as CalendarIcon,
    FileText
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Label } from "@/components/ui/label";

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
        hourlyRate: number;
        maxOccupancy: number;
        standardOccupancy: number;
        cleaningFrequencyDays: number;
        amenities: string[] | null;
        specialFeatures: string[] | null;
    };
    floor: {
        id: number;
        name: string;
        floorNumber: number;
        description: string;
    } | null;
    facilities: Array<{
        id: number;
        facility: {
            id: number;
            name: string;
            category: string;
            description: string;
            isActive: boolean;
        };
        notes: string | null;
        condition: string;
        lastMaintenanceDate: string | null;
        createdAt: string;
    }>;
    reservations: Array<{
        id: number;
        checkInDate: string;
        checkOutDate: string;
        status: string;
        totalAmount: number;
        guestCount: number;
        reservationType: string;
        customer: {
            firstName: string;
            lastName: string;
            phone: string;
            email: string;
        };
        createdAt: string;
    }>;
    _count: {
        reservations: number;
        facilities: number;
    };
}

export default function ViewRoomPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;

    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchRoomData();
    }, [roomId]);

    const fetchRoomData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/rooms/${roomId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch room data');
            }

            const data = await response.json();
            setRoom(data.room);
        } catch (error) {
            console.error('Error fetching room data:', error);
            toast.error('Failed to load room data');
            router.push('/rooms');
        } finally {
            setLoading(false);
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
            console.error('Error deleting room:', error);
            toast.error('Failed to delete room: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    const updateRoomStatus = async (newStatus: string) => {
        if (!room) return;

        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/${roomId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update room status');

            toast.success('Room status updated successfully');
            fetchRoomData(); // Refresh data
        } catch (error) {
            console.error('Status update error:', error);
            toast.error('Failed to update room status');
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <CheckCircle className="w-4 h-4" />;
            case 'OCCUPIED':
                return <Users className="w-4 h-4" />;
            case 'MAINTENANCE':
                return <Wrench className="w-4 h-4" />;
            case 'CLEANING':
                return <Sparkles className="w-4 h-4" />;
            case 'OUT_OF_ORDER':
                return <Ban className="w-4 h-4" />;
            default:
                return <Home className="w-4 h-4" />;
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

    const isCleaningOverdue = (room: Room) => {
        if (!room.nextCleaningDue) return false;
        return new Date(room.nextCleaningDue) < new Date();
    };

    const getDaysUntilCleaning = (room: Room) => {
        if (!room.nextCleaningDue) return null;
        const today = new Date();
        const dueDate = new Date(room.nextCleaningDue);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getReservationStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-800';
            case 'CHECKED_IN':
                return 'bg-green-100 text-green-800';
            case 'CHECKED_OUT':
                return 'bg-gray-100 text-gray-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getFacilityIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'technology':
                return <Tv className="w-4 h-4" />;
            case 'comfort':
                return <Bed className="w-4 h-4" />;
            case 'bathroom':
                return <Bath className="w-4 h-4" />;
            case 'climate':
                return <Wind className="w-4 h-4" />;
            case 'connectivity':
                return <Wifi className="w-4 h-4" />;
            case 'amenities':
                return <Coffee className="w-4 h-4" />;
            case 'parking':
                return <Car className="w-4 h-4" />;
            default:
                return <Shield className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading room details...</span>
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

    const daysUntilCleaning = getDaysUntilCleaning(room);
    const isOverdue = isCleaningOverdue(room);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
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
                            <Home className="w-8 h-8 text-blue-600 mr-3" />
                            Room {room.roomNumber}
                            <Badge className={`ml-4 text-sm border ${getStatusColor(room.status)}`}>
                                {getStatusIcon(room.status)}
                                <span className="ml-1">{room.status.replace('_', ' ')}</span>
                            </Badge>
                            {!room.isActive && (
                                <Badge variant="secondary" className="ml-2">
                                    <Ban className="w-3 h-3 mr-1" />
                                    Inactive
                                </Badge>
                            )}
                            {isOverdue && (
                                <Badge variant="destructive" className="ml-2">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Cleaning Overdue
                                </Badge>
                            )}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {room.roomClass.name} • Floor {room.floor?.floorNumber || 'N/A'} • {room.roomClass.maxOccupancy} guests max
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Link href={`/rooms/${roomId}/edit`}>
                        <Button variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Room
                        </Button>
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                                onClick={() => updateRoomStatus('AVAILABLE')}
                                disabled={room.status === 'AVAILABLE'}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Available
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => updateRoomStatus('MAINTENANCE')}
                                disabled={room.status === 'MAINTENANCE'}
                            >
                                <Wrench className="w-4 h-4 mr-2" />
                                Mark Maintenance
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => updateRoomStatus('CLEANING')}
                                disabled={room.status === 'CLEANING'}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Mark Cleaning
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => updateRoomStatus('OUT_OF_ORDER')}
                                disabled={room.status === 'OUT_OF_ORDER'}
                            >
                                <Ban className="w-4 h-4 mr-2" />
                                Mark Out of Order
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteDialogOpen(true)}
                                disabled={room._count.reservations > 0}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {room._count.reservations > 0 ? 'Has Reservations' : 'Delete Room'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(room.roomClass.ratePerNight)}</div>
                        <div className="text-xs text-gray-600">Per Night</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(room.roomClass.rateDayUse)}</div>
                        <div className="text-xs text-gray-600">Day Use</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{room.roomClass.maxOccupancy}</div>
                        <div className="text-xs text-gray-600">Max Guests</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{room._count.reservations}</div>
                        <div className="text-xs text-gray-600">Total Bookings</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-indigo-600">{room._count.facilities}</div>
                        <div className="text-xs text-gray-600">Facilities</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-700">{room.roomClass.cleaningFrequencyDays}</div>
                        <div className="text-xs text-gray-600">Clean Days</div>
                    </CardContent>
                </Card>
            </div>

            {/* Special Alerts */}
            {(room.specialNotes || room.cleaningNotes || isOverdue) && (
                <div className="space-y-3">
                    {room.specialNotes && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                                <div>
                                    <h4 className="font-medium text-yellow-800">Special Note</h4>
                                    <p className="text-sm text-yellow-700 mt-1">{room.specialNotes}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {room.cleaningNotes && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start">
                                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                                <div>
                                    <h4 className="font-medium text-blue-800">Cleaning Instructions</h4>
                                    <p className="text-sm text-blue-700 mt-1">{room.cleaningNotes}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isOverdue && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start">
                                <Clock className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                                <div>
                                    <h4 className="font-medium text-red-800">Cleaning Overdue</h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        This room is {Math.abs(daysUntilCleaning || 0)} days overdue for cleaning
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="facilities">Facilities</TabsTrigger>
                    <TabsTrigger value="reservations">Reservations</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Room Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Building className="w-5 h-5 mr-2" />
                                        Room Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Room Number</Label>
                                            <p className="text-lg font-semibold">{room.roomNumber}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Room Class</Label>
                                            <p className="text-lg font-semibold">{room.roomClass.name}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Floor</Label>
                                            <p className="text-lg font-semibold">
                                                {room.floor ? `Floor ${room.floor.floorNumber} - ${room.floor.name}` : 'No Floor Assigned'}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Status</Label>
                                            <Badge className={`text-sm border ${getStatusColor(room.status)}`}>
                                                {getStatusIcon(room.status)}
                                                <span className="ml-1">{room.status.replace('_', ' ')}</span>
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Standard Occupancy</Label>
                                            <p className="text-lg font-semibold">{room.roomClass.standardOccupancy} guests</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Maximum Occupancy</Label>
                                            <p className="text-lg font-semibold">{room.roomClass.maxOccupancy} guests</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Room Features */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Star className="w-5 h-5 mr-2" />
                                        Room Features
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${room.hasBalcony ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            <span className="text-sm">Balcony</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${room.hasSeaView ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            <span className="text-sm">Sea View</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${room.hasKitchenette ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            <span className="text-sm">Kitchenette</span>
                                        </div>
                                    </div>

                                    {/* Amenities - FIXED: Added null check and Array.isArray check */}
                                    {room.roomClass.amenities && Array.isArray(room.roomClass.amenities) && room.roomClass.amenities.length > 0 && (
                                        <div className="mt-6">
                                            <Label className="text-sm font-medium text-gray-500 mb-3 block">Amenities</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {room.roomClass.amenities.map((amenity, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {amenity}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Special Features - FIXED: Added null check and Array.isArray check */}
                                    {room.roomClass.specialFeatures && Array.isArray(room.roomClass.specialFeatures) && room.roomClass.specialFeatures.length > 0 && (
                                        <div className="mt-4">
                                            <Label className="text-sm font-medium text-gray-500 mb-3 block">Special Features</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {room.roomClass.specialFeatures.map((feature, index) => (
                                                    <Badge key={index} variant="secondary" className="text-xs">
                                                        <Star className="w-3 h-3 mr-1" />
                                                        {feature}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Pricing Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <DollarSign className="w-5 h-5 mr-2" />
                                        Pricing Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {formatCurrency(room.roomClass.ratePerNight)}
                                            </div>
                                            <div className="text-sm text-gray-600">Per Night</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {formatCurrency(room.roomClass.rateDayUse)}
                                            </div>
                                            <div className="text-sm text-gray-600">Day Use</div>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {formatCurrency(room.roomClass.hourlyRate || 0)}
                                            </div>
                                            <div className="text-sm text-gray-600">Per Hour</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
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
                                        <span className="text-sm font-medium">{formatDate(room.lastCleaned)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Next Due:</span>
                                        <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' :
                                            daysUntilCleaning !== null && daysUntilCleaning <= 1 ? 'text-orange-600' : ''
                                            }`}>
                                            {formatDate(room.nextCleaningDue)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Frequency:</span>
                                        <span className="text-sm font-medium">{room.roomClass.cleaningFrequencyDays} days</span>
                                    </div>
                                    {daysUntilCleaning !== null && (
                                        <div className="pt-2 border-t">
                                            <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' :
                                                daysUntilCleaning <= 1 ? 'text-orange-600' : 'text-green-600'
                                                }`}>
                                                {isOverdue ? `Overdue by ${Math.abs(daysUntilCleaning)} days` :
                                                    daysUntilCleaning === 0 ? 'Due today' :
                                                        daysUntilCleaning === 1 ? 'Due tomorrow' :
                                                            `Due in ${daysUntilCleaning} days`}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Activity Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <Activity className="w-5 h-5 mr-2" />
                                        Activity Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Total Reservations:</span>
                                        <span className="text-sm font-medium">{room._count.reservations}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Facilities Count:</span>
                                        <span className="text-sm font-medium">{room._count.facilities}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Room Status:</span>
                                        <Badge variant={room.isActive ? "default" : "secondary"} className="text-xs">
                                            {room.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
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
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="facilities" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Shield className="w-5 h-5 mr-2" />
                                    Room Facilities ({room._count.facilities})
                                </div>
                                <Button variant="outline" size="sm">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Manage Facilities
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {room.facilities && room.facilities.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {room.facilities.map((roomFacility) => (
                                        <Card key={roomFacility.id} className="border">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center">
                                                        {getFacilityIcon(roomFacility.facility.category)}
                                                        <div className="ml-2">
                                                            <h4 className="font-medium text-sm">{roomFacility.facility.name}</h4>
                                                            <Badge variant="outline" className="text-xs mt-1">
                                                                {roomFacility.facility.category}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant={roomFacility.facility.isActive ? "default" : "secondary"}
                                                        className="text-xs"
                                                    >
                                                        {roomFacility.facility.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>

                                                {roomFacility.facility.description && (
                                                    <p className="text-xs text-gray-600 mb-2">
                                                        {roomFacility.facility.description}
                                                    </p>
                                                )}

                                                <div className="space-y-1 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Condition:</span>
                                                        <Badge
                                                            variant={roomFacility.condition === 'EXCELLENT' ? 'default' :
                                                                roomFacility.condition === 'GOOD' ? 'secondary' : 'destructive'}
                                                            className="text-xs"
                                                        >
                                                            {roomFacility.condition}
                                                        </Badge>
                                                    </div>
                                                    {roomFacility.lastMaintenanceDate && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Last Maintenance:</span>
                                                            <span>{formatDate(roomFacility.lastMaintenanceDate)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {roomFacility.notes && (
                                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                                        <strong>Note:</strong> {roomFacility.notes}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Facilities</h3>
                                    <p className="text-gray-600 mb-4">This room doesn't have any facilities assigned yet.</p>
                                    <Button variant="outline">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Add Facilities
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reservations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <CalendarIcon className="w-5 h-5 mr-2" />
                                    Reservation History ({room._count.reservations})
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View All
                                    </Button>
                                    <Button size="sm">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        New Booking
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {room.reservations && room.reservations.length > 0 ? (
                                <div className="space-y-4">
                                    {room.reservations.slice(0, 10).map((reservation) => (
                                        <Card key={reservation.id} className="border">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h4 className="font-medium">
                                                                {reservation.customer.firstName} {reservation.customer.lastName}
                                                            </h4>
                                                            <Badge className={getReservationStatusColor(reservation.status)}>
                                                                {reservation.status.replace('_', ' ')}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs">
                                                                {reservation.reservationType}
                                                            </Badge>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                            <div>
                                                                <span className="font-medium">Check-in:</span> {formatDate(reservation.checkInDate)}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Check-out:</span> {formatDate(reservation.checkOutDate)}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Guests:</span> {reservation.guestCount}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Total:</span> {formatCurrency(reservation.totalAmount)}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                                            {reservation.customer.phone && (
                                                                <div className="flex items-center">
                                                                    <Phone className="w-3 h-3 mr-1" />
                                                                    {reservation.customer.phone}
                                                                </div>
                                                            )}
                                                            {reservation.customer.email && (
                                                                <div className="flex items-center">
                                                                    <Mail className="w-3 h-3 mr-1" />
                                                                    {reservation.customer.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-right text-xs text-gray-500">
                                                        Booked: {formatDate(reservation.createdAt)}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {room.reservations.length > 10 && (
                                        <div className="text-center pt-4">
                                            <Button variant="outline">
                                                <History className="w-4 h-4 mr-2" />
                                                View All {room._count.reservations} Reservations
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reservations</h3>
                                    <p className="text-gray-600 mb-4">This room hasn't been booked yet.</p>
                                    <Button>
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Create First Booking
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cleaning History */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Cleaning & Maintenance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-3">Current Cleaning Status</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Last Cleaned:</span>
                                            <span className="font-medium">{formatDate(room.lastCleaned)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Next Due:</span>
                                            <span className={`font-medium ${isOverdue ? 'text-red-600' :
                                                daysUntilCleaning !== null && daysUntilCleaning <= 1 ? 'text-orange-600' : ''
                                                }`}>
                                                {formatDate(room.nextCleaningDue)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Frequency:</span>
                                            <span className="font-medium">{room.roomClass.cleaningFrequencyDays} days</span>
                                        </div>
                                    </div>

                                    {daysUntilCleaning !== null && (
                                        <div className={`mt-3 p-2 rounded text-sm ${isOverdue ? 'bg-red-50 text-red-800' :
                                            daysUntilCleaning <= 1 ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'
                                            }`}>
                                            {isOverdue ? `⚠️ Overdue by ${Math.abs(daysUntilCleaning)} days` :
                                                daysUntilCleaning === 0 ? '⏰ Due today' :
                                                    daysUntilCleaning === 1 ? '📅 Due tomorrow' :
                                                        `✅ Due in ${daysUntilCleaning} days`}
                                        </div>
                                    )}
                                </div>

                                {room.cleaningNotes && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="font-medium text-blue-800 mb-2">Cleaning Instructions</h4>
                                        <p className="text-sm text-blue-700">{room.cleaningNotes}</p>
                                    </div>
                                )}

                                <div className="flex space-x-2">
                                    <Button size="sm">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Mark as Cleaned
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Cleaning Log
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Room Condition */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2" />
                                    Room Condition
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-3">Overall Condition</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Overall Rating</span>
                                            <div className="flex items-center">
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <Star className="w-4 h-4 text-gray-300" />
                                                <span className="ml-2 text-sm font-medium">4.0</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Facilities in Good Condition</span>
                                                <span className="font-medium">
                                                    {room.facilities.filter(f => f.condition === 'GOOD' || f.condition === 'EXCELLENT').length}/{room.facilities.length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Last Maintenance Check</span>
                                                <span className="font-medium">2 weeks ago</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-2">
                                    <Button size="sm" variant="outline">
                                        <Wrench className="w-4 h-4 mr-2" />
                                        Schedule Maintenance
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Maintenance Log
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                            Delete Room
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete Room {room.roomNumber}?
                            This action cannot be undone and will remove all room data including facilities and cleaning history.
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
        </div>
    );
}