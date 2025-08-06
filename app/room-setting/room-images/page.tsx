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
    Building,
    Images,
    Upload,
    X
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import Image from "next/image";

// Updated interface to match actual API response
interface RoomImage {
    id: number;
    imageUrl: string;
    createdAt: string;
    room: {
        roomType: string;
    };
}

// Interface for room types from the API
interface RoomType {
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
    { key: "image", label: "Image" },
    { key: "action", label: "Action" },
];

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function RoomImagesPage() {
    const [entries, setEntries] = useState(10);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    const [editingRoomImage, setEditingRoomImage] = useState<RoomImage | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRoomType, setSelectedRoomType] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // Use SWR to fetch room images
    const { data: roomImages = [], error, isLoading, mutate } = useSWR<RoomImage[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/room-images`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Use SWR to fetch room types for the dropdown
    const { data: roomTypes = [], isLoading: isLoadingRoomTypes } = useSWR<RoomType[]>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/room-list`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    console.log("Room Images Data:", roomImages);
    console.log("Room Types Data:", roomTypes);

    // Filtering with null safety - updated to use room.roomType
    const filtered = useMemo(() => {
        if (!roomImages?.length) return [];
        return roomImages.filter(roomImage =>
            roomImage?.room?.roomType?.toLowerCase()?.includes(search.toLowerCase())
        );
    }, [search, roomImages]);

    // Sorting - updated to use room.roomType
    const sorted = useMemo(() => {
        const sortedRoomImages = [...filtered];
        if (sort.key === "sl") {
            sortedRoomImages.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "roomType") {
            sortedRoomImages.sort((a, b) => {
                return sort.dir === "asc"
                    ? a.room.roomType.localeCompare(b.room.roomType)
                    : b.room.roomType.localeCompare(a.room.roomType);
            });
        }
        return sortedRoomImages;
    }, [filtered, sort]);

    // Pagination
    const totalPages = Math.ceil(sorted.length / entries);
    const paginated = sorted.slice((page - 1) * entries, page * entries);

    // Export/Print handlers
    const handleExport = (type: string) => {
        toast.info(`Exporting as ${type}...`);
    };

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error("Please select a valid image file");
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }

            setSelectedImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Reset file selection
    const resetFileSelection = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
    };

    // Add room image - Updated to use roomType from dropdown
    const handleAddRoomImage = async () => {
        if (!selectedRoomType.trim()) {
            toast.error("Please select a room type");
            return;
        }

        if (!selectedImage) {
            toast.error("Please select an image");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('roomType', selectedRoomType);
            formData.append('image', selectedImage);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/room-images`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to add room image");
            }

            // Refresh the data
            await mutate();
            setSelectedRoomType("");
            resetFileSelection();
            setIsAddModalOpen(false);
            toast.success("Room image added successfully!");
        } catch (error) {
            console.error("Add room image error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to add room image. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit room image
    const handleEdit = (roomImage: RoomImage) => {
        setEditingRoomImage({ ...roomImage });
        setImagePreview(roomImage.imageUrl || null);
        setIsEditModalOpen(true);
    };

    // Updated save edit to match API structure
    const handleSaveEdit = async () => {
        if (!editingRoomImage?.room?.roomType?.trim()) {
            toast.error("Please provide room type");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('id', editingRoomImage.id.toString());
            formData.append('roomType', editingRoomImage.room.roomType);

            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/room-images`, {
                method: "PUT",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update room image");
            }

            // Refresh the data
            await mutate();
            setIsEditModalOpen(false);
            setEditingRoomImage(null);
            resetFileSelection();
            toast.success("Room image updated successfully!");
        } catch (error) {
            console.error("Update room image error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update room image. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete room image - Updated to use correct API endpoint
    const handleDelete = async (id: number, roomType: string) => {
        if (!confirm(`Are you sure you want to delete "${roomType}" image?`)) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/room-setting/room-images`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete room image");
            }

            // Refresh the data
            await mutate();
            toast.success("Room image deleted successfully!");
        } catch (error) {
            console.error("Delete room image error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete room image. Please try again.");
        }
    };

    // Get room type icon
    const getRoomTypeIcon = (roomType: string) => {
        const lowerType = roomType.toLowerCase();
        if (lowerType.includes('deluxe') || lowerType.includes('premium')) return <Building className="w-4 h-4 text-primary" />;
        if (lowerType.includes('vip') || lowerType.includes('suite')) return <Building className="w-4 h-4 text-chart-1" />;
        if (lowerType.includes('triple')) return <Building className="w-4 h-4 text-chart-2" />;
        if (lowerType.includes('double')) return <Building className="w-4 h-4 text-chart-3" />;
        if (lowerType.includes('single')) return <Building className="w-4 h-4 text-chart-4" />;
        return <Images className="w-4 h-4 text-muted-foreground" />;
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
                    <Skeleton className="h-16 w-24 rounded-lg" />
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
                        <p className="text-sm text-muted-foreground mb-4">Failed to load room images</p>
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
                                <BreadcrumbLink href="/room-facilities/room-images" className="text-sm font-medium">
                                    Room Images
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Images className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Room Images</h1>
                                <p className="text-sm text-muted-foreground">Manage room type images and visual content</p>
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
                                    placeholder="Search room types..."
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
                                    ["sl", "roomType", "image"] :
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
                                                if (col.key !== "action" && col.key !== "image" && !isLoading) {
                                                    setSort(s => ({
                                                        key: col.key,
                                                        dir: s.key === col.key ? (s.dir === "asc" ? "desc" : "asc") : "asc"
                                                    }));
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.label}
                                                {col.key !== "action" && col.key !== "image" && (
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
                                                <Images className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {search ? "No room images found" : "No room images available"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {search
                                                        ? "Try adjusting your search criteria"
                                                        : "Add your first room image to get started"
                                                    }
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginated.map((roomImage, idx) => (
                                        <TableRow key={roomImage.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("roomType") && (
                                                <TableCell className="text-sm py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                                            {getRoomTypeIcon(roomImage?.room?.roomType)}
                                                        </div>
                                                        <span className="text-foreground font-medium">{roomImage.room.roomType}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("image") && (
                                                <TableCell className="py-3">
                                                    <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden">
                                                        {roomImage.imageUrl ? (
                                                            <Image
                                                                src={roomImage.imageUrl}
                                                                alt={roomImage.room.roomType}
                                                                width={96}
                                                                height={64}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Images className="w-6 h-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(roomImage)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(roomImage.id, roomImage.room.roomType)}
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

            {/* Add Room Image Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Room Image
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="roomType" className="text-sm font-medium">
                                Room Type *
                            </Label>
                            <Select
                                value={selectedRoomType}
                                onValueChange={setSelectedRoomType}
                                disabled={isSubmitting || isLoadingRoomTypes}
                            >
                                <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                    <SelectValue placeholder={isLoadingRoomTypes ? "Loading room types..." : "Select a room type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomTypes.map((roomType) => (
                                        <SelectItem key={roomType.id} value={roomType.roomType}>
                                            <div className="flex items-center gap-2">
                                                {getRoomTypeIcon(roomType.roomType)}
                                                <span>{roomType.roomType}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({roomType.bedType.name} bed, {roomType.capacity} capacity)
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image" className="text-sm font-medium">
                                Room Image *
                            </Label>
                            <div className="space-y-2">
                                <Input
                                    ref={fileInputRef}
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e)}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                                </p>
                            </div>

                            {imagePreview && (
                                <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                                    <Image
                                        src={imagePreview}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-white/80 hover:bg-white"
                                        onClick={resetFileSelection}
                                        disabled={isSubmitting}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setSelectedRoomType("");
                                    resetFileSelection();
                                }}
                                className="px-4"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddRoomImage}
                                disabled={!selectedRoomType.trim() || !selectedImage || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Room Image"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Room Image Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Room Image
                        </DialogTitle>
                    </DialogHeader>
                    {editingRoomImage && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editRoomType" className="text-sm font-medium">
                                    Room Type *
                                </Label>
                                <Select
                                    value={editingRoomImage.room.roomType}
                                    onValueChange={(value) => setEditingRoomImage({
                                        ...editingRoomImage,
                                        room: { ...editingRoomImage.room, roomType: value }
                                    })}
                                    disabled={isSubmitting || isLoadingRoomTypes}
                                >
                                    <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomTypes.map((roomType) => (
                                            <SelectItem key={roomType.id} value={roomType.roomType}>
                                                <div className="flex items-center gap-2">
                                                    {getRoomTypeIcon(roomType.roomType)}
                                                    <span>{roomType.roomType}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({roomType.bedType.name} bed, {roomType.capacity} capacity)
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editImage" className="text-sm font-medium">
                                    Room Image
                                </Label>
                                <div className="space-y-2">
                                    <Input
                                        ref={editFileInputRef}
                                        id="editImage"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, true)}
                                        className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                        disabled={isSubmitting}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty to keep current image. Supported formats: JPG, PNG, GIF. Max size: 5MB
                                    </p>
                                </div>

                                {imagePreview && (
                                    <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-white/80 hover:bg-white"
                                            onClick={resetFileSelection}
                                            disabled={isSubmitting}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingRoomImage(null);
                                        resetFileSelection();
                                    }}
                                    className="px-4"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={!editingRoomImage.room.roomType.trim() || isSubmitting}
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