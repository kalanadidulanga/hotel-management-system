"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Bath,
    Bed,
    Building,
    Calendar,
    Car,
    CheckCircle,
    Coffee,
    DollarSign,
    Edit,
    Eye,
    Filter,
    Home,
    Plus,
    Search,
    Settings,
    SortAsc,
    SortDesc,
    Star,
    Trash2,
    Tv,
    Users,
    Wifi,
    Wind
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RoomClass {
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
}

interface RoomClassStats {
    totalClasses: number;
    activeClasses: number;
    averageRate: number;
    totalRooms: number;
    totalReservations: number;
}

export default function RoomClassesPage() {
    const [roomClasses, setRoomClasses] = useState<RoomClass[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<RoomClass[]>([]);
    const [stats, setStats] = useState<RoomClassStats>({
        totalClasses: 0,
        activeClasses: 0,
        averageRate: 0,
        totalRooms: 0,
        totalReservations: 0,
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [filterStatus, setFilterStatus] = useState("all");
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchRoomClasses();
    }, []);

    useEffect(() => {
        filterAndSortClasses();
    }, [roomClasses, searchTerm, sortBy, sortOrder, filterStatus]);

    const fetchRoomClasses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/classes`);
            if (!response.ok) throw new Error('Failed to fetch room classes');

            const data = await response.json();
            setRoomClasses(data.roomClasses || []);
            setStats(data.stats || {});
        } catch (error) {
            // console.error('Error fetching room classes:', error);
            toast.error('Failed to load room classes');
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortClasses = () => {
        let filtered = [...roomClasses];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(roomClass =>
                roomClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (roomClass.description && roomClass.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (roomClass.bedConfiguration && roomClass.bedConfiguration.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply status filter
        if (filterStatus !== 'all') {
            const isActive = filterStatus === 'active';
            filtered = filtered.filter(roomClass => roomClass.isActive === isActive);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any = a[sortBy as keyof RoomClass];
            let bValue: any = b[sortBy as keyof RoomClass];

            // Handle nested count values
            if (sortBy === 'rooms') {
                aValue = a._count.rooms;
                bValue = b._count.rooms;
            } else if (sortBy === 'reservations') {
                aValue = a._count.reservations;
                bValue = b._count.reservations;
            }

            // Handle string comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            // Handle number comparison
            if (sortOrder === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });

        setFilteredClasses(filtered);
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete the room class "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setDeleteLoading(id);
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/classes/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete room class');
            }

            toast.success(`Room class "${name}" deleted successfully`);
            fetchRoomClasses(); // Refresh the list
        } catch (error) {
            // console.error('Delete error:', error);
            toast.error('Failed to delete room class: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setDeleteLoading(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const parseAmenities = (amenitiesJson: string | null): string[] => {
        if (!amenitiesJson) return [];
        try {
            return JSON.parse(amenitiesJson);
        } catch {
            return [];
        }
    };

    const getAmenityIcon = (amenity: string) => {
        const amenityLower = amenity.toLowerCase();
        if (amenityLower.includes('wifi')) return <Wifi className="w-3 h-3" />;
        if (amenityLower.includes('parking')) return <Car className="w-3 h-3" />;
        if (amenityLower.includes('coffee')) return <Coffee className="w-3 h-3" />;
        if (amenityLower.includes('tv')) return <Tv className="w-3 h-3" />;
        if (amenityLower.includes('ac') || amenityLower.includes('air')) return <Wind className="w-3 h-3" />;
        if (amenityLower.includes('bath')) return <Bath className="w-3 h-3" />;
        return <Star className="w-3 h-3" />;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/rooms/settings">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Settings
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Building className="w-8 h-8 text-purple-600 mr-3" />
                            Room Classes
                            <Badge variant="outline" className="ml-3 text-xs">
                                {filteredClasses.length} of {stats.totalClasses}
                            </Badge>
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage room types, pricing, and capacity settings
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Button onClick={fetchRoomClasses} variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Link href="/rooms/settings/classes/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Room Class
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
                            </div>
                            <Building className="w-6 h-6 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active</p>
                                <p className="text-2xl font-bold text-green-600">{stats.activeClasses}</p>
                            </div>
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Rooms</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.totalRooms}</p>
                            </div>
                            <Home className="w-6 h-6 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Reservations</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.totalReservations}</p>
                            </div>
                            <Calendar className="w-6 h-6 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Rate</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.averageRate)}</p>
                            </div>
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search room classes by name, description, or bed type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-32">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="ratePerNight">Rate/Night</SelectItem>
                                <SelectItem value="maxOccupancy">Max Occupancy</SelectItem>
                                <SelectItem value="rooms">Room Count</SelectItem>
                                <SelectItem value="reservations">Reservations</SelectItem>
                                <SelectItem value="createdAt">Created Date</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Room Classes Grid */}
            {filteredClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map((roomClass) => (
                        <Card
                            key={roomClass.id}
                            className={`transition-all duration-200 hover:shadow-lg ${!roomClass.isActive ? 'opacity-75 bg-gray-50' : 'hover:border-purple-200'
                                }`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${roomClass.isActive
                                                ? 'bg-purple-100 text-purple-600'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            <Bed className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{roomClass.name}</h3>
                                            {roomClass.description && (
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                    {roomClass.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Badge
                                        variant={roomClass.isActive ? "default" : "secondary"}
                                        className="text-xs"
                                    >
                                        {roomClass.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Pricing */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <p className="text-blue-600 font-medium">Night Rate</p>
                                        <p className="text-lg font-bold text-blue-800">
                                            {formatCurrency(roomClass.ratePerNight)}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                        <p className="text-green-600 font-medium">Day Rate</p>
                                        <p className="text-lg font-bold text-green-800">
                                            {formatCurrency(roomClass.rateDayUse)}
                                        </p>
                                    </div>
                                </div>

                                {/* Room Details */}
                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{roomClass.maxOccupancy} guests max</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Home className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{roomClass._count.rooms} rooms</span>
                                    </div>
                                    {roomClass.bedConfiguration && (
                                        <div className="flex items-center col-span-2">
                                            <Bed className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>{roomClass.bedConfiguration}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Amenities */}
                                {roomClass.amenities && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {parseAmenities(roomClass.amenities).slice(0, 4).map((amenity, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="outline"
                                                    className="text-xs flex items-center"
                                                >
                                                    {getAmenityIcon(amenity)}
                                                    <span className="ml-1">{amenity}</span>
                                                </Badge>
                                            ))}
                                            {parseAmenities(roomClass.amenities).length > 4 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{parseAmenities(roomClass.amenities).length - 4} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Statistics */}
                                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                    <div className="flex items-center space-x-4">
                                        <span>{roomClass._count.reservations} bookings</span>
                                        <span>•</span>
                                        <span>{roomClass._count.roomImages} images</span>
                                        {roomClass._count.roomOffers > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="text-orange-600">{roomClass._count.roomOffers} offers</span>
                                            </>
                                        )}
                                    </div>
                                    <span>Added {formatDate(roomClass.createdAt)}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-2 pt-2">
                                    <Link href={`/rooms/settings/classes/${roomClass.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                    </Link>
                                    <Link href={`/rooms/settings/classes/${roomClass.id}/edit`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(roomClass.id, roomClass.name)}
                                        disabled={deleteLoading === roomClass.id}
                                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                                    >
                                        {deleteLoading === roomClass.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {roomClasses.length === 0 ? 'No Room Classes' : 'No Matching Room Classes'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {roomClasses.length === 0
                                ? 'Create your first room class to get started with room management'
                                : 'Try adjusting your search or filter criteria'
                            }
                        </p>
                        <div className="flex justify-center space-x-3">
                            {roomClasses.length > 0 && (
                                <Button variant="outline" onClick={() => {
                                    setSearchTerm("");
                                    setFilterStatus("all");
                                }}>
                                    Clear Filters
                                </Button>
                            )}
                            <Link href="/rooms/settings/classes/new">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Room Class
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}