"use client";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Home,
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    Copy,
    FileText,
    Printer,
    Settings,
    DollarSign,
    ChevronUp,
    ChevronDown,
    Users,
    Check,
    Receipt,
    MessageSquare,
    Loader2
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import Link from "next/link";

interface Customer {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    balance: number;
    status: "Active" | "Inactive" | "Blocked";
    createdAt: string;
}

interface Booking {
    id: string;
    bookingNumber: string;
    customerName: string;
    amount: number;
    status: "Pending" | "Paid" | "Refunded";
}

interface CustomerResponse {
    customers: Customer[];
    total: number;
    totalPages: number;
}

interface BookingResponse {
    bookings: Booking[];
}

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "balance", label: "Balance" },
    { key: "status", label: "Status" },
    { key: "action", label: "Action" }
];

export default function CustomerListPage() {
    const [entries, setEntries] = useState(10);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Payment modal states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
    const [paymentType, setPaymentType] = useState("refund");
    const [selectedBooking, setSelectedBooking] = useState<string>("");
    const [searchBooking, setSearchBooking] = useState("");
    const [bookingOpen, setBookingOpen] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounce search query
    useEffect(() => {
        console.log("Search query changed:", searchQuery);
        const timer = setTimeout(() => {
            console.log("Setting debounced search:", searchQuery);
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to first page when search changes
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Build API URL with query parameters
    const buildApiUrl = () => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: entries.toString(),
            sortBy: sort.key,
            sortOrder: sort.dir,
        });

        if (debouncedSearch) {
            params.append('search', debouncedSearch);
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const fullUrl = `${baseUrl}/api/customer/customer-list?${params.toString()}`;

        // Debug logging
        console.log("API URL:", fullUrl);
        console.log("Search query:", debouncedSearch);

        return fullUrl;
    };

    // Fetch customers with SWR
    const { data: customerData, error: customerError, isLoading: customersLoading, mutate: mutateCustomers } = useSWR<CustomerResponse>(
        buildApiUrl(),
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Fetch bookings for payment modal
    const { data: bookingData, error: bookingError, isLoading: bookingsLoading } = useSWR<BookingResponse>(
        showPaymentModal ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/bookings` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    const customers = customerData?.customers || [];
    const totalCustomers = customerData?.total || 0;
    const totalPages = customerData?.totalPages || 0;
    const bookings = bookingData?.bookings || [];

    // Filter bookings based on search
    const filteredBookings = bookings.filter(booking =>
        booking.bookingNumber.toLowerCase().includes(searchBooking.toLowerCase()) ||
        booking.customerName.toLowerCase().includes(searchBooking.toLowerCase())
    );

    // Handle payment modal open
    const handlePaymentClick = (customer: Customer) => {
        setSelectedCustomerForPayment(customer);
        setShowPaymentModal(true);
    };

    // Handle payment form submission
    const handlePaymentSubmit = async () => {
        if (!selectedBooking || !paymentType || !selectedCustomerForPayment) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerId: selectedCustomerForPayment.id,
                    bookingId: selectedBooking,
                    paymentType: paymentType,
                    remarks: remarks
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to process payment");
            }

            // Refresh customer data
            await mutateCustomers();

            toast.success("Payment processed successfully!");

            // Reset form
            setSelectedBooking("");
            setPaymentType("refund");
            setRemarks("");
            setShowPaymentModal(false);
            setSelectedCustomerForPayment(null);
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to process payment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Export handlers
    const handleExport = async (type: string) => {
        try {
            const params = new URLSearchParams({
                format: type.toLowerCase(),
                sortBy: sort.key,
                sortOrder: sort.dir,
            });

            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/customers/export?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Handle file download based on type
            if (type === 'CSV' || type === 'PDF') {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `customers.${type.toLowerCase()}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else if (type === 'Copy') {
                const text = await response.text();
                await navigator.clipboard.writeText(text);
                toast.success("Data copied to clipboard!");
            } else if (type === 'Print') {
                const htmlContent = await response.text();
                const printWindow = window.open('', '_blank');
                printWindow?.document.write(htmlContent);
                printWindow?.document.close();
                printWindow?.print();
            }
        } catch (error) {
            toast.error(`Failed to export as ${type}`);
        }
    };

    // Delete customer
    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/customer/customer-list`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id : id
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete customer");
            }

            // Refresh the data
            await mutateCustomers();
            toast.success("Customer deleted successfully!");
        } catch (error) {
            console.error("Delete customer error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete customer. Please try again.");
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return `$${Math.abs(amount).toFixed(2)}`;
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active':
                return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">Active</Badge>;
            case 'Inactive':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">Inactive</Badge>;
            case 'Blocked':
                return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">Blocked</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="space-y-4 p-4">
            {Array.from({ length: entries }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                    <div className="flex space-x-2 ml-auto">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );

    // Error state
    if (customerError) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">Failed to load customers</p>
                        <Button onClick={() => mutateCustomers()} variant="outline">
                            Try Again
                        </Button>
                    </div>
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
                                <BreadcrumbLink href="/customers" className="text-sm font-medium">
                                    Customer List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Customer Management</h1>
                                <p className="text-sm text-muted-foreground">
                                    {totalCustomers > 0 ? `${totalCustomers} customers found` : 'Manage your customers'}
                                </p>
                            </div>
                        </div>
                        <Link href={"/customer/customer-list/create"}>
                            <Button
                                className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                                disabled={customersLoading}
                            >
                                <Plus className="w-4 h-4" />
                                Add New Customer
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
                            <Select
                                value={String(entries)}
                                onValueChange={v => {
                                    setEntries(Number(v));
                                    setPage(1);
                                }}
                                disabled={customersLoading}
                            >
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
                                disabled={customersLoading}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("CSV")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
                                disabled={customersLoading}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                CSV
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("PDF")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
                                disabled={customersLoading}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                PDF
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("Print")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
                                disabled={customersLoading}
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
                                    placeholder="Search customers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-9 w-64 text-sm rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
                                    disabled={customersLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Column Visibility */}
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                const next = visibleCols.length === columns.length ?
                                    ["sl", "firstName", "lastName", "email", "phone", "balance", "action"] :
                                    columns.map(c => c.key);
                                setVisibleCols(next);
                            }}
                            className="h-9 px-4 rounded-lg text-sm shadow-sm"
                            disabled={customersLoading}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Column visibility
                        </Button>
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
                                                if (col.key !== "action" && !customersLoading) {
                                                    setSort(s => ({
                                                        key: col.key,
                                                        dir: s.key === col.key ? (s.dir === "asc" ? "desc" : "asc") : "asc"
                                                    }));
                                                    setPage(1);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.label}
                                                {col.key !== "action" && col.key !== "status" && (
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
                                {customersLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="p-0">
                                            <LoadingSkeleton />
                                        </TableCell>
                                    </TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {searchQuery ? "No customers found" : "No customers available"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {searchQuery
                                                        ? "Try adjusting your search criteria"
                                                        : "Add your first customer to get started"
                                                    }
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((customer, idx) => (
                                        <TableRow key={customer.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("firstName") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {customer.firstName}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("lastName") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {customer.lastName}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("email") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {customer.email}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("phone") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {customer.phone}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("balance") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-1">
                                                        <span className={`font-medium ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {customer.balance >= 0 ? '+' : '-'}{formatCurrency(customer.balance)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("status") && (
                                                <TableCell className="py-3">
                                                    {getStatusBadge(customer.status)}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/customer/customer-list/update/${customer.id}`}>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 rounded-full border-green-200 hover:bg-green-50 hover:border-green-300 shadow-sm"
                                                                disabled={customersLoading}
                                                            >
                                                                <Edit className="w-4 h-4 text-green-600" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handlePaymentClick(customer)}
                                                            className="h-8 w-8 p-0 rounded-full border-teal-200 hover:bg-teal-50 hover:border-teal-300 shadow-sm"
                                                            disabled={customersLoading}
                                                        >
                                                            <DollarSign className="w-4 h-4 text-teal-600" />
                                                        </Button>
                                                        <Link href={`/customer/options/${customer.id}`}>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                                disabled={customersLoading}
                                                            >
                                                                <Settings className="w-4 h-4 text-blue-600" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/customer/customer_info/${customer.id}`}>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                                disabled={customersLoading}
                                                            >
                                                                <Eye className="w-4 h-4 text-blue-600" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(customer.id, `${customer.firstName} ${customer.lastName}`)}
                                                            className="h-8 w-8 p-0 rounded-full border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm"
                                                            disabled={customersLoading}
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
                            {customersLoading ? (
                                "Loading..."
                            ) : (
                                `Showing ${(page - 1) * entries + 1} to ${Math.min(page * entries, totalCustomers)} of ${totalCustomers} entries`
                            )}
                        </div>

                        {totalPages > 1 && !customersLoading && (
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

            {/* Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Payment Form
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Customer Info */}
                        {selectedCustomerForPayment && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-900">
                                    Customer: {selectedCustomerForPayment.firstName} {selectedCustomerForPayment.lastName}
                                </p>
                                <p className="text-sm text-blue-700">
                                    Email: {selectedCustomerForPayment.email}
                                </p>
                                <p className="text-sm text-blue-700">
                                    Balance: ${selectedCustomerForPayment.balance.toFixed(2)}
                                </p>
                            </div>
                        )}

                        {/* Payment Type */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentType" className="text-sm font-medium">
                                Payment Type
                            </Label>
                            <Select
                                value={paymentType || ""}
                                onValueChange={setPaymentType}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="refund">Refund</SelectItem>
                                    <SelectItem value="payment">Payment</SelectItem>
                                    <SelectItem value="partial">Partial Payment</SelectItem>
                                    <SelectItem value="adjustment">Adjustment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Booking Number */}
                        <div className="space-y-2">
                            <Label htmlFor="bookingNumber" className="text-sm font-medium">
                                Booking Number
                            </Label>
                            <Popover open={bookingOpen} onOpenChange={setBookingOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={bookingOpen}
                                        className="w-full justify-between"
                                        disabled={isSubmitting || bookingsLoading}
                                    >
                                        {selectedBooking
                                            ? (() => {
                                                const booking = bookings.find(b => b.id === selectedBooking);
                                                return booking ? `${booking.bookingNumber} - ${booking.customerName}` : "Select Booking Number";
                                            })()
                                            : "Select Booking Number"}
                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search booking number..."
                                            value={searchBooking || ""}
                                            onValueChange={setSearchBooking}
                                        />
                                        <CommandEmpty>
                                            {bookingsLoading ? "Loading bookings..." : "No booking found."}
                                        </CommandEmpty>
                                        <CommandList>
                                            <CommandGroup>
                                                {filteredBookings.map((booking) => (
                                                    <CommandItem
                                                        key={booking.id}
                                                        value={`${booking.bookingNumber} ${booking.customerName}`}
                                                        onSelect={() => {
                                                            setSelectedBooking(booking.id);
                                                            setBookingOpen(false);
                                                            setSearchBooking("");
                                                        }}
                                                    >
                                                        <Check
                                                            className={`mr-2 h-4 w-4 ${selectedBooking === booking.id ? "opacity-100" : "opacity-0"
                                                                }`}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{booking.bookingNumber}</span>
                                                            <span className="text-sm text-muted-foreground">{booking.customerName}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Remarks */}
                        <div className="space-y-2">
                            <Label htmlFor="remarks" className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Remarks
                            </Label>
                            <Textarea
                                id="remarks"
                                placeholder="Enter any additional remarks or notes..."
                                value={remarks || ""}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="min-h-[80px] rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent resize-none"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Selected Booking Details */}
                        {selectedBooking && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                {(() => {
                                    const booking = bookings.find(b => b.id === selectedBooking);
                                    return booking ? (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Booking: {booking.bookingNumber}</p>
                                            <p className="text-sm text-muted-foreground">Customer: {booking.customerName}</p>
                                            <p className="text-sm text-muted-foreground">Amount: ${booking.amount.toFixed(2)}</p>
                                            <p className="text-sm text-muted-foreground">Status: {booking.status}</p>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setSelectedCustomerForPayment(null);
                                    setSelectedBooking("");
                                    setPaymentType("refund");
                                    setRemarks("");
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePaymentSubmit}
                                disabled={!selectedBooking || !paymentType || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Process Payment"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}