"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
    ArrowLeft,
    Calendar,
    CreditCard,
    Edit2,
    Home,
    Plus,
    Receipt,
    Save,
    Trash2,
    User
} from "lucide-react"
import React, { useState } from "react"

interface Guest {
    id: number
    name: string
    mobile: string
}

interface ReservationData {
    // Reservation Info
    checkIn: string
    checkOut: string
    arrivalFrom: string
    bookingType: string
    bookingReference: string
    purposeOfVisit: string
    remarks: string
    
    // Room Details
    roomType: string
    roomNo: string
    adults: number
    children: number
    
    // Customer Info
    guests: Guest[]
    
    // Rent Info
    rent: number
    bedAmount: number
    personAmount: number
    childAmount: number
    complementary: string
    
    // Payment Details
    discountReason: string
    discount: number
    commission: number
    commissionAmount: number
    
    // Billing Details
    bookingCharge: number
    tax: number
    serviceCharge: number
    total: number
    
    // Advance Payment
    paymentMode: string
    totalAmount: number
    advanceRemarks: string
    advanceAmount: number
}

const roomTypes = ["VIP", "Deluxe", "Standard", "Suite", "Executive"]
const bookingTypes = ["Manual", "Online"]
const paymentModes = ["Cash", "Card", "UPI", "Bank Transfer"]
const complementaryOptions = ["None", "Breakfast", "Dinner", "Airport Transfer", "Wi-Fi"]
const visitPurposes = ["Business", "Leisure", "Wedding", "Conference", "Medical", "Other"]

