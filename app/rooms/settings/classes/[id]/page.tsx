"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
    Building,
    ArrowLeft,
    Edit,
    Trash2,
    DollarSign,
    Users,
    Bed,
    Clock,
    Star,
    Wifi,
    Car,
    Coffee,
    Tv,
    Wind,
    Bath,
    Shield,
    Calendar,
    Home,
    MapPin,
    ImageIcon,
    Plus,
    AlertCircle,
    CheckCircle,
    Loader2,
    MoreVertical,
    Eye,
    Settings,
    BookOpen,
    Camera,
    Gift,
    Percent,
    RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
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

interface RoomClassData {
    id: number;
    name: string;
    description: string | null;
    ratePerNight: number;
    rateDayUse: number;
    hourlyRate: number | null;
    extraPersonCharge: number;
    childCharge: number;
    maxOccupancy: number;
    standardOccupancy: number;
    roomSize: string | null;
    bedConfiguration: string | null;
    cleaningFrequencyDays: number;
    lastCleaningUpdate: string;
    cleaningDueNotification: boolean;
    amenities: string | null;
    specialFeatures: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        rooms: number;
        reservations: number;
        roomImages: number;
        roomOffers: number;
        complementaryItems: number;
    };
    rooms?: Array<{
        id: number;
        roomNumber: string;
        status: string;
        floor: {
            id: number;
            name: string;
            floorNumber: number;
        } | null;
        lastCleaned: string | null;
        nextCleaningDue: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    roomImages?: Array<{
        id: number;
        imageUrl: string;
        caption: string | null;
        isPrimary: boolean;
        createdAt: string;
    }>;
    roomOffers?: Array<{
        id: number;
        title: string;
        description: string | null;
        discountType: string;
        discountValue: number;
        validFrom: string;
        validTo: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
    complementaryItems?: Array<{
        id: number;
        name: string;
        description: string | null;
        rate: number;
        isOptional: boolean;
    }>;
}

const COMMON_AMENITIES = [
    { name: 'Free Wi-Fi', icon: Wifi },
    { name: 'Air Conditioning', icon: Wind },
    { name: 'Private Bathroom', icon: Bath },
    { name: 'Flat-screen TV', icon: Tv },
    { name: 'Coffee/Tea Maker', icon: Coffee },
    { name: 'Parking', icon: Car },
    { name: 'Room Service', icon: Star },
    { name: 'Safe Deposit Box', icon: Shield },
];

export default function RoomClassDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const roomClassId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [roomClass, setRoomClass] = useState<RoomClassData | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        if (roomClassId) {
            fetchRoomClass();
        }
    }, [roomClassId]);

    const fetchRoomClass = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/classes/${roomClassId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error('Room class not found');
                    router.push('/rooms/settings/classes');
                    return;
                }
                throw new Error('Failed to fetch room class');
            }

            const data = await response.json();
            setRoomClass(data.roomClass);

        } catch (error) {
            console.error('Error fetching room class:', error);
            toast.error('Failed to load room class data');
            router.push('/rooms/settings/classes');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!roomClass) return;

        setDeleteLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/classes/${roomClassId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete room class');
            }

            toast.success(`Room class "${roomClass.name}" deleted successfully`);
            router.push('/rooms/settings/classes');

        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete room class: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const parseAmenities = (amenitiesString: string | null): string[] => {
        if (!amenitiesString) return [];
        try {
            return JSON.parse(amenitiesString);
        } catch {
            return [];
        }
    };

    const getAmenityIcon = (amenityName: string) => {
        const amenity = COMMON_AMENITIES.find(a => a.name === amenityName);
        return amenity ? amenity.icon : Star;
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
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'OUT_OF_ORDER':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getDiscountTypeIcon = (discountType: string) => {
        return discountType === 'PERCENTAGE' ? Percent : DollarSign;
    };

    const formatDiscountValue = (discountType: string, value: number) => {
        return discountType === 'PERCENTAGE' ? `${value}%` : formatCurrency(value);
    };

    const isOfferActive = (validFrom: string, validTo: string) => {
        const now = new Date();
        const from = new Date(validFrom);
        const to = new Date(validTo);
        return now >= from && now <= to;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading room class details...</p>
                </div>
            </div>
        );
    }

    if (!roomClass) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Room Class Not Found</h3>
                    <p className="text-gray-600 mb-4">The room class you're looking for doesn't exist.</p>
                    <Link href="/rooms/settings/classes">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Classes
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const amenities = parseAmenities(roomClass.amenities);
    const canDelete = roomClass._count.rooms === 0 && roomClass._count.reservations === 0;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/rooms/settings/classes">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Classes
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Building className="w-8 h-8 text-purple-600 mr-3" />
                            {roomClass.name}
                            <div className="ml-3 flex items-center space-x-2">
                                <Badge variant={roomClass.isActive ? "default" : "secondary"}>
                                    {roomClass.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {roomClass._count.rooms > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                        {roomClass._count.rooms} rooms
                                    </Badge>
                                )}
                            </div>
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {roomClass.description || "Room class details and configuration"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Link href={`/rooms/settings/classes/${roomClassId}/edit`}>
                        <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/rooms/settings/classes/${roomClassId}/edit`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Camera className="w-4 h-4 mr-2" />
                                Manage Images
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Gift className="w-4 h-4 mr-2" />
                                Manage Offers
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="w-4 h-4 mr-2" />
                                Complementary Items
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteDialogOpen(true)}
                                disabled={!canDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {canDelete ? 'Delete Room Class' : 'Cannot Delete (Has Dependencies)'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Warning for Dependencies */}
            {(roomClass._count.rooms > 0 || roomClass._count.reservations > 0) && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-orange-900">Room Class In Use</h4>
                                <p className="text-sm text-orange-700 mt-1">
                                    This room class has {roomClass._count.rooms} associated room(s) and {roomClass._count.reservations} reservation(s).
                                    It cannot be deleted while these dependencies exist.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Building className="w-5 h-5 mr-2" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Room Class Name</Label>
                                    <p className="text-lg font-semibold">{roomClass.name}</p>
                                </div>
                                {roomClass.roomSize && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Room Size</Label>
                                        <p className="text-lg">{roomClass.roomSize}</p>
                                    </div>
                                )}
                            </div>

                            {roomClass.description && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                                    <p className="text-gray-700 leading-relaxed">{roomClass.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {roomClass.bedConfiguration && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Bed Configuration</Label>
                                        <p className="flex items-center text-lg">
                                            <Bed className="w-4 h-4 mr-2 text-gray-400" />
                                            {roomClass.bedConfiguration}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                                    <p className="flex items-center">
                                        <Badge variant={roomClass.isActive ? "default" : "secondary"} className="text-sm">
                                            {roomClass.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <DollarSign className="w-5 h-5 mr-2" />
                                Pricing Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="text-center p-4 rounded-lg border bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                    <div className="text-2xl font-bold text-green-700">
                                        {formatCurrency(roomClass.ratePerNight)}
                                    </div>
                                    <div className="text-sm text-green-600 font-medium">Per Night</div>
                                </div>

                                <div className="text-center p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                    <div className="text-2xl font-bold text-blue-700">
                                        {formatCurrency(roomClass.rateDayUse)}
                                    </div>
                                    <div className="text-sm text-blue-600 font-medium">Day Use</div>
                                </div>

                                {roomClass.hourlyRate && (
                                    <div className="text-center p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                        <div className="text-2xl font-bold text-purple-700">
                                            {formatCurrency(roomClass.hourlyRate)}
                                        </div>
                                        <div className="text-sm text-purple-600 font-medium">Per Hour</div>
                                    </div>
                                )}
                            </div>

                            {(roomClass.extraPersonCharge > 0 || roomClass.childCharge > 0) && (
                                <>
                                    <Separator className="my-4" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {roomClass.extraPersonCharge > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-gray-50">
                                                <div className="text-lg font-semibold text-gray-700">
                                                    {formatCurrency(roomClass.extraPersonCharge)}
                                                </div>
                                                <div className="text-sm text-gray-600">Extra Person Charge</div>
                                            </div>
                                        )}
                                        {roomClass.childCharge > 0 && (
                                            <div className="text-center p-3 rounded-lg bg-gray-50">
                                                <div className="text-lg font-semibold text-gray-700">
                                                    {formatCurrency(roomClass.childCharge)}
                                                </div>
                                                <div className="text-sm text-gray-600">Child Charge</div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Occupancy & Cleaning */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Users className="w-5 h-5 mr-2" />
                                Occupancy & Cleaning Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600 mb-1">
                                        {roomClass.standardOccupancy}
                                    </div>
                                    <div className="text-sm text-gray-600">Standard Occupancy</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600 mb-1">
                                        {roomClass.maxOccupancy}
                                    </div>
                                    <div className="text-sm text-gray-600">Maximum Occupancy</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-600 mb-1 flex items-center justify-center">
                                        {roomClass.cleaningFrequencyDays}
                                        <Clock className="w-5 h-5 ml-1" />
                                    </div>
                                    <div className="text-sm text-gray-600">Cleaning Frequency (Days)</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600 mb-1">
                                        {roomClass.cleaningDueNotification ? (
                                            <CheckCircle className="w-8 h-8 mx-auto" />
                                        ) : (
                                            <AlertCircle className="w-8 h-8 mx-auto" />
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {roomClass.cleaningDueNotification ? 'Notifications On' : 'Notifications Off'}
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-4" />
                            <div className="text-sm text-gray-600">
                                <Label className="font-medium">Last Cleaning Schedule Update:</Label>
                                <p className="mt-1">{formatDate(roomClass.lastCleaningUpdate)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Amenities */}
                    {amenities.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <Star className="w-5 h-5 mr-2" />
                                    Amenities & Features ({amenities.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {amenities.map((amenity, index) => {
                                        const IconComponent = getAmenityIcon(amenity);
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                                            >
                                                <IconComponent className="w-5 h-5 mr-3 text-purple-600" />
                                                <span className="text-sm font-medium">{amenity}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {roomClass.specialFeatures && (
                                    <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                                        <Label className="text-sm font-medium text-blue-900 mb-1 block">Special Features</Label>
                                        <p className="text-sm text-blue-700">{roomClass.specialFeatures}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Active Room Offers */}
                    {roomClass.roomOffers && roomClass.roomOffers.length > 0 && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center text-lg">
                                    <Gift className="w-5 h-5 mr-2" />
                                    Room Offers ({roomClass.roomOffers.length})
                                </CardTitle>
                                <Button variant="outline" size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Offer
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {roomClass.roomOffers.map((offer) => {
                                        const DiscountIcon = getDiscountTypeIcon(offer.discountType);
                                        const isActive = isOfferActive(offer.validFrom, offer.validTo);

                                        return (
                                            <div
                                                key={offer.id}
                                                className={`p-4 rounded-lg border ${isActive && offer.isActive
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-lg flex items-center">
                                                        <DiscountIcon className="w-4 h-4 mr-2 text-green-600" />
                                                        {offer.title}
                                                    </h4>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant={isActive && offer.isActive ? "default" : "secondary"}>
                                                            {formatDiscountValue(offer.discountType, offer.discountValue)} OFF
                                                        </Badge>
                                                        <Badge variant={isActive && offer.isActive ? "outline" : "secondary"}>
                                                            {isActive && offer.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {offer.description && (
                                                    <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                                                )}

                                                <div className="text-xs text-gray-500">
                                                    <span>Valid: {new Date(offer.validFrom).toLocaleDateString()} - {new Date(offer.validTo).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Complementary Items */}
                    {roomClass.complementaryItems && roomClass.complementaryItems.length > 0 && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center text-lg">
                                    <Gift className="w-5 h-5 mr-2" />
                                    Complementary Items ({roomClass.complementaryItems.length})
                                </CardTitle>
                                <Button variant="outline" size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Item
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {roomClass.complementaryItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-lg border bg-gray-50"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold">{item.name}</h4>
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="outline">
                                                        {formatCurrency(item.rate)}
                                                    </Badge>
                                                    <Badge variant={item.isOptional ? "secondary" : "default"}>
                                                        {item.isOptional ? "Optional" : "Included"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-gray-600">{item.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                                <div className="flex items-center">
                                    <Home className="w-5 h-5 text-blue-600 mr-2" />
                                    <span className="text-sm font-medium">Total Rooms</span>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                    {roomClass._count.rooms}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                                <div className="flex items-center">
                                    <BookOpen className="w-5 h-5 text-green-600 mr-2" />
                                    <span className="text-sm font-medium">Reservations</span>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                    {roomClass._count.reservations}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                                <div className="flex items-center">
                                    <ImageIcon className="w-5 h-5 text-purple-600 mr-2" />
                                    <span className="text-sm font-medium">Images</span>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                    {roomClass._count.roomImages}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                                <div className="flex items-center">
                                    <Gift className="w-5 h-5 text-orange-600 mr-2" />
                                    <span className="text-sm font-medium">Active Offers</span>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                    {roomClass._count.roomOffers}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50">
                                <div className="flex items-center">
                                    <Star className="w-5 h-5 text-teal-600 mr-2" />
                                    <span className="text-sm font-medium">Complementary</span>
                                </div>
                                <Badge variant="outline" className="bg-white">
                                    {roomClass._count.complementaryItems}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href={`/rooms/settings/classes/${roomClassId}/edit`} className="block">
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Room Class
                                </Button>
                            </Link>

                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <Camera className="w-4 h-4 mr-2" />
                                Manage Images ({roomClass._count.roomImages})
                            </Button>

                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <Gift className="w-4 h-4 mr-2" />
                                Manage Offers ({roomClass._count.roomOffers})
                            </Button>

                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <Star className="w-4 h-4 mr-2" />
                                Complementary Items ({roomClass._count.complementaryItems})
                            </Button>

                            {roomClass._count.rooms > 0 && (
                                <Link href={`/rooms?classId=${roomClassId}`} className="block">
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View All Rooms ({roomClass._count.rooms})
                                    </Button>
                                </Link>
                            )}

                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Update Cleaning Schedule
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Room Class Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <Label className="text-gray-500 font-medium">Created</Label>
                                <p className="text-gray-700">{formatDate(roomClass.createdAt)}</p>
                            </div>
                            <div>
                                <Label className="text-gray-500 font-medium">Last Updated</Label>
                                <p className="text-gray-700">{formatDate(roomClass.updatedAt)}</p>
                            </div>
                            <div>
                                <Label className="text-gray-500 font-medium">Last Cleaning Update</Label>
                                <p className="text-gray-700">{formatDate(roomClass.lastCleaningUpdate)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Associated Rooms Preview */}
            {roomClass.rooms && roomClass.rooms.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Home className="w-5 h-5 mr-2" />
                            Associated Rooms ({roomClass.rooms.length})
                        </CardTitle>
                        {roomClass._count.rooms > roomClass.rooms.length && (
                            <Link href={`/rooms?classId=${roomClassId}`}>
                                <Button variant="outline" size="sm">
                                    View All ({roomClass._count.rooms})
                                </Button>
                            </Link>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roomClass.rooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-lg">{room.roomNumber}</h4>
                                        <Badge className={`text-xs ${getStatusColor(room.status)}`}>
                                            {room.status}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        {room.floor && (
                                            <p className="flex items-center">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                Floor {room.floor.floorNumber} - {room.floor.name}
                                            </p>
                                        )}
                                        {room.lastCleaned && (
                                            <p className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Last cleaned: {new Date(room.lastCleaned).toLocaleDateString()}
                                            </p>
                                        )}
                                        {room.nextCleaningDue && (
                                            <p className="flex items-center text-orange-600">
                                                <RefreshCw className="w-3 h-3 mr-1" />
                                                Next cleaning: {new Date(room.nextCleaningDue).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            Delete Room Class
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the room class "{roomClass?.name}"?
                            This action cannot be undone and will remove all associated images, offers, and complementary items.
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
                            {deleteLoading ? 'Deleting...' : 'Delete Room Class'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}