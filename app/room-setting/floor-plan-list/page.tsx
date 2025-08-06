"use client";

import { useState, useMemo, useRef } from "react";
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
    Building2,
    MapPin,
    Users,
    Hash
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

// Interface for floor data
interface Floor {
    id: number;
    floorName: string;
    noOfRoom: number;
    startRoomNo: number;
    createdAt: string;
}

// Interface for floor names from API (for assign floor dropdown)
interface FloorName {
    id: number;
    name: string;
}

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "floorName", label: "Floor Name" },
    { key: "noOfRoom", label: "No of Room" },
    { key: "startRoomNo", label: "Start Room No" },
    { key: "action", label: "Action" },
];

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function FloorPlanListPage() {
    const [entries, setEntries] = useState(10);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
    const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false);
    const [isAssignFloorModalOpen, setIsAssignFloorModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFloorListModalOpen, setIsFloorListModalOpen] = useState(false);

    // Form states for Add Floor
    const [newFloorName, setNewFloorName] = useState("");
    const [newNoOfRoom, setNewNoOfRoom] = useState("");
    const [newStartRoomNo, setNewStartRoomNo] = useState("");

    // Form states for Assign Floor
    const [selectedFloorName, setSelectedFloorName] = useState("");
    const [assignNoOfRoom, setAssignNoOfRoom] = useState("");
    const [assignStartRoomNo, setAssignStartRoomNo] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use SWR to fetch floor data
    const { data: floors = [], error, isLoading, mutate } = useSWR<Floor[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/floor-plan-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Use SWR to fetch floor names for assign dropdown
    const { data: floorNames = [], isLoading: isLoadingFloorNames } = useSWR<FloorName[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/floor-names`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    console.log("Floors Data:", floors);
    console.log("Floor Names Data:", floorNames);

    // Filtering
    const filtered = useMemo(() => {
        if (!floors?.length) return [];
        return floors.filter(floor =>
            floor?.floorName?.toLowerCase()?.includes(search.toLowerCase()) ||
            floor?.noOfRoom?.toString()?.includes(search) ||
            floor?.startRoomNo?.toString()?.includes(search)
        );
    }, [search, floors]);

    // Sorting
    const sorted = useMemo(() => {
        const sortedFloors = [...filtered];
        if (sort.key === "sl") {
            sortedFloors.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "floorName") {
            sortedFloors.sort((a, b) => {
                return sort.dir === "asc"
                    ? a.floorName.localeCompare(b.floorName)
                    : b.floorName.localeCompare(a.floorName);
            });
        } else if (sort.key === "noOfRoom") {
            sortedFloors.sort((a, b) => sort.dir === "asc" ? a.noOfRoom - b.noOfRoom : b.noOfRoom - a.noOfRoom);
        } else if (sort.key === "startRoomNo") {
            sortedFloors.sort((a, b) => sort.dir === "asc" ? a.startRoomNo - b.startRoomNo : b.startRoomNo - a.startRoomNo);
        }
        return sortedFloors;
    }, [filtered, sort]);

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries);
    const paginated = sorted.slice((page - 1) * entries, page * entries);

    // Export/Print handlers
    const handleExport = (type: string) => {
        toast.info(`Exporting as ${type}...`);
    };

    // Reset form states
    const resetAddFloorForm = () => {
        setNewFloorName("");
        setNewNoOfRoom("");
        setNewStartRoomNo("");
    };

    const resetAssignFloorForm = () => {
        setSelectedFloorName("");
        setAssignNoOfRoom("");
        setAssignStartRoomNo("");
    };

    // Add floor
    const handleAddFloor = async () => {
        if (!newFloorName.trim()) {
            toast.error("Please enter floor name");
            return;
        }
        if (!newNoOfRoom.trim()) {
            toast.error("Please enter number of rooms");
            return;
        }
        if (!newStartRoomNo.trim()) {
            toast.error("Please enter start room number");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/floor-plan-list`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    floorName: newFloorName,
                    noOfRoom: parseInt(newNoOfRoom),
                    startRoomNo: parseInt(newStartRoomNo),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to add floor");
            }

            await mutate();
            resetAddFloorForm();
            setIsAddFloorModalOpen(false);
            toast.success("Floor added successfully!");
        } catch (error) {
            console.error("Add floor error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add floor. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Assign floor
    const handleAssignFloor = async () => {
        if (!selectedFloorName.trim()) {
            toast.error("Please select a floor name");
            return;
        }
        if (!assignNoOfRoom.trim()) {
            toast.error("Please enter number of rooms");
            return;
        }
        if (!assignStartRoomNo.trim()) {
            toast.error("Please enter start room number");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/assign-floor`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    floorName: selectedFloorName,
                    noOfRoom: parseInt(assignNoOfRoom),
                    startRoomNo: parseInt(assignStartRoomNo),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to assign floor");
            }

            await mutate();
            resetAssignFloorForm();
            setIsAssignFloorModalOpen(false);
            toast.success("Floor assigned successfully!");
        } catch (error) {
            console.error("Assign floor error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to assign floor. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit floor
    const handleEdit = (floor: Floor) => {
        setEditingFloor({ ...floor });
        setIsEditModalOpen(true);
    };

    // Save edit
    const handleSaveEdit = async () => {
        if (!editingFloor?.floorName?.trim()) {
            toast.error("Please provide floor name");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/floor-plan-list`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingFloor.id,
                    floorName: editingFloor.floorName,
                    noOfRoom: editingFloor.noOfRoom,
                    startRoomNo: editingFloor.startRoomNo,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update floor");
            }

            await mutate();
            setIsEditModalOpen(false);
            setEditingFloor(null);
            toast.success("Floor updated successfully!");
        } catch (error) {
            console.error("Update floor error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update floor. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete floor
    const handleDelete = async (id: number, floorName: string) => {
        if (!confirm(`Are you sure you want to delete "${floorName}" floor?`)) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/floor-plan-list`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete floor");
            }

            await mutate();
            toast.success("Floor deleted successfully!");
        } catch (error) {
            console.error("Delete floor error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete floor. Please try again.");
        }
    };

    // Get floor icon
    const getFloorIcon = (floorName: string) => {
        const lowerName = floorName.toLowerCase();
        if (lowerName.includes('ground') || lowerName.includes('first')) return <Building2 className="w-4 h-4 text-primary" />;
        if (lowerName.includes('terrace') || lowerName.includes('roof')) return <Building2 className="w-4 h-4 text-chart-1" />;
        return <Building2 className="w-4 h-4 text-muted-foreground" />;
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
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
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
                        <p className="text-sm text-muted-foreground mb-4">Failed to load floor plan list</p>
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
                                <BreadcrumbLink href="/room-setting/floor-plan-list" className="text-sm font-medium">
                                    Floor Plan List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Floor Plan List</h1>
                                <p className="text-sm text-muted-foreground">Manage building floors and room assignments</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsAssignFloorModalOpen(true)}
                                variant="outline"
                                className="h-10 px-4 rounded-full shadow-md flex items-center gap-2"
                                disabled={isLoading}
                            >
                                <MapPin className="w-4 h-4" />
                                Assign Floor
                            </Button>
                            <Button
                                onClick={() => setIsAddFloorModalOpen(true)}
                                className="h-10 px-4 rounded-full shadow-md flex items-center gap-2"
                                disabled={isLoading}
                            >
                                <Plus className="w-4 h-4" />
                                Add Floor
                            </Button>
                            <Button
                                onClick={() => setIsFloorListModalOpen(true)}
                                variant="outline"
                                className="h-10 px-4 rounded-full shadow-md flex items-center gap-2"
                                disabled={isLoading}
                            >
                                <Building2 className="w-4 h-4" />
                                Floor List
                            </Button>
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
                                    placeholder="Search floors..."
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
                                    ["sl", "floorName", "noOfRoom", "startRoomNo"] :
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
                                                <Building2 className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {search ? "No floors found" : "No floors available"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {search
                                                        ? "Try adjusting your search criteria"
                                                        : "Add your first floor to get started"
                                                    }
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((floor, idx) => (
                                        <TableRow key={floor.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("floorName") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                            {getFloorIcon(floor.floorName)}
                                                        </div>
                                                        <span className="text-foreground font-medium">{floor.floorName}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("noOfRoom") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-foreground font-medium">{floor.noOfRoom}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("startRoomNo") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Hash className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-foreground font-medium">{floor.startRoomNo}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(floor)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(floor.id, floor.floorName)}
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

            {/* Add Floor Modal */}
            <Dialog open={isAddFloorModalOpen} onOpenChange={setIsAddFloorModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Floor
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="floorName" className="text-sm font-medium">
                                Floor Name *
                            </Label>
                            <Input
                                id="floorName"
                                value={newFloorName}
                                onChange={(e) => setNewFloorName(e.target.value)}
                                placeholder="Enter floor name..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="noOfRoom" className="text-sm font-medium">
                                Number of Rooms *
                            </Label>
                            <Input
                                id="noOfRoom"
                                type="number"
                                value={newNoOfRoom}
                                onChange={(e) => setNewNoOfRoom(e.target.value)}
                                placeholder="Enter number of rooms..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startRoomNo" className="text-sm font-medium">
                                Start Room Number *
                            </Label>
                            <Input
                                id="startRoomNo"
                                type="number"
                                value={newStartRoomNo}
                                onChange={(e) => setNewStartRoomNo(e.target.value)}
                                placeholder="Enter start room number..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddFloorModalOpen(false);
                                    resetAddFloorForm();
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddFloor}
                                disabled={!newFloorName.trim() || !newNoOfRoom.trim() || !newStartRoomNo.trim() || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Floor"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Assign Floor Modal */}
            <Dialog open={isAssignFloorModalOpen} onOpenChange={setIsAssignFloorModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Assign Floor
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="assignFloorName" className="text-sm font-medium">
                                Floor Name *
                            </Label>
                            <Select
                                value={selectedFloorName}
                                onValueChange={setSelectedFloorName}
                                disabled={isSubmitting || isLoadingFloorNames}
                            >
                                <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                    <SelectValue placeholder={isLoadingFloorNames ? "Loading floor names..." : "Select a floor name"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {floorNames.map((floorName) => (
                                        <SelectItem key={floorName.id} value={floorName.name}>
                                            <div className="flex items-center gap-2">
                                                {getFloorIcon(floorName.name)}
                                                <span>{floorName.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assignNoOfRoom" className="text-sm font-medium">
                                Number of Rooms *
                            </Label>
                            <Input
                                id="assignNoOfRoom"
                                type="number"
                                value={assignNoOfRoom}
                                onChange={(e) => setAssignNoOfRoom(e.target.value)}
                                placeholder="Enter number of rooms..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assignStartRoomNo" className="text-sm font-medium">
                                Start Room Number *
                            </Label>
                            <Input
                                id="assignStartRoomNo"
                                type="number"
                                value={assignStartRoomNo}
                                onChange={(e) => setAssignStartRoomNo(e.target.value)}
                                placeholder="Enter start room number..."
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAssignFloorModalOpen(false);
                                    resetAssignFloorForm();
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAssignFloor}
                                disabled={!selectedFloorName.trim() || !assignNoOfRoom.trim() || !assignStartRoomNo.trim() || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    "Assign Floor"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Floor Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Floor
                        </DialogTitle>
                    </DialogHeader>
                    {editingFloor && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editFloorName" className="text-sm font-medium">
                                    Floor Name *
                                </Label>
                                <Input
                                    id="editFloorName"
                                    value={editingFloor.floorName}
                                    onChange={(e) => setEditingFloor({
                                        ...editingFloor,
                                        floorName: e.target.value
                                    })}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editNoOfRoom" className="text-sm font-medium">
                                    Number of Rooms *
                                </Label>
                                <Input
                                    id="editNoOfRoom"
                                    type="number"
                                    value={editingFloor.noOfRoom}
                                    onChange={(e) => setEditingFloor({
                                        ...editingFloor,
                                        noOfRoom: parseInt(e.target.value) || 0
                                    })}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editStartRoomNo" className="text-sm font-medium">
                                    Start Room Number *
                                </Label>
                                <Input
                                    id="editStartRoomNo"
                                    type="number"
                                    value={editingFloor.startRoomNo}
                                    onChange={(e) => setEditingFloor({
                                        ...editingFloor,
                                        startRoomNo: parseInt(e.target.value) || 0
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
                                        setEditingFloor(null);
                                    }}
                                    className="px-4"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={!editingFloor.floorName.trim() || isSubmitting}
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

            {/* Floor List Modal (Simple display modal) */}
            <Dialog open={isFloorListModalOpen} onOpenChange={setIsFloorListModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Floor List
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : floors.length === 0 ? (
                            <div className="text-center py-8">
                                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-base text-muted-foreground">No floors available</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {floors.map((floor) => (
                                    <div key={floor.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                {getFloorIcon(floor.floorName)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{floor.floorName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {floor.noOfRoom} rooms, starting from #{floor.startRoomNo}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={() => setIsFloorListModalOpen(false)}
                                className="px-4"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}