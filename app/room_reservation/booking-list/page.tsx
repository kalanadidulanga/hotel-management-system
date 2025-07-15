"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Pencil,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Copy,
    FileText,
    Printer,
    Plus,
    Calendar,
    Phone,
    User,
    Building,
    DollarSign,
    Settings
} from "lucide-react"
import Link from "next/link"

interface Booking {
    id: number
    bookingNumber: string
    roomType: string
    roomNo: string
    name: string
    phone: string
    checkIn: string
    checkOut: string
    paidAmount: number
    dueAmount: number
    bookingStatus: "Pending" | "Confirmed" | "Cancelled" | "Completed"
    paymentStatus: "Success" | "Pending" | "Failed"
    totalAmount: number
    guestCount: number
    notes?: string
}

const mockBookings: Booking[] = [
    {
        id: 1,
        bookingNumber: "BK0000272",
        roomType: "VIP Room",
        roomNo: "101",
        name: "John Smith",
        phone: "+1 234 567 8900",
        checkIn: "2025-07-15",
        checkOut: "2025-07-18",
        paidAmount: 0,
        dueAmount: 45796.00,
        totalAmount: 45796.00,
        bookingStatus: "Pending",
        paymentStatus: "Pending",
        guestCount: 2,
        notes: "VIP treatment required"
    },
    {
        id: 2,
        bookingNumber: "BK0000271",
        roomType: "Double Room",
        roomNo: "105",
        name: "Emily Johnson",
        phone: "+1 234 567 8901",
        checkIn: "2025-07-16",
        checkOut: "2025-07-19",
        paidAmount: 26750.00,
        dueAmount: 1872.50,
        totalAmount: 28622.50,
        bookingStatus: "Confirmed",
        paymentStatus: "Success",
        guestCount: 2,
        notes: "Late check-in requested"
    },
    {
        id: 3,
        bookingNumber: "BK0000270",
        roomType: "Single Room",
        roomNo: "203",
        name: "Michael Brown",
        phone: "+1 234 567 8902",
        checkIn: "2025-07-17",
        checkOut: "2025-07-20",
        paidAmount: 15000.00,
        dueAmount: 0,
        totalAmount: 15000.00,
        bookingStatus: "Confirmed",
        paymentStatus: "Success",
        guestCount: 1,
        notes: "Business traveler"
    }
]

const roomTypes = ["VIP Room", "Double Room", "Single Room", "Suite"]
const bookingStatuses = ["Pending", "Confirmed", "Cancelled", "Completed"]
const paymentStatuses = ["Success", "Pending", "Failed"]

const pageSizes = [10, 25, 50, 100]

const columns = [
    { key: "sl", label: "SL" },
    { key: "bookingNumber", label: "Booking Number" },
    { key: "roomType", label: "Room Type" },
    { key: "roomNo", label: "Room No." },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "checkIn", label: "Check In" },
    { key: "checkOut", label: "Check Out" },
    { key: "paidAmount", label: "Paid Amount" },
    { key: "dueAmount", label: "Due Amount" },
    { key: "bookingStatus", label: "Booking Status" },
    { key: "paymentStatus", label: "Payment Status" },
    { key: "action", label: "Action" },
]

const statusColors = {
    bookingStatus: {
        "Pending": "bg-yellow-100 text-yellow-800",
        "Confirmed": "bg-green-100 text-green-800",
        "Cancelled": "bg-red-100 text-red-800",
        "Completed": "bg-blue-100 text-blue-800",
    },
    paymentStatus: {
        "Success": "bg-green-100 text-green-800",
        "Pending": "bg-yellow-100 text-yellow-800",
        "Failed": "bg-red-100 text-red-800",
    }
}

