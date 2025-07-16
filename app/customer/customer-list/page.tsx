"use client";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
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
    DollarSign,
    CreditCard,
    ChevronUp,
    ChevronDown,
    Users
} from "lucide-react";
import { useState, useMemo } from "react";

interface Customer {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    balance: number;
    status: "Active" | "Inactive" | "Blocked";
    createdAt: string;
}

const mockCustomers: Customer[] = [
    {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        balance: 150.00,
        status: "Active",
        createdAt: "2024-01-15"
    },
    {
        id: 2,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "+1987654321",
        balance: -50.00,
        status: "Active",
        createdAt: "2024-01-16"
    },
    {
        id: 3,
        firstName: "Michael",
        lastName: "Johnson",
        email: "michael.j@example.com",
        phone: "+1555123456",
        balance: 0.00,
        status: "Inactive",
        createdAt: "2024-01-17"
    },
    {
        id: 4,
        firstName: "Emily",
        lastName: "Brown",
        email: "emily.brown@example.com",
        phone: "+1444987654",
        balance: 300.00,
        status: "Active",
        createdAt: "2024-01-18"
    },
    {
        id: 5,
        firstName: "David",
        lastName: "Wilson",
        email: "david.wilson@example.com",
        phone: "+1333456789",
        balance: -25.00,
        status: "Blocked",
        createdAt: "2024-01-19"
    },
    {
        id: 6,
        firstName: "Sarah",
        lastName: "Davis",
        email: "sarah.davis@example.com",
        phone: "+1222345678",
        balance: 75.00,
        status: "Active",
        createdAt: "2024-01-20"
    }
];

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "balance", label: "Balance" },
    { key: "status", label: "Status" },
    { key: "action", label: "Action" }
];

