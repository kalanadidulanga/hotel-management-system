"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Home,
    Search,
    Eye,
    Edit,
    Trash2,
    Copy,
    FileText,
    Printer,
    ChevronUp,
    ChevronDown,
    UserCheck,
    Plus,
} from "lucide-react";
import Link from "next/link";
import useSWR from 'swr';

// Updated interface to match Prisma schema
interface CheckInReservation {
    id: number;
    bookingNumber: string;
    checkInDate: string;
    checkOutDate: string;
    checkInTime: string;
    checkOutTime: string;
    roomType: string;
    roomNumber: number;
    roomPrice: number;
    total: number;
    advanceAmount: number;
    balanceAmount: number;
    billingType: string;
    paymentMode: string;
    purposeOfVisit: string;
    adults?: number;
    children?: number;
    // Customer details (from relation)
    customer: {
        id: number;
        firstName: string;
        lastName?: string;
        phone: string;
        email: string;
        nationality: "native" | "foreigner";
    };
    // Room details (from relation)
    room: {
        id: number;
        roomNumber: number;
        isAvailable: boolean;
    };
    roomTypeDetails: {
        roomType: string;
        rate: number;
        capacity: number;
    };
    createdAt: string;
    updatedAt: string;
}

// Define check-in status type
type CheckInStatus = "Pending" | "Checked In" | "Checked Out" | "Cancelled";
type PaymentStatus = "Pending" | "Partial" | "Paid" | "Overdue";

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "bookingNumber", label: "Booking Number" },
    { key: "roomType", label: "Room Type" },
    { key: "roomNumber", label: "Room No." },
    { key: "customerName", label: "Customer Name" },
    { key: "phone", label: "Phone" },
    { key: "checkIn", label: "Check In" },
    { key: "checkOut", label: "Check Out" },
    { key: "advanceAmount", label: "Advance Paid" },
    { key: "balanceAmount", label: "Balance Due" },
    { key: "total", label: "Total Amount" },
    { key: "checkInStatus", label: "Check-in Status" },
    { key: "paymentStatus", label: "Payment Status" },
    { key: "action", label: "Action" },
];

