"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Eye, Edit, Plus, Search, Filter, RefreshCw, Home, FileText, Check, Clock, CheckCircle, Trash2, XCircle, Undo, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 10;
 
// Deterministic date formatter to avoid hydration mismatches
const formatDate = (value: string | number | Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));

// Order interface for API data
interface RestaurantOrder {
  id: number;
  orderNumber: string;
  customerName?: string;
  tableId?: number;
  table?: { tableNumber: string };
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  orderTime: string;
  createdAt?: string;
  updatedAt?: string;
  items?: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    product: { name: string; category: { name: string } };
  }>;
  takenByStaff?: { name: string };
  cancellationReason?: string;
  paymentStatus?: string;
}

// Stats card configuration

const STATS_CONFIG = [
  {
    id: 'total',
    title: 'Total Orders',
    subtitle: 'All orders',
    icon: FileText,
    gradient: 'from-blue-50 to-blue-100/50',
    textColor: 'text-blue-700',
    numberColor: 'text-blue-900',
    subtitleColor: 'text-blue-600',
    iconBg: 'bg-blue-500',
    getValue: (orders: RestaurantOrder[]) => orders.length,
    format: (value: number) => value.toString()
  },
  {
    id: 'revenue',
    title: 'Revenue',
    subtitle: 'Total earned',
    icon: TrendingUp,
    gradient: 'from-emerald-50 to-emerald-100/50',
    textColor: 'text-emerald-700',
    numberColor: 'text-emerald-900',
    subtitleColor: 'text-emerald-600',
    iconBg: 'bg-emerald-500',
    getValue: (orders: RestaurantOrder[]) => orders.filter(o => o.status !== 'cancelled').reduce((sum, order) => sum + order.total, 0),
    format: (value: number) => `Rs. ${value.toFixed(2)}`
  },
  {
    id: 'pending',
    title: 'Active Orders',
    subtitle: 'In progress',
    icon: Clock,
    gradient: 'from-orange-50 to-orange-100/50',
    textColor: 'text-orange-700',
    numberColor: 'text-orange-900',
    subtitleColor: 'text-orange-600',
    iconBg: 'bg-orange-500',
    getValue: (orders: RestaurantOrder[]) => orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length,
    format: (value: number) => value.toString()
  },
  {
    id: 'completed',
    title: 'Completed',
    subtitle: 'Successful orders',
    icon: CheckCircle,
    gradient: 'from-green-50 to-green-100/50',
    textColor: 'text-green-700',
    numberColor: 'text-green-900',
    subtitleColor: 'text-green-600',
    iconBg: 'bg-green-500',
    getValue: (orders: RestaurantOrder[]) => orders.filter(o => ['completed', 'served'].includes(o.status)).length,
    format: (value: number) => value.toString()
  },
  {
    id: 'cancelled',
    title: 'Cancelled',
    subtitle: 'Cancelled orders',
    icon: XCircle,
    gradient: 'from-red-50 to-red-100/50',
    textColor: 'text-red-700',
    numberColor: 'text-red-900',
    subtitleColor: 'text-red-600',
    iconBg: 'bg-red-500',
    getValue: (orders: RestaurantOrder[]) => orders.filter(o => o.status === 'cancelled').length,
    format: (value: number) => value.toString()
  }
] as const;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'served', label: 'Served' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const;