export default function CustomerListPage() {
    const [entries, setEntries] = useState(10);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

    // Filtering
    const filteredCustomers = useMemo(() => {
        return customers.filter(customer =>
            customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.status.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, customers]);

    // Sorting
    const sortedCustomers = useMemo(() => {
        const sorted = [...filteredCustomers];
        if (sort.key === "sl") {
            sorted.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "firstName") {
            sorted.sort((a, b) => {
                const result = a.firstName.localeCompare(b.firstName);
                return sort.dir === "asc" ? result : -result;
            });
        } else if (sort.key === "lastName") {
            sorted.sort((a, b) => {
                const result = a.lastName.localeCompare(b.lastName);
                return sort.dir === "asc" ? result : -result;
            });
        } else if (sort.key === "email") {
            sorted.sort((a, b) => {
                const result = a.email.localeCompare(b.email);
                return sort.dir === "asc" ? result : -result;
            });
        } else if (sort.key === "balance") {
            sorted.sort((a, b) => sort.dir === "asc" ? a.balance - b.balance : b.balance - a.balance);
        }
        return sorted;
    }, [filteredCustomers, sort]);

    // Pagination
    const totalPages = Math.ceil(sortedCustomers.length / entries);
    const paginatedCustomers = sortedCustomers.slice((page - 1) * entries, page * entries);

    // Export handlers
    const handleExport = (type: string) => {
        alert(`Export as ${type}`);
    };

    // Delete customer
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this customer?")) {
            setCustomers(customers.filter(c => c.id !== id));
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return `$${Math.abs(amount).toFixed(2)}`;
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active':
                return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">Active</Badge>;
            case 'Inactive':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">Inactive</Badge>;
            case 'Blocked':
                return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">Blocked</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header Section */}
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
                <div className="px-4 py-3 space-y-3">
                    {/* Breadcrumb */}
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <Home className="w-3.5 h-3.5" /> Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/customers" className="text-sm font-medium">
                                    Customer List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            <h1 className="text-lg font-semibold text-foreground">Customer Management</h1>
                        </div>
                        <Button className="h-8 px-4 rounded-full shadow-md flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5" />
                            Add New Customer
                        </Button>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="flex-shrink-0 bg-white shadow-lg border-b border-border/50">
                <div className="px-4 py-3 space-y-3">
                    {/* Top Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Entries Selection */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Show</span>
                            <Select value={String(entries)} onValueChange={v => { setEntries(Number(v)); setPage(1); }}>
                                <SelectTrigger className="w-16 h-8 text-xs rounded-lg border-border/50 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizes.map(size => (
                                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-xs font-medium text-muted-foreground">entries</span>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex gap-1.5">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("Copy")}
                                className="h-8 px-3 rounded-full text-xs shadow-sm"
                            >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("CSV")}
                                className="h-8 px-3 rounded-full text-xs shadow-sm"
                            >
                                <FileText className="w-3 h-3 mr-1" />
                                CSV
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("PDF")}
                                className="h-8 px-3 rounded-full text-xs shadow-sm"
                            >
                                <FileText className="w-3 h-3 mr-1" />
                                PDF
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport("Print")}
                                className="h-8 px-3 rounded-full text-xs shadow-sm"
                            >
                                <Printer className="w-3 h-3 mr-1" />
                                Print
                            </Button>
                        </div>

                        {/* Search Bar */}
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs font-medium text-muted-foreground">Search:</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-9 h-8 w-48 text-xs rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
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
                                    ["sl", "firstName", "lastName", "email", "phone", "balance", "action"] :
                                    columns.map(c => c.key);
                                setVisibleCols(next);
                            }}
                            className="h-8 px-3 rounded-lg text-xs shadow-sm"
                        >
                            <Eye className="w-3 h-3 mr-1" />
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
                                            className="text-xs font-medium text-muted-foreground cursor-pointer select-none hover:bg-accent transition-colors duration-200 border-b border-border/50 whitespace-nowrap h-10"
                                            onClick={() => {
                                                if (col.key !== "action") {
                                                    setSort(s => ({
                                                        key: col.key,
                                                        dir: s.key === col.key ? (s.dir === "asc" ? "desc" : "asc") : "asc"
                                                    }));
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-1">
                                                {col.label}
                                                {col.key !== "action" && col.key !== "status" && (
                                                    <div className="flex flex-col">
                                                        {sort.key === col.key ? (
                                                            sort.dir === "asc" ?
                                                                <ChevronUp className="w-3 h-3 text-foreground" /> :
                                                                <ChevronDown className="w-3 h-3 text-foreground" />
                                                        ) : (
                                                            <ChevronUp className="w-3 h-3 text-muted-foreground/50" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCustomers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <Settings className="w-8 h-8 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">No customers found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedCustomers.map((customer, idx) => (
                                        <TableRow key={customer.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-xs text-foreground font-medium py-2">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("firstName") && (
                                                <TableCell className="text-xs text-foreground font-medium py-2">
                                                    {customer.firstName}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("lastName") && (
                                                <TableCell className="text-xs text-foreground py-2">
                                                    {customer.lastName}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("email") && (
                                                <TableCell className="text-xs text-foreground py-2">
                                                    {customer.email}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("phone") && (
                                                <TableCell className="text-xs text-foreground py-2">
                                                    {customer.phone}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("balance") && (
                                                <TableCell className="text-xs py-2">
                                                    <div className="flex items-center gap-1">
                                                        <span className={`font-medium ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {customer.balance >= 0 ? '+' : '-'}{formatCurrency(customer.balance)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("status") && (
                                                <TableCell className="py-2">
                                                    {getStatusBadge(customer.status)}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-2">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => window.location.href = `/customers/edit/${customer.id}`}
                                                            className="h-7 w-7 p-0 rounded-full border-green-200 hover:bg-green-50 hover:border-green-300 shadow-sm"
                                                        >
                                                            <Edit className="w-3 h-3 text-green-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => window.location.href = `/customers/payment/${customer.id}`}
                                                            className="h-7 w-7 p-0 rounded-full border-teal-200 hover:bg-teal-50 hover:border-teal-300 shadow-sm"
                                                        >
                                                            <DollarSign className="w-3 h-3 text-teal-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => window.location.href = `/customers/options/${customer.id}`}
                                                            className="h-7 w-7 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                        >
                                                            <Settings className="w-3 h-3 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => window.location.href = `/customers/view/${customer.id}`}
                                                            className="h-7 w-7 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                        >
                                                            <Eye className="w-3 h-3 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(customer.id)}
                                                            className="h-7 w-7 p-0 rounded-full border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm"
                                                        >
                                                            <Trash2 className="w-3 h-3 text-red-600" />
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
                <div className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-muted-foreground">
                            Showing {(page - 1) * entries + 1} to {Math.min(page * entries, sortedCustomers.length)} of {sortedCustomers.length} entries
                        </div>

                        {totalPages > 1 && (
                            <Pagination>
                                <PaginationContent className="flex justify-center">
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage(Math.max(1, page - 1))}
                                            className={`${page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full shadow-sm h-8 px-3 text-xs`}
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
                                                    className={`cursor-pointer rounded-full hover:bg-accent h-8 px-3 text-xs ${page === pageNum ? "shadow-md" : "shadow-sm"}`}
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                                            className={`${page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full shadow-sm h-8 px-3 text-xs`}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}