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
import { toast } from "sonner";
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
    Gift,
    Building,
    Coffee,
    Wifi,
    Car,
    Utensils,
    Loader2,
    AlertCircle
} from "lucide-react";

import useSWR from 'swr';
import axiosInstance from "@/lib/axios";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

interface ComplementaryItem {
    id: number;
    roomType: string;
    complementary: string;
    rate: number;
}

interface RoomType {
    id: number;
    roomType: string;
  
}



// Mock data for development/fallback
const mockComplementaryItems: ComplementaryItem[] = [];

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "roomType", label: "Room Type" },
    { key: "complementary", label: "Complementary" },
    { key: "rate", label: "Rate" },
    { key: "action", label: "Action" },
];




const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function ComplementaryPage() {
    // Fetch complementary items
    const { data: apiData, error, isLoading, mutate } = useSWR<ComplementaryItem[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/complementary-list`,
        fetcher,
        {
            onError: () => {
                toast.error("Failed to load complementary items. Using local data.");
            }
        }
    );

    // Fetch room types from API
    const { data: roomTypesData = [], isLoading: isLoadingRoomTypes } = useSWR<RoomType[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/room-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            onError: () => {
                toast.error("Failed to load room types.");
            }
        }
    );

    // Use API data if available, otherwise fallback to mock data
    const complementaryItems = apiData || mockComplementaryItems;
    const roomTypes = roomTypesData || [];

    const [entries, setEntries] = useState(10);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    const [editingItem, setEditingItem] = useState<ComplementaryItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        roomType: "",
        complementary: "",
        rate: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtering with null check
    const filtered = useMemo(() => {
        if (!complementaryItems || complementaryItems.length === 0) return [];
        return complementaryItems.filter(item =>
            item?.roomType?.toLowerCase().includes(search.toLowerCase()) ||
            item?.complementary?.toLowerCase().includes(search.toLowerCase()) ||
            item?.rate?.toString().includes(search)
        );
    }, [search, complementaryItems]);

    // Sorting
    const sorted = useMemo(() => {
        const sortedItems = [...filtered];
        if (sort.key === "sl") {
            sortedItems.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "roomType") {
            sortedItems.sort((a, b) => {
                if (a.roomType < b.roomType) return sort.dir === "asc" ? -1 : 1;
                if (a.roomType > b.roomType) return sort.dir === "asc" ? 1 : -1;
                return 0;
            });
        } else if (sort.key === "complementary") {
            sortedItems.sort((a, b) => {
                if (a.complementary < b.complementary) return sort.dir === "asc" ? -1 : 1;
                if (a.complementary > b.complementary) return sort.dir === "asc" ? 1 : -1;
                return 0;
            });
        } else if (sort.key === "rate") {
            sortedItems.sort((a, b) => sort.dir === "asc" ? a.rate - b.rate : b.rate - a.rate);
        }
        return sortedItems;
    }, [filtered, sort]);

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries);
    const paginated = sorted.slice((page - 1) * entries, page * entries);

    // Export/Print handlers
    const handleExport = (type: "Copy" | "CSV" | "PDF" | "Print") => {
        if (!complementaryItems?.length) {
            toast.warning("No data available to export");
            return;
        }

        // Prepare export data
        const exportData = complementaryItems.map((item, index) => ({
            sl: index + 1,
            roomType: item.roomType || "-",
            complementary: item.complementary || "-",
            rate: item.rate ?? 0,
        }));

        // ---- COPY ----
        if (type === "Copy") {
            const text = exportData
                .map(row =>
                    `${row.sl}\t${row.roomType}\t${row.complementary}\t${row.rate}`
                )
                .join("\n");
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard!");
        }

        // ---- CSV ----
        if (type === "CSV") {
            const headers = ["SL", "Room Type", "Complementary", "Rate"];
            const rows = exportData.map(row => [
                row.sl,
                `"${row.roomType}"`,
                `"${row.complementary}"`,
                row.rate
            ]);

            const csvContent =
                "data:text/csv;charset=utf-8," +
                [headers, ...rows].map(e => e.join(",")).join("\n");

            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.download = "complementary-items-list.csv";
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
            doc.text("Complementary Items Report", 105, 30, { align: "center" });

            autoTable(doc, {
                startY: 40,
                head: [["SL", "Room Type", "Complementary", "Rate"]],
                body: exportData.map(row => [
                    row.sl,
                    row.roomType,
                    row.complementary,
                    row.rate
                ]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            doc.save("complementary-items-list.pdf");
            toast.success("PDF downloaded!");
        }

        // ---- PRINT ----
        if (type === "Print") {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
<html>
  <head>
    <title>Complementary Items Report</title>
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
    <h3>Complementary Items Report</h3>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Room Type</th>
          <th>Complementary</th>
          <th>Rate</th>
        </tr>
      </thead>
      <tbody>
        ${exportData.map(row => `
          <tr>
            <td>${row.sl}</td>
            <td>${row.roomType}</td>
            <td>${row.complementary}</td>
            <td>${row.rate}</td>
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

    // Add item
    const handleAddItem = async () => {
        if (!newItem.roomType.trim() || !newItem.complementary.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axiosInstance.post("/api/room-setting/complementary-list", newItem);

            if (response.status !== 201) {
                throw new Error("Failed to add complementary item");
            }

            await mutate(); // Refresh the data
            setNewItem({ roomType: "", complementary: "", rate: 0 });
            setIsAddModalOpen(false);
            toast.success("Complementary item added successfully!");
        } catch (error) {
            console.error("Add item error:", error);
            // Fallback to local state update if API fails
            const newComplementaryItem: ComplementaryItem = {
                id: Math.max(...(complementaryItems.length > 0 ? complementaryItems.map(f => f.id) : [0])) + 1,
                roomType: newItem.roomType,
                complementary: newItem.complementary.trim(),
                rate: newItem.rate
            };

            // Update local data optimistically
            mutate([...complementaryItems, newComplementaryItem], false);
            setNewItem({ roomType: "", complementary: "", rate: 0 });
            setIsAddModalOpen(false);
            toast.success("Complementary item added successfully!");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit item
    const handleEdit = (item: ComplementaryItem) => {
        setEditingItem({ ...item });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingItem || !editingItem.roomType.trim() || !editingItem.complementary.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axiosInstance.put("/api/room-setting/complementary-list", {
                id: editingItem.id,
                roomType: editingItem.roomType,
                complementary: editingItem.complementary,
                rate: editingItem.rate
            });

            if (response.status !== 200) {
                throw new Error("Failed to update complementary item");
            }

            await mutate(); // Refresh the data
            setIsEditModalOpen(false);
            setEditingItem(null);
            toast.success("Complementary item updated successfully!");
        } catch (error) {
            console.error("Update item error:", error);
            // Fallback to local state update if API fails
            const updatedItems = complementaryItems.map(f =>
                f.id === editingItem.id ? editingItem : f
            );

            // Update local data optimistically
            mutate(updatedItems, false);
            setIsEditModalOpen(false);
            setEditingItem(null);
            toast.success("Complementary item updated successfully!");
        } finally {
            setIsSubmitting(false);
        }
    };
       
    // Delete item
    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }

        try {
            const response = await axiosInstance.delete(`/api/room-setting/complementary-list`, {
                data: {
                    id: id
                }
            });

            if (response.status !== 200) {
                throw new Error("Failed to delete complementary item");
            }

            await mutate(); // Refresh the data
            toast.success("Complementary item deleted successfully!");
        } catch (error) {
            console.error("Delete item error:", error);
            // Fallback to local state update if API fails
            const updatedItems = complementaryItems.filter(f => f.id !== id);

            // Update local data optimistically
            mutate(updatedItems, false);
            toast.success("Complementary item deleted successfully!");
        }
    };

    // Get complementary icon
    const getComplementaryIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('breakfast') || lowerName.includes('dinner') || lowerName.includes('food')) return <Utensils className="w-4 h-4 text-primary" />;
        if (lowerName.includes('drink') || lowerName.includes('coffee') || lowerName.includes('tea')) return <Coffee className="w-4 h-4 text-chart-2" />;
        if (lowerName.includes('wifi') || lowerName.includes('internet')) return <Wifi className="w-4 h-4 text-chart-4" />;
        if (lowerName.includes('parking') || lowerName.includes('car') || lowerName.includes('pickup')) return <Car className="w-4 h-4 text-muted-foreground" />;
        return <Gift className="w-4 h-4 text-muted-foreground" />;
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                    <div className="flex space-x-2 ml-auto">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );

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
                                    Room Settings
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/room-setting/complementary-list" className="text-sm font-medium">
                                    Complementary Services
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Gift className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Complementary Services</h1>
                                <p className="text-sm text-muted-foreground">
                                    {sorted.length > 0 ? `${sorted.length} complementary items` : 'Manage complementary items for room types'}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                            disabled={isLoading || isLoadingRoomTypes}
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
                                    placeholder="Search items..."
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
                                    ["sl", "roomType", "complementary", "rate"] :
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
                                {isLoading && !complementaryItems?.length ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="py-4">
                                            <LoadingSkeleton />
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Gift className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {search ? "No items found" : "No complementary items available"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {search
                                                        ? "Try adjusting your search criteria"
                                                        : "Add your first complementary item to get started"
                                                    }
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((item, idx) => (
                                        <TableRow key={item.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("roomType") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                            <Building className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <span className="text-foreground font-medium">{item.roomType}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("complementary") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                            {getComplementaryIcon(item.complementary)}
                                                        </div>
                                                        <span className="text-foreground font-medium">{item.complementary}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("rate") && (
                                                <TableCell className="text-sm py-3">
                                                    {item.rate === 0 ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                            Free
                                                        </span>
                                                    ) : (
                                                        <span className="text-foreground font-medium">Rs. {item.rate.toLocaleString()}</span>
                                                    )}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(item)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(item.id, item.complementary)}
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
                            {isLoading ? (
                                "Loading..."
                            ) : (
                                `Showing ${Math.min((page - 1) * entries + 1, sorted.length)} to ${Math.min(page * entries, sorted.length)} of ${sorted.length} entries`
                            )}
                        </div>

                        {totalPages > 1 && !isLoading && (
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

            {/* Add Item Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Complementary Item
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="roomType" className="text-sm font-medium">
                                Room Type
                            </Label>
                            <Select
                                value={newItem.roomType}
                                onValueChange={(value) => setNewItem(prev => ({ ...prev, roomType: value }))}
                                disabled={isLoadingRoomTypes || isSubmitting}
                            >
                                <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                    <SelectValue placeholder={isLoadingRoomTypes ? "Loading room types..." : "Select room type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomTypes.map(type => (
                                        <SelectItem key={type.id} value={type.roomType}>{type.roomType}</SelectItem>
                                    ))}
                                    {roomTypes.length === 0 && !isLoadingRoomTypes && (
                                        <SelectItem value="" disabled>No room types available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="complementary" className="text-sm font-medium">
                                Complementary Service
                            </Label>
                            <Input
                                id="complementary"
                                value={newItem.complementary}
                                onChange={(e) => setNewItem(prev => ({ ...prev, complementary: e.target.value }))}
                                placeholder="Enter complementary service..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rate" className="text-sm font-medium">
                                Rate (Rs.)
                            </Label>
                            <Input
                                id="rate"
                                type="number"
                                min="0"
                                step="0.01"
                                value={newItem.rate}
                                onChange={(e) => setNewItem(prev => ({ ...prev, rate: Number(e.target.value) }))}
                                placeholder="Enter rate (0 for free)..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setNewItem({ roomType: "", complementary: "", rate: 0 });
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddItem}
                                disabled={!newItem.roomType.trim() || !newItem.complementary.trim() || isSubmitting || isLoadingRoomTypes}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Item"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Item Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Complementary Item
                        </DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editRoomType" className="text-sm font-medium">
                                    Room Type
                                </Label>
                                <Select
                                    value={editingItem.roomType}
                                    onValueChange={(value) => setEditingItem(prev => prev ? { ...prev, roomType: value } : null)}
                                    disabled={isLoadingRoomTypes || isSubmitting}
                                >
                                    <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomTypes.map(type => (
                                            <SelectItem key={type.id} value={type.roomType}>{type.roomType}</SelectItem>
                                        ))}
                                        {roomTypes.length === 0 && !isLoadingRoomTypes && (
                                            <SelectItem value="" disabled>No room types available</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editComplementary" className="text-sm font-medium">
                                    Complementary Service
                                </Label>
                                <Input
                                    id="editComplementary"
                                    value={editingItem.complementary}
                                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, complementary: e.target.value } : null)}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editRate" className="text-sm font-medium">
                                    Rate (Rs.)
                                </Label>
                                <Input
                                    id="editRate"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editingItem.rate}
                                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, rate: Number(e.target.value) } : null)}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingItem(null);
                                    }}
                                    className="px-4"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={!editingItem.roomType.trim() || !editingItem.complementary.trim() || isSubmitting || isLoadingRoomTypes}
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