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
    Users,
    MessageSquare,
    Phone,
    Mail,
    CreditCard,
    User
} from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";

interface Guest {
    id: number;
    bookingNumber: string;
    guestName: string;
    gender: string;
    mobile: string;
    email: string;
    identityType: string;
    identityId: string;
    createdAt: string;
}

const mockGuests: Guest[] = [
    {
        id: 1,
        bookingNumber: "00000089",
        guestName: "vish",
        gender: "",
        mobile: "0766991792",
        email: "vish92@gmail.com",
        identityType: "",
        identityId: "",
        createdAt: "2025-01-15"
    },
    {
        id: 2,
        bookingNumber: "00000073",
        guestName: "Milo",
        gender: "",
        mobile: "987654321",
        email: "timothy@gmail.com",
        identityType: "",
        identityId: "",
        createdAt: "2025-01-16"
    },
    {
        id: 3,
        bookingNumber: "00000250",
        guestName: "Wemba",
        gender: "",
        mobile: "123456789",
        email: "timur@gmail.com",
        identityType: "",
        identityId: "",
        createdAt: "2025-01-17"
    },
    {
        id: 4,
        bookingNumber: "00000226",
        guestName: "Mr asd asdf",
        gender: "",
        mobile: "",
        email: "",
        identityType: "",
        identityId: "",
        createdAt: "2025-01-18"
    },
    {
        id: 5,
        bookingNumber: "00000177",
        guestName: "Mr Myson",
        gender: "",
        mobile: "546897213",
        email: "",
        identityType: "",
        identityId: "",
        createdAt: "2025-01-19"
    },
    {
        id: 6,
        bookingNumber: "00000121",
        guestName: "MOHAMED",
        gender: "",
        mobile: "907730333",
        email: "suldaanka03@gmail.com",
        identityType: "",
        identityId: "",
        createdAt: "2025-01-20"
    },
    {
        id: 7,
        bookingNumber: "00000001",
        guestName: "Mehedi Hassan",
        gender: "",
        mobile: "01862009785",
        email: "bdtask.mehedi@gmail.com",
        identityType: "",
        identityId: "",
        createdAt: "2025-01-21"
    }
];

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "bookingNumber", label: "Booking Number" },
    { key: "guestName", label: "Guest Name" },
    { key: "gender", label: "Gender" },
    { key: "mobile", label: "Mobile" },
    { key: "email", label: "Email" },
    { key: "identityType", label: "Identity Type" },
    { key: "identityId", label: "ID" },
    { key: "action", label: "Action" }
];

