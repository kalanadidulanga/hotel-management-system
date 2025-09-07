"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Camera,
    Clock,
    DollarSign,
    Download,
    Edit,
    Eye,
    FileText,
    History,
    MapPin,
    Package,
    QrCode,
    Settings,
    Trash2,
    User,
    Utensils,
    Wrench,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

interface Asset {
    id: number;
    assetId: string;
    code: string;
    name: string;
    description: string | null;
    type: 'FIXED_ASSET' | 'UTENSIL';
    status: string;
    condition: string | null;
    quantity: number;
    unit: string | null;
    purchasePrice: number;
    currentValue: number | null;
    purchaseDate: string;
    supplier: string | null;
    warrantyPeriod: number | null;
    warrantyExpiry: string | null;
    location: string | null;
    serialNumber: string | null;
    model: string | null;
    brand: string | null;
    maintenanceDate: string;
    maintenanceInterval: number;
    maintenanceStatus: string;
    daysDiff: number;
    imageUrl: string | null;
    documentUrl: string | null;
    qrCode: string | null;
    createdAt: string;
    updatedAt: string;
    category: {
        id: number;
        name: string;
        assetType: string;
    } | null;
    assignedTo: {
        id: number;
        name: string;
        fullName: string | null;
        department: string | null;
    } | null;
    maintenanceLogs: Array<{
        id: number;
        maintenanceId: string;
        serviceType: string | null;
        description: string;
        cost: number;
        serviceProvider: string | null;
        maintenanceDate: string;
        nextMaintenanceDate: string | null;
        status: string;
    }>;
    notifications: Array<{
        id: number;
        type: string;
        title: string;
        message: string;
        priority: string;
        scheduledFor: string;
        isRead: boolean;
        createdAt: string;
    }>;
}

