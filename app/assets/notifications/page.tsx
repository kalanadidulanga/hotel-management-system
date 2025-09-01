"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Bell,
    BellRing,
    AlertTriangle,
    Clock,
    Shield,
    Wrench,
    Package,
    Eye,
    Check,
    CheckCircle2,
    X,
    Trash2,
    MoreHorizontal,
    Filter,
    RefreshCw,
    Settings,
    Calendar,
    User,
    MapPin,
    ExternalLink,
    Loader2,
    Wifi,
    WifiOff
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface AssetNotification {
    id: number;
    notificationId: string;
    type: string;
    title: string;
    message: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    isRead: boolean;
    isActionTaken: boolean;
    scheduledFor: string;
    sentAt: string | null;
    acknowledgedAt: string | null;
    escalationLevel: number;
    createdAt: string;
    asset: {
        id: number;
        assetId: string;
        name: string;
        type: string;
        location: string | null;
        status: string;
        category: {
            id: number;
            name: string;
        } | null;
        assignedTo: {
            id: number;
            name: string;
            fullName: string | null;
            department: string | null;
            email: string;
        } | null;
    };
    user: {
        id: number;
        name: string;
        fullName: string | null;
        department: string | null;
        email: string;
    } | null;
}

interface NotificationStats {
    total: number;
    unread: number;
    critical: number;
    overdue: number;
    byType: {
        maintenance_due: number;
        maintenance_overdue: number;
        warranty_expiring: number;
        asset_damaged: number;
    };
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<AssetNotification[]>([]);
    const [stats, setStats] = useState<NotificationStats>({
        total: 0,
        unread: 0,
        critical: 0,
        overdue: 0,
        byType: {
            maintenance_due: 0,
            maintenance_overdue: 0,
            warranty_expiring: 0,
            asset_damaged: 0
        }
    });
    const [pagination, setPagination] = useState<PaginationInfo>({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20
    });
    const [loading, setLoading] = useState(true);
    const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
    const [filters, setFilters] = useState({
        type: "all",
        status: "all",
        priority: "all"
    });
    const [selectedNotification, setSelectedNotification] = useState<AssetNotification | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [generateLoading, setGenerateLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    const wsRef = useRef<WebSocket | null>(null);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    // Initialize WebSocket connection and browser notifications
    useEffect(() => {
        initializeRealTimeNotifications();
        requestNotificationPermission();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // Fetch notifications when filters change
    useEffect(() => {
        fetchNotifications();
    }, [filters, pagination.currentPage]);

    const initializeRealTimeNotifications = () => {
        try {
            const ws = new WebSocket('ws://localhost:8080');
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('🔗 WebSocket connected');
                setIsConnected(true);
                toast.success('Real-time notifications enabled');
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('📡 WebSocket message received:', data);

                if (data.type === 'NEW_NOTIFICATION') {
                    handleNewNotification(data.notification);
                } else if (data.type === 'BATCH_UPDATE') {
                    toast.info(`${data.count} new maintenance alerts received!`, {
                        action: {
                            label: "Refresh",
                            onClick: () => fetchNotifications()
                        }
                    });
                    fetchNotifications();
                }

                setLastUpdate(new Date().toLocaleTimeString());
            };

            ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                setIsConnected(false);
                toast.warning('Real-time notifications disconnected');

                // Attempt to reconnect after 5 seconds
                setTimeout(() => {
                    initializeRealTimeNotifications();
                }, 5000);
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setIsConnected(false);
            };

        } catch (error) {
            console.error('❌ Failed to initialize WebSocket:', error);
            setIsConnected(false);
        }
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                toast.success('Browser notifications enabled');
            } else {
                toast.warning('Browser notifications disabled');
            }
        }
    };

    const handleNewNotification = (notification: AssetNotification) => {
        // Show browser notification for critical alerts
        if (Notification.permission === 'granted' && notification.priority === 'CRITICAL') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id.toString(),
                requireInteraction: true
            });

            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };

            // Auto-close after 10 seconds
            setTimeout(() => {
                browserNotification.close();
            }, 10000);
        }

        // Show toast notification
        const toastMessage = notification.priority === 'CRITICAL' ?
            `🚨 CRITICAL: ${notification.title}` :
            `🔔 ${notification.title}`;

        toast(toastMessage, {
            description: notification.message,
            action: {
                label: "View",
                onClick: () => {
                    setSelectedNotification(notification);
                }
            },
            duration: notification.priority === 'CRITICAL' ? 0 : 5000, // Critical stays until dismissed
        });

        // Refresh notifications list
        fetchNotifications();
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: pagination.itemsPerPage.toString(),
                ...Object.fromEntries(
                    Object.entries(filters).filter(([, value]) => value !== "all")
                )
            });

            const response = await fetch(`${apiBaseUrl}/api/notifications?${params}`);
            if (!response.ok) throw new Error("Failed to fetch notifications");

            const data = await response.json();
            setNotifications(data.notifications || []);
            setStats(data.stats || {});
            setPagination(data.pagination || {});
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const generateNotifications = async () => {
        try {
            setGenerateLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/scheduler`, {
                method: "POST"
            });

            if (!response.ok) throw new Error("Failed to generate notifications");

            const data = await response.json();
            toast.success(`Generated ${data.notifications} new notifications`);
            fetchNotifications();
        } catch (error) {
            console.error("Error generating notifications:", error);
            toast.error("Failed to generate notifications");
        } finally {
            setGenerateLoading(false);
        }
    };

    const markAsRead = async (notificationIds: number[]) => {
        try {
            setActionLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/notifications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "markAsRead",
                    notificationIds: notificationIds.map(String)
                })
            });

            if (!response.ok) throw new Error("Failed to mark as read");

            toast.success("Notifications marked as read");
            setSelectedNotifications([]);
            fetchNotifications();
        } catch (error) {
            console.error("Error marking as read:", error);
            toast.error("Failed to mark notifications as read");
        } finally {
            setActionLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            setActionLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/notifications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "markAllAsRead",
                    userId: "1" // TODO: Get from auth context
                })
            });

            if (!response.ok) throw new Error("Failed to mark all as read");

            toast.success("All notifications marked as read");
            fetchNotifications();
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast.error("Failed to mark all notifications as read");
        } finally {
            setActionLoading(false);
        }
    };

    const takeAction = async (notificationIds: number[]) => {
        try {
            setActionLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/notifications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "takeAction",
                    notificationIds: notificationIds.map(String)
                })
            });

            if (!response.ok) throw new Error("Failed to take action");

            toast.success("Action taken on notifications");
            setSelectedNotifications([]);
            fetchNotifications();
        } catch (error) {
            console.error("Error taking action:", error);
            toast.error("Failed to take action on notifications");
        } finally {
            setActionLoading(false);
        }
    };

    const deleteNotifications = async (notificationIds: number[]) => {
        try {
            setActionLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/notifications`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: notificationIds.map(String) })
            });

            if (!response.ok) throw new Error("Failed to delete notifications");

            toast.success("Notifications deleted successfully");
            setSelectedNotifications([]);
            setIsDeleteDialogOpen(false);
            fetchNotifications();
        } catch (error) {
            console.error("Error deleting notifications:", error);
            toast.error("Failed to delete notifications");
        } finally {
            setActionLoading(false);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "MAINTENANCE_DUE":
                return <Clock className="w-5 h-5 text-orange-600" />;
            case "MAINTENANCE_OVERDUE":
                return <AlertTriangle className="w-5 h-5 text-red-600" />;
            case "WARRANTY_EXPIRING":
                return <Shield className="w-5 h-5 text-blue-600" />;
            case "ASSET_DAMAGED":
                return <Package className="w-5 h-5 text-red-600" />;
            default:
                return <Bell className="w-5 h-5 text-gray-600" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "CRITICAL":
                return "bg-red-100 text-red-800 border-red-200";
            case "HIGH":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "MEDIUM":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "LOW":
                return "bg-green-100 text-green-800 border-green-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "MAINTENANCE_DUE":
                return "bg-orange-100 text-orange-800";
            case "MAINTENANCE_OVERDUE":
                return "bg-red-100 text-red-800";
            case "WARRANTY_EXPIRING":
                return "bg-blue-100 text-blue-800";
            case "ASSET_DAMAGED":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)}d ago`;
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedNotifications(notifications.map(n => n.id));
        } else {
            setSelectedNotifications([]);
        }
    };

    const handleSelectNotification = (notificationId: number, checked: boolean) => {
        if (checked) {
            setSelectedNotifications(prev => [...prev, notificationId]);
        } else {
            setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header with Connection Status */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <BellRing className="w-8 h-8 text-blue-600 mr-3" />
                        Maintenance Notifications
                        <div className="flex items-center ml-4">
                            {isConnected ? (
                                <div className="flex items-center text-green-600">
                                    <Wifi className="w-4 h-4 mr-1" />
                                    <span className="text-sm font-medium">Live</span>
                                </div>
                            ) : (
                                <div className="flex items-center text-red-600">
                                    <WifiOff className="w-4 h-4 mr-1" />
                                    <span className="text-sm font-medium">Disconnected</span>
                                </div>
                            )}
                        </div>
                    </h1>
                    <p className="text-gray-600 mt-1">
                        🚀 Automatic notifications • Real-time updates • Push alerts
                        {lastUpdate && (
                            <span className="ml-2 text-xs text-gray-500">
                                Last update: {lastUpdate}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        onClick={generateNotifications}
                        variant="outline"
                        size="sm"
                        disabled={generateLoading}
                    >
                        {generateLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Settings className="w-4 h-4 mr-2" />
                        )}
                        Force Check
                    </Button>
                    <Button onClick={fetchNotifications} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Rest of your existing UI components */}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Bell className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Unread</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
                            </div>
                            <BellRing className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Critical</p>
                                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overdue</p>
                                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                            </div>
                            <Clock className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add your existing filters, table, and other components here */}
            {/* I'll include the key ones for completeness */}

            {/* Notifications Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Notification</TableHead>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Scheduled For</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {notifications.map((notification) => (
                                    <TableRow
                                        key={notification.id}
                                        className={`hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedNotifications.includes(notification.id)}
                                                onCheckedChange={(checked) =>
                                                    handleSelectNotification(notification.id, !!checked)
                                                }
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <p className={`text-sm font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                                                            {notification.title}
                                                        </p>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                        )}
                                                        {notification.priority === 'CRITICAL' && (
                                                            <Badge className="bg-red-100 text-red-800 animate-pulse">
                                                                🚨 URGENT
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Badge className={getTypeColor(notification.type)} variant="outline">
                                                            {notification.type.replace('_', ' ')}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            {formatRelativeTime(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm">{notification.asset.name}</p>
                                                <p className="text-xs text-gray-500">{notification.asset.assetId}</p>
                                                {notification.asset.location && (
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {notification.asset.location}
                                                    </div>
                                                )}
                                                {notification.asset.assignedTo && (
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <User className="w-3 h-3 mr-1" />
                                                        {notification.asset.assignedTo.fullName || notification.asset.assignedTo.name}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <Badge className={getPriorityColor(notification.priority)} variant="outline">
                                                {notification.priority}
                                                {notification.escalationLevel > 0 && (
                                                    <span className="ml-1">↑{notification.escalationLevel}</span>
                                                )}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            <div className="text-sm">
                                                <div className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {formatDate(notification.scheduledFor)}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                {notification.isActionTaken ? (
                                                    <Badge className="bg-green-100 text-green-800" variant="outline">
                                                        Action Taken
                                                    </Badge>
                                                ) : notification.isRead ? (
                                                    <Badge className="bg-gray-100 text-gray-800" variant="outline">
                                                        Read
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-blue-100 text-blue-800" variant="outline">
                                                        Unread
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedNotification(notification)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => markAsRead([notification.id])}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {notifications.length === 0 && (
                        <div className="text-center py-12">
                            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                            <p className="text-gray-600 mb-4">
                                🎉 You're all caught up! The system is automatically monitoring for maintenance alerts.
                            </p>
                            <p className="text-sm text-gray-500">
                                Automatic checks run every 30 minutes • Real-time alerts enabled
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}