"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowRight,
    Bed,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Edit,
    Eye,
    Home,
    Plus,
    Settings,
    TrendingUp,
    Users
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
    maxOccupancy: number;
    standardOccupancy: number;
    roomSize: string | null;
    bedConfiguration: string | null;
    amenities: string | null;
    isActive: boolean;
    createdAt: string;
    _count: {
        rooms: number;
        reservations: number;
    };
}

interface Room {
    id: number;
    roomNumber: string;
    status: string;
    roomClass: {
        name: string;
    };
    floor: {
        name: string;
    } | null;
}

interface RoomStats {
    totalRooms: number;
    totalClasses: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    cleaningRooms: number;
    averageRate: number;
    occupancyRate: number;
}

export default function RoomSettingsPage() {
    const [roomClasses, setRoomClasses] = useState<RoomClass[]>([]);
    const [recentRooms, setRecentRooms] = useState<Room[]>([]);
    const [stats, setStats] = useState<RoomStats>({
        totalRooms: 0,
        totalClasses: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        maintenanceRooms: 0,
        cleaningRooms: 0,
        averageRate: 0,
        occupancyRate: 0,
    });
    const [loading, setLoading] = useState(true);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchRoomSettings();
    }, []);

    const fetchRoomSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings`);
            if (!response.ok) throw new Error('Failed to fetch room settings');

            const data = await response.json();
            setRoomClasses(data.roomClasses || []);
            setRecentRooms(data.recentRooms || []);
            setStats(data.stats || {});
        } catch (error) {
            console.error('Error fetching room settings:', error);
            toast.error('Failed to load room settings');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'OCCUPIED':
                return <Users className="w-4 h-4 text-blue-600" />;
            case 'MAINTENANCE':
                return <Settings className="w-4 h-4 text-orange-600" />;
            case 'CLEANING':
                return <Clock className="w-4 h-4 text-purple-600" />;
            default:
                return <Home className="w-4 h-4 text-gray-600" />;
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Settings className="w-8 h-8 text-blue-600 mr-3" />
                        Room Settings
                        <Badge variant="outline" className="ml-3 text-xs">
                            Module 06
                        </Badge>
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage room classes, pricing, individual rooms, and cleaning schedules
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button onClick={fetchRoomSettings} variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Rooms</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
                            </div>
                            <Home className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Room Classes</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
                            </div>
                            <Building className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                                <p className="text-2xl font-bold text-green-600">{stats.occupancyRate}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg. Rate/Night</p>
                                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.averageRate)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Room Status Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <Home className="w-5 h-5 mr-2" />
                        Room Status Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-green-800">{stats.availableRooms}</p>
                            <p className="text-sm text-green-600">Available</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-800">{stats.occupiedRooms}</p>
                            <p className="text-sm text-blue-600">Occupied</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <Settings className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-orange-800">{stats.maintenanceRooms}</p>
                            <p className="text-sm text-orange-600">Maintenance</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-purple-800">{stats.cleaningRooms}</p>
                            <p className="text-sm text-purple-600">Cleaning</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Room Classes Management */}
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg text-purple-800">
                            <Building className="w-5 h-5 mr-2" />
                            Room Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-purple-600">
                            Manage room types, pricing, and capacity settings
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{stats.totalClasses} classes configured</span>
                        </div>
                        <div className="flex space-x-2">
                            <Link href="/rooms/settings/classes" className="flex-1">
                                <Button variant="outline" size="sm" className="w-full">
                                    <Eye className="w-4 h-4 mr-2" />
                                    View All
                                </Button>
                            </Link>
                            <Link href="/rooms/settings/classes/new" className="flex-1">
                                <Button size="sm" className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Class
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Individual Rooms */}
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg text-blue-800">
                            <Home className="w-5 h-5 mr-2" />
                            Individual Rooms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-blue-600">
                            Add, edit, and manage individual room details
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{stats.totalRooms} rooms total</span>
                        </div>
                        <div className="flex space-x-2">
                            <Link href="/rooms/settings/rooms" className="flex-1">
                                <Button variant="outline" size="sm" className="w-full">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Manage
                                </Button>
                            </Link>
                            <Link href="/rooms/settings/rooms/new" className="flex-1">
                                <Button size="sm" className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Room
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Cleaning Schedule */}
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg text-green-800">
                            <Calendar className="w-5 h-5 mr-2" />
                            Cleaning Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-green-600">
                            Configure cleaning frequency and schedules (Admin only)
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{stats.cleaningRooms} rooms due cleaning</span>
                        </div>
                        <div className="flex space-x-2">
                            <Link href="/rooms/settings/cleaning" className="flex-1">
                                <Button variant="outline" size="sm" className="w-full">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Schedule
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Room Classes List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Building className="w-5 h-5 mr-2" />
                            Room Classes Overview
                        </CardTitle>
                        <Link href="/rooms/settings/classes">
                            <Button variant="outline" size="sm">
                                View All
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {roomClasses.length > 0 ? (
                        <div className="space-y-4">
                            {roomClasses.slice(0, 3).map((roomClass) => (
                                <div
                                    key={roomClass.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Bed className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{roomClass.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {roomClass.maxOccupancy} guests max • {roomClass._count.rooms} rooms
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrency(roomClass.ratePerNight)}/night
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatCurrency(roomClass.rateDayUse)}/day
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Link href={`/rooms/settings/classes/${roomClass.id}/edit`}>
                                            <Button variant="outline" size="sm">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Room Classes</h3>
                            <p className="text-gray-600 mb-4">Create your first room class to get started</p>
                            <Link href="/rooms/settings/classes/new">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Room Class
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Rooms */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Home className="w-5 h-5 mr-2" />
                            Recent Rooms
                        </CardTitle>
                        <Link href="/rooms/settings/rooms">
                            <Button variant="outline" size="sm">
                                Manage All
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentRooms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentRooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="p-4 bg-gray-50 rounded-lg border"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium text-gray-900">Room {room.roomNumber}</h3>
                                        <Badge className={`text-xs border ${getStatusColor(room.status)}`}>
                                            {getStatusIcon(room.status)}
                                            <span className="ml-1">{room.status.replace('_', ' ')}</span>
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {room.roomClass.name}
                                        {room.floor && ` • ${room.floor.name}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rooms</h3>
                            <p className="text-gray-600 mb-4">Add your first room to get started</p>
                            <Link href="/rooms/settings/rooms/new">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Room
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}