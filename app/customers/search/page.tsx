"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Users,
    ArrowLeft,
    Search,
    Crown,
    Phone,
    Mail,
    CreditCard,
    Eye,
    Edit,
    Clock,
    AlertTriangle,
    CheckCircle,
    Loader2,
    History,
    User,
    Calendar
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";

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
    identityNumber: string;
    identityType: string | null;
    nationality: string;
    isVip: boolean;
    vipLevel: string | null;
    title: string | null;
    gender: string;
    dateOfBirth: string;
    occupation: string | null;
    country: string | null;
    city: string | null;
    address: string;
    guestImageUrl: string | null;
    createdAt: string;
    _count?: {
        reservations: number;
        quickOrders: number;
        wakeUpCalls: number;
    };
    currentStay?: {
        id: number;
        room: {
            roomNumber: string;
        };
        roomClass: {
            name: string;
        };
        checkInDate: string;
        checkOutDate: string;
    };
}

interface SearchHistory {
    id: string;
    searchTerm: string;
    searchType: 'nic' | 'general';
    timestamp: string;
    resultCount: number;
}

export default function CustomerSearchPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Load search history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('customerSearchHistory');
        const savedRecent = localStorage.getItem('recentCustomerSearches');

        if (savedHistory) {
            setSearchHistory(JSON.parse(savedHistory));
        }
        if (savedRecent) {
            setRecentSearches(JSON.parse(savedRecent));
        }
    }, []);

    const performSearch = async (term: string) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            // Use NEXT_PUBLIC_API_BASE_URL for the request
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/customers/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    searchTerm: term.trim(),
                    searchType: isNICFormat(term) ? 'nic' : 'general'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Search failed');
            }

            const data = await response.json();
            setSearchResults(data.customers || []);

            // Save to search history
            saveSearchToHistory(term, data.customers?.length || 0);

            if (data.customers?.length === 0) {
                toast.info('No customers found matching your search');
            } else {
                toast.success(`Found ${data.customers.length} customer(s)`);
            }

        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search customers: ' + (error instanceof Error ? error.message : 'Unknown error'));
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const saveSearchToHistory = (term: string, resultCount: number) => {
        const newHistoryItem: SearchHistory = {
            id: Date.now().toString(),
            searchTerm: term,
            searchType: isNICFormat(term) ? 'nic' : 'general',
            timestamp: new Date().toISOString(),
            resultCount
        };

        const updatedHistory = [newHistoryItem, ...searchHistory.slice(0, 9)];
        const updatedRecent = [term, ...recentSearches.filter(s => s !== term).slice(0, 4)];

        setSearchHistory(updatedHistory);
        setRecentSearches(updatedRecent);

        localStorage.setItem('customerSearchHistory', JSON.stringify(updatedHistory));
        localStorage.setItem('recentCustomerSearches', JSON.stringify(updatedRecent));
    };

    const isNICFormat = (value: string) => {
        const nicPattern = /^(\d{9}[vVxX]|\d{12})$/;
        return nicPattern.test(value.replace(/\s+/g, ''));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(searchTerm);
    };

    const handleQuickSearch = (term: string) => {
        setSearchTerm(term);
        performSearch(term);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        setRecentSearches([]);
        localStorage.removeItem('customerSearchHistory');
        localStorage.removeItem('recentCustomerSearches');
        toast.success('Search history cleared');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getNationalityFlag = (nationality: string) => {
        return nationality === 'native' ? '🇱🇰' : '🌍';
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

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
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
                            <Search className="w-8 h-8 text-blue-600 mr-3" />
                            Quick Customer Search
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Search customers by NIC, name, phone, email, or customer ID
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <Search className="w-5 h-5 mr-2" />
                        Search Customer Database
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Enter NIC (e.g., 950123456V), name, phone, email, or customer ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 text-lg"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" disabled={loading || !searchTerm.trim()}>
                                {loading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4 mr-2" />
                                )}
                                Search
                            </Button>
                        </div>

                        {/* Search Type Indicator */}
                        {searchTerm && (
                            <div className="flex items-center text-sm text-gray-600">
                                <Badge variant="outline" className="mr-2">
                                    {isNICFormat(searchTerm) ? (
                                        <>
                                            <CreditCard className="w-3 h-3 mr-1" />
                                            NIC Search
                                        </>
                                    ) : (
                                        <>
                                            <User className="w-3 h-3 mr-1" />
                                            General Search
                                        </>
                                    )}
                                </Badge>
                                <span>
                                    {isNICFormat(searchTerm)
                                        ? 'Searching by National Identity Card number'
                                        : 'Searching across all customer fields'
                                    }
                                </span>
                            </div>
                        )}
                    </form>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-gray-700">Recent Searches:</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {recentSearches.map((term, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickSearch(term)}
                                        className="text-xs"
                                    >
                                        {term}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Search Results */}
            {loading && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-gray-600">Searching customer database...</p>
                    </CardContent>
                </Card>
            )}

            {!loading && searchResults.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            Search Results ({searchResults.length})
                        </h2>
                    </div>

                    {searchResults.map((customer) => (
                        <Card
                            key={customer.id}
                            className={`transition-all duration-200 hover:shadow-lg ${customer.isVip
                                ? 'border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'
                                : 'hover:border-gray-300'
                                }`}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        {/* Customer Avatar */}
                                        <div className="relative">
                                            {customer.guestImageUrl ? (
                                                <Image
                                                    src={customer.guestImageUrl}
                                                    alt={customer.fullName || customer.firstName}
                                                    width={60}
                                                    height={60}
                                                    className="w-15 h-15 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className={`w-15 h-15 rounded-full flex items-center justify-center text-white font-bold text-lg ${customer.isVip
                                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                                    : 'bg-gray-400'
                                                    }`}>
                                                    {customer.firstName.charAt(0)}{customer.lastName?.charAt(0) || ''}
                                                </div>
                                            )}
                                            {customer.isVip && (
                                                <div className="absolute -bottom-1 -right-1">
                                                    <Crown className="w-5 h-5 text-yellow-500 bg-white rounded-full p-0.5" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Customer Info */}
                                        <div className="space-y-2">
                                            <div>
                                                <h3 className={`text-lg font-semibold ${customer.isVip ? 'text-purple-800' : 'text-gray-900'
                                                    }`}>
                                                    {customer.title && `${customer.title} `}
                                                    {customer.fullName}
                                                </h3>
                                                <div className="flex items-center space-x-3 mt-1">
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                        {customer.customerID}
                                                    </Badge>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <span className="mr-1">{getNationalityFlag(customer.nationality)}</span>
                                                        <span className="capitalize">{customer.nationality}</span>
                                                    </div>
                                                    {customer.isVip && (
                                                        <Badge className={`text-xs ${getVipBadgeColor(customer.vipLevel)}`}>
                                                            <Crown className="w-3 h-3 mr-1" />
                                                            {customer.vipLevel || 'VIP'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span>{customer.email}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span>{customer.countryCode} {customer.phone}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span className="font-mono">{customer.identityNumber}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span>Joined {formatDate(customer.createdAt)}</span>
                                                </div>
                                            </div>

                                            {customer.currentStay && (
                                                <div className="bg-green-100 border border-green-200 rounded-md p-2 mt-2">
                                                    <div className="flex items-center text-sm text-green-800">
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        <span className="font-medium">Currently Checked In</span>
                                                        <span className="ml-2">- Room {customer.currentStay.room.roomNumber}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {customer._count && (
                                                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                                                    <span>{customer._count.reservations || 0} bookings</span>
                                                    <span>•</span>
                                                    <span>{customer._count.quickOrders || 0} orders</span>
                                                    <span>•</span>
                                                    <span>{customer._count.wakeUpCalls || 0} wake calls</span>
                                                </div>
                                            )}
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
                                            <Button variant="outline" size="sm">
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!loading && searchTerm && searchResults.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Customers Found</h3>
                        <p className="text-gray-600 mb-6">
                            No customers match your search term "{searchTerm}"
                        </p>
                        <div className="flex justify-center space-x-3">
                            <Button variant="outline" onClick={() => setSearchTerm("")}>
                                Clear Search
                            </Button>
                            <Link href="/customers/new">
                                <Button>
                                    <Users className="w-4 h-4 mr-2" />
                                    Add New Customer
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center text-lg">
                                <History className="w-5 h-5 mr-2" />
                                Search History
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={clearHistory}>
                                Clear History
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {searchHistory.slice(0, 5).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                    onClick={() => handleQuickSearch(item.searchTerm)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Badge variant="outline" className="text-xs">
                                            {item.searchType === 'nic' ? 'NIC' : 'General'}
                                        </Badge>
                                        <span className="font-mono text-sm">{item.searchTerm}</span>
                                        <span className="text-xs text-gray-500">
                                            {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatDate(item.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}