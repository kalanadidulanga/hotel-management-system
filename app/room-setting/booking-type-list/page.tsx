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
    Calendar,
    Users
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

// Interface for booking type data
interface BookingType {
    id: number;
    name: string;
    createdAt: string;
}

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "name", label: "Booking Type" },
    { key: "action", label: "Action" },
];

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function BookingTypeListPage() {
    const [entries, setEntries] = useState(10);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    const [editingBookingType, setEditingBookingType] = useState<BookingType | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Form states
    const [newBookingTypeName, setNewBookingTypeName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use SWR to fetch booking type data
    const { data: bookingTypes = [], error, isLoading, mutate } = useSWR<BookingType[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-type-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    console.log("Booking Types Data:", bookingTypes);

    // Filtering
    const filtered = useMemo(() => {
        if (!bookingTypes?.length) return [];
        return bookingTypes.filter(bookingType =>
            bookingType?.name?.toLowerCase()?.includes(search.toLowerCase())
        );
    }, [search, bookingTypes]);

    // Sorting
    const sorted = useMemo(() => {
        const sortedBookingTypes = [...filtered];
        if (sort.key === "sl") {
            sortedBookingTypes.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "name") {
            sortedBookingTypes.sort((a, b) => {
                return sort.dir === "asc"
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            });
        }
        return sortedBookingTypes;
    }, [filtered, sort]);

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries);
    const paginated = sorted.slice((page - 1) * entries, page * entries);

    // Export/Print handlers
    const handleExport = (type: "Copy" | "CSV" | "PDF" | "Print") => {
        if (!bookingTypes?.length) {
            toast.warning("No data available to export");
            return;
        }

        // Prepare export data
        const exportData = bookingTypes.map((bt, index) => ({
            sl: index + 1,
            name: bt.name || "-",
            createdAt: bt.createdAt || "-"
        }));

        // ---- COPY ----
        if (type === "Copy") {
            const text = exportData
                .map(row => `${row.sl}\t${row.name}\t${row.createdAt}`)
                .join("\n");
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard!");
        }

        // ---- CSV ----
        if (type === "CSV") {
            const headers = ["SL", "Booking Type", "Created At"];
            const rows = exportData.map(row => [row.sl, `"${row.name}"`, `"${row.createdAt}"`]);
            const csvContent =
                "data:text/csv;charset=utf-8," +
                [headers, ...rows].map(e => e.join(",")).join("\n");

            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.download = "booking-types-list.csv";
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
            doc.text("Booking Types Report", 105, 30, { align: "center" });

            autoTable(doc, {
                startY: 40,
                head: [["SL", "Booking Type", "Created At"]],
                body: exportData.map(row => [row.sl, row.name, row.createdAt]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            doc.save("booking-types-list.pdf");
            toast.success("PDF downloaded!");
        }

        // ---- PRINT ----
        if (type === "Print") {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
<html>
  <head>
    <title>Booking Types Report</title>
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
    <h3>Booking Types Report</h3>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Booking Type</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        ${exportData.map(row => `
          <tr>
            <td>${row.sl}</td>
            <td>${row.name}</td>
            <td>${row.createdAt}</td>
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


    // Reset form states
    const resetAddForm = () => {
        setNewBookingTypeName("");
    };

    // Add booking type
    const handleAdd = async () => {
        if (!newBookingTypeName.trim()) {
            toast.error("Please enter booking type name");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-type-list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newBookingTypeName,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to add booking type");
            }

            await mutate();
            resetAddForm();
            setIsAddModalOpen(false);
            toast.success("Booking type added successfully!");
        } catch (error) {
            console.error("Add booking type error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add booking type. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit booking type
    const handleEdit = (bookingType: BookingType) => {
        setEditingBookingType({ ...bookingType });
        setIsEditModalOpen(true);
    };

    // Save edit
    const handleSaveEdit = async () => {
        if (!editingBookingType?.name?.trim()) {
            toast.error("Please provide booking type name");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-type-list`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingBookingType.id,
                    name: editingBookingType.name,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update booking type");
            }

            await mutate();
            setIsEditModalOpen(false);
            setEditingBookingType(null);
            toast.success("Booking type updated successfully!");
        } catch (error) {
            console.error("Update booking type error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update booking type. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete booking type
    const handleDelete = async (id: number, bookingTypeName: string) => {
        if (!confirm(`Are you sure you want to delete "${bookingTypeName}" booking type?`)) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/booking-type-list`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete booking type");
            }

            await mutate();
            toast.success("Booking type deleted successfully!");
        } catch (error) {
            console.error("Delete booking type error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete booking type. Please try again.");
        }
    };

    // Get booking type icon
    const getBookingTypeIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('wedding') || lowerName.includes('party')) return <Users className="w-4 h-4 text-pink-500" />;
        if (lowerName.includes('group') || lowerName.includes('corporate')) return <Users className="w-4 h-4 text-blue-500" />;
        if (lowerName.includes('conference') || lowerName.includes('meeting')) return <Calendar className="w-4 h-4 text-green-500" />;
        return <Calendar className="w-4 h-4 text-muted-foreground" />;
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="space-y-4 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                    <Skeleton className="h-4 w-8" />
                    <div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex space-x-2 ml-auto">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );

    // Error state
    if (error) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">Failed to load booking type list</p>
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
                                <BreadcrumbLink href="/room-setting/booking-type-list" className="text-sm font-medium">
                                    Booking Type List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Booking Type List</h1>
                                <p className="text-sm text-muted-foreground">Manage various types of booking categories in the system</p>
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
                                    placeholder="Search booking types..."
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
                                    ["sl", "name"] :
                                    columns.map(c => c.key);
                                setVisibleCols(next);
                            }}
                            className="h-9 px-4 rounded-lg text-sm shadow-sm bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
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
                                                <Calendar className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {search ? "No booking types found" : "No booking types available"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {search
                                                        ? "Try adjusting your search criteria"
                                                        : "Add your first booking type to get started"
                                                    }
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((bookingType, idx) => (
                                        <TableRow key={bookingType.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("name") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                            {getBookingTypeIcon(bookingType.name)}
                                                        </div>
                                                        <span className="text-foreground font-medium">{bookingType.name}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(bookingType)}
                                                            className="h-8 w-8 p-0 rounded-full border-teal-200 hover:bg-teal-50 hover:border-teal-300 shadow-sm"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Edit className="w-4 h-4 text-teal-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(bookingType.id, bookingType.name)}
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

            {/* Add Booking Type Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Booking Type
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bookingTypeName" className="text-sm font-medium">
                                Booking Type Name *
                            </Label>
                            <Input
                                id="bookingTypeName"
                                value={newBookingTypeName}
                                onChange={(e) => setNewBookingTypeName(e.target.value)}
                                placeholder="Enter booking type name..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    resetAddForm();
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAdd}
                                disabled={!newBookingTypeName.trim() || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Booking Type"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Booking Type Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Booking Type
                        </DialogTitle>
                    </DialogHeader>
                    {editingBookingType && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editBookingTypeName" className="text-sm font-medium">
                                    Booking Type Name *
                                </Label>
                                <Input
                                    id="editBookingTypeName"
                                    value={editingBookingType.name}
                                    onChange={(e) => setEditingBookingType({
                                        ...editingBookingType,
                                        name: e.target.value
                                    })}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingBookingType(null);
                                    }}
                                    className="px-4"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={!editingBookingType.name.trim() || isSubmitting}
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
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}