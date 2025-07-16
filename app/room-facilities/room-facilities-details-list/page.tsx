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
    Image as ImageIcon,
    Building
} from "lucide-react";
import { useState, useMemo } from "react";

interface FacilityDetail {
    id: number;
    facilityType: string;
    facilityName: string;
    image: string;
    description?: string;
}

const mockFacilityDetails: FacilityDetail[] = [
    {
        id: 1,
        facilityType: "Aroma",
        facilityName: "Air Conditioner",
        image: "/test.jpg",
        description: "High-efficiency cooling system"
    },
    {
        id: 2,
        facilityType: "Lighting",
        facilityName: "LED Ceiling Lights",
        image: "/test.jpg",
        description: "Energy-efficient LED lighting"
    },
    {
        id: 3,
        facilityType: "Entertainment",
        facilityName: "Smart TV",
        image: "/test.jpg",
        description: "55-inch 4K Smart Television"
    },
    {
        id: 4,
        facilityType: "Comfort",
        facilityName: "Premium Bedding",
        image: "/test.jpg",
        description: "Luxury cotton bedding set"
    },
    {
        id: 5,
        facilityType: "Connectivity",
        facilityName: "High-Speed WiFi",
        image: "/test.jpg",
        description: "Fiber optic internet connection"
    },
    {
        id: 6,
        facilityType: "Storage",
        facilityName: "Room Safe",
        image: "/test.jpg",
        description: "Digital security safe"
    },
    {
        id: 7,
        facilityType: "Refreshment",
        facilityName: "Mini Refrigerator",
        image: "/test.jpg",
        description: "Compact cooling unit"
    },
    {
        id: 8,
        facilityType: "Comfort",
        facilityName: "Balcony Access",
        image: "/test.jpg",
        description: "Private outdoor space"
    },
];

const facilityTypes = ["Aroma", "Lighting", "Entertainment", "Comfort", "Connectivity", "Storage", "Refreshment"];

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "facilityType", label: "Add Facility Type" },
    { key: "facilityName", label: "Facility Name" },
    { key: "image", label: "Image" },
    { key: "action", label: "Action" },
];

export default function RoomFacilitiesDetailsListPage() {
    const [entries, setEntries] = useState(10);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));
    const [facilityDetails, setFacilityDetails] = useState<FacilityDetail[]>(mockFacilityDetails);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<FacilityDetail | null>(null);
    const [formData, setFormData] = useState({
        facilityType: "",
        facilityName: "",
        image: "",
        description: ""
    });

    // Handle form submission for add
    const handleAddSubmit = () => {
        if (!formData.facilityType || !formData.facilityName) return;

        const newFacility: FacilityDetail = {
            id: Math.max(...facilityDetails.map(f => f.id)) + 1,
            facilityType: formData.facilityType,
            facilityName: formData.facilityName,
            image: formData.image || "/api/placeholder/80/80",
            description: formData.description
        };

        setFacilityDetails([...facilityDetails, newFacility]);
        setShowAddModal(false);
        setFormData({
            facilityType: "",
            facilityName: "",
            image: "",
            description: ""
        });
    };

    // Handle form submission for edit
    const handleEditSubmit = () => {
        if (!selectedFacility || !formData.facilityType || !formData.facilityName) return;

        setFacilityDetails(facilityDetails.map(f =>
            f.id === selectedFacility.id
                ? { ...f, ...formData }
                : f
        ));

        setShowEditModal(false);
        setSelectedFacility(null);
        setFormData({
            facilityType: "",
            facilityName: "",
            image: "",
            description: ""
        });
    };

    // Handle edit click
    const handleEditClick = (facility: FacilityDetail) => {
        setSelectedFacility(facility);
        setFormData({
            facilityType: facility.facilityType,
            facilityName: facility.facilityName,
            image: facility.image,
            description: facility.description || ""
        });
        setShowEditModal(true);
    };

    // Filtering
    const filteredFacilities = useMemo(() => {
        return facilityDetails.filter(facility =>
            facility.facilityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            facility.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (facility.description && facility.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
                const result = a.facilityName.localeCompare(b.facilityName);
                return sort.dir === "asc" ? result : -result;
            });
        }
        return sorted;
    }, [filteredFacilities, sort]);

    // Pagination
    const totalPages = Math.ceil(sortedFacilities.length / entries);
    const paginatedFacilities = sortedFacilities.slice((page - 1) * entries, page * entries);

    // Export handlers
    const handleExport = (type: string) => {
        alert(`Export as ${type}`);
    };

    // Delete facility
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this facility detail?")) {
            setFacilityDetails(facilityDetails.filter(f => f.id !== id));
        }
    };

    // Image upload handler
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, image: imageUrl }));
        }
    };

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
                                onClick={() => handleExport("Copy")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("CSV")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                CSV
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("PDF")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                PDF
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("Print")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm"
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
                                                if (col.key !== "action" && col.key !== "image") {
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
                                {paginatedFacilities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Settings className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">No facility details found</p>
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
                                                    <div className="text-foreground font-medium">{facility.facilityName}</div>
                                                    {facility.description && (
                                                        <div className="text-sm text-muted-foreground mt-1">{facility.description}</div>
                                                    )}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("image") && (
                                                <TableCell className="py-3">
                                                    <div className="w-12 h-12 border border-border/50 rounded overflow-hidden">
                                                        <img
                                                            src={facility.image}
                                                            alt={facility.facilityName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = "/api/placeholder/80/80";
                                                            }}
                                                        />
                                                    </div>
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
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(facility.id)}
                                                            className="h-8 w-8 p-0 rounded-full border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm"
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
                            Showing {(page - 1) * entries + 1} to {Math.min(page * entries, sortedFacilities.length)} of {sortedFacilities.length} entries
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
                                    Facility Type
                                </Label>
                                <Select value={formData.facilityType} onValueChange={(value) => setFormData(prev => ({ ...prev, facilityType: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select facility type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {facilityTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="facilityName" className="text-sm font-medium">
                                    Facility Name
                                </Label>
                                <Input
                                    id="facilityName"
                                    placeholder="Enter facility name"
                                    value={formData.facilityName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, facilityName: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
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
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="min-h-[80px] rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image" className="text-sm font-medium">
                                Facility Image
                            </Label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 border border-border/50 rounded overflow-hidden flex items-center justify-center bg-muted">
                                    {formData.image ? (
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">Upload an image for this facility</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setFormData({
                                        facilityType: "",
                                        facilityName: "",
                                        image: "",
                                        description: ""
                                    });
                                }}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddSubmit}
                                disabled={!formData.facilityType || !formData.facilityName}
                                className="px-4"
                            >
                                Add Facility Details
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
                                    Facility Type
                                </Label>
                                <Select value={formData.facilityType} onValueChange={(value) => setFormData(prev => ({ ...prev, facilityType: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {facilityTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editFacilityName" className="text-sm font-medium">
                                    Facility Name
                                </Label>
                                <Input
                                    id="editFacilityName"
                                    placeholder="Enter facility name"
                                    value={formData.facilityName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, facilityName: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
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
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="min-h-[80px] rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editImage" className="text-sm font-medium">
                                Facility Image
                            </Label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 border border-border/50 rounded overflow-hidden flex items-center justify-center bg-muted">
                                    {formData.image ? (
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">Upload a new image or keep current one</p>
                                </div>
                            </div>
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
                                        image: "",
                                        description: ""
                                    });
                                }}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditSubmit}
                                disabled={!formData.facilityType || !formData.facilityName}
                                className="px-4"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}