export default function GuestListPage() {
    const [entries, setEntries] = useState(10);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));
    const [guests, setGuests] = useState<Guest[]>(mockGuests);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [formData, setFormData] = useState({
        bookingNumber: "",
        guestName: "",
        gender: "",
        mobile: "",
        email: "",
        identityType: "",
        identityId: ""
    });

    // Handle form submission for add
    const handleAddSubmit = () => {
        if (!formData.bookingNumber || !formData.guestName) return;
        
        const newGuest: Guest = {
            id: Math.max(...guests.map(g => g.id)) + 1,
            bookingNumber: formData.bookingNumber,
            guestName: formData.guestName,
            gender: formData.gender,
            mobile: formData.mobile,
            email: formData.email,
            identityType: formData.identityType,
            identityId: formData.identityId,
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        setGuests([...guests, newGuest]);
        setShowAddModal(false);
        setFormData({
            bookingNumber: "",
            guestName: "",
            gender: "",
            mobile: "",
            email: "",
            identityType: "",
            identityId: ""
        });
    };

    // Handle form submission for edit
    const handleEditSubmit = () => {
        if (!selectedGuest || !formData.bookingNumber || !formData.guestName) return;
        
        setGuests(guests.map(g => 
            g.id === selectedGuest.id 
                ? { ...g, ...formData }
                : g
        ));
        
        setShowEditModal(false);
        setSelectedGuest(null);
        setFormData({
            bookingNumber: "",
            guestName: "",
            gender: "",
            mobile: "",
            email: "",
            identityType: "",
            identityId: ""
        });
    };

    // Handle edit click
    const handleEditClick = (guest: Guest) => {
        setSelectedGuest(guest);
        setFormData({
            bookingNumber: guest.bookingNumber,
            guestName: guest.guestName,
            gender: guest.gender,
            mobile: guest.mobile,
            email: guest.email,
            identityType: guest.identityType,
            identityId: guest.identityId
        });
        setShowEditModal(true);
    };

    // Filtering
    const filteredGuests = useMemo(() => {
        return guests.filter(guest =>
            guest.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guest.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guest.mobile.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guest.identityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guest.identityId.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, guests]);

    // Sorting
    const sortedGuests = useMemo(() => {
        const sorted = [...filteredGuests];
        if (sort.key === "sl") {
            sorted.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "bookingNumber") {
            sorted.sort((a, b) => {
                const result = a.bookingNumber.localeCompare(b.bookingNumber);
                return sort.dir === "asc" ? result : -result;
            });
        } else if (sort.key === "guestName") {
            sorted.sort((a, b) => {
                const result = a.guestName.localeCompare(b.guestName);
                return sort.dir === "asc" ? result : -result;
            });
        } else if (sort.key === "mobile") {
            sorted.sort((a, b) => {
                const result = a.mobile.localeCompare(b.mobile);
                return sort.dir === "asc" ? result : -result;
            });
        } else if (sort.key === "email") {
            sorted.sort((a, b) => {
                const result = a.email.localeCompare(b.email);
                return sort.dir === "asc" ? result : -result;
            });
        }
        return sorted;
    }, [filteredGuests, sort]);

    // Pagination
    const totalPages = Math.ceil(sortedGuests.length / entries);
    const paginatedGuests = sortedGuests.slice((page - 1) * entries, page * entries);

    // Export handlers
    const handleExport = (type: string) => {
        alert(`Export as ${type}`);
    };

    // Delete guest
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this guest?")) {
            setGuests(guests.filter(g => g.id !== id));
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
                                <BreadcrumbLink href="/customer/guest-list" className="text-sm font-medium">
                                    Guest List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-primary" />
                            <h1 className="text-xl font-semibold text-foreground">Guest List</h1>
                        </div>
                        <Button 
                            onClick={() => setShowAddModal(true)}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Guest
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
                                    placeholder="Search guests..."
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
                                    ["sl", "bookingNumber", "guestName", "mobile", "email", "action"] :
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
                                                {col.key !== "action" && col.key !== "gender" && col.key !== "identityType" && col.key !== "identityId" && (
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
                                {paginatedGuests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">No guests found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedGuests.map((guest, idx) => (
                                        <TableRow key={guest.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("bookingNumber") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {guest.bookingNumber}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("guestName") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {guest.guestName}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("gender") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {guest.gender || "-"}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("mobile") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {guest.mobile || "-"}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("email") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {guest.email || "-"}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("identityType") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {guest.identityType || "-"}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("identityId") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {guest.identityId || "-"}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditClick(guest)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(guest.id)}
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
                            Showing {(page - 1) * entries + 1} to {Math.min(page * entries, sortedGuests.length)} of {sortedGuests.length} entries
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

            {/* Add Guest Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add New Guest
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bookingNumber" className="text-sm font-medium">
                                    Booking Number
                                </Label>
                                <Input
                                    id="bookingNumber"
                                    placeholder="Enter booking number"
                                    value={formData.bookingNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bookingNumber: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guestName" className="text-sm font-medium">
                                    Guest Name
                                </Label>
                                <Input
                                    id="guestName"
                                    placeholder="Enter guest name"
                                    value={formData.guestName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender" className="text-sm font-medium">
                                    Gender
                                </Label>
                                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="text-sm font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Mobile
                                </Label>
                                <Input
                                    id="mobile"
                                    placeholder="Enter mobile number"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="identityType" className="text-sm font-medium">
                                    Identity Type
                                </Label>
                                <Select value={formData.identityType} onValueChange={(value) => setFormData(prev => ({ ...prev, identityType: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select identity type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Passport">Passport</SelectItem>
                                        <SelectItem value="National ID">National ID</SelectItem>
                                        <SelectItem value="Driver License">Driver License</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="identityId" className="text-sm font-medium flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Identity ID
                                </Label>
                                <Input
                                    id="identityId"
                                    placeholder="Enter identity ID"
                                    value={formData.identityId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, identityId: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setFormData({
                                        bookingNumber: "",
                                        guestName: "",
                                        gender: "",
                                        mobile: "",
                                        email: "",
                                        identityType: "",
                                        identityId: ""
                                    });
                                }}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddSubmit}
                                disabled={!formData.bookingNumber || !formData.guestName}
                                className="px-4"
                            >
                                Add Guest
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Guest Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Guest
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editBookingNumber" className="text-sm font-medium">
                                    Booking Number
                                </Label>
                                <Input
                                    id="editBookingNumber"
                                    placeholder="Enter booking number"
                                    value={formData.bookingNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bookingNumber: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editGuestName" className="text-sm font-medium">
                                    Guest Name
                                </Label>
                                <Input
                                    id="editGuestName"
                                    placeholder="Enter guest name"
                                    value={formData.guestName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editGender" className="text-sm font-medium">
                                    Gender
                                </Label>
                                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editMobile" className="text-sm font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Mobile
                                </Label>
                                <Input
                                    id="editMobile"
                                    placeholder="Enter mobile number"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editEmail" className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </Label>
                            <Input
                                id="editEmail"
                                type="email"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editIdentityType" className="text-sm font-medium">
                                    Identity Type
                                </Label>
                                <Select value={formData.identityType} onValueChange={(value) => setFormData(prev => ({ ...prev, identityType: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select identity type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Passport">Passport</SelectItem>
                                        <SelectItem value="National ID">National ID</SelectItem>
                                        <SelectItem value="Driver License">Driver License</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editIdentityId" className="text-sm font-medium flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Identity ID
                                </Label>
                                <Input
                                    id="editIdentityId"
                                    placeholder="Enter identity ID"
                                    value={formData.identityId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, identityId: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedGuest(null);
                                    setFormData({
                                        bookingNumber: "",
                                        guestName: "",
                                        gender: "",
                                        mobile: "",
                                        email: "",
                                        identityType: "",
                                        identityId: ""
                                    });
                                }}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditSubmit}
                                disabled={!formData.bookingNumber || !formData.guestName}
                                className="px-4"
                            >
                                Update Guest
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}