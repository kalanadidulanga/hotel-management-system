"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
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
  Building,
  Users,
  IdCard,
  Download
} from "lucide-react";
import Link from "next/link";

interface Booking {
  id: number;
  bookingNumber: string;
  roomType: string;
  roomNumber: string;
  name: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  paidAmount: number;
  dueAmount: number;
  bookingStatus: "Pending" | "Confirmed" | "Checked In" | "Checked Out" | "Cancelled";
  paymentStatus: "Pending" | "Success" | "Failed" | "Partial";
}

const mockBookings: Booking[] = [
  {
    id: 1,
    bookingNumber: "0000282",
    roomType: "Deluxe",
    roomNumber: "165",
    name: "farhid",
    phone: "566567",
    checkIn: "2025-07-18 01:00",
    checkOut: "2025-07-18 03:00",
    paidAmount: 0.00,
    dueAmount: 183184.00,
    bookingStatus: "Pending",
    paymentStatus: "Pending"
  },
  {
    id: 2,
    bookingNumber: "0000281",
    roomType: "VIP",
    roomNumber: "102",
    name: "Tester",
    phone: "0620425286",
    checkIn: "2025-07-18 01:00",
    checkOut: "2025-07-18 03:00",
    paidAmount: 0.00,
    dueAmount: 42800.00,
    bookingStatus: "Pending",
    paymentStatus: "Success"
  },
  {
    id: 3,
    bookingNumber: "0000280",
    roomType: "Standard",
    roomNumber: "201",
    name: "John Smith",
    phone: "9876543210",
    checkIn: "2025-07-19 15:00",
    checkOut: "2025-07-20 12:00",
    paidAmount: 5000.00,
    dueAmount: 15000.00,
    bookingStatus: "Confirmed",
    paymentStatus: "Partial"
  },
  {
    id: 4,
    bookingNumber: "0000279",
    roomType: "Suite",
    roomNumber: "301",
    name: "Alice Johnson",
    phone: "1234567890",
    checkIn: "2025-07-20 14:00",
    checkOut: "2025-07-22 11:00",
    paidAmount: 25000.00,
    dueAmount: 0.00,
    bookingStatus: "Confirmed",
    paymentStatus: "Success"
  },
  {
    id: 5,
    bookingNumber: "0000278",
    roomType: "Deluxe",
    roomNumber: "150",
    name: "Bob Wilson",
    phone: "5555555555",
    checkIn: "2025-07-16 16:00",
    checkOut: "2025-07-18 10:00",
    paidAmount: 8000.00,
    dueAmount: 2000.00,
    bookingStatus: "Checked In",
    paymentStatus: "Partial"
  }
];

const pageSizes = [10, 25, 50, 100];

const columns = [
  { key: "sl", label: "SL" },
  { key: "bookingNumber", label: "Booking Number" },
  { key: "roomType", label: "Room Type" },
  { key: "roomNumber", label: "Room No." },
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "checkIn", label: "Check In" },
  { key: "checkOut", label: "Check Out" },
  { key: "paidAmount", label: "Paid Amount" },
  { key: "dueAmount", label: "Due Amount" },
  { key: "bookingStatus", label: "Booking Status" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "action", label: "Action" },
];

