"use client";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    ChevronUp,
    ChevronDown,
    BedDouble,
    Users,
    DollarSign,
    Building,
    Zap,
    Gift
} from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";

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
    bedType: string;
    status: "Available" | "Occupied" | "Maintenance" | "Reserved";
    createdAt: string;
}

const mockRooms: Room[] = [
    {
        id: 1,
        roomType: "Deluxe",
        rate: 40000.00,
        bedCharge: 5000.00,
        personCharge: 2000.00,
        capacity: 4,
        extraCapability: true,
        roomSize: "500 Double",
        bedNo: 2,
        bedType: "Queen Bed",
        status: "Available",
        createdAt: "2025-01-15"
    },
    {
        id: 2,
        roomType: "VIP",
        rate: 75000.00,
        bedCharge: 8000.00,
        personCharge: 3500.00,
        capacity: 6,
        extraCapability: true,
        roomSize: "750 Triple",
        bedNo: 3,
        bedType: "King Bed",
        status: "Occupied",
        createdAt: "2025-01-16"
    },
    {
        id: 3,
        roomType: "Standard",
        rate: 25000.00,
        bedCharge: 3000.00,
        personCharge: 1500.00,
        capacity: 2,
        extraCapability: false,
        roomSize: "300 Single",
        bedNo: 1,
        bedType: "Single Bed",
        status: "Available",
        createdAt: "2025-01-17"
    },
    {
        id: 4,
        roomType: "Suite",
        rate: 100000.00,
        bedCharge: 10000.00,
        personCharge: 5000.00,
        capacity: 8,
        extraCapability: true,
        roomSize: "1000 Master Suite",
        bedNo: 4,
        bedType: "King Bed",
        status: "Reserved",
        createdAt: "2025-01-18"
    },
    {
        id: 5,
        roomType: "Economy",
        rate: 15000.00,
        bedCharge: 2000.00,
        personCharge: 1000.00,
        capacity: 1,
        extraCapability: false,
        roomSize: "200 Single",
        bedNo: 1,
        bedType: "Single Bed",
        status: "Maintenance",
        createdAt: "2025-01-19"
    }
];

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "roomType", label: "Room Type" },
    { key: "rate", label: "Rate" },
    { key: "bedCharge", label: "Bed Charge" },
    { key: "personCharge", label: "Person Charge" },
    { key: "capacity", label: "Capacity" },
    { key: "extraCapability", label: "Extra Capability" },
    { key: "roomSize", label: "Room Size" },
    { key: "bedNo", label: "Bed No." },
    { key: "bedType", label: "Bed Type" },
    { key: "action", label: "Action" }
];