export default function ReservationDetailsPage() {
    const [reservationData, setReservationData] = useState<ReservationData>({
        checkIn: "2025-07-16T01:00",
        checkOut: "2025-07-17T12:00",
        arrivalFrom: "",
        bookingType: "Manual",
        bookingReference: "",
        purposeOfVisit: "Business",
        remarks: "",
        roomType: "",
        roomNo: "",
        adults: 1,
        children: 0,
        guests: [],
        rent: 0,
        bedAmount: 0,
        personAmount: 0,
        childAmount: 0,
        complementary: "None",
        discountReason: "",
        discount: 0,
        commission: 0,
        commissionAmount: 0,
        bookingCharge: 0,
        tax: 0,
        serviceCharge: 0,
        total: 0,
        paymentMode: "Cash",
        totalAmount: 0,
        advanceRemarks: "",
        advanceAmount: 0
    })

    const [newGuest, setNewGuest] = useState({ name: "", mobile: "" })
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Calculate totals
    const calculateTotals = () => {
        const subtotal = reservationData.rent + reservationData.bedAmount + reservationData.personAmount + reservationData.childAmount
        const discountAmount = (subtotal * reservationData.discount) / 100
        const commissionAmount = (subtotal * reservationData.commission) / 100
        const afterDiscount = subtotal - discountAmount
        const total = afterDiscount + reservationData.tax + reservationData.serviceCharge
        
        setReservationData(prev => ({
            ...prev,
            commissionAmount,
            total,
            totalAmount: total
        }))
    }

    // Add guest
    const addGuest = () => {
        if (newGuest.name && newGuest.mobile) {
            const guest: Guest = {
                id: Date.now(),
                name: newGuest.name,
                mobile: newGuest.mobile
            }
            setReservationData(prev => ({
                ...prev,
                guests: [...prev.guests, guest]
            }))
            setNewGuest({ name: "", mobile: "" })
        }
    }

    // Edit guest
    const editGuest = (guest: Guest) => {
        setEditingGuest(guest)
        setNewGuest({ name: guest.name, mobile: guest.mobile })
    }

    // Update guest
    const updateGuest = () => {
        if (editingGuest && newGuest.name && newGuest.mobile) {
            setReservationData(prev => ({
                ...prev,
                guests: prev.guests.map(g => 
                    g.id === editingGuest.id 
                        ? { ...g, name: newGuest.name, mobile: newGuest.mobile }
                        : g
                )
            }))
            setEditingGuest(null)
            setNewGuest({ name: "", mobile: "" })
        }
    }

    // Delete guest
    const deleteGuest = (id: number) => {
        if (confirm("Are you sure you want to remove this guest?")) {
            setReservationData(prev => ({
                ...prev,
                guests: prev.guests.filter(g => g.id !== id)
            }))
        }
    }

    // Save reservation
    const handleSave = async () => {
        if (!reservationData.roomType || !reservationData.roomNo || reservationData.guests.length === 0) {
            alert("Please fill in all required fields (Room Type, Room No., and at least one guest)")
            return
        }

        setIsLoading(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Here you would typically send the data to your backend
            console.log("Saving reservation:", reservationData)
            
            alert("Reservation saved successfully!")
            // Redirect to reservations list or show success message
            // window.location.href = '/room-reservation'
        } catch (error) {
            console.error("Error saving reservation:", error)
            alert("Error saving reservation. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate totals when relevant fields change
    React.useEffect(() => {
        calculateTotals()
    }, [reservationData.rent, reservationData.bedAmount, reservationData.personAmount, reservationData.childAmount, reservationData.discount, reservationData.commission, reservationData.tax, reservationData.serviceCharge])

    return (
        <div className="w-full h-full bg-background flex flex-col">
            {/* Header */}
            <div className="bg-card shadow-sm border-b border-border flex-shrink-0 px-4 py-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">New Reservation</h1>
                        <p className="text-xs text-muted-foreground">Create a new room reservation</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* 1. Reservation Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Reservation Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Check In *</Label>
                                    <Input
                                        type="datetime-local"
                                        value={reservationData.checkIn}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, checkIn: e.target.value }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Check Out *</Label>
                                    <Input
                                        type="datetime-local"
                                        value={reservationData.checkOut}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, checkOut: e.target.value }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Arrival From</Label>
                                    <Input
                                        value={reservationData.arrivalFrom}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, arrivalFrom: e.target.value }))}
                                        placeholder="City/Country"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Booking Type</Label>
                                    <Select value={reservationData.bookingType} onValueChange={(value) => setReservationData(prev => ({ ...prev, bookingType: value }))}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bookingTypes.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Booking Reference</Label>
                                    <Input
                                        value={reservationData.bookingReference}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, bookingReference: e.target.value }))}
                                        placeholder="Optional booking number"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Purpose of Visit</Label>
                                    <Select value={reservationData.purposeOfVisit} onValueChange={(value) => setReservationData(prev => ({ ...prev, purposeOfVisit: value }))}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {visitPurposes.map(purpose => (
                                                <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                    <Label className="text-sm font-medium">Remarks</Label>
                                    <Textarea
                                        value={reservationData.remarks}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, remarks: e.target.value }))}
                                        placeholder="Additional notes about the booking"
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Room Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Home className="w-5 h-5" />
                                Room Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Room Type *</Label>
                                    <Select value={reservationData.roomType} onValueChange={(value) => setReservationData(prev => ({ ...prev, roomType: value }))}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select room type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomTypes.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Room No. *</Label>
                                    <Input
                                        value={reservationData.roomNo}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, roomNo: e.target.value }))}
                                        placeholder="Room number"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium"># Adults</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={reservationData.adults}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, adults: parseInt(e.target.value) || 1 }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium"># Children</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={reservationData.children}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Customer Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Add Guest Form */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                                    <div>
                                        <Label className="text-sm font-medium">Name</Label>
                                        <Input
                                            value={newGuest.name}
                                            onChange={(e) => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Guest name"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Mobile No.</Label>
                                        <Input
                                            value={newGuest.mobile}
                                            onChange={(e) => setNewGuest(prev => ({ ...prev, mobile: e.target.value }))}
                                            placeholder="Contact number"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            onClick={editingGuest ? updateGuest : addGuest}
                                            disabled={!newGuest.name || !newGuest.mobile}
                                            className="w-full"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {editingGuest ? 'Update Guest' : 'Add Guest'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Guests Table */}
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>SL</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Mobile No.</TableHead>
                                                <TableHead>Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reservationData.guests.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                        No guests added yet
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                reservationData.guests.map((guest, index) => (
                                                    <TableRow key={guest.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell>{guest.name}</TableCell>
                                                        <TableCell>{guest.mobile}</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => editGuest(guest)}
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => deleteGuest(guest.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Rent Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="w-5 h-5" />
                                Rent Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Check In</Label>
                                    <Input
                                        value={reservationData.checkIn}
                                        disabled
                                        className="mt-1 bg-muted"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Check Out</Label>
                                    <Input
                                        value={reservationData.checkOut}
                                        disabled
                                        className="mt-1 bg-muted"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Complementary</Label>
                                    <Select value={reservationData.complementary} onValueChange={(value) => setReservationData(prev => ({ ...prev, complementary: value }))}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {complementaryOptions.map(option => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Rent</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={reservationData.rent}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, rent: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Bed Amount</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={reservationData.bedAmount}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, bedAmount: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Person Amount</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={reservationData.personAmount}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, personAmount: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Child Amount</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={reservationData.childAmount}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, childAmount: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 5. Payment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Payment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Discount Reason</Label>
                                    <Input
                                        value={reservationData.discountReason}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, discountReason: e.target.value }))}
                                        placeholder="Reason for discount"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Discount (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={reservationData.discount}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Commission (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={reservationData.commission}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, commission: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Commission Amount</Label>
                                    <Input
                                        type="number"
                                        value={reservationData.commissionAmount}
                                        disabled
                                        className="mt-1 bg-muted"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 6. Billing Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Booking Charge</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={reservationData.bookingCharge}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, bookingCharge: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Tax</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={reservationData.tax}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Service Charge</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={reservationData.serviceCharge}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, serviceCharge: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Total</Label>
                                    <div className="mt-1 p-2 bg-primary/10 rounded border">
                                        <span className="text-lg font-semibold">₹{reservationData.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 7. Advance Payment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Advance Payment Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Payment Mode</Label>
                                    <Select value={reservationData.paymentMode} onValueChange={(value) => setReservationData(prev => ({ ...prev, paymentMode: value }))}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentModes.map(mode => (
                                                <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Total Amount</Label>
                                    <Input
                                        type="number"
                                        value={reservationData.totalAmount}
                                        disabled
                                        className="mt-1 bg-muted"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Advance Amount</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max={reservationData.totalAmount}
                                        value={reservationData.advanceAmount}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, advanceAmount: parseFloat(e.target.value) || 0 }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Advance Remarks</Label>
                                    <Textarea
                                        value={reservationData.advanceRemarks}
                                        onChange={(e) => setReservationData(prev => ({ ...prev, advanceRemarks: e.target.value }))}
                                        placeholder="Notes related to advance payment"
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 8. Save Button */}
                    <div className="flex justify-end gap-4 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading || !reservationData.roomType || !reservationData.roomNo || reservationData.guests.length === 0}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Reservation
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}