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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    ChevronDown,
    ChevronUp,
    Copy,
    CreditCard,
    Edit,
    Eye,
    FileText,
    Home,
    Loader2,
    Mail,
    Phone,
    Plus,
    Printer,
    RotateCcw,
    Search,
    Trash2,
    Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

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
    customerData?: {
        title?: string;
        firstName: string;
        lastName?: string;
        dateOfBirth: string;
        anniversary?: string;
        nationality: string;
        isVip: boolean;
        occupation?: string;
        countryCode: string;
        contactType?: string;
        country?: string;
        state?: string;
        city?: string;
        zipcode?: string;
        address: string;
        frontIdUrl?: string;
        backIdUrl?: string;
        guestImageUrl?: string;
    };
}

interface GuestResponse {
    data: Guest[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

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
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "id", dir: "desc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        gender: "",
        dateOfBirth: "",
        nationality: "US",
        mobile: "",
        email: "",
        address: "",
        identityType: "",
        identityId: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset page when search query or entries change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, entries]);

    // Build API URL with query parameters
    const buildApiUrl = () => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: entries.toString(),
            sortBy: sort.key,
            sortDir: sort.dir,
        });

        if (searchQuery) {
            params.append('search', searchQuery);
        }

        return `/api/customer/guest-list?${params.toString()}`;
    };

    // Fetch guests with SWR
    const { data: guestData, error, isLoading, mutate } = useSWR<GuestResponse>(
        buildApiUrl(),
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            keepPreviousData: true,
            dedupingInterval: 5000,
        }
    );

    const guests = guestData?.data || [];
    const totalGuests = guestData?.pagination.total || 0;
    const totalPages = guestData?.pagination.totalPages || 0;

    // Handle form submission for add
    const handleAddSubmit = async () => {
        if (!formData.firstName || !formData.gender || !formData.dateOfBirth || !formData.email || !formData.mobile || !formData.address) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/customer/guest-list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName || null,
                    gender: formData.gender,
                    dateOfBirth: formData.dateOfBirth,
                    nationality: formData.nationality,
                    email: formData.email,
                    phone: formData.mobile,
                    address: formData.address,
                    identityType: formData.identityType || null,
                    identityNumber: formData.identityId || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create guest');
            }

            toast.success("Guest added successfully");
            setShowAddModal(false);
            resetForm();
            mutate(); // Refresh data
        } catch (error: any) {
            toast.error(error.message || "Failed to add guest");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle form submission for edit
    const handleEditSubmit = async () => {
        if (!selectedGuest || !formData.firstName || !formData.gender || !formData.dateOfBirth || !formData.email || !formData.mobile || !formData.address) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/customer/guest-list', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectedGuest.id,
                    firstName: formData.firstName,
                    lastName: formData.lastName || null,
                    gender: formData.gender,
                    dateOfBirth: formData.dateOfBirth,
                    nationality: formData.nationality,
                    email: formData.email,
                    phone: formData.mobile,
                    address: formData.address,
                    identityType: formData.identityType || null,
                    identityNumber: formData.identityId || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update guest');
            }

            toast.success("Guest updated successfully");
            setShowEditModal(false);
            setSelectedGuest(null);
            resetForm();
            mutate(); // Refresh data
        } catch (error: any) {
            toast.error(error.message || "Failed to update guest");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle edit click
    const handleEditClick = (guest: Guest) => {
        setSelectedGuest(guest);
        setFormData({
            firstName: guest.customerData?.firstName || guest.guestName.split(' ')[0],
            lastName: guest.customerData?.lastName || guest.guestName.split(' ').slice(1).join(' '),
            gender: guest.gender,
            dateOfBirth: guest.customerData?.dateOfBirth?.split('T')[0] || "",
            nationality: guest.customerData?.nationality || "US",
            mobile: guest.mobile,
            email: guest.email,
            address: guest.customerData?.address || "",
            identityType: guest.identityType,
            identityId: guest.identityId
        });
        setShowEditModal(true);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            firstName: "",
            lastName: "",
            gender: "",
            dateOfBirth: "",
            nationality: "US",
            mobile: "",
            email: "",
            address: "",
            identityType: "",
            identityId: ""
        });
    };

    // Export handlers
    const handleExport = (type: "Copy" | "CSV" | "PDF" | "Print") => {
        if (!guests?.length) {
            toast.warning("No data available to export");
            return;
        }

        // Prepare export data
        const exportData = guests.map((guest, index) => ({
            sl: index + 1,
            bookingNumber: guest.bookingNumber || "-",
            guestName: guest.guestName || "-",
            gender: guest.gender || "-",
            mobile: guest.mobile || "-",
            email: guest.email || "-",
            identityType: guest.identityType || "-",
            identityId: guest.identityId || "-",
            createdAt: guest.createdAt
                ? new Date(guest.createdAt).toLocaleDateString("en-CA") // YYYY-MM-DD
                : "-",
        }));

        // ---- COPY ----
        if (type === "Copy") {
            const text = exportData
                .map(
                    row =>
                        `${row.sl}\t${row.bookingNumber}\t${row.guestName}\t${row.gender}\t${row.mobile}\t${row.email}\t${row.identityType}\t${row.identityId}\t${row.createdAt}`
                )
                .join("\n");
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard!");
        }

        // ---- CSV ----
        if (type === "CSV") {
            const headers = [
                "SL",
                "Booking Number",
                "Guest Name",
                "Gender",
                "Mobile",
                "Email",
                "Identity Type",
                "ID",
                "Created At",
            ];
            const rows = exportData.map(row => [
                row.sl,
                row.bookingNumber,
                row.guestName,
                row.gender,
                row.mobile,
                row.email,
                row.identityType,
                row.identityId,
                row.createdAt,
            ]);
            const csvContent =
                "data:text/csv;charset=utf-8," +
                [headers, ...rows].map(e => e.join(",")).join("\n");

            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.download = "guest-list.csv";
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
            doc.text("Guest List Report", 105, 30, { align: "center" });

            autoTable(doc, {
                startY: 40,
                head: [
                    [
                        "SL",
                        "Booking Number",
                        "Guest Name",
                        "Gender",
                        "Mobile",
                        "Email",
                        "Identity Type",
                        "ID",
                        "Created At",
                    ],
                ],
                body: exportData.map(row => [
                    row.sl,
                    row.bookingNumber,
                    row.guestName,
                    row.gender,
                    row.mobile,
                    row.email,
                    row.identityType,
                    row.identityId,
                    row.createdAt,
                ]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            doc.save("guest-list.pdf");
            toast.success("PDF downloaded!");
        }

        // ---- PRINT ----
        if (type === "Print") {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
<html>
  <head>
    <title>Guest List Report</title>
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
    <h3>Guest List Report</h3>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Booking Number</th>
          <th>Guest Name</th>
          <th>Gender</th>
          <th>Mobile</th>
          <th>Email</th>
          <th>Identity Type</th>
          <th>ID</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        ${exportData
                        .map(
                            row => `
          <tr>
            <td>${row.sl}</td>
            <td>${row.bookingNumber}</td>
            <td>${row.guestName}</td>
            <td>${row.gender}</td>
            <td>${row.mobile}</td>
            <td>${row.email}</td>
            <td>${row.identityType}</td>
            <td>${row.identityId}</td>
            <td>${row.createdAt}</td>
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

    // Delete guest
    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this guest?")) return;

        try {
            const response = await fetch('/api/customer/guest-list', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete guest');
            }

            toast.success("Guest deleted successfully");
            mutate(); // Refresh data
        } catch (error: any) {
            toast.error(error.message || "Failed to delete guest");
        }
    };

    // Loading skeleton
    if (isLoading && guests.length === 0) {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="px-4 py-4 space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="text-center space-y-4">
                    <div className="text-red-600 text-lg font-medium">Failed to load guests</div>
                    <Button 
                        onClick={() => mutate()}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Retry
                    </Button>
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
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        </div>
                        {/* <Button 
                            onClick={() => setShowAddModal(true)}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <Plus className="w-4 h-4" />
                            Add New Guest
                        </Button> */}
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
                                    placeholder="Search guests..."
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
                                    ["sl", "bookingNumber", "guestName", "mobile", "email", "action"] :
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
                                {guests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">
                                                    {searchQuery ? "No guests found matching your search" : "No guests found"}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    guests.map((guest, idx) => (
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
                                                        <Link href={`/customer/guest-list/update/${guest.id}`} >
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                          
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                            disabled={isLoading}
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                            </Link>
                                                        {/* <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(guest.id)}
                                                            className="h-8 w-8 p-0 rounded-full border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm"
                                                            disabled={isLoading}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </Button> */}
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
                            Showing {guests.length === 0 ? 0 : (page - 1) * entries + 1} to {Math.min(page * entries, totalGuests)} of {totalGuests} entries
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
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-sm font-medium">
                                    First Name *
                                </Label>
                                <Input
                                    id="firstName"
                                    placeholder="Enter first name"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-sm font-medium">
                                    Last Name
                                </Label>
                                <Input
                                    id="lastName"
                                    placeholder="Enter last name"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender" className="text-sm font-medium">
                                    Gender *
                                </Label>
                                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))} disabled={isSubmitting}>
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
                                <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                                    Date of Birth *
                                </Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nationality" className="text-sm font-medium">
                                    Nationality *
                                </Label>
                                <Select value={formData.nationality} onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))} disabled={isSubmitting}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select nationality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="US">United States</SelectItem>
                                        <SelectItem value="UK">United Kingdom</SelectItem>
                                        <SelectItem value="CA">Canada</SelectItem>
                                        <SelectItem value="AU">Australia</SelectItem>
                                        <SelectItem value="IN">India</SelectItem>
                                        <SelectItem value="DE">Germany</SelectItem>
                                        <SelectItem value="FR">France</SelectItem>
                                        <SelectItem value="JP">Japan</SelectItem>
                                        <SelectItem value="CN">China</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="text-sm font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Mobile *
                                </Label>
                                <Input
                                    id="mobile"
                                    placeholder="Enter mobile number"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email *
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-medium">
                                Address *
                            </Label>
                            <Textarea
                                id="address"
                                placeholder="Enter address"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                rows={3}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="identityType" className="text-sm font-medium">
                                    Identity Type
                                </Label>
                                <Select value={formData.identityType} onValueChange={(value) => setFormData(prev => ({ ...prev, identityType: value }))} disabled={isSubmitting}>
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
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddModal(false);
                                    resetForm();
                                }}
                                disabled={isSubmitting}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddSubmit}
                                disabled={!formData.firstName || !formData.gender || !formData.dateOfBirth || !formData.email || !formData.mobile || !formData.address || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Guest"
                                )}
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
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Same form fields as Add Modal */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editFirstName" className="text-sm font-medium">
                                    First Name *
                                </Label>
                                <Input
                                    id="editFirstName"
                                    placeholder="Enter first name"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editLastName" className="text-sm font-medium">
                                    Last Name
                                </Label>
                                <Input
                                    id="editLastName"
                                    placeholder="Enter last name"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editGender" className="text-sm font-medium">
                                    Gender *
                                </Label>
                                <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))} disabled={isSubmitting}>
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
                                <Label htmlFor="editDateOfBirth" className="text-sm font-medium">
                                    Date of Birth *
                                </Label>
                                <Input
                                    id="editDateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editNationality" className="text-sm font-medium">
                                    Nationality *
                                </Label>
                                <Select value={formData.nationality} onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))} disabled={isSubmitting}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select nationality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="US">United States</SelectItem>
                                        <SelectItem value="UK">United Kingdom</SelectItem>
                                        <SelectItem value="CA">Canada</SelectItem>
                                        <SelectItem value="AU">Australia</SelectItem>
                                        <SelectItem value="IN">India</SelectItem>
                                        <SelectItem value="DE">Germany</SelectItem>
                                        <SelectItem value="FR">France</SelectItem>
                                        <SelectItem value="JP">Japan</SelectItem>
                                        <SelectItem value="CN">China</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editMobile" className="text-sm font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Mobile *
                                </Label>
                                <Input
                                    id="editMobile"
                                    placeholder="Enter mobile number"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editEmail" className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email *
                            </Label>
                            <Input
                                id="editEmail"
                                type="email"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editAddress" className="text-sm font-medium">
                                Address *
                            </Label>
                            <Textarea
                                id="editAddress"
                                placeholder="Enter address"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                rows={3}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editIdentityType" className="text-sm font-medium">
                                    Identity Type
                                </Label>
                                <Select value={formData.identityType} onValueChange={(value) => setFormData(prev => ({ ...prev, identityType: value }))} disabled={isSubmitting}>
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
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedGuest(null);
                                    resetForm();
                                }}
                                disabled={isSubmitting}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditSubmit}
                                disabled={!formData.firstName || !formData.gender || !formData.dateOfBirth || !formData.email || !formData.mobile || !formData.address || isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Guest"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}