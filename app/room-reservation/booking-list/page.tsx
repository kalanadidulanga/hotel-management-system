"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Download,
  Plus,
  Loader2,
  X,
  Calendar,
  Clock,
  RotateCcw
} from "lucide-react";
import Link from "next/link";

// Updated interface to match Prisma Reservation schema
interface ReservationBooking {
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
  arrivalFrom?: string;
  bookingType?: string;
  remarks?: string;
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

// API Response interface
interface ApiResponse {
  data: ReservationBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Edit form data interface
interface EditFormData {
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  roomPrice: string;
  total: string;
  advanceAmount: string;
  balanceAmount: string;
  paymentMode: string;
  purposeOfVisit: string;
  arrivalFrom: string;
  billingType: string;
  adults: string;
  children: string;
  remarks: string;
}

// Define booking status type based on dates and business logic
type BookingStatus = "Pending" | "Confirmed" | "Checked In" | "Checked Out" | "Cancelled";
type PaymentStatus = "Pending" | "Success" | "Failed" | "Partial";

// Build URL for API calls
const buildUrl = (search: string, page: number, entries: number, sort: { key: string; dir: "asc" | "desc" }) => {
  const params = new URLSearchParams({
    search,
    page: page.toString(),
    limit: entries.toString(),
    sortBy: sort.key,
    sortDir: sort.dir,
  });
  return `/api/room-reservation/booking-list?${params}`;
};

// Fetcher function for SWR
const fetcher = async (url: string): Promise<ApiResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch reservations');
  }
  return response.json();
};

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
  { key: "bookingStatus", label: "Booking Status" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "action", label: "Action" },
];

const paymentModes = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
];

const billingTypes = [
  { value: "nightly", label: "Nightly" },
  { value: "hourly", label: "Hourly" },
];

const purposeOptions = [
  { value: "leisure", label: "Leisure" },
  { value: "business", label: "Business" },
  { value: "conference", label: "Conference" },
  { value: "wedding", label: "Wedding" },
  { value: "other", label: "Other" },
];