export default function AssetDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const assetId = params.id as string;

    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAssetDetails();
    }, [assetId]);

    const fetchAssetDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/${assetId}`);

            if (!response.ok) {
                throw new Error("Failed to fetch asset details");
            }

            const data = await response.json();
            setAsset(data);
        } catch (error) {
            console.error("Error fetching asset:", error);
            setError("Failed to load asset details");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'ACTIVE': 'bg-green-100 text-green-800',
            'MAINTENANCE': 'bg-yellow-100 text-yellow-800',
            'RETIRED': 'bg-gray-100 text-gray-800',
            'DAMAGED': 'bg-red-100 text-red-800',
            'OUT_OF_ORDER': 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getMaintenanceStatusColor = (maintenanceStatus: string) => {
        const colors = {
            'overdue': 'bg-red-100 text-red-800',
            'urgent': 'bg-orange-100 text-orange-800',
            'due-soon': 'bg-yellow-100 text-yellow-800',
            'scheduled': 'bg-green-100 text-green-800'
        };
        return colors[maintenanceStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getMaintenanceStatusText = (maintenanceStatus: string, daysDiff: number) => {
        if (maintenanceStatus === 'overdue') return `${Math.abs(daysDiff)} days overdue`;
        if (maintenanceStatus === 'urgent') return `Due in ${daysDiff} days`;
        if (maintenanceStatus === 'due-soon') return `Due in ${daysDiff} days`;
        return `Due in ${daysDiff} days`;
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            'HIGH': 'bg-red-100 text-red-800',
            'MEDIUM': 'bg-yellow-100 text-yellow-800',
            'LOW': 'bg-green-100 text-green-800',
            'CRITICAL': 'bg-red-200 text-red-900'
        };
        return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const downloadQrCode = () => {
        if (asset?.qrCode) {
            // Generate QR code image URL
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(asset.qrCode)}`;
            const link = document.createElement('a');
            link.href = qrUrl;
            link.download = `${asset.assetId}-qr-code.png`;
            link.click();
            toast.success("QR Code downloaded");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/${assetId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error("Failed to delete asset");
            }

            toast.success("Asset deleted successfully");
            router.push("/assets/list");
        } catch (error) {
            console.error("Error deleting asset:", error);
            toast.error("Failed to delete asset");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Asset Not Found</h2>
                    <p className="text-gray-600 mb-4">{error || "The asset you're looking for doesn't exist."}</p>
                    <Link href="/assets/list">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Assets
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/assets/list">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            {asset.type === 'FIXED_ASSET' ? (
                                <Package className="w-8 h-8 text-blue-600 mr-3" />
                            ) : (
                                <Utensils className="w-8 h-8 text-purple-600 mr-3" />
                            )}
                            {asset.name}
                        </h1>
                        <div className="flex items-center space-x-4 mt-2">
                            <p className="text-lg font-semibold text-blue-600">{asset.assetId}</p>
                            <Badge variant="outline" className="font-mono">{asset.code}</Badge>
                            <Badge className={getStatusColor(asset.status)}>
                                {asset.status.replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex space-x-2">
                    <Button variant="outline" onClick={downloadQrCode}>
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Code
                    </Button>
                    <Link href={`/assets/maintenance/create?assetId=${asset.id}`}>
                        <Button
                            variant={asset.maintenanceStatus === 'overdue' ? 'default' : 'outline'}
                            className={asset.maintenanceStatus === 'overdue' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            <Wrench className="w-4 h-4 mr-2" />
                            Maintenance
                        </Button>
                    </Link>
                    <Link href={`/assets/${asset.id}/edit`}>
                        <Button variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    </Link>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Asset</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete "{asset.name}"? This action cannot be undone and will remove all associated maintenance logs and notifications.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button variant="outline">Cancel</Button>
                                <Button variant="destructive" onClick={handleDelete}>
                                    Delete Asset
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="w-5 h-5 mr-2" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {asset.description && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                                    <p className="text-gray-600">{asset.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Asset Type</h4>
                                    <Badge className={asset.type === 'FIXED_ASSET' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                                        {asset.type === 'FIXED_ASSET' ? (
                                            <>
                                                <Package className="w-3 h-3 mr-1" />
                                                Fixed Asset
                                            </>
                                        ) : (
                                            <>
                                                <Utensils className="w-3 h-3 mr-1" />
                                                Utensil
                                            </>
                                        )}
                                    </Badge>
                                </div>

                                {asset.category && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-1">Category</h4>
                                        <p className="text-gray-600">{asset.category.name}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Quantity</h4>
                                    <p className="text-gray-600 font-semibold">
                                        {asset.quantity} {asset.unit && <span className="text-sm">({asset.unit})</span>}
                                    </p>
                                </div>

                                {asset.condition && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-1">Condition</h4>
                                        <p className="text-gray-600">{asset.condition}</p>
                                    </div>
                                )}

                                {asset.location && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-1">Location</h4>
                                        <p className="text-gray-600 flex items-center">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            {asset.location}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <DollarSign className="w-5 h-5 mr-2" />
                                Purchase Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-1">Purchase Price</h4>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(asset.purchasePrice)}</p>
                                    </div>

                                    {asset.currentValue && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-1">Current Value</h4>
                                            <p className="text-xl font-semibold text-blue-600">{formatCurrency(asset.currentValue)}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-1">Purchase Date</h4>
                                        <p className="text-gray-600 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {formatDate(asset.purchaseDate)}
                                        </p>
                                    </div>

                                    {asset.supplier && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-1">Supplier</h4>
                                            <p className="text-gray-600">{asset.supplier}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(asset.warrantyPeriod || asset.warrantyExpiry) && (
                                <>
                                    <Separator className="my-4" />
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Warranty Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {asset.warrantyPeriod && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Period</p>
                                                    <p className="text-gray-600">{asset.warrantyPeriod} months</p>
                                                </div>
                                            )}
                                            {asset.warrantyExpiry && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Expires</p>
                                                    <p className="text-gray-600">{formatDate(asset.warrantyExpiry)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Technical Details */}
                    {(asset.brand || asset.model || asset.serialNumber) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Settings className="w-5 h-5 mr-2" />
                                    Technical Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {asset.brand && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-1">Brand</h4>
                                            <p className="text-gray-600">{asset.brand}</p>
                                        </div>
                                    )}
                                    {asset.model && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-1">Model</h4>
                                            <p className="text-gray-600">{asset.model}</p>
                                        </div>
                                    )}
                                    {asset.serialNumber && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-1">Serial Number</h4>
                                            <p className="text-gray-600 font-mono">{asset.serialNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Asset Images and Documents */}
                    {(asset.imageUrl || asset.documentUrl) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Camera className="w-5 h-5 mr-2" />
                                    Media & Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {asset.imageUrl && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Asset Image</h4>
                                            <div className="relative group">
                                                <Image
                                                    src={asset.imageUrl!}
                                                    alt={asset.name}
                                                    width={600}
                                                    height={300}
                                                    className="w-full h-48 object-cover rounded-lg border"
                                                    style={{ objectFit: "cover" }}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="opacity-0 group-hover:opacity-100 transition-all"
                                                        onClick={() => window.open(asset.imageUrl!, '_blank')}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Full Size
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {asset.documentUrl && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-600 mb-3">Receipt/Manual/Documentation</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(asset.documentUrl!, '_blank')}
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Maintenance Logs */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center">
                                    <History className="w-5 h-5 mr-2" />
                                    Recent Maintenance History
                                </CardTitle>
                                <Link href={`/assets/maintenance?assetId=${asset.id}`}>
                                    <Button variant="outline" size="sm">
                                        View All
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {asset.maintenanceLogs && asset.maintenanceLogs.length > 0 ? (
                                <div className="space-y-4">
                                    {asset.maintenanceLogs.slice(0, 3).map((log) => (
                                        <div key={log.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="outline">{log.serviceType || 'Maintenance'}</Badge>
                                                    <Badge className={log.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                                        {log.status}
                                                    </Badge>
                                                </div>
                                                {log.cost > 0 && (
                                                    <p className="font-semibold text-green-600">{formatCurrency(log.cost)}</p>
                                                )}
                                            </div>
                                            <p className="text-gray-600 mb-2">{log.description}</p>
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <p>ID: {log.maintenanceId}</p>
                                                <p>{formatDate(log.maintenanceDate)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance history</h3>
                                    <p className="text-gray-500 mb-4">This asset hasn't had any maintenance performed yet.</p>
                                    <Link href={`/assets/maintenance/create?assetId=${asset.id}`}>
                                        <Button>
                                            <Wrench className="w-4 h-4 mr-2" />
                                            Log Maintenance
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                    {/* Maintenance Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="w-5 h-5 mr-2" />
                                Maintenance Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <Badge className={`${getMaintenanceStatusColor(asset.maintenanceStatus)} text-lg px-4 py-2`}>
                                    {asset.maintenanceStatus === 'overdue' && <AlertTriangle className="w-4 h-4 mr-2" />}
                                    {asset.maintenanceStatus === 'urgent' && <Clock className="w-4 h-4 mr-2" />}
                                    {getMaintenanceStatusText(asset.maintenanceStatus, asset.daysDiff)}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Next Maintenance</h4>
                                    <p className="text-gray-600 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {formatDate(asset.maintenanceDate)}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-1">Maintenance Interval</h4>
                                    <p className="text-gray-600">{asset.maintenanceInterval} days</p>
                                </div>

                                {asset.assignedTo && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-1">Assigned To</h4>
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 mr-2 text-gray-400" />
                                            <div>
                                                <p className="text-gray-600 font-medium">{asset.assignedTo.fullName || asset.assignedTo.name}</p>
                                                {asset.assignedTo.department && (
                                                    <p className="text-xs text-gray-500">{asset.assignedTo.department}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full"
                                variant={asset.maintenanceStatus === 'overdue' ? 'default' : 'outline'}
                                asChild
                            >
                                <Link href={`/assets/maintenance/create?assetId=${asset.id}`}>
                                    <Wrench className="w-4 h-4 mr-2" />
                                    Schedule Maintenance
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Active Notifications */}
                    {asset.notifications && asset.notifications.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center">
                                        <AlertTriangle className="w-5 h-5 mr-2" />
                                        Notifications
                                    </span>
                                    <Badge variant="outline">{asset.notifications.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {asset.notifications.slice(0, 3).map((notification) => (
                                    <div key={notification.id} className="border-l-4 border-orange-400 bg-orange-50 p-3 rounded-r">
                                        <div className="flex items-center justify-between mb-1">
                                            <Badge className={getPriorityColor(notification.priority)}>{notification.priority}</Badge>
                                            <span className="text-xs text-gray-500">{formatDateTime(notification.scheduledFor)}</span>
                                        </div>
                                        <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                    </div>
                                ))}
                                {asset.notifications.length > 3 && (
                                    <p className="text-sm text-gray-500 text-center">
                                        +{asset.notifications.length - 3} more notifications
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Asset Metadata */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Asset Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                                <p className="text-sm text-gray-600">{formatDateTime(asset.createdAt)}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-1">Last Updated</h4>
                                <p className="text-sm text-gray-600">{formatDateTime(asset.updatedAt)}</p>
                            </div>
                            {asset.qrCode && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-1">QR Code</h4>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600 font-mono">{asset.qrCode}</p>
                                        <Button variant="outline" size="sm" onClick={downloadQrCode}>
                                            <QrCode className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}