"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { id, se } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Building, ChevronDown, ChevronUp, Copy, Edit, Eye, FileText, Home, Loader2, Plus, Printer, Search, Settings, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

interface FacilityDetail {
    id: number;
    facilityType: string;
    facility_name: string;
    description?: string;
}

interface FacilityType {
    id: number;
    name: string;
}

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "facilityType", label: "Facility Type" },
    { key: "facilityName", label: "Facility Name" },
    { key: "action", label: "Action" },
];

export default function RoomFacilitiesDetailsListPage() {
    const { data: facilityDetails = [], error, isLoading, mutate } = useSWR<FacilityDetail[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-facilities/room-facilities-details-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    const { data: facilityTypes = [], error: typesError, isLoading: typesLoading } = useSWR<FacilityType[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-facilities/room-facilities-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    const [entries, setEntries] = useState(10);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<FacilityDetail | null>(null);
    console.log(selectedFacility?.id)
    const [formData, setFormData] = useState({
        facilityType: "",
        facilityName: "",
        description: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle form submission for add
    const handleAddSubmit = async () => {
        if (!formData.facilityType || !formData.facilityName) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-facilities/room-facilities-details-list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    facility_type: formData.facilityType,
                    facility_name: formData.facilityName,
                    description: formData.description
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to add facility detail");
            }

            // Refresh the data
            await mutate();
            setShowAddModal(false);
            setFormData({
                facilityType: "",
                facilityName: "",
                description: ""
            });
            toast.success("Facility detail added successfully!");
        } catch (error) {
            console.error("Add facility error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add facility detail. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle form submission for edit
    const handleEditSubmit = async () => {
        if (!selectedFacility || !formData.facilityType || !formData.facilityName) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-facilities/room-facilities-details-list`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
               body: JSON.stringify({
                id: selectedFacility.id,
                   facility_type: formData.facilityType,
                   facility_name: formData.facilityName,
                   description: formData.description
}),

            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update facility detail");
            }

            // Refresh the data
            await mutate();
            setShowEditModal(false);
            setSelectedFacility(null);
            setFormData({
                facilityType: "",
                facilityName: "",
                description: ""
            });
            toast.success("Facility detail updated successfully!");
        } catch (error) {
            console.error("Update facility error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update facility detail. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle edit click
    const handleEditClick = (facility: FacilityDetail) => {
        setSelectedFacility(facility);
        setFormData({
            facilityType: facility.facilityType || "",
            facilityName: facility.facility_name || "",
            description: facility.description || ""
        });
        setShowEditModal(true);
    };

    // Filtering with null safety
    const filteredFacilities = useMemo(() => {
        if (!facilityDetails?.length) return [];
        return facilityDetails.filter(facility =>
            (facility?.facilityType?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (facility?.facility_name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
            (facility?.description?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, facilityDetails]);

    // Sorting
    const sortedFacilities = useMemo(() => {
        const sorted = [...filteredFacilities];
        if (sort.key === "sl") {
            sorted.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "facilityType") {
            sorted.sort((a, b) => {
                const result = a.facilityType.localeCompare(b.facilityType);
                return sort.dir === "asc" ? result : -result;
            });
        } else if (sort.key === "facilityName") {
            sorted.sort((a, b) => {
                const result = a.facility_name.localeCompare(b.facility_name);
                return sort.dir === "asc" ? result : -result;
            });
        }
        return sorted;
    }, [filteredFacilities, sort]);

    // Pagination
    const totalPages = Math.ceil(sortedFacilities.length / entries);
    const paginatedFacilities = sortedFacilities.slice((page - 1) * entries, page * entries);

    // Export handlers
    const handleExport = (type: "Copy" | "CSV" | "PDF" | "Print") => {
        if (!facilityDetails?.length) {
            toast.warning("No data available to export");
            return;
        }

        // Prepare export data
        const exportData = facilityDetails.map((facility, index) => ({
            sl: index + 1,
            facilityType: facility.facilityType || "-",
            facilityName: facility.facility_name || "-",
            description: facility.description || "-",
        }));

        // ---- COPY ----
        if (type === "Copy") {
            const text = exportData
                .map(
                    row =>
                        `${row.sl}\t${row.facilityType}\t${row.facilityName}\t${row.description}`
                )
                .join("\n");
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard!");
        }

        // ---- CSV ----
        if (type === "CSV") {
            const headers = ["SL", "Facility Type", "Facility Name", "Description"];
            const rows = exportData.map(row => [
                row.sl,
                row.facilityType,
                row.facilityName,
                `"${row.description}"`,
            ]);

            const csvContent =
                "data:text/csv;charset=utf-8," +
                [headers, ...rows].map(e => e.join(",")).join("\n");

            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.download = "room-facilities-details.csv";
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
            doc.text("Room Facilities Details Report", 105, 30, { align: "center" });

            autoTable(doc, {
                startY: 40,
                head: [["SL", "Facility Type", "Facility Name", "Description"]],
                body: exportData.map(row => [
                    row.sl,
                    row.facilityType,
                    row.facilityName,
                    row.description,
                ]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            doc.save("room-facilities-details.pdf");
            toast.success("PDF downloaded!");
        }

        // ---- PRINT ----
        if (type === "Print") {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
<html>
  <head>
    <title>Room Facilities Details Report</title>
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
    <h3>Room Facilities Details Report</h3>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Facility Type</th>
          <th>Facility Name</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${exportData
                        .map(
                            row => `
          <tr>
            <td>${row.sl}</td>
            <td>${row.facilityType}</td>
            <td>${row.facilityName}</td>
            <td>${row.description}</td>
          </tr>
        `
                        )
                        .join("")}
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


    // Delete facility
    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-facilities/room-facilities-details-list`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: id
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete facility detail");
            }

            // Refresh the data
            await mutate();
            toast.success("Facility detail deleted successfully!");
        } catch (error) {
            console.error("Delete facility error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete facility detail. Please try again.");
        }
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
                    <Skeleton className="h-4 w-64" />
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
                        <p className="text-sm text-muted-foreground mb-4">Failed to load facility details</p>
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
                                <BreadcrumbLink href="/room-facilities/room-facilities-details-list" className="text-sm font-medium">
                                    Room Facilities Details List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Building className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Room Facilities Details List</h1>
                                <p className="text-sm text-muted-foreground">Manage detailed information about room facilities</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <Plus className="w-4 h-4" />
                            Add Facility Details
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
                                onClick={() => handleExport("Copy" )}
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
                                    placeholder="Search facilities..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
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
                                    ["sl", "facilityType", "facilityName", "action"] :
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
                                ) : paginatedFacilities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Settings className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {searchQuery ? "No facility details found" : "No facility details available"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {searchQuery
                                                        ? "Try adjusting your search criteria"
                                                        : "Add your first facility detail to get started"
                                                    }
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedFacilities.map((facility, idx) => (
                                        <TableRow key={facility.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("facilityType") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Settings className="w-4 h-4 text-muted-foreground" />
                                                        {facility.facilityType}
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("facilityName") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="text-foreground font-medium">{facility.facility_name}</div>
                                                    {facility.description && (
                                                        <div className="text-sm text-muted-foreground mt-1">{facility.description}</div>
                                                    )}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditClick(facility)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(facility.id, facility.facility_name)}
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
                            Showing {Math.min((page - 1) * entries + 1, sortedFacilities.length)} to {Math.min(page * entries, sortedFacilities.length)} of {sortedFacilities.length} entries
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

            {/* Add Facility Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Facility Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="facilityType" className="text-sm font-medium">
                                    Facility Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.facilityType || ""}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, facilityType: value }))}
                                    disabled={isSubmitting || typesLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select facility type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {facilityTypes?.map(type => (
                                            <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="facilityName" className="text-sm font-medium">
                                    Facility Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="facilityName"
                                    placeholder="Enter facility name"
                                    value={formData.facilityName || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, facilityName: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && formData.facilityType && formData.facilityName.trim()) {
                                            handleAddSubmit();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Enter facility description..."
                                value={formData.description || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="min-h-[80px] rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent resize-none"
                                rows={3}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setFormData({
                                        facilityType: "",
                                        facilityName: "",
                                        description: ""
                                    });
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddSubmit}
                                disabled={!formData.facilityType || !formData.facilityName || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Facility Details"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Facility Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Facility Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editFacilityType" className="text-sm font-medium">
                                    Facility Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.facilityType || ""}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, facilityType: value }))}
                                    disabled={isSubmitting || typesLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {facilityTypes?.map(type => (
                                            <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editFacilityName" className="text-sm font-medium">
                                    Facility Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="editFacilityName"
                                    placeholder="Enter facility name"
                                    value={formData.facilityName || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, facilityName: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && formData.facilityType && formData.facilityName.trim()) {
                                            handleEditSubmit();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editDescription" className="text-sm font-medium">
                                Description
                            </Label>
                            <Textarea
                                id="editDescription"
                                placeholder="Enter facility description..."
                                value={formData.description || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="min-h-[80px] rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent resize-none"
                                rows={3}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedFacility(null);
                                    setFormData({
                                        facilityType: "",
                                        facilityName: "",
                                        description: ""
                                    });
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditSubmit}
                                disabled={!formData.facilityType || !formData.facilityName || isSubmitting}
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
        </div>
    );
}