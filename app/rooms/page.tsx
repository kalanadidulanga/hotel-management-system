"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Activity,
    AlertTriangle,
    Ban,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    Edit,
    Eye,
    Filter,
    Home,
    Loader2,
    MapPin,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
    Upload,
    Users,
    Wrench,
    X
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

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
    _count: {
        reservations: number;
        facilities: number;
    };
}

interface RoomClass {
    id: number;
    name: string;
}

interface Floor {
    id: number;
    name: string;
    floorNumber: number;
}

interface RoomFilters {
    search: string;
    status: string;
    roomClassId: string;
    floorId: string;
    hasBalcony: string;
    hasSeaView: string;
    hasKitchenette: string;
    cleaningDue: string;
    isActive: string;
}

interface RoomStats {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    cleaningRooms: number;
    outOfOrderRooms: number;
    roomsDueCleaning: number;
    averageOccupancy: number;
    inactiveRooms: number;
}

function RoomsManagementPageContent() {
    const searchParams = useSearchParams();
    const classIdParam = searchParams.get('classId');

    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomClasses, setRoomClasses] = useState<RoomClass[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [stats, setStats] = useState<RoomStats>({
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        maintenanceRooms: 0,
        cleaningRooms: 0,
        outOfOrderRooms: 0,
        roomsDueCleaning: 0,
        averageOccupancy: 0,
        inactiveRooms: 0,
    });

    const [filters, setFilters] = useState<RoomFilters>({
        search: '',
        status: '',
        roomClassId: classIdParam || '',
        floorId: '',
        hasBalcony: '',
        hasSeaView: '',
        hasKitchenette: '',
        cleaningDue: '',
        isActive: '',
    });

    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchRooms();
        fetchFilters();
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [filters]);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    queryParams.append(key, value);
                }
            });

            const response = await fetch(`${apiBaseUrl}/api/rooms?${queryParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch rooms');

            const data = await response.json();
            setRooms(data.rooms || []);
            setStats(data.stats || {});
        } catch (error) {
            // console.error('Error fetching rooms:', error);
            toast.error('Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    const fetchFilters = async () => {
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
            // console.error('Error fetching filter options:', error);
        }
    };

    const handleFilterChange = (key: keyof RoomFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            roomClassId: '',
            floorId: '',
            hasBalcony: '',
            hasSeaView: '',
            hasKitchenette: '',
            cleaningDue: '',
            isActive: '',
        });
    };

    const handleDeleteRoom = async () => {
        if (!roomToDelete) return;

        setDeleteLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/${roomToDelete.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete room');
            }

            toast.success(`Room ${roomToDelete.roomNumber} deleted successfully`);
            fetchRooms();
        } catch (error) {
            // console.error('Delete error:', error);
            toast.error('Failed to delete room: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
            setRoomToDelete(null);
        }
    };

    const updateRoomStatus = async (roomId: number, newStatus: string) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/${roomId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update room status');

            toast.success('Room status updated successfully');
            fetchRooms();
        } catch (error) {
            // console.error('Status update error:', error);
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
            year: 'numeric'
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

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Home className="w-8 h-8 text-blue-600 mr-3" />
                            Room Management
                            {classIdParam && (
                                <Badge variant="outline" className="ml-3 text-xs">
                                    Filtered by Class
                                </Badge>
                            )}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage individual rooms, status, cleaning, and facilities
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Button onClick={fetchRooms} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Link href="/rooms/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Room
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-gray-900">{stats.totalRooms}</div>
                        <div className="text-xs text-gray-600">Total Rooms</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-green-700">{stats.availableRooms}</div>
                        <div className="text-xs text-gray-600">Available</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-blue-700">{stats.occupiedRooms}</div>
                        <div className="text-xs text-gray-600">Occupied</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-orange-700">{stats.maintenanceRooms}</div>
                        <div className="text-xs text-gray-600">Maintenance</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-purple-700">{stats.cleaningRooms}</div>
                        <div className="text-xs text-gray-600">Cleaning</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-red-700">{stats.outOfOrderRooms}</div>
                        <div className="text-xs text-gray-600">Out of Order</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-yellow-700">{stats.roomsDueCleaning}</div>
                        <div className="text-xs text-gray-600">Due Cleaning</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-indigo-700">{stats.averageOccupancy}%</div>
                        <div className="text-xs text-gray-600">Occupancy</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-gray-50 to-gray-200">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-gray-700">{stats.inactiveRooms}</div>
                        <div className="text-xs text-gray-600">Inactive</div>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Filter className="w-5 h-5 mr-2" />
                            Advanced Filters & Search
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                            <X className="w-4 h-4 mr-2" />
                            Clear All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Primary Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Search Room Number</Label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <Input
                                    placeholder="Search by room number..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="AVAILABLE">Available</SelectItem>
                                    <SelectItem value="OCCUPIED">Occupied</SelectItem>
                                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                    <SelectItem value="CLEANING">Cleaning</SelectItem>
                                    <SelectItem value="OUT_OF_ORDER">Out of Order</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Room Class</Label>
                            <Select value={filters.roomClassId || "all"} onValueChange={(value) => handleFilterChange('roomClassId', value === "all" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {roomClasses.map((roomClass) => (
                                        <SelectItem key={roomClass.id} value={roomClass.id.toString()}>
                                            {roomClass.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Floor</Label>
                            <Select value={filters.floorId || "all"} onValueChange={(value) => handleFilterChange('floorId', value === "all" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All floors" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Floors</SelectItem>
                                    {floors.map((floor) => (
                                        <SelectItem key={floor.id} value={floor.id.toString()}>
                                            Floor {floor.floorNumber} - {floor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Secondary Filters */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <Label>Balcony</Label>
                            <Select value={filters.hasBalcony || "any"} onValueChange={(value) => handleFilterChange('hasBalcony', value === "any" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    <SelectItem value="true">With Balcony</SelectItem>
                                    <SelectItem value="false">No Balcony</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Sea View</Label>
                            <Select value={filters.hasSeaView || "any"} onValueChange={(value) => handleFilterChange('hasSeaView', value === "any" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    <SelectItem value="true">Sea View</SelectItem>
                                    <SelectItem value="false">No Sea View</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Kitchenette</Label>
                            <Select value={filters.hasKitchenette || "any"} onValueChange={(value) => handleFilterChange('hasKitchenette', value === "any" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    <SelectItem value="true">With Kitchenette</SelectItem>
                                    <SelectItem value="false">No Kitchenette</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Cleaning Status</Label>
                            <Select value={filters.cleaningDue || "any"} onValueChange={(value) => handleFilterChange('cleaningDue', value === "any" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    <SelectItem value="overdue">Cleaning Overdue</SelectItem>
                                    <SelectItem value="due_today">Due Today</SelectItem>
                                    <SelectItem value="due_week">Due This Week</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Activity Status</Label>
                            <Select value={filters.isActive || "any"} onValueChange={(value) => handleFilterChange('isActive', value === "any" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    <SelectItem value="true">Active Only</SelectItem>
                                    <SelectItem value="false">Inactive Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Rooms List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Building className="w-5 h-5 mr-2" />
                            Rooms ({rooms.length} {Object.values(filters).some(f => f) ? 'filtered' : 'total'})
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                            <Button variant="outline" size="sm">
                                <Upload className="w-4 h-4 mr-2" />
                                Bulk Import
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mr-2" />
                            <span>Loading rooms...</span>
                        </div>
                    ) : rooms.length > 0 ? (
                        <div className="space-y-4">
                            {rooms.map((room) => {
                                const daysUntilCleaning = getDaysUntilCleaning(room);
                                const isOverdue = isCleaningOverdue(room);

                                return (
                                    <div
                                        key={room.id}
                                        className={`p-4 rounded-lg border transition-all hover:shadow-md ${!room.isActive ? 'opacity-60 bg-gray-50' : 'bg-white'
                                            } ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${room.status === 'AVAILABLE' ? 'bg-green-100' :
                                                    room.status === 'OCCUPIED' ? 'bg-blue-100' :
                                                        room.status === 'MAINTENANCE' ? 'bg-orange-100' :
                                                            room.status === 'CLEANING' ? 'bg-purple-100' :
                                                                'bg-red-100'
                                                    }`}>
                                                    <Home className={`w-6 h-6 ${room.status === 'AVAILABLE' ? 'text-green-600' :
                                                        room.status === 'OCCUPIED' ? 'text-blue-600' :
                                                            room.status === 'MAINTENANCE' ? 'text-orange-600' :
                                                                room.status === 'CLEANING' ? 'text-purple-600' :
                                                                    'text-red-600'
                                                        }`} />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h3 className="font-semibold text-lg">Room {room.roomNumber}</h3>
                                                        <Badge className={`text-xs border ${getStatusColor(room.status)}`}>
                                                            {getStatusIcon(room.status)}
                                                            <span className="ml-1">{room.status.replace('_', ' ')}</span>
                                                        </Badge>
                                                        {!room.isActive && (
                                                            <Badge variant="secondary">
                                                                <Ban className="w-3 h-3 mr-1" />
                                                                Inactive
                                                            </Badge>
                                                        )}
                                                        {isOverdue && (
                                                            <Badge variant="destructive">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                Cleaning Overdue
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        <div className="flex items-center space-x-4">
                                                            <span className="flex items-center">
                                                                <Building className="w-3 h-3 mr-1" />
                                                                {room.roomClass.name}
                                                            </span>
                                                            {room.floor && (
                                                                <span className="flex items-center">
                                                                    <MapPin className="w-3 h-3 mr-1" />
                                                                    Floor {room.floor.floorNumber}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center">
                                                                <Users className="w-3 h-3 mr-1" />
                                                                Max {room.roomClass.maxOccupancy}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Activity className="w-3 h-3 mr-1" />
                                                                {room._count.facilities} facilities
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center space-x-4">
                                                            <span className="flex items-center">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                Last cleaned: {formatDate(room.lastCleaned)}
                                                            </span>
                                                            {room.nextCleaningDue && (
                                                                <span className={`flex items-center ${isOverdue ? 'text-red-600' :
                                                                    daysUntilCleaning !== null && daysUntilCleaning <= 1 ? 'text-orange-600' : ''
                                                                    }`}>
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    {isOverdue ? `Overdue by ${Math.abs(daysUntilCleaning || 0)} days` :
                                                                        daysUntilCleaning === 0 ? 'Due today' :
                                                                            daysUntilCleaning === 1 ? 'Due tomorrow' :
                                                                                `Due in ${daysUntilCleaning} days`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                {/* Room Features */}
                                                <div className="flex items-center space-x-2">
                                                    {room.hasBalcony && (
                                                        <Badge variant="outline" className="text-xs">🏠 Balcony</Badge>
                                                    )}
                                                    {room.hasSeaView && (
                                                        <Badge variant="outline" className="text-xs">🌊 Sea View</Badge>
                                                    )}
                                                    {room.hasKitchenette && (
                                                        <Badge variant="outline" className="text-xs">🍽️ Kitchenette</Badge>
                                                    )}
                                                </div>

                                                {/* Pricing & Stats */}
                                                <div className="text-right">
                                                    <div className="font-semibold text-gray-900 flex items-center">
                                                        <DollarSign className="w-4 h-4 mr-1" />
                                                        {formatCurrency(room.roomClass.ratePerNight)}/night
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Day rate: {formatCurrency(room.roomClass.rateDayUse)}
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {room._count.reservations} total bookings
                                                    </div>
                                                </div>

                                                {/* Actions Menu */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/rooms/${room.id}`}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Room Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/rooms/${room.id}/edit`}>
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Edit Room
                                                            </Link>
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            onClick={() => updateRoomStatus(room.id, 'AVAILABLE')}
                                                            disabled={room.status === 'AVAILABLE'}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            Mark Available
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => updateRoomStatus(room.id, 'MAINTENANCE')}
                                                            disabled={room.status === 'MAINTENANCE'}
                                                        >
                                                            <Wrench className="w-4 h-4 mr-2" />
                                                            Mark Maintenance
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => updateRoomStatus(room.id, 'CLEANING')}
                                                            disabled={room.status === 'CLEANING'}
                                                        >
                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                            Mark Cleaning
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => updateRoomStatus(room.id, 'OUT_OF_ORDER')}
                                                            disabled={room.status === 'OUT_OF_ORDER'}
                                                        >
                                                            <Ban className="w-4 h-4 mr-2" />
                                                            Mark Out of Order
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => {
                                                                setRoomToDelete(room);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            disabled={room._count.reservations > 0}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            {room._count.reservations > 0 ? 'Has Reservations' : 'Delete Room'}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {/* Special Notes */}
                                        {room.specialNotes && (
                                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                                <strong>Special Note:</strong> {room.specialNotes}
                                            </div>
                                        )}

                                        {room.cleaningNotes && (
                                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                                <strong>Cleaning Note:</strong> {room.cleaningNotes}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rooms Found</h3>
                            <p className="text-gray-600 mb-4">
                                {Object.values(filters).some(f => f)
                                    ? "No rooms match your current filters"
                                    : "Create your first room to get started"
                                }
                            </p>
                            <div className="flex items-center justify-center space-x-3">
                                {Object.values(filters).some(f => f) && (
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                )}
                                <Link href="/rooms/new">
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Room
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                            Delete Room
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete Room {roomToDelete?.roomNumber}?
                            This action cannot be undone and will remove all room data including facilities and cleaning history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRoom}
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

export default function RoomsManagementPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-6"><div className="text-gray-500">Loading...</div></div>}>
            <RoomsManagementPageContent />
        </Suspense>
    );
}