export default function BookingListPage() {
    const [entries, setEntries] = useState(10)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState<{ key: string, dir: "asc" | "desc" }>({ key: "sl", dir: "asc" })
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key))
    const [bookings, setBookings] = useState<Booking[]>(mockBookings)
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newBooking, setNewBooking] = useState<Partial<Booking>>({
        bookingNumber: "",
        roomType: "",
        roomNo: "",
        name: "",
        phone: "",
        checkIn: "",
        checkOut: "",
        paidAmount: 0,
        dueAmount: 0,
        totalAmount: 0,
        bookingStatus: "Pending",
        paymentStatus: "Pending",
        guestCount: 1,
        notes: ""
    })

    // Filtering
    const filtered = useMemo(() => {
        return bookings.filter(booking =>
            booking.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
            booking.name.toLowerCase().includes(search.toLowerCase()) ||
            booking.roomType.toLowerCase().includes(search.toLowerCase()) ||
            booking.roomNo.toLowerCase().includes(search.toLowerCase()) ||
            booking.phone.includes(search)
        )
    }, [search, bookings])

    // Sorting
    const sorted = useMemo(() => {
        const sortedBookings = [...filtered]
        if (sort.key === "sl") {
            sortedBookings.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id)
        } else {
            sortedBookings.sort((a, b) => {
                const aVal = a[sort.key as keyof Booking]
                const bVal = b[sort.key as keyof Booking]
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sort.dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
                }
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sort.dir === "asc" ? aVal - bVal : bVal - aVal
                }
                return 0
            })
        }
        return sortedBookings
    }, [filtered, sort])

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries)
    const paginated = sorted.slice((page - 1) * entries, page * entries)

    // Handlers
    const handleExport = (type: string) => {
        alert(`Export as ${type}`)
    }

    const handleView = (booking: Booking) => {
        setSelectedBooking(booking)
        setIsViewModalOpen(true)
    }

    const handleEdit = (booking: Booking) => {
        setEditingBooking({ ...booking })
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = () => {
        if (editingBooking) {
            setBookings(bookings.map(b => b.id === editingBooking.id ? editingBooking : b))
            setIsEditModalOpen(false)
            setEditingBooking(null)
        }
    }

    const handleAddBooking = () => {
        if (newBooking.bookingNumber && newBooking.name && newBooking.roomType) {
            const bookingToAdd: Booking = {
                id: Math.max(...bookings.map(b => b.id)) + 1,
                bookingNumber: newBooking.bookingNumber!,
                roomType: newBooking.roomType!,
                roomNo: newBooking.roomNo!,
                name: newBooking.name!,
                phone: newBooking.phone!,
                checkIn: newBooking.checkIn!,
                checkOut: newBooking.checkOut!,
                paidAmount: newBooking.paidAmount || 0,
                dueAmount: newBooking.dueAmount || 0,
                totalAmount: newBooking.totalAmount || 0,
                bookingStatus: newBooking.bookingStatus as any || "Pending",
                paymentStatus: newBooking.paymentStatus as any || "Pending",
                guestCount: newBooking.guestCount || 1,
                notes: newBooking.notes || ""
            }
            setBookings([...bookings, bookingToAdd])
            setNewBooking({
                bookingNumber: "",
                roomType: "",
                roomNo: "",
                name: "",
                phone: "",
                checkIn: "",
                checkOut: "",
                paidAmount: 0,
                dueAmount: 0,
                totalAmount: 0,
                bookingStatus: "Pending",
                paymentStatus: "Pending",
                guestCount: 1,
                notes: ""
            })
            setIsAddModalOpen(false)
        }
    }

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this booking?")) {
            setBookings(bookings.filter(b => b.id !== id))
        }
    }

    const handlePrint = (booking: Booking) => {
        alert(`Print booking ${booking.bookingNumber}`)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 max-w-7xl mx-auto space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Booking List</h1>
                        <p className="text-gray-600">Manage hotel bookings</p>
                    </div>
                    <Link href={""} 
                        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                        
                    >
                        
                        Room Booking
                    </Link>
                </div>

                {/* Controls */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Entries */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700">Show</span>
                                <Select value={String(entries)} onValueChange={v => { setEntries(Number(v)); setPage(1) }}>
                                    <SelectTrigger className="w-20 border-0 bg-gray-50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pageSizes.map(size => (
                                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-gray-700">entries</span>
                            </div>

                            {/* Export Buttons */}
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-green-700 border-0 bg-green-50" onClick={() => handleExport("Copy")}>
                                    <Copy className="h-4 w-4 mr-1" /> Copy
                                </Button>
                                <Button size="sm" variant="outline" className="text-green-700 border-0 bg-green-50" onClick={() => handleExport("CSV")}>
                                    <FileText className="h-4 w-4 mr-1" /> CSV
                                </Button>
                                <Button size="sm" variant="outline" className="text-green-700 border-0 bg-green-50" onClick={() => handleExport("PDF")}>
                                    <FileText className="h-4 w-4 mr-1" /> PDF
                                </Button>
                                <Button size="sm" variant="outline" className="text-green-700 border-0 bg-green-50" onClick={() => handleExport("Print")}>
                                    <Printer className="h-4 w-4 mr-1" /> Print
                                </Button>
                            </div>

                            {/* Search */}
                            <div className="flex items-center gap-2 lg:ml-auto">
                                <span className="text-sm text-gray-700">Search:</span>
                                <Input
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                                    className="w-48 border-0 bg-gray-50"
                                    placeholder="Search..."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-auto max-h-[70vh]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-white z-10">
                                    <TableRow className="bg-gray-50 border-0">
                                        {columns.filter(col => visibleCols.includes(col.key)).map(col => (
                                            <TableHead
                                                key={col.key}
                                                className="font-semibold text-gray-900 border-0 whitespace-nowrap"
                                            >
                                                {col.label}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginated.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={visibleCols.length} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Calendar className="h-8 w-8 text-gray-400" />
                                                    <p className="text-gray-500">No bookings found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.map((booking, idx) => (
                                        <TableRow key={booking.id} className="hover:bg-gray-50 border-0">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="font-medium border-0">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("bookingNumber") && (
                                                <TableCell className="border-0 text-blue-600 font-medium">
                                                    {booking.bookingNumber}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("roomType") && (
                                                <TableCell className="border-0">{booking.roomType}</TableCell>
                                            )}
                                            {visibleCols.includes("roomNo") && (
                                                <TableCell className="border-0">{booking.roomNo}</TableCell>
                                            )}
                                            {visibleCols.includes("name") && (
                                                <TableCell className="border-0">{booking.name}</TableCell>
                                            )}
                                            {visibleCols.includes("phone") && (
                                                <TableCell className="border-0">{booking.phone}</TableCell>
                                            )}
                                            {visibleCols.includes("checkIn") && (
                                                <TableCell className="border-0">{booking.checkIn}</TableCell>
                                            )}
                                            {visibleCols.includes("checkOut") && (
                                                <TableCell className="border-0">{booking.checkOut}</TableCell>
                                            )}
                                            {visibleCols.includes("paidAmount") && (
                                                <TableCell className="border-0 text-green-600 font-medium">
                                                    {booking.paidAmount.toLocaleString()}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("dueAmount") && (
                                                <TableCell className="border-0 text-red-600 font-medium">
                                                    {booking.dueAmount.toLocaleString()}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("bookingStatus") && (
                                                <TableCell className="border-0">
                                                    <Badge className={`${statusColors.bookingStatus[booking.bookingStatus]} border-0`}>
                                                        {booking.bookingStatus}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("paymentStatus") && (
                                                <TableCell className="border-0">
                                                    <Badge className={`${statusColors.paymentStatus[booking.paymentStatus]} border-0`}>
                                                        {booking.paymentStatus}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="border-0">
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-blue-600 hover:bg-blue-50"
                                                            onClick={() => handleEdit(booking)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-green-600 hover:bg-green-50"
                                                            onClick={() => handleView(booking)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-purple-600 hover:bg-purple-50"
                                                            onClick={() => handlePrint(booking)}
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDelete(booking.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="text-sm text-gray-600">
                                Showing {(page - 1) * entries + 1} to {Math.min(page * entries, sorted.length)} of {sorted.length} entries
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="border-0 bg-gray-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <span className="text-sm">
                                    Page {page} of {totalPages || 1}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === totalPages || totalPages === 0}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="border-0 bg-gray-50"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-0">
                    <DialogHeader>
                        <DialogTitle>Add New Booking</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Booking Number</Label>
                                <Input
                                    value={newBooking.bookingNumber}
                                    onChange={(e) => setNewBooking({ ...newBooking, bookingNumber: e.target.value })}
                                    className="border-0 bg-gray-50"
                                />
                            </div>
                            <div>
                                <Label>Room Type</Label>
                                <Select value={newBooking.roomType} onValueChange={(value) => setNewBooking({ ...newBooking, roomType: value })}>
                                    <SelectTrigger className="border-0 bg-gray-50">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Guest Name</Label>
                                <Input
                                    value={newBooking.name}
                                    onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })}
                                    className="border-0 bg-gray-50"
                                />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    value={newBooking.phone}
                                    onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                                    className="border-0 bg-gray-50"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddBooking}>Add Booking</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-0">
                    <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                    </DialogHeader>
                    {selectedBooking && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Booking Number</Label>
                                    <p className="text-blue-600 font-medium">{selectedBooking.bookingNumber}</p>
                                </div>
                                <div>
                                    <Label>Room Type</Label>
                                    <p>{selectedBooking.roomType}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Guest Name</Label>
                                    <p>{selectedBooking.name}</p>
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <p>{selectedBooking.phone}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Check In</Label>
                                    <p>{selectedBooking.checkIn}</p>
                                </div>
                                <div>
                                    <Label>Check Out</Label>
                                    <p>{selectedBooking.checkOut}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-0">
                    <DialogHeader>
                        <DialogTitle>Edit Booking</DialogTitle>
                    </DialogHeader>
                    {editingBooking && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Booking Number</Label>
                                    <Input
                                        value={editingBooking.bookingNumber}
                                        onChange={(e) => setEditingBooking({ ...editingBooking, bookingNumber: e.target.value })}
                                        className="border-0 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <Label>Room Type</Label>
                                    <Select value={editingBooking.roomType} onValueChange={(value) => setEditingBooking({ ...editingBooking, roomType: value })}>
                                        <SelectTrigger className="border-0 bg-gray-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roomTypes.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Guest Name</Label>
                                    <Input
                                        value={editingBooking.name}
                                        onChange={(e) => setEditingBooking({ ...editingBooking, name: e.target.value })}
                                        className="border-0 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        value={editingBooking.phone}
                                        onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                                        className="border-0 bg-gray-50"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveEdit}>Save Changes</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}