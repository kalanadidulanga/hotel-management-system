"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Crown,
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    Eye,
    Edit,
    Star,
    Building
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Customer {
    id: number;
    customerID: string;
    firstName: string;
    lastName: string | null;
    fullName: string | null;
    email: string;
    phone: string;
    identityNumber: string;
    nationality: string;
    isVip: boolean;
    vipLevel: string | null;
    occupation: string | null;
    country: string | null;
    city: string | null;
    guestImageUrl: string | null;
    createdAt: string;
    _count: {
        reservations: number;
    };
}

interface CustomerCardProps {
    customer: Customer;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
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

    return (
        <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${customer.isVip
                ? 'border-2 border-gradient-to-r from-purple-400 to-pink-400 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50'
                : 'hover:border-gray-300'
            }`}>
            {/* VIP Crown Overlay */}
            {customer.isVip && (
                <div className="absolute top-2 right-2 z-10">
                    <Crown className="w-6 h-6 text-yellow-500 animate-pulse" />
                </div>
            )}

            <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="relative">
                        {customer.guestImageUrl ? (
                            <Image
                                src={customer.guestImageUrl}
                                alt={customer.fullName || customer.firstName}
                                width={64}
                                height={64}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg ${customer.isVip
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                    : 'bg-gray-400'
                                }`}>
                                {customer.firstName.charAt(0)}{customer.lastName?.charAt(0) || ''}
                            </div>
                        )}

                        {/* VIP Badge on Avatar */}
                        {customer.isVip && (
                            <div className="absolute -bottom-1 -right-1">
                                <Star className="w-5 h-5 text-yellow-500 bg-white rounded-full p-0.5" />
                            </div>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1 space-y-2">
                        {/* Name and VIP Status */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className={`font-semibold text-lg ${customer.isVip ? 'text-purple-800' : 'text-gray-900'
                                    }`}>
                                    {customer.fullName || `${customer.firstName} ${customer.lastName || ''}`.trim()}
                                </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                    <p className="text-sm text-gray-600 font-mono">
                                        {customer.customerID}
                                    </p>
                                    <span className="text-gray-400">•</span>
                                    <div className="flex items-center">
                                        <span className="mr-1">{getNationalityFlag(customer.nationality)}</span>
                                        <span className="text-sm text-gray-600 capitalize">
                                            {customer.nationality}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* VIP Badge */}
                            {customer.isVip && (
                                <Badge className={`${getVipBadgeColor(customer.vipLevel)} font-semibold animate-pulse`}>
                                    <Crown className="w-3 h-3 mr-1" />
                                    {customer.vipLevel || 'VIP'}
                                </Badge>
                            )}
                        </div>

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center text-gray-600">
                                <Mail className="w-4 h-4 mr-2 text-blue-500" />
                                <span className="truncate">{customer.email}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Phone className="w-4 h-4 mr-2 text-green-500" />
                                <span>{customer.phone}</span>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {customer.occupation && (
                                <div className="flex items-center text-gray-600">
                                    <Building className="w-4 h-4 mr-2 text-purple-500" />
                                    <span className="truncate">{customer.occupation}</span>
                                </div>
                            )}
                            {(customer.city || customer.country) && (
                                <div className="flex items-center text-gray-600">
                                    <MapPin className="w-4 h-4 mr-2 text-red-500" />
                                    <span className="truncate">
                                        {customer.city}{customer.city && customer.country ? ', ' : ''}{customer.country}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Statistics and Actions */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    <span>Joined {formatDate(customer.createdAt)}</span>
                                </div>
                                <div className="flex items-center">
                                    <User className="w-4 h-4 mr-1" />
                                    <span>{customer._count.reservations} bookings</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2">
                                <Link href={`/customers/${customer.id}`}>
                                    <Button variant="outline" size="sm">
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                    </Button>
                                </Link>
                                <Link href={`/customers/${customer.id}?edit=true`}>
                                    <Button
                                        variant={customer.isVip ? "default" : "outline"}
                                        size="sm"
                                        className={customer.isVip ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}