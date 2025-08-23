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
    Building,
    Bed,
    Users
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import { id } from "date-fns/locale";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

interface RoomSize {
    id: number;
    name: string;
}

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "roomSize", label: "Room Size" },
    { key: "action", label: "Action" },
];

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function RoomSizeListPage() {
    const [entries, setEntries] = useState(10);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    const [editingRoomSize, setEditingRoomSize] = useState<RoomSize | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newRoomSizeName, setNewRoomSizeName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use SWR to fetch data
    const { data: roomSizes = [], error, isLoading, mutate } = useSWR<RoomSize[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-facilities/room-size-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    console.log("Room Sizes:", roomSizes);

    // Filtering with null safety
    const filtered = useMemo(() => {
        if (!roomSizes?.length) return [];
        return roomSizes.filter(roomSize =>
            roomSize?.name?.toLowerCase()?.includes(search.toLowerCase())
        );
    }, [search, roomSizes]);

    // Sorting
    const sorted = useMemo(() => {
        const sortedRoomSizes = [...filtered];
        if (sort.key === "sl") {
            sortedRoomSizes.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "roomSize") {
            sortedRoomSizes.sort((a, b) => {
                return sort.dir === "asc"
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            });
        }
        return sortedRoomSizes;
    }, [filtered, sort]);

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries);
    const paginated = sorted.slice((page - 1) * entries, page * entries);

    // Export/Print handlers
    const handleExport = (type: "Copy" | "CSV" | "PDF" | "Print") => {
        if (!roomSizes?.length) {
            toast.warning("No data available to export");
            return;
        }

        // Prepare export data
        const exportData = roomSizes.map((room, index) => ({
            sl: index + 1,
            roomSize: room.name || "-",
        }));

        // ---- COPY ----
        if (type === "Copy") {
            const text = exportData
                .map(row => `${row.sl}\t${row.roomSize}`)
                .join("\n");
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard!");
        }

        // ---- CSV ----
        if (type === "CSV") {
            const headers = ["SL", "Room Size"];
            const rows = exportData.map(row => [row.sl, `"${row.roomSize}"`]);
            const csvContent =
                "data:text/csv;charset=utf-8," +
                [headers, ...rows].map(e => e.join(",")).join("\n");

            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.download = "room-sizes.csv";
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
            doc.text("Room Sizes Report", 105, 30, { align: "center" });

            autoTable(doc, {
                startY: 40,
                head: [["SL", "Room Size"]],
                body: exportData.map(row => [row.sl, row.roomSize]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            doc.save("room-sizes.pdf");
            toast.success("PDF downloaded!");
        }

        // ---- PRINT ----
        if (type === "Print") {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
<html>
  <head>
    <title>Room Sizes Report</title>
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
    <h3>Room Sizes Report</h3>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Room Size</th>
        </tr>
      </thead>
      <tbody>
        ${exportData.map(row => `
          <tr>
            <td>${row.sl}</td>
            <td>${row.roomSize}</td>
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


    // Add room size
    const handleAddRoomSize = async () => {
        if (!newRoomSizeName.trim()) {
            toast.error("Please enter a room size name");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-facilities/room-size-list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    room_size: newRoomSizeName,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to add room size");
            }

            // Refresh the data
            await mutate();
            setNewRoomSizeName("");
            setIsAddModalOpen(false);
            toast.success("Room size added successfully!");
        } catch (error) {
            console.error("Add room size error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add room size. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit room size
    const handleEdit = (roomSize: RoomSize) => {
        setEditingRoomSize({ ...roomSize });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingRoomSize?.name.trim()) {
            toast.error("Please enter a room size name");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-facilities/room-size-list`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingRoomSize.id,
                    room_size: editingRoomSize.name,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update room size");
            }

            // Refresh the data
            await mutate();
            setIsEditModalOpen(false);
            setEditingRoomSize(null);
            toast.success("Room size updated successfully!");
        } catch (error) {
            console.error("Update room size error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update room size. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete room size
    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-facilities/room-size-list`, {
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
                throw new Error(errorData.message || "Failed to delete room size");
            }

            // Refresh the data
            await mutate();
            toast.success("Room size deleted successfully!");
        } catch (error) {
            console.error("Delete room size error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete room size. Please try again.");
        }
    };

    // Get room size icon
    const getRoomSizeIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('suite')) return <Home className="w-4 h-4 text-primary" />;
        if (lowerName.includes('king') || lowerName.includes('queen')) return <Bed className="w-4 h-4 text-chart-2" />;
        if (lowerName.includes('triple') || lowerName.includes('quad')) return <Users className="w-4 h-4 text-chart-4" />;
        if (lowerName.includes('double') || lowerName.includes('twin')) return <Bed className="w-4 h-4 text-chart-3" />;
        return <Settings className="w-4 h-4 text-muted-foreground" />;
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
                        <p className="text-sm text-muted-foreground mb-4">Failed to load room sizes</p>
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
                                <BreadcrumbLink href="/room-facilities" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Room Facilities
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-facilities/room-size-list" className="text-sm font-medium">
                                    Room Size List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Building className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Room Size List</h1>
                                <p className="text-sm text-muted-foreground">Manage room size categories and types</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <Plus className="w-4 h-4" />
                            Add Room Size
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
                                onClick={() => handleExport("Copy"    )}
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
                                    placeholder="Search room sizes..."
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
                                    ["sl", "roomSize"] :
                                    columns.map(c => c.key);
                                setVisibleCols(next);
                            }}
                            className="h-9 px-4 rounded-lg text-sm shadow-sm"
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
                                                <Settings className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {search ? "No room sizes found" : "No room sizes available"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {search
                                                        ? "Try adjusting your search criteria"
                                                        : "Add your first room size to get started"
                                                    }
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((roomSize, idx) => (
                                        <TableRow key={roomSize.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("roomSize") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                            {getRoomSizeIcon(roomSize.name)}
                                                        </div>
                                                        <span className="text-foreground font-medium">{roomSize.name}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(roomSize)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(roomSize.id, roomSize.name)}
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

            {/* Add Room Size Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Room Size
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="roomSizeName" className="text-sm font-medium">
                                Room Size Name
                            </Label>
                            <Input
                                id="roomSizeName"
                                value={newRoomSizeName}
                                onChange={(e) => setNewRoomSizeName(e.target.value)}
                                placeholder="Enter room size name..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newRoomSizeName.trim()) {
                                        handleAddRoomSize();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setNewRoomSizeName("");
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddRoomSize}
                                disabled={!newRoomSizeName.trim() || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Room Size"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Room Size Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Room Size
                        </DialogTitle>
                    </DialogHeader>
                    {editingRoomSize && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editRoomSizeName" className="text-sm font-medium">
                                    Room Size Name
                                </Label>
                                <Input
                                    id="editRoomSizeName"
                                    value={editingRoomSize.name}
                                    onChange={(e) => setEditingRoomSize({ ...editingRoomSize, name: e.target.value })}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && editingRoomSize.name.trim()) {
                                            handleSaveEdit();
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={!editingRoomSize.name.trim() || isSubmitting}
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