export default function RoomListPage() {
    const [entries, setEntries] = useState(10);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));
    const [rooms, setRooms] = useState<Room[]>(mockRooms);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [formData, setFormData] = useState({
        roomType: "",
        rate: "",
        bedCharge: "",
        personCharge: "",
        capacity: "",
        extraCapability: false,
        roomSize: "",
        bedNo: "",
        bedType: ""
    });

    // Handle form submission for add
    const handleAddSubmit = () => {
        if (!formData.roomType || !formData.rate || !formData.capacity) return;

        const newRoom: Room = {
            id: Math.max(...rooms.map(r => r.id)) + 1,
            roomType: formData.roomType,
            rate: parseFloat(formData.rate),
            bedCharge: parseFloat(formData.bedCharge) || 0,
            personCharge: parseFloat(formData.personCharge) || 0,
            capacity: parseInt(formData.capacity),
            extraCapability: formData.extraCapability,
            roomSize: formData.roomSize,
            bedNo: parseInt(formData.bedNo) || 1,
            bedType: formData.bedType,
            status: "Available",
            createdAt: new Date().toISOString().split('T')[0]
        };

        setRooms([...rooms, newRoom]);
        setShowAddModal(false);
        resetFormData();
    };

    // Handle form submission for edit
    const handleEditSubmit = () => {
        if (!selectedRoom || !formData.roomType || !formData.rate || !formData.capacity) return;

        setRooms(rooms.map(r =>
            r.id === selectedRoom.id
                ? {
                    ...r,
                    roomType: formData.roomType,
                    rate: parseFloat(formData.rate),
                    bedCharge: parseFloat(formData.bedCharge) || 0,
                    personCharge: parseFloat(formData.personCharge) || 0,
                    capacity: parseInt(formData.capacity),
                    extraCapability: formData.extraCapability,
                    roomSize: formData.roomSize,
                    bedNo: parseInt(formData.bedNo) || 1,
                    bedType: formData.bedType
                }
                : r
        ));

        setShowEditModal(false);
        setSelectedRoom(null);
        resetFormData();
    };

    // Reset form data
    const resetFormData = () => {
        setFormData({
            roomType: "",
            rate: "",
            bedCharge: "",
            personCharge: "",
            capacity: "",
            extraCapability: false,
            roomSize: "",
            bedNo: "",
            bedType: ""
        });
    };

    // Handle edit click
    const handleEditClick = (room: Room) => {
        setSelectedRoom(room);
        setFormData({
            roomType: room.roomType,
            rate: room.rate.toString(),
            bedCharge: room.bedCharge.toString(),
            personCharge: room.personCharge.toString(),
            capacity: room.capacity.toString(),
            extraCapability: room.extraCapability,
            roomSize: room.roomSize,
            bedNo: room.bedNo.toString(),
            bedType: room.bedType
        });
        setShowEditModal(true);
    };

    // Filtering
    const filteredRooms = useMemo(() => {
        return rooms.filter(room =>
            room.roomType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.bedType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.roomSize.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.rate.toString().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, rooms]);

    // Sorting
    const sortedRooms = useMemo(() => {
        const sorted = [...filteredRooms];
        if (sort.key === "sl") {
            sorted.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "roomType") {
            sorted.sort((a, b) => {
                const result = a.roomType.localeCompare(b.roomType);
                return sort.dir === "asc" ? result : -result;
            });
        } else if (sort.key === "rate") {
            sorted.sort((a, b) => {
                const result = a.rate - b.rate;
                return sort.dir === "asc" ? result : -result;
            });
        } else if (sort.key === "capacity") {
            sorted.sort((a, b) => {
                const result = a.capacity - b.capacity;
                return sort.dir === "asc" ? result : -result;
            });
        }
        return sorted;
    }, [filteredRooms, sort]);

    // Pagination
    const totalPages = Math.ceil(sortedRooms.length / entries);
    const paginatedRooms = sortedRooms.slice((page - 1) * entries, page * entries);

    // Export handlers
    const handleExport = (type: string) => {
        alert(`Export as ${type}`);
    };

    // Delete room
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this room?")) {
            setRooms(rooms.filter(r => r.id !== id));
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return `${amount.toFixed(2)}`;
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Available':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Available</Badge>;
            case 'Occupied':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Occupied</Badge>;
            case 'Reserved':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Reserved</Badge>;
            case 'Maintenance':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Maintenance</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
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
                                <BreadcrumbLink href="/room-setting/room-list" className="text-sm font-medium">
                                    Room List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Building className="w-6 h-6 text-primary" />
                            <h1 className="text-xl font-semibold text-foreground">Room List</h1>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => setShowAddModal(true)}
                                className="h-10 px-4 rounded-full shadow-md flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add New
                            </Button>
                            <Button
                                variant="outline"
                                className="h-10 px-4 rounded-full shadow-md flex items-center gap-2"
                            >
                                <Users className="w-4 h-4" />
                                Assign Room
                            </Button>
                            <Button
                                variant="outline"
                                className="h-10 px-4 rounded-full shadow-md flex items-center gap-2"
                            >
                                <Gift className="w-4 h-4" />
                                Assign Room Offer
                            </Button>
                            <Button
                                variant="outline"
                                className="h-10 px-4 rounded-full shadow-md flex items-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                Assign Room Facilities
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
                                className="h-9 px-4 rounded-full text-sm shadow-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("CSV")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                CSV
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("PDF")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                PDF
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("Print")}
                                className="h-9 px-4 rounded-full text-sm shadow-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const next = visibleCols.length === columns.length ?
                                        ["sl", "roomType", "rate", "capacity", "action"] :
                                        columns.map(c => c.key);
                                    setVisibleCols(next);
                                }}
                                className="h-9 px-4 rounded-full text-sm shadow-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Column visibility
                            </Button>
                        </div>

                        {/* Search Bar */}
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm font-medium text-muted-foreground">Search:</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search rooms..."
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
                                                if (col.key !== "action") {
                                                    setSort(s => ({
                                                        key: col.key,
                                                        dir: s.key === col.key ? (s.dir === "asc" ? "desc" : "asc") : "asc"
                                                    }));
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.label}
                                                {col.key !== "action" && col.key !== "extraCapability" && (
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
                                {paginatedRooms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Building className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">No rooms found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedRooms.map((room, idx) => (
                                        <TableRow key={room.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("roomType") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    <div className="flex items-center gap-2">
                                                        <BedDouble className="w-4 h-4 text-muted-foreground" />
                                                        {room.roomType}
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("rate") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                                                        {formatCurrency(room.rate)}
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("bedCharge") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {formatCurrency(room.bedCharge)}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("personCharge") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {formatCurrency(room.personCharge)}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("capacity") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4 text-muted-foreground" />
                                                        {room.capacity}
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("extraCapability") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    <Badge variant={room.extraCapability ? "default" : "secondary"}>
                                                        {room.extraCapability ? "Yes" : "No"}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("roomSize") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {room.roomSize}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("bedNo") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {room.bedNo}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("bedType") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {room.bedType}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditClick(room)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(room.id)}
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
                            Showing {(page - 1) * entries + 1} to {Math.min(page * entries, sortedRooms.length)} of {sortedRooms.length} entries
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

            {/* Add Room Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Room
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="roomType" className="text-sm font-medium">
                                    Room Type
                                </Label>
                                <Select value={formData.roomType} onValueChange={(value) => setFormData(prev => ({ ...prev, roomType: value }))}>
                                    <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                        <SelectValue placeholder="Select room type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Deluxe">Deluxe</SelectItem>
                                        <SelectItem value="VIP">VIP</SelectItem>
                                        <SelectItem value="Suite">Suite</SelectItem>
                                        <SelectItem value="Economy">Economy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rate" className="text-sm font-medium">
                                    Rate
                                </Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    placeholder="Enter rate"
                                    value={formData.rate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bedCharge" className="text-sm font-medium">
                                    Bed Charge
                                </Label>
                                <Input
                                    id="bedCharge"
                                    type="number"
                                    placeholder="Enter bed charge"
                                    value={formData.bedCharge}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bedCharge: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="personCharge" className="text-sm font-medium">
                                    Person Charge
                                </Label>
                                <Input
                                    id="personCharge"
                                    type="number"
                                    placeholder="Enter person charge"
                                    value={formData.personCharge}
                                    onChange={(e) => setFormData(prev => ({ ...prev, personCharge: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="capacity" className="text-sm font-medium">
                                    Capacity
                                </Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    placeholder="Enter capacity"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="roomSize" className="text-sm font-medium">
                                    Room Size
                                </Label>
                                <Input
                                    id="roomSize"
                                    placeholder="e.g. 500 Double"
                                    value={formData.roomSize}
                                    onChange={(e) => setFormData(prev => ({ ...prev, roomSize: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bedNo" className="text-sm font-medium">
                                    Number of Beds
                                </Label>
                                <Input
                                    id="bedNo"
                                    type="number"
                                    placeholder="Enter number of beds"
                                    value={formData.bedNo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bedNo: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bedType" className="text-sm font-medium">
                                    Bed Type
                                </Label>
                                <Select value={formData.bedType} onValueChange={(value) => setFormData(prev => ({ ...prev, bedType: value }))}>
                                    <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                        <SelectValue placeholder="Select bed type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Single Bed">Single Bed</SelectItem>
                                        <SelectItem value="Queen Bed">Queen Bed</SelectItem>
                                        <SelectItem value="King Bed">King Bed</SelectItem>
                                        <SelectItem value="Bunk Bed">Bunk Bed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="extraCapability"
                                checked={formData.extraCapability}
                                onChange={(e) => setFormData(prev => ({ ...prev, extraCapability: e.target.checked }))}
                                className="rounded border-border/50"
                            />
                            <Label htmlFor="extraCapability" className="text-sm font-medium">
                                Extra Capability Available
                            </Label>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddModal(false);
                                    resetFormData();
                                }}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddSubmit}
                                disabled={!formData.roomType || !formData.rate || !formData.capacity}
                                className="px-4"
                            >
                                Add Room
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Room Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Room
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editRoomType" className="text-sm font-medium">
                                    Room Type
                                </Label>
                                <Select value={formData.roomType} onValueChange={(value) => setFormData(prev => ({ ...prev, roomType: value }))}>
                                    <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                        <SelectValue placeholder="Select room type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Deluxe">Deluxe</SelectItem>
                                        <SelectItem value="VIP">VIP</SelectItem>
                                        <SelectItem value="Suite">Suite</SelectItem>
                                        <SelectItem value="Economy">Economy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editRate" className="text-sm font-medium">
                                    Rate
                                </Label>
                                <Input
                                    id="editRate"
                                    type="number"
                                    placeholder="Enter rate"
                                    value={formData.rate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editBedCharge" className="text-sm font-medium">
                                    Bed Charge
                                </Label>
                                <Input
                                    id="editBedCharge"
                                    type="number"
                                    placeholder="Enter bed charge"
                                    value={formData.bedCharge}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bedCharge: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editPersonCharge" className="text-sm font-medium">
                                    Person Charge
                                </Label>
                                <Input
                                    id="editPersonCharge"
                                    type="number"
                                    placeholder="Enter person charge"
                                    value={formData.personCharge}
                                    onChange={(e) => setFormData(prev => ({ ...prev, personCharge: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editCapacity" className="text-sm font-medium">
                                    Capacity
                                </Label>
                                <Input
                                    id="editCapacity"
                                    type="number"
                                    placeholder="Enter capacity"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editRoomSize" className="text-sm font-medium">
                                    Room Size
                                </Label>
                                <Input
                                    id="editRoomSize"
                                    placeholder="e.g. 500 Double"
                                    value={formData.roomSize}
                                    onChange={(e) => setFormData(prev => ({ ...prev, roomSize: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editBedNo" className="text-sm font-medium">
                                    Number of Beds
                                </Label>
                                <Input
                                    id="editBedNo"
                                    type="number"
                                    placeholder="Enter number of beds"
                                    value={formData.bedNo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bedNo: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editBedType" className="text-sm font-medium">
                                    Bed Type
                                </Label>
                                <Select value={formData.bedType} onValueChange={(value) => setFormData(prev => ({ ...prev, bedType: value }))}>
                                    <SelectTrigger className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent">
                                        <SelectValue placeholder="Select bed type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Single Bed">Single Bed</SelectItem>
                                        <SelectItem value="Queen Bed">Queen Bed</SelectItem>
                                        <SelectItem value="King Bed">King Bed</SelectItem>
                                        <SelectItem value="Bunk Bed">Bunk Bed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="editExtraCapability"
                                checked={formData.extraCapability}
                                onChange={(e) => setFormData(prev => ({ ...prev, extraCapability: e.target.checked }))}
                                className="rounded border-border/50"
                            />
                            <Label htmlFor="editExtraCapability" className="text-sm font-medium">
                                Extra Capability Available
                            </Label>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedRoom(null);
                                    resetFormData();
                                }}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditSubmit}
                                disabled={!formData.roomType || !formData.rate || !formData.capacity}
                                className="px-4"
                            >
                                Update Room
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}