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
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

interface BedType {
    id: number;
    name: string;
}

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "bedName", label: "Bed Name" },
    { key: "action", label: "Action" },
];

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function BedListPage() {
    const [entries, setEntries] = useState(10);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    const [editingBed, setEditingBed] = useState<BedType | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newBedName, setNewBedName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use SWR to fetch data
    const { data: beds = [], error, isLoading, mutate } = useSWR<BedType[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/bed-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    console.log("Beds:", beds);

    // Filtering with null safety
    const filtered = useMemo(() => {
        if (!beds?.length) return [];
        return beds.filter(bed =>
            bed?.name?.toLowerCase()?.includes(search.toLowerCase())
        );
    }, [search, beds]);

    // Sorting
    const sorted = useMemo(() => {
        const sortedBeds = [...filtered];
        if (sort.key === "sl") {
            sortedBeds.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "bedName") {
            sortedBeds.sort((a, b) => {
                return sort.dir === "asc"
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            });
        }
        return sortedBeds;
    }, [filtered, sort]);

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries);
    const paginated = sorted.slice((page - 1) * entries, page * entries);

    // Export/Print handlers

    const handleExport = (type: "Copy" | "CSV" | "PDF" | "Print") => {
        if (!beds?.length) {
            toast.warning("No data available to export");
            return;
        }

        // Prepare export data
        const exportData = beds.map((bed, index) => ({
            sl: index + 1,
            bedName: bed.name || "-",
        }));

        // ---- COPY ----
        if (type === "Copy") {
            const text = exportData
                .map(row => `${row.sl}\t${row.bedName}`)
                .join("\n");
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard!");
        }

        // ---- CSV ----
        if (type === "CSV") {
            const headers = ["SL", "Bed Name"];
            const rows = exportData.map(row => [row.sl, `"${row.bedName}"`]);
            const csvContent =
                "data:text/csv;charset=utf-8," +
                [headers, ...rows].map(e => e.join(",")).join("\n");

            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.download = "beds-list.csv";
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
            doc.text("Beds List Report", 105, 30, { align: "center" });

            autoTable(doc, {
                startY: 40,
                head: [["SL", "Bed Name"]],
                body: exportData.map(row => [row.sl, row.bedName]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            doc.save("beds-list.pdf");
            toast.success("PDF downloaded!");
        }

        // ---- PRINT ----
        if (type === "Print") {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
<html>
  <head>
    <title>Beds List Report</title>
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
    <h3>Beds List Report</h3>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Bed Name</th>
        </tr>
      </thead>
      <tbody>
        ${exportData.map(row => `
          <tr>
            <td>${row.sl}</td>
            <td>${row.bedName}</td>
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


    // Add bed
    const handleAddBed = async () => {
        if (!newBedName.trim()) {
            toast.error("Please enter a bed name");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/bed-list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newBedName,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to add bed");
            }

            // Refresh the data
            await mutate();
            setNewBedName("");
            setIsAddModalOpen(false);
            toast.success("Bed added successfully!");
        } catch (error) {
            console.error("Add bed error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add bed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit bed
    const handleEdit = (bed: BedType) => {
        setEditingBed({ ...bed });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingBed?.name.trim()) {
            toast.error("Please enter a bed name");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/bed-list`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingBed.id,
                    name: editingBed.name,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update bed");
            }

            // Refresh the data
            await mutate();
            setIsEditModalOpen(false);
            setEditingBed(null);
            toast.success("Bed updated successfully!");
        } catch (error) {
            console.error("Update bed error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update bed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete bed
    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/bed-list`, {
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
                throw new Error(errorData.message || "Failed to delete bed");
            }

            // Refresh the data
            await mutate();
            toast.success("Bed deleted successfully!");
        } catch (error) {
            console.error("Delete bed error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete bed. Please try again.");
        }
    };

    // Get bed icon
    const getBedIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('king')) return <Bed className="w-4 h-4 text-primary" />;
        if (lowerName.includes('queen')) return <Bed className="w-4 h-4 text-chart-2" />;
        if (lowerName.includes('double') || lowerName.includes('twin')) return <Bed className="w-4 h-4 text-chart-3" />;
        if (lowerName.includes('single')) return <Bed className="w-4 h-4 text-chart-4" />;
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
                        <p className="text-sm text-muted-foreground mb-4">Failed to load beds</p>
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
                                <BreadcrumbLink href="/room-configuration" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Room Configuration
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-configuration/bed-list" className="text-sm font-medium">
                                    Bed List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Bed className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Bed List</h1>
                                <p className="text-sm text-muted-foreground">Manage bed types and configurations</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <Plus className="w-4 h-4" />
                            Add New Bed
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
                                    placeholder="Search beds..."
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
                                    ["sl", "bedName"] :
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
                                                <Bed className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {search ? "No beds found" : "No beds available"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {search
                                                        ? "Try adjusting your search criteria"
                                                        : "Add your first bed to get started"
                                                    }
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((bed, idx) => (
                                        <TableRow key={bed.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("bedName") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                            {getBedIcon(bed.name)}
                                                        </div>
                                                        <span className="text-foreground font-medium">{bed.name}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(bed)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(bed.id, bed.name)}
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

            {/* Add Bed Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Bed
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bedName" className="text-sm font-medium">
                                Bed Name
                            </Label>
                            <Input
                                id="bedName"
                                value={newBedName}
                                onChange={(e) => setNewBedName(e.target.value)}
                                placeholder="Enter bed name..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newBedName.trim()) {
                                        handleAddBed();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setNewBedName("");
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddBed}
                                disabled={!newBedName.trim() || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Bed"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Bed Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Bed
                        </DialogTitle>
                    </DialogHeader>
                    {editingBed && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editBedName" className="text-sm font-medium">
                                    Bed Name
                                </Label>
                                <Input
                                    id="editBedName"
                                    value={editingBed.name}
                                    onChange={(e) => setEditingBed({ ...editingBed, name: e.target.value })}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && editingBed.name.trim()) {
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
                                    disabled={!editingBed.name.trim() || isSubmitting}
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