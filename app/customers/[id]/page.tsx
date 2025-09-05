"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    Users,
    ArrowLeft,
    Edit,
    Trash2,
    Crown,
    Phone,
    Mail,
    MapPin,
    Calendar,
    CreditCard,
    User,
    Building,
    Star,
    BedDouble,
    ShoppingCart,
    Bell,
    TrendingUp,
    DollarSign,
    Clock,
    Eye,
    AlertTriangle,
    CheckCircle,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import CustomerForm from "../components/CustomerForm";

interface Customer {
    id: number;
    customerID: string;
    firstName: string;
    lastName: string | null;
    fullName: string | null;
    email: string;
    phone: string;
    alternatePhone: string | null;
    countryCode: string | null;
    contactType: string | null;
    identityNumber: string;
    identityType: string | null;
    nationality: string;
    isVip: boolean;
    vipLevel: string | null;
    title: string | null;
    gender: string;
    dateOfBirth: string;
    anniversary: string | null;
    occupation: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
    zipcode: string | null;
    address: string;
    frontIdUrl: string | null;
    backIdUrl: string | null;
    guestImageUrl: string | null;
    specialRequests: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    reservations: any[];
    quickOrders: any[];
    wakeUpCalls: any[];
}

interface CustomerStats {
    totalBookings: number;
    totalOrders: number;
    totalWakeUpCalls: number;
    totalSpent: { _sum: { totalAmount: number | null } };
    lastVisit: { actualCheckOut: string } | null;
    currentStay: any | null;
}

