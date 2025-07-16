"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Trash, Eye, Edit, Printer, FileText, Search, Home, Download, Filter, Plus, Calendar, DollarSign } from "lucide-react";
import { useState } from "react";
import { orders, Order } from "@/data/order-list-data";

const PAGE_SIZE = 10;

export default function OrderListPage() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [page, setPage] = useState(1);

  // Get unique statuses from orders
  const statuses = ["All", ...Array.from(new Set(orders.map(order => order.state)))];

  // Filter orders by search and status
  const filteredOrders = orders.filter(
    (order: Order) => {
      const matchesSearch = order.customerName.toLowerCase().includes(search.toLowerCase()) ||
                           String(order.invoiceNo).includes(search) ||
                           order.waiter.toLowerCase().includes(search.toLowerCase()) ||
                           order.tableMap.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = selectedStatus === "All" || order.state === selectedStatus;
      return matchesSearch && matchesStatus;
    }
  );

  // Pagination
  const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.ceil(filteredOrders.length / PAGE_SIZE);

  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "destructive";
      case "served": return "default";
      case "completed": return "secondary";
      case "cancelled": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/40 relative">
      {/* Header Section with Breadcrumb */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
        <div className="px-4 py-3 space-y-3">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/restaurant" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-3.5 h-3.5" /> Restaurant
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/restaurant/order-list" className="text-sm font-medium">
                  Order List
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">Order List</h1>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 px-3 rounded-full shadow-sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Order
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-3 rounded-full shadow-sm">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200/40 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by customer, invoice, waiter or table..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 rounded-lg border-border/80 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1.5 flex-wrap">
                {statuses.map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedStatus(status);
                      setPage(1);
                    }}
                    className={`h-7 px-3 rounded-full text-xs whitespace-nowrap transition-all duration-200 ${
                      selectedStatus === status ? "shadow-md" : "border-border/50 hover:border-border hover:shadow-sm"
                    }`}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
            <Button size="sm" variant="outline" className="h-7 px-3 rounded-full text-xs shadow-sm">
              <Download className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-3 rounded-full text-xs shadow-sm">
              <Download className="w-3 h-3 mr-1" />
              CSV
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-3 rounded-full text-xs shadow-sm">
              <Download className="w-3 h-3 mr-1" />
              Excel
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-3 rounded-full text-xs shadow-sm">
              <Download className="w-3 h-3 mr-1" />
              PDF
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-3 rounded-full text-xs shadow-sm">
              <Printer className="w-3 h-3 mr-1" />
              Print
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{filteredOrders.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">
                  ${filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredOrders.filter(order => order.state === "Pending").length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Served Orders</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredOrders.filter(order => order.state === "Served").length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  <TableHead className="text-xs font-semibold text-muted-foreground">SL</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Invoice No</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Customer Name</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Waiter</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Table</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Order Date</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Total Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No orders found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order: Order, idx: number) => (
                    <TableRow key={order.invoiceNo} className="hover:bg-gray-50/60 transition-colors">
                      <TableCell className="text-sm font-medium">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell className="text-sm font-mono">{order.invoiceNo}</TableCell>
                      <TableCell className="text-sm font-medium">{order.customerName}</TableCell>
                      <TableCell className="text-sm">Waiter {order.waiter}</TableCell>
                      <TableCell className="text-sm">Table {order.tableMap}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusColor(order.state)} 
                          className="text-xs px-2 py-1 rounded-full"
                        >
                          {order.state}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{order.orderDate}</TableCell>
                      <TableCell className="text-sm font-semibold text-green-600">
                        ${order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-7 w-7 rounded-full shadow-sm hover:shadow-md transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-7 w-7 rounded-full shadow-sm hover:shadow-md transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-7 w-7 rounded-full shadow-sm hover:shadow-md transition-all"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-7 w-7 rounded-full shadow-sm hover:shadow-md transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="destructive" 
                            className="h-7 w-7 rounded-full shadow-sm hover:shadow-md transition-all"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="px-4 py-3 border-t border-border/30">
              <Pagination>
                <PaginationContent className="flex justify-center">
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(Math.max(1, page - 1))}
                      className={`${page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full shadow-sm`}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                    let pageNum;
                    if (pageCount <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pageCount - 2) {
                      pageNum = pageCount - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className={`cursor-pointer rounded-full hover:bg-accent ${page === pageNum ? "shadow-md" : "shadow-sm"}`}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(Math.min(pageCount, page + 1))}
                      className={`${page === pageCount ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full shadow-sm`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 