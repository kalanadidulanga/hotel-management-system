"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Copy,
    FileText,
    Printer,
    Eye,
    Plus,
    Settings,
    Receipt,
    FileDown
} from "lucide-react"

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
    paymentStatus: "Pending" | "Partial" | "Paid" | "Refunded"
}

const mockBookings: Booking[] = [
    {
        id: 1,
        bookingNumber: "00000278",
        roomType: "VIP",
        roomNo: "101",
        name: "Ghghhj",
        phone: "+1234567890",
        checkIn: "2024-01-15 14:00",
        checkOut: "2024-01-18 11:00",
        paidAmount: 0,
        dueAmount: 45796,
        bookingStatus: "Pending",
        paymentStatus: "Pending"
    },
    {
        id: 2,
        bookingNumber: "00000279",
        roomType: "Deluxe room",
        roomNo: "165",
        name: "Alexander",
        phone: "+1987654321",
        checkIn: "2024-01-16 15:00",
        checkOut: "2024-01-20 10:00",
        paidAmount: 0,
        dueAmount: 45796,
        bookingStatus: "Pending",
        paymentStatus: "Pending"
    },
    {
        id: 3,
        bookingNumber: "00000280",
        roomType: "Standard",
        roomNo: "203",
        name: "John Smith",
        phone: "+1555123456",
        checkIn: "2024-01-17 14:00",
        checkOut: "2024-01-19 12:00",
        paidAmount: 25000,
        dueAmount: 15000,
        bookingStatus: "Confirmed",
        paymentStatus: "Partial"
    },
    {
        id: 4,
        bookingNumber: "00000281",
        roomType: "Suite",
        roomNo: "301",
        name: "Emma Johnson",
        phone: "+1444987654",
        checkIn: "2024-01-18 16:00",
        checkOut: "2024-01-22 11:00",
        paidAmount: 60000,
        dueAmount: 0,
        bookingStatus: "Confirmed",
        paymentStatus: "Paid"
    },
    {
        id: 5,
        bookingNumber: "00000282",
        roomType: "Executive",
        roomNo: "205",
        name: "Michael Brown",
        phone: "+1333456789",
        checkIn: "2024-01-19 13:00",
        checkOut: "2024-01-21 10:00",
        paidAmount: 0,
        dueAmount: 35000,
        bookingStatus: "Cancelled",
        paymentStatus: "Refunded"
    }
]

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