export default function CheckInListPage() {
    const [entries, setEntries] = useState(10);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    // Fetch reservations that are eligible for check-in (today's check-ins)
    const { data: reservations = [], error, isLoading, mutate } = useSWR<CheckInReservation[]>(
        "/api/room-reservation/check-in",
        fetcher,
        {
            refreshInterval: 30000, // Refresh every 30 seconds
        }
    );

    // Helper function to determine check-in status
    const getCheckInStatus = (reservation: CheckInReservation): CheckInStatus => {
        const today = new Date().toDateString();
        const checkInDate = new Date(reservation.checkInDate).toDateString();
        const checkOutDate = new Date(reservation.checkOutDate).toDateString();

        if (checkOutDate < today) return "Checked Out";
        if (checkInDate === today) return "Pending"; // Can check in today
        if (checkInDate < today) return "Checked In"; // Should be checked in
        return "Pending";
    };

    // Helper function to determine payment status
    const getPaymentStatus = (reservation: CheckInReservation): PaymentStatus => {
        const { total, advanceAmount, balanceAmount } = reservation;

        if (advanceAmount >= total) return "Paid";
        if (advanceAmount > 0 && balanceAmount > 0) return "Partial";
        if (balanceAmount > 0) return "Pending";
        return "Paid";
    };

    // Filtering
    const filtered = useMemo(() => {
        if (!reservations || reservations.length === 0) return [];

        return reservations.filter(reservation => {
            const customerName = `${reservation.customer.firstName} ${reservation.customer.lastName || ''}`.toLowerCase();
            const searchTerm = search.toLowerCase();

            return (
                reservation.bookingNumber.toLowerCase().includes(searchTerm) ||
                customerName.includes(searchTerm) ||
                reservation.customer.phone.toLowerCase().includes(searchTerm) ||
                reservation.roomType.toLowerCase().includes(searchTerm) ||
                String(reservation.roomNumber).includes(searchTerm)
            );
        });
    }, [search, reservations]);

    // Sorting
    const sorted = useMemo(() => {
        const sortedReservations = [...filtered];

        if (sort.key === "sl") {
            sortedReservations.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "bookingNumber") {
            sortedReservations.sort((a, b) => {
                if (a.bookingNumber < b.bookingNumber) return sort.dir === "asc" ? -1 : 1;
                if (a.bookingNumber > b.bookingNumber) return sort.dir === "asc" ? 1 : -1;
                return 0;
            });
        } else if (sort.key === "customerName") {
            sortedReservations.sort((a, b) => {
                const nameA = `${a.customer.firstName} ${a.customer.lastName || ''}`;
                const nameB = `${b.customer.firstName} ${b.customer.lastName || ''}`;
                if (nameA < nameB) return sort.dir === "asc" ? -1 : 1;
                if (nameA > nameB) return sort.dir === "asc" ? 1 : -1;
                return 0;
            });
        } else if (["advanceAmount", "balanceAmount", "total"].includes(sort.key)) {
            sortedReservations.sort((a, b) => {
                const aVal = a[sort.key as keyof CheckInReservation] as number;
                const bVal = b[sort.key as keyof CheckInReservation] as number;
                return sort.dir === "asc" ? aVal - bVal : bVal - aVal;
            });
        } else if (["checkIn", "checkOut"].includes(sort.key)) {
            sortedReservations.sort((a, b) => {
                const aVal = sort.key === "checkIn" ? a.checkInDate : a.checkOutDate;
                const bVal = sort.key === "checkIn" ? b.checkInDate : b.checkOutDate;
                return sort.dir === "asc" ?
                    new Date(aVal).getTime() - new Date(bVal).getTime() :
                    new Date(bVal).getTime() - new Date(aVal).getTime();
            });
        }
        return sortedReservations;
    }, [filtered, sort]);

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries);
    const paginated = sorted.slice((page - 1) * entries, page * entries);

    // Export/Print handlers
    const handleExport = (type: string) => {
        alert(`Export as ${type}`);
    };

    // Handle check-in action
    const handleCheckIn = async (reservationId: number) => {
        try {
            const response = await fetch(`/api/room-reservation/check-in/${reservationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to check in');

            mutate(); // Refresh data
            alert('Guest checked in successfully!');
        } catch (error) {
            console.error('Check-in error:', error);
            alert('Failed to check in guest');
        }
    };

    // Get status badge configurations
    const getCheckInStatusConfig = (status: CheckInStatus) => {
        switch (status) {
            case "Pending":
                return { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" };
            case "Checked In":
                return { variant: "default" as const, className: "bg-green-100 text-green-800" };
            case "Checked Out":
                return { variant: "outline" as const, className: "bg-purple-100 text-purple-800" };
            case "Cancelled":
                return { variant: "destructive" as const, className: "bg-red-100 text-red-800" };
            default:
                return { variant: "outline" as const, className: "bg-gray-100 text-gray-800" };
        }
    };

    const getPaymentStatusConfig = (status: PaymentStatus) => {
        switch (status) {
            case "Paid":
                return { variant: "default" as const, className: "bg-green-100 text-green-800" };
            case "Pending":
                return { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" };
            case "Partial":
                return { variant: "outline" as const, className: "bg-orange-100 text-orange-800" };
            case "Overdue":
                return { variant: "destructive" as const, className: "bg-red-100 text-red-800" };
            default:
                return { variant: "outline" as const, className: "bg-gray-100 text-gray-800" };
        }
    };

    if (error) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-red-500 mb-4">Error loading check-in data: {error.message}</p>
                    <Button onClick={() => mutate()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header Section */}
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
                <div className="px-4 py-4 space-y-4">
                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <Home className="w-4 h-4" /> Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-reservation" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Room Reservation
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-reservation/check-in" className="text-sm font-medium">
                                    Check In List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Direct Check-in Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <UserCheck className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Check In List</h1>
                                <p className="text-sm text-muted-foreground">
                                    {filtered.length > 0 ? `${filtered.length} reservations ready for check-in` : 'Manage all current guest check-ins'}
                                </p>
                            </div>
                        </div>
                        <Link href="/room-reservation/room-booking" className="flex-shrink-0">
                            <Button className="h-10 px-6 rounded-full shadow-md flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                New Reservation
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="flex-shrink-0 bg-white shadow-lg border-b border-border/50">
                <div className="px-4 py-4 space-y-4">
                    {/* Top Controls */}
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Entries Selection */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Show</span>
                            <Select value={String(entries)} onValueChange={v => { setEntries(Number(v)); setPage(1); }}>
                                <SelectTrigger className="w-20 h-9 text-sm rounded-lg border-border/50 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizes.map(size => (
                                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-sm font-medium text-muted-foreground">entries</span>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("Copy")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("CSV")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                CSV
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("PDF")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                PDF
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("Print")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                        </div>

                        {/* Search Bar */}
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm font-medium text-muted-foreground">Search:</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search reservations..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-10 h-9 w-64 text-sm rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Column Visibility */}
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-4 rounded-lg text-sm shadow-sm"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Column visibility
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                {columns.map(col => (
                                    <DropdownMenuCheckboxItem
                                        key={col.key}
                                        checked={visibleCols.includes(col.key)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setVisibleCols([...visibleCols, col.key]);
                                            } else {
                                                setVisibleCols(visibleCols.filter(c => c !== col.key));
                                            }
                                        }}
                                    >
                                        {col.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
                    <div className="bg-white shadow-lg">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow className="border-b border-border/50">
                                    {columns.filter(col => visibleCols.includes(col.key)).map(col => (
                                        <TableHead
                                            key={col.key}
                                            className="text-sm font-medium text-muted-foreground cursor-pointer select-none hover:bg-accent transition-colors duration-200 border-b border-border/50 whitespace-nowrap h-12"
                                            onClick={() => {
                                                if (col.key !== "action") {
                                                    setSort(s => ({
                                                        key: col.key,
                                                        dir: s.key === col.key ? (s.dir === "asc" ? "desc" : "asc") : "asc"
                                                    }));
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.label}
                                                {col.key !== "action" && (
                                                    <div className="flex flex-col">
                                                        {sort.key === col.key ? (
                                                            sort.dir === "asc" ?
                                                                <ChevronUp className="w-4 h-4 text-foreground" /> :
                                                                <ChevronDown className="w-4 h-4 text-foreground" />
                                                        ) : (
                                                            <ChevronUp className="w-4 h-4 text-muted-foreground/50" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                                Loading check-in data...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <UserCheck className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">No check-ins found</p>
                                                <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((reservation, idx) => {
                                        const checkInStatus = getCheckInStatus(reservation);
                                        const paymentStatus = getPaymentStatus(reservation);

                                        return (
                                            <TableRow key={reservation.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                                {visibleCols.includes("sl") && (
                                                    <TableCell className="text-sm text-foreground font-medium py-3">
                                                        {(page - 1) * entries + idx + 1}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("bookingNumber") && (
                                                    <TableCell className="text-sm py-3 font-medium text-blue-600">
                                                        {reservation.bookingNumber}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("roomType") && (
                                                    <TableCell className="text-sm py-3">
                                                        {reservation.roomType}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("roomNumber") && (
                                                    <TableCell className="text-sm py-3 font-medium">
                                                        {reservation.roomNumber}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("customerName") && (
                                                    <TableCell className="text-sm py-3">
                                                        {reservation.customer.firstName} {reservation.customer.lastName || ''}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("phone") && (
                                                    <TableCell className="text-sm py-3">
                                                        {reservation.customer.phone}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("checkIn") && (
                                                    <TableCell className="text-sm py-3">
                                                        {new Date(reservation.checkInDate).toLocaleDateString()} {reservation.checkInTime}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("checkOut") && (
                                                    <TableCell className="text-sm py-3">
                                                        {new Date(reservation.checkOutDate).toLocaleDateString()} {reservation.checkOutTime}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("advanceAmount") && (
                                                    <TableCell className="text-sm py-3 font-medium text-green-600">
                                                        Rs.{reservation.advanceAmount.toLocaleString()}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("balanceAmount") && (
                                                    <TableCell className="text-sm py-3 font-medium text-red-600">
                                                        Rs.{reservation.balanceAmount.toLocaleString()}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("total") && (
                                                    <TableCell className="text-sm py-3 font-medium">
                                                        Rs.{reservation.total.toLocaleString()}
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("checkInStatus") && (
                                                    <TableCell className="text-sm py-3">
                                                        <Badge
                                                            variant={getCheckInStatusConfig(checkInStatus).variant}
                                                            className={getCheckInStatusConfig(checkInStatus).className}
                                                        >
                                                            {checkInStatus}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("paymentStatus") && (
                                                    <TableCell className="text-sm py-3">
                                                        <Badge
                                                            variant={getPaymentStatusConfig(paymentStatus).variant}
                                                            className={getPaymentStatusConfig(paymentStatus).className}
                                                        >
                                                            {paymentStatus}
                                                        </Badge>
                                                    </TableCell>
                                                )}
                                                {visibleCols.includes("action") && (
                                                    <TableCell className="py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                            >
                                                                <Eye className="w-4 h-4 text-blue-600" />
                                                            </Button>
                                                            {checkInStatus === "Pending" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleCheckIn(reservation.id)}
                                                                    className="h-8 px-3 rounded-full border-green-200 hover:bg-green-50 hover:border-green-300 shadow-sm text-green-600 text-xs"
                                                                >
                                                                    Check In
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 rounded-full border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300 shadow-sm"
                                                            >
                                                                <Edit className="w-4 h-4 text-yellow-600" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-border/50 z-10">
                <div className="px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {(page - 1) * entries + 1} to {Math.min(page * entries, sorted.length)} of {sorted.length} entries
                        </div>

                        {totalPages > 1 && (
                            <Pagination>
                                <PaginationContent className="flex justify-center">
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage(Math.max(1, page - 1))}
                                            className={`${page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full shadow-sm h-9 px-4 text-sm`}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    onClick={() => setPage(pageNum)}
                                                    isActive={page === pageNum}
                                                    className={`cursor-pointer rounded-full hover:bg-accent h-9 px-4 text-sm ${page === pageNum ? "shadow-md" : "shadow-sm"}`}
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                                            className={`${page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full shadow-sm h-9 px-4 text-sm`}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}