export default function OrderListPage() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [ordersData, setOrdersData] = useState<RestaurantOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRefund, setProcessingRefund] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed values with memoization
  const statuses = useMemo(
    () => ["All", ...Array.from(new Set(ordersData.map(order => order.status)))],
    [ordersData]
  );

  const filteredOrders = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return ordersData.filter(order => {
      const matchesSearch = [
        order.orderNumber,
        order.customerName,
        order.takenByStaff?.name,
        order.table?.tableNumber
      ].some(field => field?.toLowerCase().includes(searchLower));
      
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ordersData, searchQuery, statusFilter]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);

  // Status badge 
  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "destructive";
      case "preparing": return "secondary";
      case "ready": return "default";
      case "completed": return "default";
      case "served": return "default";
      case "cancelled": return "outline";
      default: return "secondary";
    }
  };

  // Get status-specific actions
  const getStatusActions = (order: RestaurantOrder) => {
    const actions = [];
    
    switch (order.status.toLowerCase()) {
      case 'pending':
        actions.push({
          label: 'Generate KOT',
          icon: FileText,
          action: () => handleGenerateKOT(order.id.toString()),
          variant: 'default' as const
        });
        break;
      case 'preparing':
        actions.push({
          label: 'Mark Ready',
          icon: Check,
          action: () => handleMarkReady(order.id.toString()),
          variant: 'default' as const
        });
        break;
      case 'ready':
        actions.push({
          label: 'Print Bill',
          icon: FileText,
          action: () => handlePrintBill(order.id.toString()),
          variant: 'default' as const
        });
        break;
      case 'cancelled':
        if (order.paymentStatus === 'pending') {
          actions.push({
            label: 'Process Refund',
            icon: Undo,
            action: () => handleProcessRefund(order.id.toString()),
            variant: 'default' as const,
            disabled: processingRefund.includes(order.id.toString())
          });
        }
        break;
    }
    
    return actions;
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/restaurant/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const orders = await response.json();
      setOrdersData(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success('Orders refreshed successfully');
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewOrder = (order: RestaurantOrder) => {
    setSelectedOrder(order);
    setViewOpen(true);
  };

  const handleEditOrder = (order: RestaurantOrder) => {
    setSelectedOrder(order);
    setEditOpen(true);
  };

  const handleUpdateOrder = (updates: Partial<RestaurantOrder>) => {
    if (!selectedOrder) return;
    setSelectedOrder(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    try {
      const response = await fetch(`/api/restaurant/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedOrder)
      });
      if (response.ok) {
        await fetchOrders();
        setEditOpen(false);
        toast.success('Order updated successfully');
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
      const response = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete order');
      
      toast.success('Order deleted successfully');
      await fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const handleGenerateKOT = async (orderId: string) => {
    try {
      const response = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'preparing' })
      });
      
      if (!response.ok) throw new Error('Failed to generate KOT');
      
      toast.success('KOT generated successfully');
      await fetchOrders();
    } catch (error) {
      console.error('Error generating KOT:', error);
      toast.error('Failed to generate KOT');
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      const response = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' })
      });
      
      if (!response.ok) throw new Error('Failed to mark order as ready');
      
      toast.success('Order marked as ready');
      await fetchOrders();
    } catch (error) {
      console.error('Error marking order as ready:', error);
      toast.error('Failed to mark order as ready');
    }
  };

  const handlePrintBill = async (orderId: string) => {
    try {
      const response = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (!response.ok) throw new Error('Failed to complete order');
      
      window.open(`/restaurant/bill-printing?orderId=${orderId}`, '_blank');
      toast.success('Bill printed and order completed');
      await fetchOrders();
    } catch (error) {
      console.error('Error printing bill:', error);
      toast.error('Failed to print bill');
    }
  };

  const handleProcessRefund = async (orderId: string) => {
    setProcessingRefund(prev => [...prev, orderId]);
    try {
      const response = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'refunded' })
      });
      
      if (!response.ok) throw new Error('Failed to process refund');
      
      toast.success('Refund processed successfully');
      await fetchOrders();
    } catch (error) {
      console.error('Failed to process refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setProcessingRefund(prev => prev.filter(id => id !== orderId));
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, newPage)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header with Gradient */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10">
        <div className="px-4 py-4">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/restaurant" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <Home className="w-4 h-4" /> Restaurant
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-sm font-medium text-gray-900">Order Management</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Order Management
                </h1>
                <p className="text-gray-600 mt-1">Manage and track all restaurant orders efficiently</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 px-4 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                  size="sm" 
                  className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => window.open('/restaurant/pos-invoice', '_blank')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              </div>
            </div>
            
            {/* Search and Filter in Header */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-sm text-sm bg-white/80"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9 border-gray-200 rounded-sm bg-white/80 text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {statuses.map((status: string) => (
                      <SelectItem key={status} value={status} className="rounded-md">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 space-y-4">

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STATS_CONFIG.map(stat => {
            const Icon = stat.icon;
            const value = stat.getValue(ordersData);
            const displayValue = 'format' in stat ? stat.format(value) : value.toString();
            
            return (
              <Card 
                key={stat.id} 
                className={`py-3 rounded-sm bg-gradient-to-br ${stat.gradient} border-1 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer`}
                onClick={() => {
                  if (stat.id === 'pending') setStatusFilter('Pending');
                  else if (stat.id === 'completed') setStatusFilter('Completed');
                  else if (stat.id === 'cancelled') setStatusFilter('Cancelled');
                  else setStatusFilter('All');
                }}
              >
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-medium ${stat.textColor}`}>{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.numberColor}`}>{displayValue}</p>
                      <p className={`text-xs ${stat.subtitleColor}`}>{stat.subtitle}</p>
                    </div>
                    <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Orders Table */}
          
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="divide-y divide-gray-200">
              {paginatedOrders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold mb-2 text-gray-700">No orders found</p>
                  <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
                </div>
              ) : (
                paginatedOrders.map((order: RestaurantOrder, idx: number) => (
                  <div key={order.id} className="p-4 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 border-l-4 border-transparent hover:border-blue-400">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">#{(currentPage - 1) * PAGE_SIZE + idx + 1}</span>
                          <span className="text-sm font-mono font-semibold text-gray-900 bg-blue-50 px-2 py-0.5 rounded">{order.orderNumber}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-base">{order.customerName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            {order.table?.tableNumber || order.tableId || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            {order.takenByStaff?.name || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(order.status)} className="text-xs px-3 py-1 rounded-full font-medium capitalize shadow-sm">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{formatDate(order.orderTime)}</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Rs. {order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 rounded-lg text-xs border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 rounded-lg text-xs border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          onClick={() => handleEditOrder(order)}
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        {getStatusActions(order).map((action, idx) => (
                          <Button 
                            key={idx}
                            size="sm" 
                            variant={action.variant}
                            className="h-8 px-2 rounded-sm text-xs transition-colors"
                            title={action.label}
                            onClick={action.action}
                            disabled={action.disabled}
                          >
                            <action.icon className="w-3 h-3 mr-1" />
                            {action.label}
                          </Button>
                        ))}
                        {order.status !== 'cancelled' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 rounded-sm border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            title="Delete Order"
                            onClick={() => handleDeleteOrder(order.id.toString())}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto rounded-sm border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 border-b">
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 px-6 rounded-sm">#</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 rounded-sm">Order Number</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 rounded-sm">Customer</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 rounded-sm">Table</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 rounded-sm">Waiter</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 rounded-sm">Status</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 rounded-sm">Date</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 rounded-sm">Amount</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 text-right rounded-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-semibold mb-2 text-gray-700">No orders found</p>
                        <p className="text-sm text-gray-500">Try adjusting your search criteria or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order: RestaurantOrder, idx: number) => (
                    <TableRow key={order.id} className="border-b even:bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                      <TableCell className="text-sm text-gray-500 py-3 px-6 font-medium">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-sm text-[11px]">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-gray-900 py-3">
                        <span className="bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                          {order.orderNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900 py-3">
                        {order.customerName}
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          {order.table?.tableNumber || order.tableId || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          {order.takenByStaff?.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={getStatusColor(order.status)} className="text-[11px] px-2.5 py-0.5 rounded-sm font-medium capitalize shadow-sm">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-3">
                        {formatDate(order.orderTime)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm w-fit">
                          Rs. {order.total.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 rounded-sm border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 rounded-sm border-gray-200 text-gray-600 hover:bg-gray-50"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {getStatusActions(order).map((action, idx) => (
                            <Button 
                              key={idx}
                              size="sm" 
                              variant={action.variant}
                              className="h-8 px-2 rounded-sm text-xs transition-colors"
                              title={action.label}
                              onClick={action.action}
                              disabled={action.disabled}
                            >
                              <action.icon className="w-3 h-3 mr-1" />
                              {action.label}
                            </Button>
                          ))}
                          {order.status !== 'cancelled' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 rounded-sm border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                              title="Delete Order"
                              onClick={() => handleDeleteOrder(order.id.toString())}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30">
              <div className="flex justify-center">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={`rounded-lg transition-all duration-200 ${
                            currentPage === 1 
                              ? "pointer-events-none opacity-50" 
                              : "cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                          }`}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={currentPage === pageNum}
                            className={`cursor-pointer rounded-lg transition-all duration-200 ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={`rounded-lg transition-all duration-200 ${
                            currentPage === totalPages 
                              ? "pointer-events-none opacity-50" 
                              : "cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                          }`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* View Order Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl w-full mx-4 rounded-sm border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-sm flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Order Details</DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">Complete order information and status</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 py-6">
              {/* Order Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-sm border border-blue-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-mono text-lg font-bold text-gray-900">{selectedOrder.orderNumber}</h3>
                    <p className="text-sm text-gray-500 mb-1">{formatDate(selectedOrder.orderTime)}</p>
                  </div>
                  <Badge variant={getStatusColor(selectedOrder.status)} className="text-sm px-4 py-2 rounded-sm font-semibold capitalize w-fit">
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>

              {/* Order Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer Information</Label>
                  <div className="bg-white p-3 rounded-sm border border-gray-200">
                    <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-500">Primary Customer</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Table Assignment</Label>
                  <div className="bg-white p-3 rounded-sm border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      {selectedOrder.tableId || 'N/A'}
                    </div>
                    <p className="text-sm text-gray-500">Table Number</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Service Staff</Label>
                  <div className="bg-white p-3 rounded-sm border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      {selectedOrder.takenByStaff?.name || 'N/A'}
                    </div>
                    <p className="text-sm text-gray-500">Assigned Waiter</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Order Items</Label>
                  <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="p-4 flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                            <p className="text-sm text-gray-500">{item.product.category.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">Qty: {item.quantity}</p>
                            <p className="text-sm text-gray-600">Rs. {item.unitPrice.toFixed(2)} each</p>
                            <p className="text-sm font-bold text-emerald-600">Rs. {(item.quantity * item.unitPrice).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Order Total */}
              <div className="bg-emerald-50 p-4 rounded-sm border border-emerald-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Subtotal: Rs. {selectedOrder.subtotal.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Tax: Rs. {selectedOrder.tax.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">
                      Total: Rs. {selectedOrder.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  className="flex-1 h-11 rounded-sm border-gray-300 hover:bg-gray-50"
                  onClick={() => setViewOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 h-11 rounded-sm border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteOrder(selectedOrder.id.toString())}
                >
                  Delete Order
                </Button>
                <Button 
                  className="flex-1 h-11 rounded-sm bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setViewOpen(false);
                    handleEditOrder(selectedOrder);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl w-full mx-4 rounded-sm border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-sm flex items-center justify-center">
                <Edit className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Edit Order</DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">Update order information and settings</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 py-6">
              {/* Current Order Info */}
              <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-mono text-lg font-bold text-gray-900">{selectedOrder.orderNumber}</h3>
                    <p className="text-sm text-gray-600">Editing order details</p>
                  </div>
                  <Badge variant={getStatusColor(selectedOrder.status)} className="text-sm px-4 py-2 rounded-sm font-semibold capitalize w-fit">
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-gray-700">Basic Information</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Customer Name</Label>
                      <Input
                        value={selectedOrder.customerName}
                        onChange={(e) => handleUpdateOrder({ customerName: e.target.value })}
                        className="h-11 text-sm rounded-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Assigned Waiter</Label>
                      <Input
                        value={selectedOrder.takenByStaff?.name || ""}
                        onChange={(e) => handleUpdateOrder({ takenByStaff: { name: e.target.value } })}
                        className="h-11 text-sm rounded-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Enter waiter name"
                      />
                    </div>
                  </div>
                </div>

                {/* Order Status & Amount */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-gray-700">Order Status & Pricing</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Order Status</Label>
                      <Select value={selectedOrder.status} onValueChange={(value) => handleUpdateOrder({ status: value as RestaurantOrder['status'] })}>
                        <SelectTrigger className="h-11 text-sm rounded-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm">
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status.value} value={status.value} className="rounded-sm">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  status.value === 'pending' ? 'bg-red-400' :
                                  status.value === 'preparing' ? 'bg-yellow-400' :
                                  status.value === 'ready' ? 'bg-blue-400' :
                                  status.value === 'completed' ? 'bg-green-400' :
                                  'bg-gray-400'
                                }`}></div>
                                {status.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Order Amount ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={selectedOrder.total?.toString() || ""}
                        onChange={(e) => handleUpdateOrder({ total: parseFloat(e.target.value) || 0 })}
                        className="h-11 text-sm rounded-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Table Information */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-gray-700">Table Information</Label>
                  <div className="bg-blue-50 p-4 rounded-sm border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-blue-900">Table {selectedOrder.table?.tableNumber || selectedOrder.tableId || 'N/A'}</p>
                        <p className="text-sm text-blue-600">Current table assignment</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  className="flex-1 h-11 rounded-sm border-gray-300 hover:bg-gray-50"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel Changes
                </Button>
                <Button 
                  className="flex-1 h-11 rounded-sm bg-blue-600 hover:bg-blue-700 shadow-lg"
                  onClick={handleSaveEdit}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}