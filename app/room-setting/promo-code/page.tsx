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
    Tag,
    Percent,
    Calendar
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

// Interface for promocode data
interface Promocode {
    id: number;
    roomType: string;
    fromDate: string;
    toDate: string;
    discount: number;
    promocode: string;
    status: string;
    createdAt: string;
}

// Interface for room data
interface Room {
    id: number;
    roomType: string;
    rate: number;
    bedCharge: number;
    personCharge: number;
    capacity: number;
    extraCapability: boolean;
    roomSize: string;
    bedNo: number;
    bedTypeId: number;
    roomDescription: string;
    reserveCondition: string;
    createdAt: string;
    bedType: {
        id: number;
        name: string;
    };
}

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "roomType", label: "Room Type" },
    { key: "from", label: "From" },
    { key: "to", label: "To" },
    { key: "discount", label: "Discount" },
    { key: "promocode", label: "Promocode" },
    { key: "status", label: "Status" },
    { key: "action", label: "Action" },
];

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function PromocodeListPage() {
    const [entries, setEntries] = useState(10);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    const [editingPromocode, setEditingPromocode] = useState<Promocode | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Form states for Add Promocode
    const [newRoomType, setNewRoomType] = useState("");
    const [newFromDate, setNewFromDate] = useState("");
    const [newToDate, setNewToDate] = useState("");
    const [newDiscount, setNewDiscount] = useState("");
    const [newPromocode, setNewPromocode] = useState("");
    const [newStatus, setNewStatus] = useState("Active");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use SWR to fetch promocode data
    const { data: promocodes = [], error, isLoading, mutate } = useSWR<Promocode[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/promocode-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Use SWR to fetch room types
    const { data: rooms = [], isLoading: isLoadingRooms } = useSWR<Room[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/room-list`,
        fetcher
    );

    console.log("Promocodes Data:", promocodes);
    console.log("Rooms Data:", rooms);

    // Get unique room types from rooms data
    const roomTypes = useMemo(() => {
        if (!rooms?.length) return [];
        return rooms.map(room => ({
            id: room.id,
            roomType: room.roomType
        }));
    }, [rooms]);

    // Filtering
    const filtered = useMemo(() => {
        if (!promocodes?.length) return [];
        return promocodes.filter(promocode =>
            promocode?.roomType?.toLowerCase()?.includes(search.toLowerCase()) ||
            promocode?.promocode?.toLowerCase()?.includes(search.toLowerCase()) ||
            promocode?.status?.toLowerCase()?.includes(search.toLowerCase())
        );
    }, [search, promocodes]);

    // Sorting
    const sorted = useMemo(() => {
        const sortedPromocodes = [...filtered];
        if (sort.key === "sl") {
            sortedPromocodes.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "roomType") {
            sortedPromocodes.sort((a, b) => {
                return sort.dir === "asc"
                    ? a.roomType.localeCompare(b.roomType)
                    : b.roomType.localeCompare(a.roomType);
            });
        } else if (sort.key === "discount") {
            sortedPromocodes.sort((a, b) => sort.dir === "asc" ? a.discount - b.discount : b.discount - a.discount);
        } else if (sort.key === "promocode") {
            sortedPromocodes.sort((a, b) => {
                return sort.dir === "asc"
                    ? a.promocode.localeCompare(b.promocode)
                    : b.promocode.localeCompare(a.promocode);
            });
        }
        return sortedPromocodes;
    }, [filtered, sort]);

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries);
    const paginated = sorted.slice((page - 1) * entries, page * entries);

    // Export/Print handlers
    const handleExport = (type: "Copy" | "CSV" | "PDF" | "Print") => {
        if (!sorted?.length) {
            toast.warning("No data available to export");
            return;
        }

        const exportData = sorted.map((item, index) => ({
            sl: index + 1,
            roomType: item.roomType || "-",
            from: item.fromDate ? new Date(item.fromDate).toLocaleDateString("en-CA") : "-", // YYYY-MM-DD
            to: item.toDate ? new Date(item.toDate).toLocaleDateString("en-CA") : "-",       // YYYY-MM-DD
            discount: item.discount?.toString() || "0",
            promocode: item.promocode || "-",
            status: item.status || "-",
        }));


        // ---- COPY ----
        if (type === "Copy") {
            const text = exportData
                .map(row =>
                    `${row.sl}\t${row.roomType}\t${row.from}\t${row.to}\t${row.discount}\t${row.promocode}\t${row.status}`
                )
                .join("\n");
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard!");
        }

        // ---- CSV ----
        if (type === "CSV") {
            const headers = ["SL", "Room Type", "From", "To", "Discount", "Promocode", "Status"];
            const rows = exportData.map(row => [
                row.sl,
                row.roomType,
                row.from,
                row.to,
                row.discount,
                row.promocode,
                row.status
            ]);
            const csvContent =
                "data:text/csv;charset=utf-8," +
                [headers, ...rows].map(e => e.join(",")).join("\n");

            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.download = "promocode-list.csv";
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
            doc.text("Promocode List Report", 105, 30, { align: "center" });

            autoTable(doc, {
                startY: 40,
                head: [["SL", "Room Type", "From", "To", "Discount", "Promocode", "Status"]],
                body: exportData.map(row => [
                    row.sl,
                    row.roomType,
                    row.from,
                    row.to,
                    row.discount,
                    row.promocode,
                    row.status
                ]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            doc.save("promocode-list.pdf");
            toast.success("PDF downloaded!");
        }

        // ---- PRINT ----
        if (type === "Print") {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
<html>
  <head>
    <title>Promocode List Report</title>
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
    <h3>Promocode List Report</h3>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Room Type</th>
          <th>From</th>
          <th>To</th>
          <th>Discount</th>
          <th>Promocode</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${exportData
                        .map(row => `
          <tr>
            <td>${row.sl}</td>
            <td>${row.roomType}</td>
            <td>${row.from}</td>
            <td>${row.to}</td>
            <td>${row.discount}</td>
            <td>${row.promocode}</td>
            <td>${row.status}</td>
          </tr>
        `).join('')}
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
        setNewRoomType("");
        setNewFromDate("");
        setNewToDate("");
        setNewDiscount("");
        setNewPromocode("");
        setNewStatus("Active");
    };

    // Add promocode
    const handleAdd = async () => {
        if (!newRoomType.trim()) {
            toast.error("Please select room type");
            return;
        }
        if (!newFromDate.trim()) {
            toast.error("Please select from date");
            return;
        }
        if (!newToDate.trim()) {
            toast.error("Please select to date");
            return;
        }
        if (!newDiscount.trim()) {
            toast.error("Please enter discount");
            return;
        }
        if (!newPromocode.trim()) {
            toast.error("Please enter promocode");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/promocode-list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    roomType: newRoomType,
                    fromDate: newFromDate,
                    toDate: newToDate,
                    discount: parseFloat(newDiscount),
                    promocode: newPromocode,
                    status: newStatus,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to add promocode");
            }

            await mutate();
            resetAddForm();
            setIsAddModalOpen(false);
            toast.success("Promocode added successfully!");
        } catch (error) {
            console.error("Add promocode error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add promocode. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit promocode
    const handleEdit = (promocode: Promocode) => {
        setEditingPromocode({ ...promocode });
        setIsEditModalOpen(true);
    };

    // Save edit
    const handleSaveEdit = async () => {
        if (!editingPromocode?.roomType?.trim()) {
            toast.error("Please provide room type");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/promocode-list`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingPromocode.id,
                    roomType: editingPromocode.roomType,
                    fromDate: editingPromocode.fromDate,
                    toDate: editingPromocode.toDate,
                    discount: editingPromocode.discount,
                    promocode: editingPromocode.promocode,
                    status: editingPromocode.status,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update promocode");
            }

            await mutate();
            setIsEditModalOpen(false);
            setEditingPromocode(null);
            toast.success("Promocode updated successfully!");
        } catch (error) {
            console.error("Update promocode error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update promocode. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete promocode
    const handleDelete = async (id: number, promocodeName: string) => {
        if (!confirm(`Are you sure you want to delete "${promocodeName}" promocode?`)) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/promocode-list`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete promocode");
            }

            await mutate();
            toast.success("Promocode deleted successfully!");
        } catch (error) {
            console.error("Delete promocode error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete promocode. Please try again.");
        }
    };

    // Get status badge color
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800 border-green-200";
            case "expired":
                return "bg-red-100 text-red-800 border-red-200";
            case "inactive":
                return "bg-gray-100 text-gray-800 border-gray-200";
            default:
                return "bg-blue-100 text-blue-800 border-blue-200";
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="space-y-4 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
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
                        <p className="text-sm text-muted-foreground mb-4">Failed to load promocode list</p>
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
                                <BreadcrumbLink href="/room-setting/promocode-list" className="text-sm font-medium">
                                    Promocode List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Tag className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Promocode List</h1>
                                <p className="text-sm text-muted-foreground">Displays a list of promotional codes assigned to specific room types</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <Plus className="w-4 h-4" />
                            New Promocode
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
                                    placeholder="Search promocodes..."
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
                                    ["sl", "roomType", "discount", "promocode", "status"] :
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
                                                <Tag className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {search ? "No promocodes found" : "No promocodes available"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {search
                                                        ? "Try adjusting your search criteria"
                                                        : "Create your first promocode to get started"
                                                    }
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((promocode, idx) => (
                                        <TableRow key={promocode.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("roomType") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="w-4 h-4 text-blue-600" />
                                                        <span className="text-foreground font-medium">{promocode.roomType}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("from") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-green-600" />
                                                        <span className="text-foreground">{formatDate(promocode.fromDate)}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("to") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-red-600" />
                                                        <span className="text-foreground">{formatDate(promocode.toDate)}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("discount") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Percent className="w-4 h-4 text-orange-600" />
                                                        <span className="text-foreground font-medium">{promocode.discount}%</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("promocode") && (
                                                <TableCell className="text-sm py-3">
                                                    <span className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs text-gray-700">
                                                        {promocode.promocode}
                                                    </span>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("status") && (
                                                <TableCell className="text-sm py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(promocode.status)}`}>
                                                        {promocode.status}
                                                    </span>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(promocode)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(promocode.id, promocode.promocode)}
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

            {/* Add Promocode Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            New Promocode
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="roomType" className="text-sm font-medium">
                                Room Type *
                            </Label>
                            <Select
                                value={newRoomType}
                                onValueChange={setNewRoomType}
                                disabled={isSubmitting || isLoadingRooms}
                            >
                                <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                    <SelectValue placeholder={isLoadingRooms ? "Loading room types..." : "Select room type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomTypes.map((room) => (
                                        <SelectItem key={room.id} value={room.roomType}>
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-4 h-4 text-blue-500" />
                                                <span>{room.roomType}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fromDate" className="text-sm font-medium">
                                    From Date *
                                </Label>
                                <Input
                                    id="fromDate"
                                    type="date"
                                    value={newFromDate}
                                    onChange={(e) => setNewFromDate(e.target.value)}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="toDate" className="text-sm font-medium">
                                    To Date *
                                </Label>
                                <Input
                                    id="toDate"
                                    type="date"
                                    value={newToDate}
                                    onChange={(e) => setNewToDate(e.target.value)}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="discount" className="text-sm font-medium">
                                Discount (%) *
                            </Label>
                            <Input
                                id="discount"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={newDiscount}
                                onChange={(e) => setNewDiscount(e.target.value)}
                                placeholder="Enter discount percentage..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="promocode" className="text-sm font-medium">
                                Promocode *
                            </Label>
                            <Input
                                id="promocode"
                                value={newPromocode}
                                onChange={(e) => setNewPromocode(e.target.value)}
                                placeholder="Enter promocode..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium">
                                Status *
                            </Label>
                            <Select
                                value={newStatus}
                                onValueChange={setNewStatus}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
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
                                disabled={!newRoomType.trim() || !newFromDate.trim() || !newToDate.trim() || !newDiscount.trim() || !newPromocode.trim() || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Promocode"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Promocode Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Promocode
                        </DialogTitle>
                    </DialogHeader>
                    {editingPromocode && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editRoomType" className="text-sm font-medium">
                                    Room Type *
                                </Label>
                                <Select
                                    value={editingPromocode.roomType}
                                    onValueChange={(value) => setEditingPromocode({
                                        ...editingPromocode,
                                        roomType: value
                                    })}
                                    disabled={isSubmitting || isLoadingRooms}
                                >
                                    <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomTypes.map((room) => (
                                            <SelectItem key={room.id} value={room.roomType}>
                                                <div className="flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-blue-500" />
                                                    <span>{room.roomType}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="editFromDate" className="text-sm font-medium">
                                        From Date *
                                    </Label>
                                    <Input
                                        id="editFromDate"
                                        type="date"
                                        value={editingPromocode.fromDate.split('T')[0]}
                                        onChange={(e) => setEditingPromocode({
                                            ...editingPromocode,
                                            fromDate: e.target.value
                                        })}
                                        className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="editToDate" className="text-sm font-medium">
                                        To Date *
                                    </Label>
                                    <Input
                                        id="editToDate"
                                        type="date"
                                        value={editingPromocode.toDate.split('T')[0]}
                                        onChange={(e) => setEditingPromocode({
                                            ...editingPromocode,
                                            toDate: e.target.value
                                        })}
                                        className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editDiscount" className="text-sm font-medium">
                                    Discount (%) *
                                </Label>
                                <Input
                                    id="editDiscount"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={editingPromocode.discount}
                                    onChange={(e) => setEditingPromocode({
                                        ...editingPromocode,
                                        discount: parseFloat(e.target.value) || 0
                                    })}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editPromocode" className="text-sm font-medium">
                                    Promocode *
                                </Label>
                                <Input
                                    id="editPromocode"
                                    value={editingPromocode.promocode}
                                    onChange={(e) => setEditingPromocode({
                                        ...editingPromocode,
                                        promocode: e.target.value
                                    })}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editStatus" className="text-sm font-medium">
                                    Status *
                                </Label>
                                <Select
                                    value={editingPromocode.status}
                                    onValueChange={(value) => setEditingPromocode({
                                        ...editingPromocode,
                                        status: value
                                    })}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                        <SelectItem value="Expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingPromocode(null);
                                    }}
                                    className="px-4"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={!editingPromocode.roomType.trim() || isSubmitting}
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