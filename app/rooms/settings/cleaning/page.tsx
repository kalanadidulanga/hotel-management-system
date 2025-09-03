"use client";

import { Badge } from "@/components/ui/badge";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    ArrowLeft,
    Sparkles,
    AlertTriangle,
    Clock,
    CheckCircle,
    Calendar as CalendarIcon,
    Filter,
    Settings,
    Loader2,
    RefreshCw,
    MapPin,
    Building,
    Home,
    TrendingUp,
    Activity,
    Ban,
    Edit,
    Save
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CleaningRoom {
    id: number;
    roomNumber: string;
    status: string;
    isActive: boolean;
    lastCleaned: string | null;
    nextCleaningDue: string | null;
    cleaningNotes: string | null;
    createdAt: string;
    updatedAt: string;
    roomClass: {
        id: number;
        name: string;
        cleaningFrequencyDays: number;
        cleaningDueNotification: boolean;
    };
    floor: {
        id: number;
        name: string;
        floorNumber: number;
    } | null;
}

interface RoomClass {
    id: number;
    name: string;
    cleaningFrequencyDays: number;
    cleaningDueNotification: boolean;
}

interface Floor {
    id: number;
    name: string;
    floorNumber: number;
}

interface CleaningStats {
    totalRooms: number;
    overdueRooms: number;
    dueTodayRooms: number;
    dueThisWeekRooms: number;
    cleaningRooms: number;
    upToDateRooms: number;
    complianceRate: number;
}

interface CleaningFilters {
    status: string;
    roomClassId: string;
    floorId: string;
}

