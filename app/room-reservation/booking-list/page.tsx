"use client";

import { useState } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Plus, Search, Eye, Edit, Trash2, FileText, Calendar, User, Phone, CreditCard } from "lucide-react";

const PAGE_SIZE = 12;

interface Booking {
  id: number;
  bookingNumber: string;
  roomType: string;
  roomNo: string;
  name: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  paidAmount: number;
  dueAmount: number;
  bookingStatus: "Pending" | "Confirmed" | "Cancelled" | "Completed";
  paymentStatus: "Pending" | "Partial" | "Paid" | "Refunded";
}

const mockBookings: Booking[] = [
  {
    id: 1,
    bookingNumber: "00000278",
    roomType: "VIP",
    roomNo: "101",
    name: "Ghghhj",
    phone: "+1234567890",
    checkIn: "2024-01-15",
    checkOut: "2024-01-18",
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
    checkIn: "2024-01-16",
    checkOut: "2024-01-20",
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
    checkIn: "2024-01-17",
    checkOut: "2024-01-19",
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
    checkIn: "2024-01-18",
    checkOut: "2024-01-22",
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
    checkIn: "2024-01-19",
    checkOut: "2024-01-21",
    paidAmount: 0,
    dueAmount: 35000,
    bookingStatus: "Cancelled",
    paymentStatus: "Refunded"
  },
  {
    id: 6,
    bookingNumber: "00000283",
    roomType: "Deluxe",
    roomNo: "102",
    name: "Sarah Wilson",
    phone: "+1777888999",
    checkIn: "2024-01-20",
    checkOut: "2024-01-23",
    paidAmount: 45000,
    dueAmount: 5000,
    bookingStatus: "Confirmed",
    paymentStatus: "Partial"
  },
  {
    id: 7,
    bookingNumber: "00000284",
    roomType: "Standard",
    roomNo: "204",
    name: "David Lee",
    phone: "+1666555444",
    checkIn: "2024-01-21",
    checkOut: "2024-01-24",
    paidAmount: 30000,
    dueAmount: 0,
    bookingStatus: "Completed",
    paymentStatus: "Paid"
  },
  {
    id: 8,
    bookingNumber: "00000285",
    roomType: "VIP",
    roomNo: "302",
    name: "Lisa Anderson",
    phone: "+1888999000",
    checkIn: "2024-01-22",
    checkOut: "2024-01-26",
    paidAmount: 80000,
    dueAmount: 0,
    bookingStatus: "Confirmed",
    paymentStatus: "Paid"
  }
];

const statusFilters = ["All", "Pending", "Confirmed", "Cancelled", "Completed"];

export default function RoomReservationPage() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredBookings = mockBookings.filter((booking) => {
    const matchesStatus = selectedStatus === "All" || booking.bookingStatus === selectedStatus;
    const matchesSearch = 
      booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.roomType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.roomNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const paginatedBookings = filteredBookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.ceil(filteredBookings.length / PAGE_SIZE);

  const getStatusBadge = (status: string, type: 'booking' | 'payment') => {
    if (type === 'booking') {
      switch (status) {
        case 'Pending': return <Badge variant="outline" className="text-chart-1 border-chart-1/30 bg-chart-1/10">Pending</Badge>;
        case 'Confirmed': return <Badge variant="outline" className="text-chart-2 border-chart-2/30 bg-chart-2/10">Confirmed</Badge>;
        case 'Cancelled': return <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">Cancelled</Badge>;
        case 'Completed': return <Badge variant="outline" className="text-chart-3 border-chart-3/30 bg-chart-3/10">Completed</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
      }
    } else {
      switch (status) {
        case 'Pending': return <Badge variant="outline" className="text-chart-1 border-chart-1/30 bg-chart-1/10">Pending</Badge>;
        case 'Partial': return <Badge variant="outline" className="text-chart-4 border-chart-4/30 bg-chart-4/10">Partial</Badge>;
        case 'Paid': return <Badge variant="outline" className="text-chart-2 border-chart-2/30 bg-chart-2/10">Paid</Badge>;
        case 'Refunded': return <Badge variant="outline" className="text-chart-5 border-chart-5/30 bg-chart-5/10">Refunded</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

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

          {/* Action Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default" size="sm" className="h-9 px-4 rounded-[var(--radius-lg)] shadow-sm">
              <FileText className="w-4 h-4 mr-2" /> All Bookings
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-[var(--radius-lg)]">
              Today&apos;s Check-in
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-[var(--radius-lg)]">
              Today&apos;s Check-out
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-[var(--radius-lg)] ml-auto">
              <Plus className="w-4 h-4 mr-2" /> New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col gap-4 p-4 pb-4 overflow-y-auto">
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <Card className="bg-background border-0 shadow-none rounded-[var(--radius-lg)] flex-shrink-0">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((status) => (
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
          <Card className="bg-background border-0 shadow-none rounded-[var(--radius-lg)] flex-1">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by booking number, name, room..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 h-10 rounded-[var(--radius-lg)] border-border"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Grid */}
        <Card className="flex-1 bg-background border-0 shadow-none rounded-[var(--radius-lg)] min-h-0">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full overflow-y-auto pr-2">
                {paginatedBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="group cursor-pointer bg-card border border-border/50 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all duration-200 flex flex-col h-80 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-border/30 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-primary">#{booking.bookingNumber}</span>
                        <div className="flex gap-1">
                          {getStatusBadge(booking.bookingStatus, 'booking')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{booking.name}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 space-y-3">
                      {/* Room Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Room Type</span>
                          <span className="text-sm font-medium text-foreground">{booking.roomType}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Room No.</span>
                          <span className="text-sm font-medium text-foreground">#{booking.roomNo}</span>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{booking.phone}</span>
                      </div>

                      {/* Dates */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Check-in: {booking.checkIn}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Check-out: {booking.checkOut}</span>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="space-y-2 pt-2 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Paid Amount</span>
                          <span className="text-sm font-medium text-chart-2">{formatCurrency(booking.paidAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Due Amount</span>
                          <span className="text-sm font-medium text-destructive">{formatCurrency(booking.dueAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Payment Status</span>
                          {getStatusBadge(booking.paymentStatus, 'payment')}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-3 border-t border-border/30 bg-muted/10">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <button className="h-7 w-7 rounded-md border border-border/50 bg-background hover:bg-accent transition-colors duration-200 flex items-center justify-center">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button className="h-7 w-7 rounded-md border border-border/50 bg-background hover:bg-accent transition-colors duration-200 flex items-center justify-center">
                            <Edit className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button className="h-7 w-7 rounded-md border border-border/50 bg-background hover:bg-destructive/10 transition-colors duration-200 flex items-center justify-center">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground">
                            {formatCurrency(booking.paidAmount + booking.dueAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Pagination */}
            {pageCount > 1 && (
              <div className="mt-4 pt-4">
                <Pagination>
                  <PaginationContent className="flex justify-center">
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={`${page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-[var(--radius-lg)]`}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                      let pageNum;
                      if (pageCount <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= pageCount - 2) {
                        pageNum = pageCount - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer rounded-[var(--radius-lg)] hover:bg-accent"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(Math.min(pageCount, page + 1))}
                        className={`${page === pageCount ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-[var(--radius-lg)]`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}