export default function BookingListPage() {
  const [entries, setEntries] = useState(10);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
  const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  // Filtering
  const filtered = useMemo(() => {
    return bookings.filter(booking =>
      booking.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
      booking.name.toLowerCase().includes(search.toLowerCase()) ||
      booking.phone.toLowerCase().includes(search.toLowerCase()) ||
      booking.roomType.toLowerCase().includes(search.toLowerCase()) ||
      booking.roomNumber.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, bookings]);

  // Sorting
  const sorted = useMemo(() => {
    const sortedBookings = [...filtered];
    if (sort.key === "sl") {
      sortedBookings.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
    } else if (sort.key === "bookingNumber") {
      sortedBookings.sort((a, b) => {
        if (a.bookingNumber < b.bookingNumber) return sort.dir === "asc" ? -1 : 1;
        if (a.bookingNumber > b.bookingNumber) return sort.dir === "asc" ? 1 : -1;
        return 0;
      });
    } else if (sort.key === "name") {
      sortedBookings.sort((a, b) => {
        if (a.name < b.name) return sort.dir === "asc" ? -1 : 1;
        if (a.name > b.name) return sort.dir === "asc" ? 1 : -1;
        return 0;
      });
    } else if (sort.key === "paidAmount" || sort.key === "dueAmount") {
      sortedBookings.sort((a, b) => {
        const aVal = sort.key === "paidAmount" ? a.paidAmount : a.dueAmount;
        const bVal = sort.key === "paidAmount" ? b.paidAmount : b.dueAmount;
        return sort.dir === "asc" ? aVal - bVal : bVal - aVal;
      });
    }
    return sortedBookings;
  }, [filtered, sort]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / entries);
  const paginated = sorted.slice((page - 1) * entries, page * entries);

  // Export/Print handlers
  const handleExport = (type: string) => {
    alert(`Export as ${type}`);
  };

  // Delete booking
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      setBookings(bookings.filter(b => b.id !== id));
    }
  };

  // Get status badge variant
  const getBookingStatusConfig = (status: string) => {
    switch (status) {
      case "Confirmed":
        return { variant: "default" as const, className: "bg-green-100 text-green-800" };
      case "Pending":
        return { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" };
      case "Checked In":
        return { variant: "outline" as const, className: "bg-blue-100 text-blue-800" };
      case "Checked Out":
        return { variant: "outline" as const, className: "bg-purple-100 text-purple-800" };
      case "Cancelled":
        return { variant: "destructive" as const, className: "bg-red-100 text-red-800" };
      default:
        return { variant: "outline" as const, className: "bg-gray-100 text-gray-800" };
    }
  };

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case "Success":
        return { variant: "default" as const, className: "bg-green-100 text-green-800" };
      case "Pending":
        return { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" };
      case "Partial":
        return { variant: "outline" as const, className: "bg-orange-100 text-orange-800" };
      case "Failed":
        return { variant: "destructive" as const, className: "bg-red-100 text-red-800" };
      default:
        return { variant: "outline" as const, className: "bg-gray-100 text-gray-800" };
    }
  };

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
                <BreadcrumbLink href="/booking" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Booking
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/booking/booking-list" className="text-sm font-medium">
                  Booking List
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Title */}
          <div className="flex  justify-between items-center gap-3">
            <div>
              <Building className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Booking List</h1>
                <p className="text-sm text-muted-foreground">Manage all guest room bookings</p>
              </div>
            </div>
            <Link href={"/room-reservation/room-booking"} >
            <Button
              
              className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
              >
              
              Room Booking
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
                onClick={() => handleExport("Copy")}
                className="h-9 px-4 rounded-full text-sm shadow-sm bg-green-600 hover:bg-green-700 text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                size="sm"
                onClick={() => handleExport("CSV")}
                className="h-9 px-4 rounded-full text-sm shadow-sm bg-green-600 hover:bg-green-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                size="sm"
                onClick={() => handleExport("PDF")}
                className="h-9 px-4 rounded-full text-sm shadow-sm bg-green-600 hover:bg-green-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                size="sm"
                onClick={() => handleExport("Print")}
                className="h-9 px-4 rounded-full text-sm shadow-sm bg-green-600 hover:bg-green-700 text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>

            {/* Column Visibility Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 rounded-lg text-sm shadow-sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Column visibility
                  <ChevronDown className="w-4 h-4 ml-2" />
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

            {/* Search Bar */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-muted-foreground">Search:</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search bookings..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 h-9 w-64 text-sm rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
                />
              </div>
            </div>
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
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleCols.length} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Building className="w-12 h-12 text-muted-foreground" />
                        <p className="text-base text-muted-foreground">No bookings found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((booking, idx) => (
                    <TableRow key={booking.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                      {visibleCols.includes("sl") && (
                        <TableCell className="text-sm text-foreground font-medium py-3">
                          {(page - 1) * entries + idx + 1}
                        </TableCell>
                      )}
                      {visibleCols.includes("bookingNumber") && (
                        <TableCell className="text-sm py-3 font-medium text-blue-600">
                          {booking.bookingNumber}
                        </TableCell>
                      )}
                      {visibleCols.includes("roomType") && (
                        <TableCell className="text-sm py-3">
                          {booking.roomType}
                        </TableCell>
                      )}
                      {visibleCols.includes("roomNumber") && (
                        <TableCell className="text-sm py-3 font-medium">
                          {booking.roomNumber}
                        </TableCell>
                      )}
                      {visibleCols.includes("name") && (
                        <TableCell className="text-sm py-3">
                          {booking.name}
                        </TableCell>
                      )}
                      {visibleCols.includes("phone") && (
                        <TableCell className="text-sm py-3">
                          {booking.phone}
                        </TableCell>
                      )}
                      {visibleCols.includes("checkIn") && (
                        <TableCell className="text-sm py-3">
                          {booking.checkIn}
                        </TableCell>
                      )}
                      {visibleCols.includes("checkOut") && (
                        <TableCell className="text-sm py-3">
                          {booking.checkOut}
                        </TableCell>
                      )}
                      {visibleCols.includes("paidAmount") && (
                        <TableCell className="text-sm py-3 font-medium">
                          {booking.paidAmount.toLocaleString()}
                        </TableCell>
                      )}
                      {visibleCols.includes("dueAmount") && (
                        <TableCell className="text-sm py-3 font-medium text-red-600">
                          {booking.dueAmount.toLocaleString()}
                        </TableCell>
                      )}
                      {visibleCols.includes("bookingStatus") && (
                        <TableCell className="text-sm py-3">
                          <Badge
                            variant={getBookingStatusConfig(booking.bookingStatus).variant}
                            className={getBookingStatusConfig(booking.bookingStatus).className}
                          >
                            {booking.bookingStatus}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleCols.includes("paymentStatus") && (
                        <TableCell className="text-sm py-3">
                          <Badge
                            variant={getPaymentStatusConfig(booking.paymentStatus).variant}
                            className={getPaymentStatusConfig(booking.paymentStatus).className}
                          >
                            {booking.paymentStatus}
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
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-full border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300 shadow-sm"
                            >
                              <Edit className="w-4 h-4 text-yellow-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                            >
                              <IdCard className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(booking.id)}
                              className="h-8 w-8 p-0 rounded-full border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
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