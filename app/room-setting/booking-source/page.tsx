"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
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
    ChevronUp,
    ChevronDown,
    Users,
    DollarSign,
    Globe,
    Phone,
    Building
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

interface BookingType {
    id: number;
    name: string;
}

interface BookingSource {
    id: number;
    bookingType: BookingType;
    bookingTypeId: number;
    bookingSource: string;
    commissionRate: number;
    totalBalance: number;
    paidAmount: number;
    dueAmount: number;
}

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "bookingType", label: "Booking Type" },
    { key: "bookingSource", label: "Booking Source" },
    { key: "commissionRate", label: "Commission Rate" },
    { key: "totalBalance", label: "Total Balance" },
    { key: "paidAmount", label: "Paid Amount" },
    { key: "dueAmount", label: "Due Amount" },
    { key: "action", label: "Action" },
];

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function BookingSourcePage() {
    const [entries, setEntries] = useState(10);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    const [editingSource, setEditingSource] = useState<BookingSource | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [payingSource, setPayingSource] = useState<BookingSource | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        bookingTypeId: "",
        bookingSource: "",
        commissionRate: ""
    });

    // Use SWR to fetch booking types
    const { data: bookingTypes = [], error: bookingTypesError, isLoading: bookingTypesLoading } = useSWR<BookingType[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-type-list`,
        fetcher,
        
        
    );

    // Use SWR to fetch booking sources
    const { data: bookingSources = [], error, isLoading, mutate } = useSWR<BookingSource[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-source`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    console.log("Booking Types:", bookingTypes);
    console.log("Booking Sources:", bookingSources);

    // Filtering with null safety
    const filtered = useMemo(() => {
        if (!bookingSources?.length) return [];
        return bookingSources.filter(source =>
            source?.bookingType?.name?.toLowerCase()?.includes(search.toLowerCase()) ||
            source?.bookingSource?.toLowerCase()?.includes(search.toLowerCase())
        );
    }, [search, bookingSources]);

    // Sorting
    const sorted = useMemo(() => {
        const sortedSources = [...filtered];
        if (sort.key === "sl") {
            sortedSources.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "bookingType") {
            sortedSources.sort((a, b) => {
                return sort.dir === "asc"
                    ? a.bookingType.name.localeCompare(b.bookingType.name)
                    : b.bookingType.name.localeCompare(a.bookingType.name);
            });
        } else if (sort.key === "bookingSource") {
            sortedSources.sort((a, b) => {
                return sort.dir === "asc"
                    ? a.bookingSource.localeCompare(b.bookingSource)
                    : b.bookingSource.localeCompare(a.bookingSource);
            });
        } else if (sort.key === "commissionRate") {
            sortedSources.sort((a, b) => sort.dir === "asc" ? a.commissionRate - b.commissionRate : b.commissionRate - a.commissionRate);
        }
        return sortedSources;
    }, [filtered, sort]);

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries);
    const paginated = sorted.slice((page - 1) * entries, page * entries);

    // Export/Print handlers

    const handleExport = (type: "Copy" | "CSV" | "PDF" | "Print") => {
        if (!bookingSources?.length) {
            toast.warning("No data available to export");
            return;
        }

        // Prepare export data
        const exportData = bookingSources.map((source, index) => ({
            sl: index + 1,
            bookingType: source.bookingType?.name || "-",
            bookingSource: source.bookingSource || "-",
            commissionRate: source.commissionRate ?? 0,
            totalBalance: source.totalBalance ?? 0,
            paidAmount: source.paidAmount ?? 0,
            dueAmount: source.dueAmount ?? 0,
        }));

        // ---- COPY ----
        if (type === "Copy") {
            const text = exportData
                .map(row =>
                    `${row.sl}\t${row.bookingType}\t${row.bookingSource}\t${row.commissionRate}\t${row.totalBalance}\t${row.paidAmount}\t${row.dueAmount}`
                )
                .join("\n");
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard!");
        }

        // ---- CSV ----
        if (type === "CSV") {
            const headers = ["SL", "Booking Type", "Booking Source", "Commission Rate", "Total Balance", "Paid Amount", "Due Amount"];
            const rows = exportData.map(row => [
                row.sl,
                `"${row.bookingType}"`,
                `"${row.bookingSource}"`,
                row.commissionRate,
                row.totalBalance,
                row.paidAmount,
                row.dueAmount
            ]);

            const csvContent =
                "data:text/csv;charset=utf-8," +
                [headers, ...rows].map(e => e.join(",")).join("\n");

            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.download = "booking-sources-list.csv";
            link.click();
            toast.success("CSV downloaded!");
        }

        // ---- PDF ----
        if (type === "PDF") {
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("🏨 Grand Ocean View Hotel", 105, 20, { align: "center" });

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text("Booking Sources Report", 105, 30, { align: "center" });

            autoTable(doc, {
                startY: 40,
                head: [["SL", "Booking Type", "Booking Source", "Commission Rate", "Total Balance", "Paid Amount", "Due Amount"]],
                body: exportData.map(row => [
                    row.sl,
                    row.bookingType,
                    row.bookingSource,
                    row.commissionRate,
                    row.totalBalance,
                    row.paidAmount,
                    row.dueAmount
                ]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            doc.save("booking-sources-list.pdf");
            toast.success("PDF downloaded!");
        }

        // ---- PRINT ----
        if (type === "Print") {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
<html>
  <head>
    <title>Booking Sources Report</title>
    <style>
      body { font-family: Arial, sans-serif; text-align: center; margin: 40px; }
      h1 { font-size: 24px; margin-bottom: 0; color: #2c3e50; }
      h3 { font-size: 16px; margin-top: 5px; margin-bottom: 20px; color: #7f8c8d; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #333; padding: 8px; font-size: 12px; }
      th { background: #2980b9; color: white; }
      tr:nth-child(even) { background: #f2f2f2; }
    </style>
  </head>
  <body>
    <h1>Grand Ocean View Hotel</h1>
    <h3>Booking Sources Report</h3>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Booking Type</th>
          <th>Booking Source</th>
          <th>Commission Rate</th>
          <th>Total Balance</th>
          <th>Paid Amount</th>
          <th>Due Amount</th>
        </tr>
      </thead>
      <tbody>
        ${exportData.map(row => `
          <tr>
            <td>${row.sl}</td>
            <td>${row.bookingType}</td>
            <td>${row.bookingSource}</td>
            <td>${row.commissionRate}</td>
            <td>${row.totalBalance}</td>
            <td>${row.paidAmount}</td>
            <td>${row.dueAmount}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  </body>
</html>
            `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    // Add booking source
    const handleAddSource = async () => {
        if (!formData.bookingTypeId.trim() || !formData.bookingSource.trim() || !formData.commissionRate.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-source`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bookingTypeId: parseInt(formData.bookingTypeId),
                    bookingSource: formData.bookingSource,
                    commissionRate: parseFloat(formData.commissionRate),
                    totalBalance: 0,
                    paidAmount: 0,
                    dueAmount: 0
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to add booking source");
            }

            // Refresh the data
            await mutate();
            setFormData({ bookingTypeId: "", bookingSource: "", commissionRate: "" });
            setIsAddModalOpen(false);
            toast.success("Booking source added successfully!");
        } catch (error) {
            console.error("Add booking source error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add booking source. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit booking source
    const handleEdit = (source: BookingSource) => {
        setEditingSource({ ...source });
        setFormData({
            bookingTypeId: source.bookingTypeId.toString(),
            bookingSource: source.bookingSource,
            commissionRate: source.commissionRate.toString()
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!formData.bookingTypeId.trim() || !formData.bookingSource.trim() || !formData.commissionRate.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-source`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingSource?.id,
                    bookingTypeId: parseInt(formData.bookingTypeId),
                    bookingSource: formData.bookingSource,
                    commissionRate: parseFloat(formData.commissionRate),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update booking source");
            }

            // Refresh the data
            await mutate();
            setIsEditModalOpen(false);
            setEditingSource(null);
            setFormData({ bookingTypeId: "", bookingSource: "", commissionRate: "" });
            toast.success("Booking source updated successfully!");
        } catch (error) {
            console.error("Update booking source error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update booking source. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle payment
    const handlePay = (source: BookingSource) => {
        setPayingSource(source);
        setPaymentAmount("");
        setIsPayModalOpen(true);
    };

    const handleMakePayment = async () => {
        if (!paymentAmount.trim() || isNaN(Number(paymentAmount))) {
            toast.error("Please enter a valid payment amount");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-source/payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: payingSource?.id,
                    paymentAmount: Number(paymentAmount)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to process payment");
            }

            // Refresh the data
            await mutate();
            setIsPayModalOpen(false);
            setPayingSource(null);
            setPaymentAmount("");
            toast.success("Payment processed successfully!");
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to process payment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete booking source
    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-source`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete booking source");
            }

            // Refresh the data
            await mutate();
            toast.success("Booking source deleted successfully!");
        } catch (error) {
            console.error("Delete booking source error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete booking source. Please try again.");
        }
    };

    // Get source icon
    const getSourceIcon = (source: string) => {
        const lowerSource = source.toLowerCase();
        if (lowerSource.includes('online') || lowerSource.includes('web')) return <Globe className="w-4 h-4 text-primary" />;
        if (lowerSource.includes('phone') || lowerSource.includes('call')) return <Phone className="w-4 h-4 text-chart-2" />;
        if (lowerSource.includes('agent') || lowerSource.includes('travel')) return <Building className="w-4 h-4 text-chart-3" />;
        return <Users className="w-4 h-4 text-chart-4" />;
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="space-y-4 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <div className="flex space-x-2 ml-auto">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );

    // Error state
    if (error || bookingTypesError) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">Failed to load booking sources</p>
                        <Button onClick={() => mutate()} variant="outline">
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
                                <BreadcrumbLink href="/room-setting" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Room Setting
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-setting/booking-source" className="text-sm font-medium">
                                    Booking Source
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Booking Source</h1>
                                <p className="text-sm text-muted-foreground">Manage booking sources and commission rates</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <Plus className="w-4 h-4" />
                            Add New
                        </Button>
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

                        {/* Search Bar */}
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm font-medium text-muted-foreground">Search:</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search booking sources..."
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
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                const next = visibleCols.length === columns.length ?
                                    ["sl", "bookingType", "bookingSource", "action"] :
                                    columns.map(c => c.key);
                                setVisibleCols(next);
                            }}
                            className="h-9 px-4 rounded-lg text-sm shadow-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            disabled={isLoading}
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
                                                if (col.key !== "action" && !isLoading) {
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
                                        <TableCell colSpan={visibleCols.length} className="p-0">
                                            <LoadingSkeleton />
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {search ? "No booking sources found" : "No booking sources available"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {search
                                                        ? "Try adjusting your search criteria"
                                                        : "Add your first booking source to get started"
                                                    }
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((source, idx) => (
                                        <TableRow key={source.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("bookingType") && (
                                                <TableCell className="text-sm py-3">
                                                    <span className="text-foreground font-medium">{source.bookingType.name}</span>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("bookingSource") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                            {getSourceIcon(source.bookingSource)}
                                                        </div>
                                                        <span className="text-foreground font-medium">{source.bookingSource}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("commissionRate") && (
                                                <TableCell className="text-sm py-3">
                                                    <span className="text-foreground font-medium">{source.commissionRate}%</span>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("totalBalance") && (
                                                <TableCell className="text-sm py-3">
                                                    <span className="text-foreground font-medium">Rs.{source.totalBalance.toLocaleString()}</span>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("paidAmount") && (
                                                <TableCell className="text-sm py-3">
                                                    <span className="text-foreground font-medium">Rs.{source.paidAmount.toLocaleString()}</span>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("dueAmount") && (
                                                <TableCell className="text-sm py-3">
                                                    <span className="text-foreground font-medium">Rs.{source.dueAmount.toLocaleString()}</span>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(source)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(source.id, source.bookingSource)}
                                                            className="h-8 w-8 p-0 rounded-full border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm"
                                                            disabled={isSubmitting}
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
                            Showing {Math.min((page - 1) * entries + 1, sorted.length)} to {Math.min(page * entries, sorted.length)} of {sorted.length} entries
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

            {/* Add Booking Source Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Booking Source
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bookingType" className="text-sm font-medium">
                                Booking Type
                            </Label>
                            <Select value={formData.bookingTypeId} onValueChange={(value) => setFormData({ ...formData, bookingTypeId: value })}>
                                <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                    <SelectValue placeholder="Select booking type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {bookingTypes.length === 0 || bookingTypes.every((type) => bookingSources.some((source) => source.bookingTypeId === type.id)) ? (
                                        <div className="text-sm text-muted-foreground p-2">No available booking types</div>
                                    ) : (
                                        bookingTypes
                                            .filter((type) => !bookingSources.some((source) => source.bookingTypeId === type.id))
                                            .map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bookingSource" className="text-sm font-medium">
                                Booking Source
                            </Label>
                            <Input
                                id="bookingSource"
                                value={formData.bookingSource}
                                onChange={(e) => setFormData({ ...formData, bookingSource: e.target.value })}
                                placeholder="Enter booking source..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="commissionRate" className="text-sm font-medium">
                                Commission Rate (%)
                            </Label>
                            <Input
                                id="commissionRate"
                                type="number"
                                value={formData.commissionRate}
                                onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                                placeholder="Enter commission rate..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setFormData({ bookingTypeId: "", bookingSource: "", commissionRate: "" });
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddSource}
                                disabled={!formData.bookingTypeId.trim() || !formData.bookingSource.trim() || !formData.commissionRate.trim() || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Source"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Booking Source Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Booking Source
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="editBookingType" className="text-sm font-medium">
                                Booking Type
                            </Label>
                            <Select value={formData.bookingTypeId} onValueChange={(value) => setFormData({ ...formData, bookingTypeId: value })}>
                                <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                    <SelectValue placeholder="Select booking type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {bookingTypes
                                        .filter(
                                            (type) =>
                                                !bookingSources.some(
                                                    (source) =>
                                                        source.bookingTypeId === type.id &&
                                                        type.id.toString() !== formData.bookingTypeId // always allow current value
                                                ) || type.id.toString() === formData.bookingTypeId
                                        )
                                        .map((type) => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editBookingSource" className="text-sm font-medium">
                                Booking Source
                            </Label>
                            <Input
                                id="editBookingSource"
                                value={formData.bookingSource}
                                onChange={(e) => setFormData({ ...formData, bookingSource: e.target.value })}
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editCommissionRate" className="text-sm font-medium">
                                Commission Rate (%)
                            </Label>
                            <Input
                                id="editCommissionRate"
                                type="number"
                                value={formData.commissionRate}
                                onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setFormData({ bookingTypeId: "", bookingSource: "", commissionRate: "" });
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                disabled={!formData.bookingTypeId.trim() || !formData.bookingSource.trim() || !formData.commissionRate.trim() || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Make Payment
                        </DialogTitle>
                    </DialogHeader>
                    {payingSource && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Booking Source</p>
                                <p className="font-medium">{payingSource.bookingSource}</p>
                                <p className="text-sm text-muted-foreground mt-2">Due Amount</p>
                                <p className="font-medium text-red-600">Rs.{payingSource.dueAmount.toLocaleString()}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentAmount" className="text-sm font-medium">
                                    Payment Amount
                                </Label>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Enter payment amount..."
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsPayModalOpen(false);
                                        setPayingSource(null);
                                        setPaymentAmount("");
                                    }}
                                    className="px-4"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleMakePayment}
                                    disabled={!paymentAmount.trim() || isSubmitting}
                                    className="px-4"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Make Payment"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}