export default function BookingListPage() {
  const [entries, setEntries] = useState(10);
  const [searchInput, setSearchInput] = useState(""); // Input value for search field
  const [searchQuery, setSearchQuery] = useState(""); // Actual search query used for API
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "id", dir: "desc" });
  const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationBooking | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    checkInDate: "",
    checkOutDate: "",
    checkInTime: "",
    checkOutTime: "",
    roomPrice: "",
    total: "",
    advanceAmount: "",
    balanceAmount: "",
    paymentMode: "",
    purposeOfVisit: "",
    arrivalFrom: "",
    billingType: "",
    adults: "",
    children: "",
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset page when search query or entries change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, entries]);

  // SWR hook for fetching reservations data with backend search/pagination
  const {
    data: response,
    error,
    isLoading,
    mutate
  } = useSWR<ApiResponse>(
    buildUrl(searchQuery, page, entries, sort),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      dedupingInterval: 5000,
    }
  );

  const reservations = response?.data || [];
  const pagination = response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
  const totalPages = pagination.totalPages;

  // Helper function to determine booking status
  const getBookingStatus = useCallback((reservation: ReservationBooking): BookingStatus => {
    const now = new Date();
    const checkInDate = new Date(reservation.checkInDate);
    const checkOutDate = new Date(reservation.checkOutDate);

    if (checkOutDate < now) return "Checked Out";
    if (checkInDate <= now && checkOutDate >= now) return "Checked In";
    if (checkInDate > now) return "Confirmed";
    return "Pending";
  }, []);

  // Helper function to determine payment status
  const getPaymentStatus = useCallback((reservation: ReservationBooking): PaymentStatus => {
    const { total, advanceAmount, balanceAmount } = reservation;

    if (advanceAmount >= total) return "Success";
    if (advanceAmount > 0 && balanceAmount > 0) return "Partial";
    if (balanceAmount > 0) return "Pending";
    return "Success";
  }, []);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }, []);

  // Handle search button click
  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  // Handle search input change
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }, []);

  // Handle Enter key press in search input
  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Handle edit button click
  const handleEdit = useCallback((reservation: ReservationBooking) => {
    setEditingReservation(reservation);
    setEditFormData({
      checkInDate: formatDateForInput(reservation.checkInDate),
      checkOutDate: formatDateForInput(reservation.checkOutDate),
      checkInTime: reservation.checkInTime,
      checkOutTime: reservation.checkOutTime,
      roomPrice: String(reservation.roomPrice),
      total: String(reservation.total),
      advanceAmount: String(reservation.advanceAmount),
      balanceAmount: String(reservation.balanceAmount),
      paymentMode: reservation.paymentMode,
      purposeOfVisit: reservation.purposeOfVisit,
      arrivalFrom: reservation.arrivalFrom || "",
      billingType: reservation.billingType,
      adults: String(reservation.adults || 1),
      children: String(reservation.children || 0),
      remarks: reservation.remarks || "",
    });
    setEditModalOpen(true);
  }, [formatDateForInput]);

  // Handle form input changes
  const handleInputChange = useCallback((field: keyof EditFormData, value: string) => {
    setEditFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Auto-calculate balance when total or advance changes
      if (field === 'total' || field === 'advanceAmount') {
        const total = field === 'total' ? Number(value) || 0 : Number(updated.total) || 0;
        const advance = field === 'advanceAmount' ? Number(value) || 0 : Number(updated.advanceAmount) || 0;
        const balance = Math.max(0, total - advance);

        updated.balanceAmount = String(balance);
      }

      return updated;
    });
  }, []);

  // Handle edit form submission
  const handleEditSubmit = useCallback(async () => {
    if (!editingReservation) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        id: editingReservation.id,
        checkInDate: new Date(editFormData.checkInDate).toISOString(),
        checkOutDate: new Date(editFormData.checkOutDate).toISOString(),
        checkInTime: editFormData.checkInTime,
        checkOutTime: editFormData.checkOutTime,
        roomPrice: Number(editFormData.roomPrice),
        total: Number(editFormData.total),
        advanceAmount: Number(editFormData.advanceAmount),
        balanceAmount: Number(editFormData.balanceAmount),
        paymentMode: editFormData.paymentMode,
        purposeOfVisit: editFormData.purposeOfVisit,
        arrivalFrom: editFormData.arrivalFrom || null,
        billingType: editFormData.billingType,
        adults: Number(editFormData.adults) || 1,
        children: Number(editFormData.children) || 0,
        remarks: editFormData.remarks || null,
      };

      const response = await fetch('/api/room-reservation/booking-list', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update reservation');
      }

      // Revalidate data
      await mutate();
      setEditModalOpen(false);
      setEditingReservation(null);

      alert('Reservation updated successfully!');
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Failed to update reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingReservation, editFormData, mutate]);

  // Close edit modal
  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingReservation(null);
    setIsSubmitting(false);
  }, []);

  // Handle entries change
  const handleEntriesChange = useCallback((value: string) => {
    setEntries(Number(value));
    setPage(1);
  }, []);

  // Handle sort change
  const handleSort = useCallback((key: string) => {
    if (key === "action" || isLoading) return;

    setSort(prevSort => ({
      key,
      dir: prevSort.key === key ? (prevSort.dir === "asc" ? "desc" : "asc") : "asc"
    }));
    setPage(1);
  }, [isLoading]);

  // Export/Print handlers
  const handleExport = useCallback((type: string) => {
    alert(`Export as ${type}`);
  }, []);

  // Delete booking with optimistic updates
  const handleDelete = useCallback(async (id: number) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      try {
        const response = await fetch(`/api/room-reservation/booking-list`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete reservation');
        }

        // Revalidate data
        await mutate();
        alert('Reservation deleted successfully!');
      } catch (error) {
        console.error('Error deleting reservation:', error);
        alert('Failed to delete reservation. Please try again.');
      }
    }
  }, [mutate]);

  // Refresh data manually
  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Get status badge configurations
  const getBookingStatusConfig = useCallback((status: BookingStatus) => {
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
  }, []);

  const getPaymentStatusConfig = useCallback((status: PaymentStatus) => {
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
  }, []);

  // Show error state
  if (error && !reservations.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Building className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Failed to load bookings</p>
        <p className="text-sm text-muted-foreground mb-4">Please check your connection and try again</p>
        <Button onClick={handleRefresh} variant="outline">
          Try Again
        </Button>
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
                <BreadcrumbLink href="/room-reservation/booking-list" className="text-sm font-medium">
                  Booking List
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Title & Room Booking Button */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  Booking List
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {pagination.total > 0 ? `${pagination.total} reservations found` : 'Manage all guest room bookings'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-full shadow-md"
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Link href="/room-reservation/room-booking" className="flex-shrink-0">
                <Button className="h-10 px-6 rounded-full shadow-md flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Room Booking
                </Button>
              </Link>
            </div>
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
              <Select value={String(entries)} onValueChange={handleEntriesChange}>
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
                disabled={isLoading}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport("CSV")}
                className="h-9 px-4 rounded-full text-sm shadow-sm"
                disabled={isLoading}
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport("PDF")}
                className="h-9 px-4 rounded-full text-sm shadow-sm"
                disabled={isLoading}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport("Print")}
                className="h-9 px-4 rounded-full text-sm shadow-sm"
                disabled={isLoading}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>

            {/* Search Bar with Button */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-muted-foreground">Search:</span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search reservations..."
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleSearchKeyPress}
                    className="h-9 w-64 text-sm rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm pr-10"
                    disabled={isLoading}
                  />
                  {searchInput && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearSearch}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleSearch}
                  className="h-9 px-4 rounded-lg text-sm shadow-sm"
                  disabled={isLoading}
                >
                  <Search className="w-4 h-4 mr-1" />
                  Search
                </Button>
                {searchQuery && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearSearch}
                    className="h-9 px-3 rounded-lg text-sm shadow-sm"
                    disabled={isLoading}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Active Search Indicator */}
          {searchQuery && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <Search className="w-4 h-4 text-blue-600" />
              <span>Searching for: <span className="font-medium text-blue-700">"{searchQuery}"</span></span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearSearch}
                className="h-6 w-6 p-0 ml-2 hover:bg-blue-100 text-blue-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Column Visibility */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 rounded-lg text-sm shadow-sm"
                  disabled={isLoading}
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
                      onClick={() => handleSort(col.key)}
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
                        Loading reservations...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleCols.length} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Building className="w-12 h-12 text-muted-foreground" />
                        <p className="text-base text-muted-foreground">No bookings found</p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? "Try adjusting your search criteria" : "No reservations available"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations.map((reservation, idx) => {
                    const bookingStatus = getBookingStatus(reservation);
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
                        {visibleCols.includes("bookingStatus") && (
                          <TableCell className="text-sm py-3">
                            <Badge
                              variant={getBookingStatusConfig(bookingStatus).variant}
                              className={getBookingStatusConfig(bookingStatus).className}
                            >
                              {bookingStatus}
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
                                disabled={isLoading}
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(reservation)}
                                className="h-8 w-8 p-0 rounded-full border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300 shadow-sm"
                                disabled={isLoading}
                              >
                                <Edit className="w-4 h-4 text-yellow-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                                disabled={isLoading}
                              >
                                <IdCard className="w-4 h-4 text-gray-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(reservation.id)}
                                className="h-8 w-8 p-0 rounded-full border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm"
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
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
              Showing {pagination.total > 0 ? (page - 1) * entries + 1 : 0} to {Math.min(page * entries, pagination.total)} of {pagination.total} entries
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent className="flex justify-center">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      className={`${page === 1 || isLoading ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full shadow-sm h-9 px-4 text-sm`}
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
                          onClick={() => handlePageChange(pageNum)}
                          isActive={page === pageNum}
                          className={`${isLoading ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full h-9 px-4 text-sm ${page === pageNum ? "shadow-md" : "shadow-sm"}`}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                      className={`${page === totalPages || isLoading ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full shadow-sm h-9 px-4 text-sm`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={handleCloseEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Edit className="w-5 h-5 text-primary" />
              Edit Reservation - {editingReservation?.bookingNumber}
            </DialogTitle>
          </DialogHeader>

          {editingReservation && (
            <div className="space-y-6 py-4">
              {/* Customer Info (Read-only) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {editingReservation.customer.firstName} {editingReservation.customer.lastName || ''}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {editingReservation.customer.phone}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {editingReservation.customer.email}
                  </div>
                  <div>
                    <span className="font-medium">Room:</span> {editingReservation.roomType} - {editingReservation.roomNumber}
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-in Date & Time */}
                <div className="space-y-2">
                  <Label htmlFor="checkInDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Check-in Date
                  </Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    value={editFormData.checkInDate}
                    onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkInTime" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Check-in Time
                  </Label>
                  <Input
                    id="checkInTime"
                    type="time"
                    value={editFormData.checkInTime}
                    onChange={(e) => handleInputChange('checkInTime', e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Check-out Date & Time */}
                <div className="space-y-2">
                  <Label htmlFor="checkOutDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Check-out Date
                  </Label>
                  <Input
                    id="checkOutDate"
                    type="date"
                    value={editFormData.checkOutDate}
                    onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOutTime" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Check-out Time
                  </Label>
                  <Input
                    id="checkOutTime"
                    type="time"
                    value={editFormData.checkOutTime}
                    onChange={(e) => handleInputChange('checkOutTime', e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Guests */}
                <div className="space-y-2">
                  <Label htmlFor="adults">Adults</Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    value={editFormData.adults}
                    onChange={(e) => handleInputChange('adults', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="children">Children</Label>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    value={editFormData.children}
                    onChange={(e) => handleInputChange('children', e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Billing Information */}
                <div className="space-y-2">
                  <Label htmlFor="roomPrice">Room Price (Rs.)</Label>
                  <Input
                    id="roomPrice"
                    type="number"
                    min="0"
                    value={editFormData.roomPrice}
                    onChange={(e) => handleInputChange('roomPrice', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total">Total Amount (Rs.)</Label>
                  <Input
                    id="total"
                    type="number"
                    min="0"
                    value={editFormData.total}
                    onChange={(e) => handleInputChange('total', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advanceAmount">Advance Amount (Rs.)</Label>
                  <Input
                    id="advanceAmount"
                    type="number"
                    min="0"
                    value={editFormData.advanceAmount}
                    onChange={(e) => handleInputChange('advanceAmount', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balanceAmount">Balance Amount (Rs.)</Label>
                  <Input
                    id="balanceAmount"
                    type="number"
                    min="0"
                    value={editFormData.balanceAmount}
                    readOnly
                    className="w-full bg-gray-50"
                  />
                </div>

                {/* Payment & Booking Details */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <Select
                    value={editFormData.paymentMode}
                    onValueChange={(value) => handleInputChange('paymentMode', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModes.map(mode => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingType">Billing Type</Label>
                  <Select
                    value={editFormData.billingType}
                    onValueChange={(value) => handleInputChange('billingType', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select billing type" />
                    </SelectTrigger>
                    <SelectContent>
                      {billingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
                  <Select
                    value={editFormData.purposeOfVisit}
                    onValueChange={(value) => handleInputChange('purposeOfVisit', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {purposeOptions.map(purpose => (
                        <SelectItem key={purpose.value} value={purpose.value}>
                          {purpose.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrivalFrom">Arrival From</Label>
                  <Input
                    id="arrivalFrom"
                    type="text"
                    placeholder="e.g., Delhi, Mumbai"
                    value={editFormData.arrivalFrom}
                    onChange={(e) => handleInputChange('arrivalFrom', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Any additional notes..."
                  value={editFormData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  className="w-full min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Update Reservation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}