"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import {
    ChevronLeft,
    ChevronRight,
    Eye,
    FileDown,
    Home,
    Pencil,
    Plus,
    Receipt,
    Search,
    Trash2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from "lucide-react"
import { useMemo, useState } from "react"

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

const statusCategories = ["All", "Pending", "Confirmed", "Cancelled", "Completed"]
const PAGE_SIZE = 10

export default function RoomReservationPage() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [selectedStatus, setSelectedStatus] = useState("All")
    const [bookings, setBookings] = useState<Booking[]>(mockBookings)
    const [sortField, setSortField] = useState<keyof Booking | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Filtering
    const filtered = useMemo(() => {
        return bookings.filter(booking =>
            (selectedStatus === "All" || booking.bookingStatus === selectedStatus) &&
            (booking.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
            booking.roomType.toLowerCase().includes(search.toLowerCase()) ||
            booking.roomNo.toLowerCase().includes(search.toLowerCase()) ||
            booking.name.toLowerCase().includes(search.toLowerCase()) ||
            booking.phone.toLowerCase().includes(search.toLowerCase()))
        )
    }, [search, bookings, selectedStatus])

    // Sorting
    const sorted = useMemo(() => {
        if (!sortField) return filtered
        
        return [...filtered].sort((a, b) => {
            let aValue = a[sortField]
            let bValue = b[sortField]
            
            // Handle string comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase()
                bValue = bValue.toLowerCase()
            }
            
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })
    }, [filtered, sortField, sortDirection])

    // Pagination
    const pageCount = Math.ceil(sorted.length / PAGE_SIZE)
    const paginatedBookings = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Handle sorting
    const handleSort = (field: keyof Booking) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Get sort icon
    const getSortIcon = (field: keyof Booking) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        return sortDirection === 'asc' ? 
            <ArrowUp className="w-4 h-4 text-foreground" /> : 
            <ArrowDown className="w-4 h-4 text-foreground" />
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
        <div className="flex flex-col h-full bg-background relative">
            {/* Header Section */}
            <div className="flex-shrink-0 bg-background">
                <div className="px-4 py-4 space-y-4">
                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-reservation" className="flex items-center gap-2 text-sm">
                                    <Home className="w-4 h-4" /> Room Reservation
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-reservation/booking-list" className="text-sm font-medium">
                                    Booking List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Header Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-foreground">Room Reservations</h1>
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            className="h-9 px-4 rounded-[var(--radius-lg)] shadow-sm"
                            onClick={() => window.location.href = '/room-reservation/new'}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Reservation
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col space-y-4 p-4 pb-6 overflow-y-auto">
                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Status Filter */}
                    <Card className="bg-background border-0 shadow-none rounded-[var(--radius-lg)]">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2">
                                {statusCategories.map((status) => (
                                    <Button
                                        key={status}
                                        variant={selectedStatus === status ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setSelectedStatus(status);
                                            setPage(1);
                                        }}
                                        className="h-8 px-3 rounded-[var(--radius-lg)] text-sm font-medium transition-all duration-200"
                                    >
                                        {status}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Search */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search reservations..."
                                className="pl-10 h-9 rounded-[var(--radius-lg)] border-border"
                            />
                        </div>
                    </div>
                </div>

                {/* Bookings Table */}
                <Card className="flex-1 bg-background border-0 shadow-none rounded-[var(--radius-lg)] min-h-0">
                    <CardContent className="p-0 h-full flex flex-col">
                        <div className="flex-1 min-h-0 overflow-hidden">
                            {paginatedBookings.length === 0 ? (
                                <div className="flex items-center justify-center h-full p-8">
                                    <div className="text-center">
                                        <p className="text-muted-foreground text-sm">No reservations found</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-auto h-full">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-10">
                                            <TableRow className="border-b border-border hover:bg-transparent">
                                                <TableHead className="w-[100px] text-xs font-medium">
                                                    <button 
                                                        onClick={() => handleSort('id')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        SL {getSortIcon('id')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium">
                                                    <button 
                                                        onClick={() => handleSort('bookingNumber')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        Booking # {getSortIcon('bookingNumber')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium">
                                                    <button 
                                                        onClick={() => handleSort('roomType')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        Room Type {getSortIcon('roomType')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium">
                                                    <button 
                                                        onClick={() => handleSort('roomNo')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        Room # {getSortIcon('roomNo')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium">
                                                    <button 
                                                        onClick={() => handleSort('name')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        Guest Name {getSortIcon('name')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium hidden md:table-cell">
                                                    Phone
                                                </TableHead>
                                                <TableHead className="text-xs font-medium hidden lg:table-cell">
                                                    <button 
                                                        onClick={() => handleSort('checkIn')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        Check In {getSortIcon('checkIn')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium hidden lg:table-cell">
                                                    <button 
                                                        onClick={() => handleSort('checkOut')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        Check Out {getSortIcon('checkOut')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium hidden xl:table-cell">
                                                    <button 
                                                        onClick={() => handleSort('paidAmount')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        Paid Amount {getSortIcon('paidAmount')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium hidden xl:table-cell">
                                                    <button 
                                                        onClick={() => handleSort('dueAmount')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        Due Amount {getSortIcon('dueAmount')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium">
                                                    <button 
                                                        onClick={() => handleSort('bookingStatus')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        Status {getSortIcon('bookingStatus')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium hidden sm:table-cell">
                                                    <button 
                                                        onClick={() => handleSort('paymentStatus')}
                                                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                                                    >
                                                        Payment {getSortIcon('paymentStatus')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-xs font-medium w-[120px]">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedBookings.map((booking, index) => (
                                                <TableRow key={booking.id} className="hover:bg-accent/50 transition-colors border-b border-border/50">
                                                    <TableCell className="text-xs font-medium">
                                                        {(page - 1) * PAGE_SIZE + index + 1}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium">
                                                        #{booking.bookingNumber}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {booking.roomType}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {booking.roomNo}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <div>
                                                            <div className="font-medium">{booking.name}</div>
                                                            <div className="text-muted-foreground md:hidden">{booking.phone}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs hidden md:table-cell">
                                                        {booking.phone}
                                                    </TableCell>
                                                    <TableCell className="text-xs hidden lg:table-cell">
                                                        <div className="whitespace-nowrap">
                                                            {new Date(booking.checkIn).toLocaleDateString()}
                                                            <div className="text-muted-foreground">
                                                                {new Date(booking.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs hidden lg:table-cell">
                                                        <div className="whitespace-nowrap">
                                                            {new Date(booking.checkOut).toLocaleDateString()}
                                                            <div className="text-muted-foreground">
                                                                {new Date(booking.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs hidden xl:table-cell">
                                                        <span className="font-medium text-chart-2">
                                                            {formatCurrency(booking.paidAmount)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs hidden xl:table-cell">
                                                        <span className="font-medium text-destructive">
                                                            {formatCurrency(booking.dueAmount)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <div className="flex flex-col gap-1">
                                                            {getStatusBadge(booking.bookingStatus, 'booking')}
                                                            <div className="sm:hidden">
                                                                {getStatusBadge(booking.paymentStatus, 'payment')}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs hidden sm:table-cell">
                                                        {getStatusBadge(booking.paymentStatus, 'payment')}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => window.location.href = `/room-reservation/edit/${booking.id}`}
                                                                className="p-1.5 hover:bg-accent transition-colors duration-200 border border-border/50 rounded-lg"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-3 h-3 text-muted-foreground" />
                                                            </button>
                                                            <button
                                                                onClick={() => window.location.href = `/room-reservation/view/${booking.id}`}
                                                                className="p-1.5 hover:bg-accent transition-colors duration-200 border border-border/50 rounded-lg"
                                                                title="Invoice"
                                                            >
                                                                <Receipt className="w-3 h-3 text-muted-foreground" />
                                                            </button>
                                                            <button
                                                                onClick={() => window.location.href = `/room-reservation/preview/${booking.id}`}
                                                                className="p-1.5 hover:bg-accent transition-colors duration-200 border border-border/50 rounded-lg hidden sm:block"
                                                                title="View"
                                                            >
                                                                <Eye className="w-3 h-3 text-muted-foreground" />
                                                            </button>
                                                            <button
                                                                onClick={() => alert(`Generate PDF for reservation ${booking.bookingNumber}`)}
                                                                className="p-1.5 hover:bg-accent transition-colors duration-200 border border-border/50 rounded-lg hidden md:block"
                                                                title="Download"
                                                            >
                                                                <FileDown className="w-3 h-3 text-muted-foreground" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(booking.id)}
                                                                className="p-1.5 hover:bg-destructive/10 transition-colors duration-200 border border-border/50 rounded-lg"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-3 h-3 text-destructive" />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {pageCount > 1 && (
                            <div className="mt-4 px-4 pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} entries
                                        {selectedStatus !== "All" && ` (filtered by ${selectedStatus})`}
                                        {search && ` (search: "${search}")`}
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                            className="h-8 px-3 rounded-[var(--radius-lg)]"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </Button>
                                        <span className="text-sm text-muted-foreground px-3">
                                            Page {page} of {pageCount}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === pageCount}
                                            onClick={() => setPage(page + 1)}
                                            className="h-8 px-3 rounded-[var(--radius-lg)]"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary Info */}
                        <div className="px-4 pb-2">
                            <div className="text-sm text-muted-foreground">
                                {sorted.length === 0 ? (
                                    search || selectedStatus !== "All" ? "No reservations match your filters" : "No reservations found"
                                ) : (
                                    <>
                                        {pageCount <= 1 ? (
                                            `Showing all ${sorted.length} reservation${sorted.length === 1 ? '' : 's'}`
                                        ) : (
                                            `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, sorted.length)} of ${sorted.length} reservations`
                                        )}
                                        {selectedStatus !== "All" && ` (filtered by ${selectedStatus})`}
                                        {search && ` (search: "${search}")`}
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}