export default function RoomReservationPage() {
    const [entries, setEntries] = useState(10)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState<{ key: string, dir: "asc" | "desc" }>({ key: "sl", dir: "asc" })
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key))
    const [bookings, setBookings] = useState<Booking[]>(mockBookings)

    // Filtering
    const filtered = useMemo(() => {
        return bookings.filter(booking =>
            booking.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
            booking.roomType.toLowerCase().includes(search.toLowerCase()) ||
            booking.roomNo.toLowerCase().includes(search.toLowerCase()) ||
            booking.name.toLowerCase().includes(search.toLowerCase()) ||
            booking.phone.toLowerCase().includes(search.toLowerCase()) ||
            booking.bookingStatus.toLowerCase().includes(search.toLowerCase()) ||
            booking.paymentStatus.toLowerCase().includes(search.toLowerCase())
        )
    }, [search, bookings])

    // Sorting
    const sorted = useMemo(() => {
        const sortedBookings = [...filtered]
        if (sort.key === "sl") {
            sortedBookings.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id)
        } else if (sort.key === "bookingNumber") {
            sortedBookings.sort((a, b) => {
                if (a.bookingNumber < b.bookingNumber) return sort.dir === "asc" ? -1 : 1
                if (a.bookingNumber > b.bookingNumber) return sort.dir === "asc" ? 1 : -1
                return 0
            })
        } else if (sort.key === "name") {
            sortedBookings.sort((a, b) => {
                if (a.name < b.name) return sort.dir === "asc" ? -1 : 1
                if (a.name > b.name) return sort.dir === "asc" ? 1 : -1
                return 0
            })
        } else if (sort.key === "paidAmount") {
            sortedBookings.sort((a, b) => sort.dir === "asc" ? a.paidAmount - b.paidAmount : b.paidAmount - a.paidAmount)
        } else if (sort.key === "dueAmount") {
            sortedBookings.sort((a, b) => sort.dir === "asc" ? a.dueAmount - b.dueAmount : b.dueAmount - a.dueAmount)
        }
        return sortedBookings
    }, [filtered, sort])

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries)
    const paginated = sorted.slice((page - 1) * entries, page * entries)

    // Export/Print handlers
    const handleExport = (type: string) => {
        alert(`Export as ${type}`)
    }

    // Delete booking
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this reservation?")) {
            setBookings(bookings.filter(b => b.id !== id))
        }
    }

    // Format currency
    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    }

    // Get status badge with theme colors
    const getStatusBadge = (status: string, type: 'booking' | 'payment') => {
        if (type === 'booking') {
            switch (status) {
                case 'Pending': return <Badge className="bg-chart-1/20 text-chart-1 border-chart-1/30 hover:bg-chart-1/30">Pending</Badge>
                case 'Confirmed': return <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30 hover:bg-chart-2/30">Confirmed</Badge>
                case 'Cancelled': return <Badge className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30">Cancelled</Badge>
                case 'Completed': return <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30 hover:bg-chart-3/30">Completed</Badge>
                default: return <Badge variant="outline">{status}</Badge>
            }
        } else {
            switch (status) {
                case 'Pending': return <Badge className="bg-chart-1/20 text-chart-1 border-chart-1/30 hover:bg-chart-1/30">Pending</Badge>
                case 'Partial': return <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30 hover:bg-chart-4/30">Partial</Badge>
                case 'Paid': return <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30 hover:bg-chart-2/30">Paid</Badge>
                case 'Refunded': return <Badge className="bg-chart-5/20 text-chart-5 border-chart-5/30 hover:bg-chart-5/30">Refunded</Badge>
                default: return <Badge variant="outline">{status}</Badge>
            }
        }
    }

    return (
        <div className="w-full h-full bg-background flex flex-col">
            {/* Header */}
            <div className="bg-card shadow-sm border-b border-border flex-shrink-0 px-4 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Room Reservation</h1>
                        <p className="text-xs text-muted-foreground mt-1">Manage hotel room reservations and bookings</p>
                    </div>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 flex items-center gap-2 text-sm font-medium px-3 py-2 h-8"
                        onClick={() => window.location.href = '/room-reservation/new'}
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Reservation</span>
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden p-4">
                {/* Controls */}
                <div className="bg-card border border-border rounded-sm mb-3">
                    <div className="p-3">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                            {/* Entries */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-foreground">Show</span>
                                <Select value={String(entries)} onValueChange={v => { setEntries(Number(v)); setPage(1) }}>
                                    <SelectTrigger className="w-16 h-8 text-xs border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pageSizes.map(size => (
                                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-xs text-foreground">entries</span>
                            </div>

                            {/* Export Buttons */}
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    onClick={() => handleExport("Copy")}
                                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-colors duration-200 text-xs h-8 px-2"
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleExport("CSV")}
                                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-colors duration-200 text-xs h-8 px-2"
                                >
                                    <FileText className="w-3 h-3 mr-1" />
                                    CSV
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleExport("PDF")}
                                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-colors duration-200 text-xs h-8 px-2"
                                >
                                    <FileText className="w-3 h-3 mr-1" />
                                    PDF
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleExport("Print")}
                                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-colors duration-200 text-xs h-8 px-2"
                                >
                                    <Printer className="w-3 h-3 mr-1" />
                                    Print
                                </Button>
                            </div>

                            {/* Search */}
                            <div className="flex items-center gap-2 lg:ml-auto">
                                <span className="text-xs text-foreground">Search:</span>
                                <Input
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                                    className="w-40 h-8 text-xs border-border"
                                    placeholder="Search reservations..."
                                />
                            </div>
                        </div>

                        {/* Column Visibility */}
                        <div className="mt-3 pt-3 border-t border-border">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const next = visibleCols.length === columns.length ?
                                        ["sl", "bookingNumber", "roomType", "name", "bookingStatus", "paymentStatus", "action"] :
                                        columns.map(c => c.key)
                                    setVisibleCols(next)
                                }}
                                className="border-border hover:bg-accent transition-colors duration-200 text-xs h-8 px-2"
                            >
                                <Eye className="w-3 h-3 mr-1" />
                                Column visibility
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-card border border-border rounded-sm flex-1 overflow-hidden">
                    {/* Table */}
                    <div className="h-full overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10">
                                <TableRow className="border-b border-border">
                                    {columns.filter(col => visibleCols.includes(col.key)).map(col => (
                                        <TableHead
                                            key={col.key}
                                            className="text-foreground font-medium cursor-pointer select-none hover:bg-accent transition-colors duration-200 border-b border-border whitespace-nowrap text-xs h-10"
                                            onClick={() => {
                                                if (col.key !== "action") {
                                                    setSort(s => ({
                                                        key: col.key,
                                                        dir: s.key === col.key ? (s.dir === "asc" ? "desc" : "asc") : "asc"
                                                    }))
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-1">
                                                {col.label}
                                                {col.key !== "action" && col.key !== "bookingStatus" && col.key !== "paymentStatus" && (
                                                    <div className="flex flex-col">
                                                        {sort.key === col.key ? (
                                                            sort.dir === "asc" ?
                                                                <ChevronUp className="w-3 h-3 text-foreground" /> :
                                                                <ChevronDown className="w-3 h-3 text-foreground" />
                                                        ) : (
                                                            <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-8 border-b border-border">
                                            <div className="flex flex-col items-center gap-2">
                                                <Settings className="w-6 h-6 text-muted-foreground" />
                                                <p className="text-muted-foreground text-sm">No reservations found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.map((booking, idx) => (
                                    <TableRow key={booking.id} className="hover:bg-accent transition-colors duration-200 border-b border-border">
                                        {visibleCols.includes("sl") && (
                                            <TableCell className="text-foreground border-b border-border font-medium text-xs py-2">
                                                {(page - 1) * entries + idx + 1}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("bookingNumber") && (
                                            <TableCell className="text-foreground border-b border-border font-medium text-xs py-2">
                                                {booking.bookingNumber}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("roomType") && (
                                            <TableCell className="text-foreground border-b border-border text-xs py-2">
                                                {booking.roomType}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("roomNo") && (
                                            <TableCell className="text-foreground border-b border-border text-xs py-2">
                                                {booking.roomNo}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("name") && (
                                            <TableCell className="text-foreground border-b border-border text-xs py-2">
                                                {booking.name}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("phone") && (
                                            <TableCell className="text-foreground border-b border-border text-xs py-2">
                                                {booking.phone}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("checkIn") && (
                                            <TableCell className="text-foreground border-b border-border whitespace-nowrap text-xs py-2">
                                                {booking.checkIn}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("checkOut") && (
                                            <TableCell className="text-foreground border-b border-border whitespace-nowrap text-xs py-2">
                                                {booking.checkOut}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("paidAmount") && (
                                            <TableCell className="text-foreground border-b border-border text-xs py-2">
                                                {formatCurrency(booking.paidAmount)}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("dueAmount") && (
                                            <TableCell className="text-foreground border-b border-border text-xs py-2">
                                                {formatCurrency(booking.dueAmount)}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("bookingStatus") && (
                                            <TableCell className="border-b border-border py-2">
                                                {getStatusBadge(booking.bookingStatus, 'booking')}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("paymentStatus") && (
                                            <TableCell className="border-b border-border py-2">
                                                {getStatusBadge(booking.paymentStatus, 'payment')}
                                            </TableCell>
                                        )}
                                        {visibleCols.includes("action") && (
                                            <TableCell className="border-b border-border py-2">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => window.location.href = `/room-reservation/edit/${booking.id}`}
                                                        className="p-1 hover:bg-accent transition-colors duration-200 border border-border rounded"
                                                    >
                                                        <Pencil className="w-3 h-3 text-muted-foreground" />
                                                    </button>
                                                    <button
                                                        onClick={() => window.location.href = `/room-reservation/view/${booking.id}`}
                                                        className="p-1 hover:bg-accent transition-colors duration-200 border border-border rounded"
                                                    >
                                                        <Receipt className="w-3 h-3 text-muted-foreground" />
                                                    </button>
                                                    <button
                                                        onClick={() => window.location.href = `/room-reservation/preview/${booking.id}`}
                                                        className="p-1 hover:bg-accent transition-colors duration-200 border border-border rounded"
                                                    >
                                                        <Eye className="w-3 h-3 text-muted-foreground" />
                                                    </button>
                                                    <button
                                                        onClick={() => alert(`Generate PDF for reservation ${booking.bookingNumber}`)}
                                                        className="p-1 hover:bg-accent transition-colors duration-200 border border-border rounded"
                                                    >
                                                        <FileDown className="w-3 h-3 text-muted-foreground" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(booking.id)}
                                                        className="p-1 hover:bg-destructive/10 transition-colors duration-200 border border-border rounded"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-destructive" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="bg-card border border-border rounded-sm mt-3 flex-shrink-0">
                    <div className="p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="text-xs text-muted-foreground">
                                Showing {(page - 1) * entries + 1} to {Math.min(page * entries, sorted.length)} of {sorted.length} entries
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="border-border hover:bg-accent transition-colors duration-200 text-xs h-8 px-2"
                                >
                                    <ChevronLeft className="w-3 h-3" />
                                    Previous
                                </Button>
                                <span className="text-xs text-foreground">
                                    Page {page} of {totalPages || 1}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === totalPages || totalPages === 0}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="border-border hover:bg-accent transition-colors duration-200 text-xs h-8 px-2"
                                >
                                    Next
                                    <ChevronRight className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}