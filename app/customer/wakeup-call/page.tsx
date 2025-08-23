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
import { Card, CardContent } from "@/components/ui/card";
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
    Clock,
    MessageSquare,
    Phone,
    User,
    X,
    Loader2
} from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

interface Customer {
    id: number;
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
    countryCode: string;
}

interface WakeUpCall {
    id: number;
    customerId: number;
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    remarks: string;
    status: "Pending" | "Completed" | "Cancelled";
    createdAt: string;
}

const mockWakeUpCalls: WakeUpCall[] = [
   
];

const pageSizes = [10, 25, 50, 100];

const columns = [
    { key: "sl", label: "SL" },
    { key: "customerName", label: "Customer Name" },
    { key: "customerPhone", label: "Phone" },
    { key: "date", label: "Date" },
    { key: "remarks", label: "Remarks" },
    { key: "action", label: "Action" }
];

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function WakeUpCallListPage() {
    const [entries, setEntries] = useState(10);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "sl", dir: "asc" });
    const [visibleCols, setVisibleCols] = useState(columns.map(c => c.key));
    const [wakeUpCalls, setWakeUpCalls] = useState<WakeUpCall[]>(mockWakeUpCalls);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedWakeUpCall, setSelectedWakeUpCall] = useState<WakeUpCall | null>(null);

    // Customer search states
    const [customerSearchQuery, setCustomerSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);

    const [formData, setFormData] = useState({
        date: "",
        time: "",
        remarks: ""
    });

    // Customer search with SWR
    const {
        data: customers,
        error: customerError,
        isLoading: isLoadingCustomers
    } = useSWR<Customer[]>(
        customerSearchQuery.length >= 2 ? `/api/customer/wakeup-call/customer?q=${encodeURIComponent(customerSearchQuery)}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 300,
        }
    );

    // Handle customer search
    const handleCustomerSearch = () => {
        if (customerSearchQuery.length < 2) {
            toast.error("Please enter at least 2 characters to search");
            return;
        }
        setShowCustomerSearch(true);
    };

    // Handle customer selection
    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowCustomerSearch(false);
        setCustomerSearchQuery("");
    };

    // Clear selected customer
    const handleClearCustomer = () => {
        setSelectedCustomer(null);
        setCustomerSearchQuery("");
    };

    // Handle form submission for add
    const handleAddSubmit = () => {
        if (!selectedCustomer || !formData.date || !formData.time) {
            toast.error("Please fill in all required fields");
            return;
        }

        const newWakeUpCall: WakeUpCall = {
            id: Math.max(...wakeUpCalls.map(w => w.id)) + 1,
            customerId: selectedCustomer.id,
            customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}`.trim(),
            customerPhone: `${selectedCustomer.countryCode} ${selectedCustomer.phone}`,
            date: formData.date,
            time: formData.time,
            remarks: formData.remarks,
            status: "Pending",
            createdAt: new Date().toISOString().split('T')[0]
        };

        setWakeUpCalls([...wakeUpCalls, newWakeUpCall]);
        setShowAddModal(false);
        setSelectedCustomer(null);
        setFormData({ date: "", time: "", remarks: "" });
        toast.success("Wake up call added successfully!");
    };

    // Handle form submission for edit
    const handleEditSubmit = () => {
        if (!selectedWakeUpCall || !selectedCustomer || !formData.date || !formData.time) {
            toast.error("Please fill in all required fields");
            return;
        }

        setWakeUpCalls(wakeUpCalls.map(w =>
            w.id === selectedWakeUpCall.id
                ? {
                    ...w,
                    customerId: selectedCustomer.id,
                    customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}`.trim(),
                    customerPhone: `${selectedCustomer.countryCode} ${selectedCustomer.phone}`,
                    date: formData.date,
                    time: formData.time,
                    remarks: formData.remarks
                }
                : w
        ));

        setShowEditModal(false);
        setSelectedWakeUpCall(null);
        setSelectedCustomer(null);
        setFormData({ date: "", time: "", remarks: "" });
        toast.success("Wake up call updated successfully!");
    };

    // Handle edit click
    const handleEditClick = (wakeUpCall: WakeUpCall) => {
        setSelectedWakeUpCall(wakeUpCall);
        setSelectedCustomer({
            id: wakeUpCall.customerId,
            firstName: wakeUpCall.customerName.split(' ')[0],
            lastName: wakeUpCall.customerName.split(' ').slice(1).join(' '),
            email: '', // You might want to fetch this from API
            phone: wakeUpCall.customerPhone.split(' ').slice(1).join(''),
            countryCode: wakeUpCall.customerPhone.split(' ')[0]
        });
        setFormData({
            date: wakeUpCall.date,
            time: wakeUpCall.time,
            remarks: wakeUpCall.remarks
        });
        setShowEditModal(true);
    };

    // Reset modal state
    const resetModalState = () => {
        setSelectedCustomer(null);
        setCustomerSearchQuery("");
        setShowCustomerSearch(false);
        setFormData({ date: "", time: "", remarks: "" });
    };

    // Filtering
    const filteredWakeUpCalls = useMemo(() => {
        return wakeUpCalls.filter(wakeUpCall =>
            wakeUpCall.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            wakeUpCall.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
            wakeUpCall.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
            wakeUpCall.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
            wakeUpCall.remarks.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, wakeUpCalls]);

    // Sorting
    const sortedWakeUpCalls = useMemo(() => {
        const sorted = [...filteredWakeUpCalls];
        if (sort.key === "sl") {
            sorted.sort((a, b) => sort.dir === "asc" ? a.id - b.id : b.id - a.id);
        } else if (sort.key === "customerName") {
            sorted.sort((a, b) => {
                const result = a.customerName.localeCompare(b.customerName);
                return sort.dir === "asc" ? result : -result;
            });
        } else if (sort.key === "date") {
            sorted.sort((a, b) => {
                const result = new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime();
                return sort.dir === "asc" ? result : -result;
            });
        }
        return sorted;
    }, [filteredWakeUpCalls, sort]);

    // Pagination
    const totalPages = Math.ceil(sortedWakeUpCalls.length / entries);
    const paginatedWakeUpCalls = sortedWakeUpCalls.slice((page - 1) * entries, page * entries);

    // Export handlers
    const handleExport = (type: "Copy" | "CSV" | "PDF" | "Print") => {
        if (!wakeUpCalls?.length) {
            toast.warning("No data available to export");
            return;
        }

        // Prepare export data
        const exportData = wakeUpCalls.map((call, index) => ({
            sl: index + 1,
            customerName: call.customerName || "-",
            customerPhone: call.customerPhone || "-",
            dateTime: `${call.date} ${call.time}`,
            remarks: call.remarks || "-",
            status: call.status,
            createdAt: call.createdAt
                ? new Date(call.createdAt).toLocaleDateString("en-CA")
                : "-",
        }));

        // ---- COPY ----
        if (type === "Copy") {
            const text = exportData
                .map(
                    row =>
                        `${row.sl}\t${row.customerName}\t${row.customerPhone}\t${row.dateTime}\t${row.remarks}\t${row.status}\t${row.createdAt}`
                )
                .join("\n");
            navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard!");
        }

        // ---- CSV ----
        if (type === "CSV") {
            const headers = [
                "SL",
                "Customer Name",
                "Phone",
                "Date & Time",
                "Remarks",
                "Status",
                "Created At",
            ];
            const rows = exportData.map(row => [
                row.sl,
                row.customerName,
                row.customerPhone,
                row.dateTime,
                `"${row.remarks}"`, // wrap remarks to avoid CSV break
                row.status,
                row.createdAt,
            ]);

            const csvContent =
                "data:text/csv;charset=utf-8," +
                [headers, ...rows].map(e => e.join(",")).join("\n");

            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.download = "wake-up-calls.csv";
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
            doc.text("Wake-Up Call Report", 105, 30, { align: "center" });

            autoTable(doc, {
                startY: 40,
                head: [
                    [
                        "SL",
                        "Customer Name",
                        "Phone",
                        "Date & Time",
                        "Remarks",
                        "Status",
                        "Created At",
                    ],
                ],
                body: exportData.map(row => [
                    row.sl,
                    row.customerName,
                    row.customerPhone,
                    row.dateTime,
                    row.remarks,
                    row.status,
                    row.createdAt,
                ]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                bodyStyles: { textColor: 50 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });

            doc.save("wake-up-calls.pdf");
            toast.success("PDF downloaded!");
        }

        // ---- PRINT ----
        if (type === "Print") {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
<html>
  <head>
    <title>Wake-Up Call Report</title>
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
    <h3>Wake-Up Call Report</h3>
    <table>
      <thead>
        <tr>
          <th>SL</th>
          <th>Customer Name</th>
          <th>Phone</th>
          <th>Date & Time</th>
          <th>Remarks</th>
          <th>Status</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        ${exportData
                        .map(
                            row => `
          <tr>
            <td>${row.sl}</td>
            <td>${row.customerName}</td>
            <td>${row.customerPhone}</td>
            <td>${row.dateTime}</td>
            <td>${row.remarks}</td>
            <td>${row.status}</td>
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


    // Delete wake up call
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this wake up call?")) {
            setWakeUpCalls(wakeUpCalls.filter(w => w.id !== id));
            toast.success("Wake up call deleted successfully!");
        }
    };

    // Format date and time
    const formatDateTime = (date: string, time: string) => {
        return `${date} ${time}`;
    };

    // Customer Search Component
    const CustomerSearchSection = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer
                </Label>

                {selectedCustomer ? (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-green-800">
                                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                                    </p>
                                    <p className="text-sm text-green-600">
                                        {selectedCustomer.countryCode} {selectedCustomer.phone}
                                    </p>
                                    {selectedCustomer.email && (
                                        <p className="text-sm text-green-600">{selectedCustomer.email}</p>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleClearCustomer}
                                    className="text-green-700 hover:text-green-900"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Search customer by name or phone..."
                                value={customerSearchQuery}
                                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                            />
                            <Button
                                onClick={handleCustomerSearch}
                                disabled={customerSearchQuery.length < 2 || isLoadingCustomers}
                                className="px-4"
                            >
                                {isLoadingCustomers ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        {showCustomerSearch && (
                            <Card className="max-h-48 overflow-y-auto">
                                <CardContent className="p-2">
                                    {isLoadingCustomers ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                                        </div>
                                    ) : customerError ? (
                                        <div className="text-center py-4">
                                            <p className="text-sm text-red-600">Error searching customers</p>
                                        </div>
                                    ) : customers && customers.length > 0 ? (
                                        <div className="space-y-1">
                                            {customers.map((customer) => (
                                                <Button
                                                    key={customer.id}
                                                    variant="ghost"
                                                    className="w-full justify-start p-3 h-auto"
                                                    onClick={() => handleCustomerSelect(customer)}
                                                >
                                                    <div className="text-left">
                                                        <p className="font-medium">
                                                            {customer.firstName} {customer.lastName}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {customer.countryCode} {customer.phone}
                                                        </p>
                                                        {customer.email && (
                                                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                                                        )}
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-sm text-muted-foreground">No customers found</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
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
                                <BreadcrumbLink href="/wakeup-call" className="text-sm font-medium">
                                    Wake Up Call List
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Add Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-6 h-6 text-primary" />
                            <h1 className="text-xl font-semibold text-foreground">Wake Up Call List</h1>
                        </div>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Wake Up Call
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
                                    placeholder="Search wake up calls..."
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
                                    ["sl", "customerName", "customerPhone", "date", "remarks", "action"] :
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
                                                {col.key !== "action" && col.key !== "remarks" && col.key !== "customerPhone" && (
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
                                {paginatedWakeUpCalls.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleCols.length} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Clock className="w-12 h-12 text-muted-foreground" />
                                                <p className="text-base text-muted-foreground">No wake up calls found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedWakeUpCalls.map((wakeUpCall, idx) => (
                                        <TableRow key={wakeUpCall.id} className="hover:bg-accent/50 transition-colors duration-200 border-b border-border/50">
                                            {visibleCols.includes("sl") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {(page - 1) * entries + idx + 1}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("customerName") && (
                                                <TableCell className="text-sm text-foreground font-medium py-3">
                                                    {wakeUpCall.customerName}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("customerPhone") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {wakeUpCall.customerPhone}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("date") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {formatDateTime(wakeUpCall.date, wakeUpCall.time)}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("remarks") && (
                                                <TableCell className="text-sm text-foreground py-3">
                                                    {wakeUpCall.remarks || "-"}
                                                </TableCell>
                                            )}
                                            {visibleCols.includes("action") && (
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditClick(wakeUpCall)}
                                                            className="h-8 w-8 p-0 rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(wakeUpCall.id)}
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
                            Showing {(page - 1) * entries + 1} to {Math.min(page * entries, sortedWakeUpCalls.length)} of {sortedWakeUpCalls.length} entries
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

            {/* Add Wake Up Call Modal */}
            <Dialog open={showAddModal} onOpenChange={(open) => {
                setShowAddModal(open);
                if (!open) resetModalState();
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Add Wake Up Call
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <CustomerSearchSection />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-sm font-medium">
                                    Date
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time" className="text-sm font-medium">
                                    Time
                                </Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks" className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Remarks
                            </Label>
                            <Textarea
                                id="remarks"
                                placeholder="Enter any additional notes..."
                                value={formData.remarks}
                                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                className="min-h-[80px] rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddModal(false);
                                    resetModalState();
                                }}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddSubmit}
                                disabled={!selectedCustomer || !formData.date || !formData.time}
                                className="px-4"
                            >
                                Add Wake Up Call
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Wake Up Call Modal */}
            <Dialog open={showEditModal} onOpenChange={(open) => {
                setShowEditModal(open);
                if (!open) {
                    setSelectedWakeUpCall(null);
                    resetModalState();
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Wake Up Call
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <CustomerSearchSection />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editDate" className="text-sm font-medium">
                                    Date
                                </Label>
                                <Input
                                    id="editDate"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editTime" className="text-sm font-medium">
                                    Time
                                </Label>
                                <Input
                                    id="editTime"
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                    className="rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="editRemarks" className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Remarks
                            </Label>
                            <Textarea
                                id="editRemarks"
                                placeholder="Enter any additional notes..."
                                value={formData.remarks}
                                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                className="min-h-[80px] rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedWakeUpCall(null);
                                    resetModalState();
                                }}
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditSubmit}
                                disabled={!selectedCustomer || !formData.date || !formData.time}
                                className="px-4"
                            >
                                Update Wake Up Call
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}