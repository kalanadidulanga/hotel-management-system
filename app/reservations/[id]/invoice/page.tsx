"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Reservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfNights: number;
    adults: number;
    children: number;
    infants: number;
    baseRoomRate: number;
    totalRoomCharge: number;
    extraCharges: number;
    discountAmount: number;
    serviceCharge: number;
    tax: number;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    paymentStatus: string;
    reservationStatus: string;
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
    };
    room: {
        roomNumber: string;
    };
    roomClass: {
        name: string;
    };
    quickOrders: Array<{
        id: number;
        description: string;
        quantity: number;
        unitPrice: number;
        totalAmount: number;
    }>;
}

export default function InvoicePage() {
    const params = useParams();
    const reservationId = params.id as string;

    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (reservationId) {
            fetchInvoiceData();
        }
    }, [reservationId]);

    const fetchInvoiceData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/reservations/${reservationId}/invoice`);

            if (!response.ok) {
                throw new Error('Failed to fetch invoice data');
            }

            const data = await response.json();
            if (data.success) {
                setReservation(data.reservation);
            } else {
                throw new Error(data.error || 'Failed to load invoice');
            }
        } catch (error) {
            console.error('Error fetching invoice:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
            toast.error('Failed to load invoice');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
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
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading invoice...</span>
            </div>
        );
    }

    if (error || !reservation) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Invoice</h3>
                        <p className="text-red-600 mb-4">{error || 'Invoice not found'}</p>
                        <Link href="/reservations">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Reservations
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const quickOrdersTotal = reservation.quickOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const grandTotal = reservation.totalAmount + quickOrdersTotal;

    return (
        <div className="max-w-4xl mx-auto p-6 print:p-4">
            {/* Header Actions - Hidden in print */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <Link href="/reservations">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Reservations
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Invoice Content */}
            <Card className="print:shadow-none print:border-none">
                <CardHeader className="text-center border-b">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">HOTEL INVOICE</h1>
                        <p className="text-gray-600">Your Hotel Name</p>
                        <p className="text-sm text-gray-500">
                            123 Hotel Street, City, Country<br />
                            Phone: +1-234-567-8900 | Email: info@hotel.com
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Invoice Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Bill To:</h3>
                            <div className="space-y-1 text-gray-700">
                                <p className="font-medium">{reservation.customer.firstName} {reservation.customer.lastName}</p>
                                <p>{reservation.customer.email}</p>
                                <p>{reservation.customer.phone}</p>
                                <p>{reservation.customer.address}</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="space-y-2">
                                <div>
                                    <span className="text-gray-600">Invoice #:</span>
                                    <span className="font-semibold ml-2">{reservation.bookingNumber}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Date:</span>
                                    <span className="ml-2">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Status:</span>
                                    <Badge className="ml-2" variant={reservation.paymentStatus === 'PAID' ? 'default' : 'destructive'}>
                                        {reservation.paymentStatus}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reservation Details */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">Reservation Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Room:</span>
                                <span className="ml-2">{reservation.room.roomNumber} - {reservation.roomClass.name}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Guests:</span>
                                <span className="ml-2">{reservation.adults} Adults, {reservation.children} Children, {reservation.infants} Infants</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Check-in:</span>
                                <span className="ml-2">{formatDate(reservation.checkInDate)}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Check-out:</span>
                                <span className="ml-2">{formatDate(reservation.checkOutDate)}</span>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-gray-600">Duration:</span>
                                <span className="ml-2">{reservation.numberOfNights} nights</span>
                            </div>
                        </div>
                    </div>

                    {/* Room Charges */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4">Room Charges</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Room Rate ({reservation.numberOfNights} nights × {formatCurrency(reservation.baseRoomRate)})</span>
                                <span>{formatCurrency(reservation.totalRoomCharge)}</span>
                            </div>
                            {reservation.extraCharges > 0 && (
                                <div className="flex justify-between">
                                    <span>Extra Charges</span>
                                    <span>{formatCurrency(reservation.extraCharges)}</span>
                                </div>
                            )}
                            {reservation.discountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(reservation.discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Service Charge</span>
                                <span>{formatCurrency(reservation.serviceCharge)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax</span>
                                <span>{formatCurrency(reservation.tax)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold">
                                <span>Room Total</span>
                                <span>{formatCurrency(reservation.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Orders */}
                    {reservation.quickOrders.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Additional Services</h3>
                            <div className="space-y-2">
                                {reservation.quickOrders.map((order) => (
                                    <div key={order.id} className="flex justify-between">
                                        <span>{order.description} (Qty: {order.quantity})</span>
                                        <span>{formatCurrency(order.totalAmount)}</span>
                                    </div>
                                ))}
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                    <span>Services Total</span>
                                    <span>{formatCurrency(quickOrdersTotal)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Final Total */}
                    <div className="border-t-2 border-gray-300 pt-4">
                        <div className="space-y-2 text-lg">
                            <div className="flex justify-between font-bold">
                                <span>Grand Total</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Advance Paid</span>
                                <span>{formatCurrency(reservation.advanceAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-xl">
                                <span>Balance Due</span>
                                <span>{formatCurrency(grandTotal - reservation.advanceAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
                        <p>Thank you for choosing our hotel!</p>
                        <p className="mt-2">For any queries, please contact us at info@hotel.com or call +1-234-567-8900</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}