export default function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEditMode = searchParams?.get('edit') === 'true';

    // Unwrap the params promise
    const { id } = use(params);

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchCustomer();
    }, [id]); // Use the unwrapped id

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/customers/${id}`); // Use the unwrapped id

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error('Customer not found');
                    router.push('/customers');
                    return;
                }
                throw new Error('Failed to fetch customer');
            }

            const data = await response.json();
            setCustomer(data.customer);
            setStats(data.stats);
        } catch (error) {
            // console.error('Error fetching customer:', error);
            toast.error('Failed to load customer details');
            router.push('/customers');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to deactivate this customer? This action cannot be undone.')) {
            return;
        }

        try {
            setDeleting(true);
            const response = await fetch(`/api/customers/${id}`, { // Use the unwrapped id
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete customer');
            }

            toast.success('Customer deactivated successfully');
            router.push('/customers');
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete customer');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return 'Rs. 0.00';
        return `Rs. ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    const getVipBadgeColor = (level: string | null) => {
        switch (level) {
            case 'Platinum':
                return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border-0';
            case 'Gold':
                return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0';
            case 'Silver':
                return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 border-0';
            default:
                return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0';
        }
    };

    const getNationalityFlag = (nationality: string) => {
        return nationality === 'native' ? '🇱🇰' : '🌍';
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'CONFIRMED': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
            'CHECKED_IN': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            'CHECKED_OUT': { color: 'bg-gray-100 text-gray-800', icon: Clock },
            'CANCELLED': { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['CONFIRMED'];
        const IconComponent = config.icon;

        return (
            <Badge className={config.color}>
                <IconComponent className="w-3 h-3 mr-1" />
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading customer details...</p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Not Found</h3>
                    <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist.</p>
                    <Link href="/customers">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Customers
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (isEditMode) {
        return (
            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                {/* Edit Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href={`/customers/${id}`}> {/* Use the unwrapped id */}
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Details
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight flex items-center">
                                <Edit className="w-8 h-8 text-blue-600 mr-3" />
                                Edit Customer
                                {customer.isVip && (
                                    <Crown className="w-6 h-6 text-purple-600 ml-2 animate-pulse" />
                                )}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Editing: <span className="font-medium">{customer.fullName}</span> ({customer.customerID})
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customer Form for Editing */}
                <CustomerForm
                    initialData={{
                        title: customer.title || undefined,
                        firstName: customer.firstName,
                        lastName: customer.lastName || undefined,
                        gender: customer.gender,
                        dateOfBirth: new Date(customer.dateOfBirth).toISOString().split('T')[0],
                        anniversary: customer.anniversary ? new Date(customer.anniversary).toISOString().split('T')[0] : undefined,
                        nationality: customer.nationality,
                        email: customer.email,
                        phone: customer.phone,
                        alternatePhone: customer.alternatePhone || undefined,
                        countryCode: customer.countryCode || undefined,
                        contactType: customer.contactType || undefined,
                        occupation: customer.occupation || undefined,
                        country: customer.country || undefined,
                        state: customer.state || undefined,
                        city: customer.city || undefined,
                        zipcode: customer.zipcode || undefined,
                        address: customer.address,
                        identityType: customer.identityType || undefined,
                        identityNumber: customer.identityNumber,
                        specialRequests: customer.specialRequests || undefined,
                        notes: customer.notes || undefined,
                        isVip: customer.isVip,
                        vipLevel: customer.vipLevel || undefined,
                    }}
                    isEdit={true}
                    customerId={customer.id}
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/customers">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Customers
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Users className="w-8 h-8 text-blue-600 mr-3" />
                            Customer Details
                            {customer.isVip && (
                                <Crown className="w-6 h-6 text-purple-600 ml-2 animate-pulse" />
                            )}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Complete customer information and booking history
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Link href={`/customers/${id}?edit=true`}> {/* Use the unwrapped id */}
                        <Button variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Customer
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        {deleting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Deactivate
                    </Button>
                </div>
            </div>

            {/* Customer Profile Card */}
            <Card className={`${customer.isVip
                ? 'border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'
                : ''
                }`}>
                <CardContent className="p-8">
                    <div className="flex items-start space-x-6">
                        {/* Avatar */}
                        <div className="relative">
                            {customer.guestImageUrl ? (
                                <Image
                                    src={customer.guestImageUrl}
                                    alt={customer.fullName || customer.firstName}
                                    width={120}
                                    height={120}
                                    className="w-30 h-30 rounded-full object-cover"
                                />
                            ) : (
                                <div className={`w-30 h-30 rounded-full flex items-center justify-center text-white font-bold text-3xl ${customer.isVip
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                    : 'bg-gray-400'
                                    }`}>
                                    {customer.firstName.charAt(0)}{customer.lastName?.charAt(0) || ''}
                                </div>
                            )}

                            {customer.isVip && (
                                <div className="absolute -bottom-2 -right-2">
                                    <Crown className="w-8 h-8 text-yellow-500 bg-white rounded-full p-1" />
                                </div>
                            )}
                        </div>

                        {/* Customer Info */}
                        <div className="flex-1 space-y-4">
                            {/* Name and Status */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className={`text-3xl font-bold ${customer.isVip ? 'text-purple-800' : 'text-gray-900'
                                        }`}>
                                        {customer.title && `${customer.title} `}
                                        {customer.fullName}
                                    </h2>
                                    <div className="flex items-center space-x-3 mt-2">
                                        <Badge variant="outline" className="font-mono">
                                            {customer.customerID}
                                        </Badge>
                                        <div className="flex items-center">
                                            <span className="mr-1">{getNationalityFlag(customer.nationality)}</span>
                                            <span className="text-gray-600 capitalize">
                                                {customer.nationality}
                                            </span>
                                        </div>
                                        {customer.isVip && (
                                            <Badge className={`${getVipBadgeColor(customer.vipLevel)} animate-pulse`}>
                                                <Crown className="w-3 h-3 mr-1" />
                                                {customer.vipLevel || 'VIP'}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <BedDouble className="w-5 h-5 text-blue-600 mr-1" />
                                        <span className="text-2xl font-bold text-blue-600">
                                            {stats?.totalBookings || 0}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">Total Bookings</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <DollarSign className="w-5 h-5 text-green-600 mr-1" />
                                        <span className="text-2xl font-bold text-green-600">
                                            {formatCurrency(stats?.totalSpent._sum.totalAmount ?? null)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">Total Spent</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <ShoppingCart className="w-5 h-5 text-purple-600 mr-1" />
                                        <span className="text-2xl font-bold text-purple-600">
                                            {stats?.totalOrders || 0}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">Quick Orders</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Clock className="w-5 h-5 text-orange-600 mr-1" />
                                        <span className="text-sm font-medium text-orange-600">
                                            {stats?.lastVisit ? formatDate(stats.lastVisit.actualCheckOut) : 'Never'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">Last Visit</p>
                                </div>
                            </div>

                            {/* Current Stay Alert */}
                            {stats?.currentStay && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                        <div>
                                            <p className="font-medium text-green-800">Currently Checked In</p>
                                            <p className="text-sm text-green-700">
                                                Room {stats.currentStay.room.roomNumber} - {stats.currentStay.roomClass.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Information Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="reservations">Reservations ({stats?.totalBookings || 0})</TabsTrigger>
                    <TabsTrigger value="orders">Quick Orders ({stats?.totalOrders || 0})</TabsTrigger>
                    <TabsTrigger value="wake-calls">Wake Up Calls ({stats?.totalWakeUpCalls || 0})</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="w-5 h-5 mr-2" />
                                    Personal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Gender</Label>
                                        <p className="text-sm text-gray-900">{customer.gender}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                                        <p className="text-sm text-gray-900">{formatDate(customer.dateOfBirth)}</p>
                                    </div>
                                </div>
                                {customer.anniversary && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Anniversary</Label>
                                        <p className="text-sm text-gray-900">{formatDate(customer.anniversary)}</p>
                                    </div>
                                )}
                                {customer.occupation && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Occupation</Label>
                                        <p className="text-sm text-gray-900">{customer.occupation}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Phone className="w-5 h-5 mr-2" />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <Mail className="w-4 h-4 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-900">{customer.email}</p>
                                            <p className="text-xs text-gray-500">Primary Email</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Phone className="w-4 h-4 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-900">
                                                {customer.countryCode} {customer.phone}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {customer.contactType} Phone
                                            </p>
                                        </div>
                                    </div>
                                    {customer.alternatePhone && (
                                        <div className="flex items-center">
                                            <Phone className="w-4 h-4 text-gray-400 mr-3" />
                                            <div>
                                                <p className="text-sm text-gray-900">{customer.alternatePhone}</p>
                                                <p className="text-xs text-gray-500">Alternate Phone</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Address Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    Address Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-900">{customer.address}</p>
                                    {(customer.city || customer.state || customer.country) && (
                                        <p className="text-sm text-gray-600">
                                            {[customer.city, customer.state, customer.country]
                                                .filter(Boolean)
                                                .join(', ')}
                                            {customer.zipcode && ` - ${customer.zipcode}`}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Identity Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Identity Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">
                                        {customer.identityType || 'Identity Type'}
                                    </Label>
                                    <p className="text-sm text-gray-900 font-mono">{customer.identityNumber}</p>
                                </div>
                                <div className="text-xs text-gray-500">
                                    <p>Used for quick customer search and validation</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Special Requests and Notes */}
                    {(customer.specialRequests || customer.notes) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {customer.specialRequests && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Star className="w-5 h-5 mr-2" />
                                            Special Requests
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-700">{customer.specialRequests}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {customer.notes && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            Internal Notes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-700">{customer.notes}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* Reservations Tab */}
                <TabsContent value="reservations" className="space-y-4">
                    {customer.reservations.length > 0 ? (
                        <div className="space-y-4">
                            {customer.reservations.map((reservation) => (
                                <Card key={reservation.id}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="font-semibold">
                                                        Booking #{reservation.bookingNumber}
                                                    </h3>
                                                    {getStatusBadge(reservation.reservationStatus)}
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <span>Room {reservation.room.roomNumber}</span>
                                                    <span>•</span>
                                                    <span>{reservation.roomClass.name}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}</span>
                                                </div>
                                                <p className="text-sm text-gray-800">
                                                    Total: <span className="font-medium">{formatCurrency(reservation.totalAmount)}</span>
                                                </p>
                                            </div>
                                            <Link href={`/reservations/${reservation.id}`}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <BedDouble className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reservations Yet</h3>
                                <p className="text-gray-600 mb-6">This customer hasn't made any reservations</p>
                                <Link href="/reservations/new">
                                    <Button>Create Reservation</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Quick Orders Tab */}
                <TabsContent value="orders" className="space-y-4">
                    {customer.quickOrders.length > 0 ? (
                        <div className="space-y-4">
                            {customer.quickOrders.map((order) => (
                                <Card key={order.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">{order.description}</h3>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                                    <span>Qty: {order.quantity}</span>
                                                    <span>•</span>
                                                    <span>{formatCurrency(order.totalAmount)}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(order.createdAt)}</span>
                                                    {order.deliveredByStaff && (
                                                        <>
                                                            <span>•</span>
                                                            <span>By: {order.deliveredByStaff.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant={order.orderStatus === 'DELIVERED' ? 'default' : 'secondary'}>
                                                {order.orderStatus}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quick Orders</h3>
                                <p className="text-gray-600">No room service orders found</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Wake Up Calls Tab */}
                <TabsContent value="wake-calls" className="space-y-4">
                    {customer.wakeUpCalls.length > 0 ? (
                        <div className="space-y-4">
                            {customer.wakeUpCalls.map((call) => (
                                <Card key={call.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center space-x-4 text-sm">
                                                    <span className="font-medium">
                                                        {formatDate(call.date)} at {call.time}
                                                    </span>
                                                    <Badge variant={call.status === 'Completed' ? 'default' : 'secondary'}>
                                                        {call.status}
                                                    </Badge>
                                                </div>
                                                {call.remarks && (
                                                    <p className="text-sm text-gray-600 mt-1">{call.remarks}</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Wake Up Calls</h3>
                                <p className="text-gray-600">No wake up call requests found</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customer.frontIdUrl && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Identity Document (Front)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Image
                                        src={customer.frontIdUrl}
                                        alt="Identity Document Front"
                                        width={300}
                                        height={200}
                                        className="w-full h-40 object-cover rounded-lg"
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {customer.backIdUrl && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Identity Document (Back)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Image
                                        src={customer.backIdUrl}
                                        alt="Identity Document Back"
                                        width={300}
                                        height={200}
                                        className="w-full h-40 object-cover rounded-lg"
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {!customer.frontIdUrl && !customer.backIdUrl && (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents</h3>
                                    <p className="text-gray-600">No identity documents uploaded</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <label className={`block text-sm font-medium ${className}`}>{children}</label>;
}