export default function CleaningSchedulePage() {
    const [rooms, setRooms] = useState<CleaningRoom[]>([]);
    const [roomClasses, setRoomClasses] = useState<RoomClass[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [stats, setStats] = useState<CleaningStats>({
        totalRooms: 0,
        overdueRooms: 0,
        dueTodayRooms: 0,
        dueThisWeekRooms: 0,
        cleaningRooms: 0,
        upToDateRooms: 0,
        complianceRate: 0,
    });

    const [filters, setFilters] = useState<CleaningFilters>({
        status: 'all',
        roomClassId: 'all',
        floorId: 'all',
    });

    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<CleaningRoom | null>(null);
    const [cleaningDialogOpen, setCleaningDialogOpen] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [selectedRoomClass, setSelectedRoomClass] = useState<RoomClass | null>(null);
    const [cleaningDate, setCleaningDate] = useState<Date>(new Date());
    const [cleaningNotes, setCleaningNotes] = useState('');
    const [newFrequency, setNewFrequency] = useState(1);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchCleaningData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
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

            await fetchCleaningData();
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load cleaning schedule data');
        } finally {
            setLoading(false);
        }
    };

    const fetchCleaningData = async () => {
        try {
            const queryParams = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    queryParams.append(key, value);
                }
            });

            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/cleaning?${queryParams.toString()}`);

            if (!response.ok) throw new Error('Failed to fetch cleaning data');

            const data = await response.json();
            setRooms(data.rooms || []);
            setStats(data.stats || {});
        } catch (error) {
            console.error('Error fetching cleaning data:', error);
            toast.error('Failed to load cleaning schedule');
        }
    };

    const handleMarkCleaned = async () => {
        if (!selectedRoom) return;

        setActionLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/cleaning`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: selectedRoom.id,
                    action: 'mark_cleaned',
                    cleaningDate: cleaningDate.toISOString(),
                    notes: cleaningNotes.trim() || null
                })
            });

            if (!response.ok) throw new Error('Failed to mark room as cleaned');

            const data = await response.json();
            toast.success(data.message || 'Room marked as cleaned successfully');

            setCleaningDialogOpen(false);
            setSelectedRoom(null);
            setCleaningNotes('');
            setCleaningDate(new Date());
            await fetchCleaningData();
        } catch (error) {
            console.error('Error marking room as cleaned:', error);
            toast.error('Failed to mark room as cleaned');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateFrequency = async () => {
        if (!selectedRoomClass) return;

        setActionLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/cleaning`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomClassId: selectedRoomClass.id,
                    cleaningFrequencyDays: newFrequency,
                    cleaningDueNotification: notificationsEnabled
                })
            });

            if (!response.ok) throw new Error('Failed to update cleaning frequency');

            const data = await response.json();
            toast.success(data.message || 'Cleaning frequency updated successfully');

            setSettingsDialogOpen(false);
            setSelectedRoomClass(null);
            await fetchData();
        } catch (error) {
            console.error('Error updating cleaning frequency:', error);
            toast.error('Failed to update cleaning frequency');
        } finally {
            setActionLoading(false);
        }
    };

    const openCleaningDialog = (room: CleaningRoom) => {
        setSelectedRoom(room);
        setCleaningDate(new Date());
        setCleaningNotes(room.cleaningNotes || '');
        setCleaningDialogOpen(true);
    };

    const openSettingsDialog = (roomClass: RoomClass) => {
        setSelectedRoomClass(roomClass);
        setNewFrequency(roomClass.cleaningFrequencyDays);
        setNotificationsEnabled(roomClass.cleaningDueNotification);
        setSettingsDialogOpen(true);
    };

    const getPriorityColor = (room: CleaningRoom) => {
        if (!room.nextCleaningDue) return 'bg-gray-100 text-gray-800';

        const dueDate = new Date(room.nextCleaningDue);
        const today = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'bg-red-100 text-red-800 border-red-200'; // Overdue
        if (diffDays === 0) return 'bg-orange-100 text-orange-800 border-orange-200'; // Due today
        if (diffDays <= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Due soon
        return 'bg-green-100 text-green-800 border-green-200'; // On schedule
    };

    const getPriorityText = (room: CleaningRoom) => {
        if (!room.nextCleaningDue) return 'No schedule';

        const dueDate = new Date(room.nextCleaningDue);
        const today = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `Due in ${diffDays} days`;
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading cleaning schedule...</span>
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
                            <Sparkles className="w-8 h-8 text-blue-600 mr-3" />
                            Cleaning Schedule
                            <Badge variant="outline" className="ml-3 text-xs bg-blue-50 text-blue-700">
                                Admin Only
                            </Badge>
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage room cleaning schedules and track compliance
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Button onClick={fetchCleaningData} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.totalRooms}</div>
                        <div className="text-xs text-gray-600">Total Rooms</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{stats.overdueRooms}</div>
                        <div className="text-xs text-gray-600">Overdue</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-700">{stats.dueTodayRooms}</div>
                        <div className="text-xs text-gray-600">Due Today</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-700">{stats.dueThisWeekRooms}</div>
                        <div className="text-xs text-gray-600">Due This Week</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-700">{stats.cleaningRooms}</div>
                        <div className="text-xs text-gray-600">Being Cleaned</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">{stats.complianceRate}%</div>
                        <div className="text-xs text-gray-600">Compliance</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <Filter className="w-5 h-5 mr-2" />
                            Filter & Room Class Settings
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                            <Label>Cleaning Status</Label>
                            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Rooms</SelectItem>
                                    <SelectItem value="overdue">Overdue Cleaning</SelectItem>
                                    <SelectItem value="due_today">Due Today</SelectItem>
                                    <SelectItem value="due_week">Due This Week</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Room Class</Label>
                            <Select value={filters.roomClassId} onValueChange={(value) => setFilters(prev => ({ ...prev, roomClassId: value }))}>
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
                            <Select value={filters.floorId} onValueChange={(value) => setFilters(prev => ({ ...prev, floorId: value }))}>
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

                    {/* Room Class Cleaning Settings */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-900">Room Class Cleaning Settings</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roomClasses.map((roomClass) => (
                                <div
                                    key={roomClass.id}
                                    className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">{roomClass.name}</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openSettingsDialog(roomClass)}
                                        >
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Frequency:</span>
                                            <span className="font-medium">{roomClass.cleaningFrequencyDays} days</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Notifications:</span>
                                            <Badge variant={roomClass.cleaningDueNotification ? "default" : "secondary"} className="text-xs">
                                                {roomClass.cleaningDueNotification ? 'Enabled' : 'Disabled'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Cleaning Schedule List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <CalendarIcon className="w-5 h-5 mr-2" />
                        Room Cleaning Schedule ({rooms.length} rooms)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {rooms.length > 0 ? (
                        <div className="space-y-4">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${room.status === 'CLEANING' ? 'bg-purple-100' : 'bg-gray-100'
                                                }`}>
                                                <Home className={`w-6 h-6 ${room.status === 'CLEANING' ? 'text-purple-600' : 'text-gray-600'
                                                    }`} />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="font-semibold text-lg">Room {room.roomNumber}</h3>
                                                    <Badge className={`text-xs border ${getPriorityColor(room)}`}>
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {getPriorityText(room)}
                                                    </Badge>
                                                    {room.status === 'CLEANING' && (
                                                        <Badge className="bg-purple-100 text-purple-800">
                                                            <Sparkles className="w-3 h-3 mr-1" />
                                                            Being Cleaned
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
                                                            <RefreshCw className="w-3 h-3 mr-1" />
                                                            Every {room.roomClass.cleaningFrequencyDays} days
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center space-x-4">
                                                        <span>Last cleaned: {formatDate(room.lastCleaned)}</span>
                                                        <span>Next due: {formatDate(room.nextCleaningDue)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openCleaningDialog(room)}
                                                disabled={room.status === 'CLEANING'}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Mark Cleaned
                                            </Button>
                                        </div>
                                    </div>

                                    {room.cleaningNotes && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                            <strong className="text-blue-800">Cleaning Notes:</strong>
                                            <p className="text-blue-700 mt-1">{room.cleaningNotes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rooms Found</h3>
                            <p className="text-gray-600 mb-4">
                                {Object.values(filters).some(f => f && f !== 'all')
                                    ? "No rooms match your current filters"
                                    : "All rooms are up to date with cleaning"
                                }
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mark as Cleaned Dialog */}
            <Dialog open={cleaningDialogOpen} onOpenChange={setCleaningDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                            Mark Room {selectedRoom?.roomNumber} as Cleaned
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cleaning Date & Time</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="justify-start text-left font-normal w-full">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(cleaningDate, "PPP")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={cleaningDate}
                                        onSelect={(date) => date && setCleaningDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cleaningNotes">Cleaning Notes (Optional)</Label>
                            <Textarea
                                id="cleaningNotes"
                                placeholder="Any special notes about the cleaning process..."
                                value={cleaningNotes}
                                onChange={(e) => setCleaningNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                            <strong>Next cleaning will be due:</strong> {' '}
                            {format(
                                new Date(cleaningDate.getTime() + (selectedRoom?.roomClass.cleaningFrequencyDays || 1) * 24 * 60 * 60 * 1000),
                                "PPP"
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setCleaningDialogOpen(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleMarkCleaned} disabled={actionLoading}>
                                {actionLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                {actionLoading ? 'Updating...' : 'Mark as Cleaned'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Room Class Settings Dialog */}
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <Settings className="w-5 h-5 mr-2 text-blue-600" />
                            Update Cleaning Settings: {selectedRoomClass?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="frequency">Cleaning Frequency (Days)</Label>
                            <Input
                                id="frequency"
                                type="number"
                                min="1"
                                max="365"
                                value={newFrequency}
                                onChange={(e) => setNewFrequency(parseInt(e.target.value) || 1)}
                            />
                            <p className="text-xs text-gray-500">
                                How often rooms of this class should be cleaned (1-365 days)
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="notifications"
                                checked={notificationsEnabled}
                                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                                className="rounded"
                            />
                            <Label htmlFor="notifications" className="text-sm">
                                Enable cleaning due notifications
                            </Label>
                        </div>

                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            <strong>Warning:</strong> This will update the cleaning schedule for all rooms of this class.
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setSettingsDialogOpen(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateFrequency} disabled={actionLoading}>
                                {actionLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {actionLoading ? 'Updating...' : 'Update Settings'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}