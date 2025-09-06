"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { CheckCircle, Home, Search, Filter, Star, Clock, DollarSign, Eye, FileText, RefreshCw } from "lucide-react";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { restaurantOrders, type RestaurantOrder } from "@/data/restaurant-data";


// Deterministic date formatter to avoid hydration mismatches
const formatDate = (value: string | number | Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));

// Stats card configuration
const STATS_CONFIG = [
  {
    id: 'completed',
    title: 'Completed',
    subtitle: 'Total orders',
    icon: CheckCircle,
    gradient: 'from-green-50 to-green-100/50',
    textColor: 'text-green-700',
    numberColor: 'text-green-900',
    subtitleColor: 'text-green-600',
    iconBg: 'bg-green-500',
    getValue: (orders: RestaurantOrder[]) => orders.length
  },
  {
    id: 'revenue',
    title: 'Revenue',
    subtitle: 'Total earned',
    icon: DollarSign,
    gradient: 'from-emerald-50 to-emerald-100/50',
    textColor: 'text-emerald-700',
    numberColor: 'text-emerald-900',
    subtitleColor: 'text-emerald-600',
    iconBg: 'bg-emerald-500',
    getValue: (orders: RestaurantOrder[]) => orders.reduce((sum, order) => sum + order.totalAmount, 0),
    format: (value: number) => `$${value.toFixed(2)}`
  },
  {
    id: 'avgTime',
    title: 'Avg Time',
    subtitle: 'Service time',
    icon: Clock,
    gradient: 'from-blue-50 to-blue-100/50',
    textColor: 'text-blue-700',
    numberColor: 'text-blue-900',
    subtitleColor: 'text-blue-600',
    iconBg: 'bg-blue-500',
    getValue: (orders: RestaurantOrder[]) => {
      const totalTime = orders.reduce((sum, order) => sum + (order.actualTime || 0), 0);
      return orders.length > 0 ? Math.round(totalTime / orders.length) : 0;
    },
    format: (value: number) => `${value} min`
  },
  {
    id: 'satisfaction',
    title: 'Rating',
    subtitle: 'Customer rating',
    icon: Star,
    gradient: 'from-yellow-50 to-yellow-100/50',
    textColor: 'text-yellow-700',
    numberColor: 'text-yellow-900',
    subtitleColor: 'text-yellow-600',
    iconBg: 'bg-yellow-500',
    getValue: () => 4.8,
    format: (value: number) => `${value.toFixed(1)}`
  }
] as const;

export default function CompleteOrderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Filter completed orders
  const completedOrders = restaurantOrders.filter(order => 
    order.status === 'completed' || order.status === 'served'
  );

  const statusFilters = ["All", "Completed", "Served"];

  const filteredOrders = useMemo(() => {
    return completedOrders.filter(order => {
      const matchesSearch = searchQuery === '' || 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.table.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.waiterName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'Completed' && order.status === 'completed') ||
        (statusFilter === 'Served' && order.status === 'served');
      
      return matchesSearch && matchesStatus;
    });
  }, [completedOrders, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "default";
      case "served": return "secondary";
      default: return "outline";
    }
  };


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Orders refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh orders');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    const order = completedOrders.find(o => o.id.toString() === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowOrderModal(true);
    }
  };

  const handleViewReceipt = (orderId: string) => {
    const order = completedOrders.find(o => o.id.toString() === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowReceiptModal(true);
    }
  };

  const handlePrintReceipt = () => {
    if (selectedOrder) {
      toast.success(`Receipt printed for order ${selectedOrder.orderNumber}`);
      setShowReceiptModal(false);
    }
  };

  const handleEmailReceipt = () => {
    if (selectedOrder) {
      toast.success(`Receipt emailed to ${selectedOrder.customerName}`);
      setShowReceiptModal(false);
    }
  };

  const handleExportReport = () => {
    const csvData = filteredOrders.map(order => ({
      'Order Number': order.orderNumber,
      'Customer': order.customerName,
      'Table': order.table.number,
      'Waiter': order.waiterName,
      'Status': order.status,
      'Amount': order.totalAmount,
      'Date': formatDate(order.updatedAt)
    }));
    
    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `completed-orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/restaurant" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <Home className="w-4 h-4" />
                  Restaurant
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/restaurant/complete-order" className="text-sm font-medium text-gray-900">
                  Complete Orders
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Complete Orders
              </h1>
              <p className="text-gray-600 mt-1">View and manage completed restaurant orders</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 px-4 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                onClick={handleExportReport}
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search completed orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-sm text-sm bg-white/80"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex gap-1.5">
                {statusFilters.map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="h-9 px-3 rounded-sm text-sm"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS_CONFIG.map(stat => {
            const Icon = stat.icon;
            const value = stat.getValue(completedOrders);
            const displayValue = 'format' in stat ? stat.format(value) : value.toString();
            
            return (
              <Card 
                key={stat.id} 
                className={`py-3 rounded-sm bg-gradient-to-br ${stat.gradient} border-1 shadow-md hover:shadow-lg transition-all duration-200`}
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
        <div className="overflow-x-auto rounded-sm border border-gray-200 bg-white">
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
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold mb-2 text-gray-700">No completed orders</p>
                      <p className="text-sm text-gray-500">Orders will appear here once they are completed</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order, index) => (
                  <TableRow key={order.id} className="border-b even:bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                    <TableCell className="text-sm text-gray-500 py-3 px-6 font-medium">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-sm text-[11px]">
                        {index + 1}
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
                    <TableCell className="text-sm text-gray-600 py-3">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        {order.table.number}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 py-3">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        {order.waiterName}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant={getStatusColor(order.status)} className="text-[11px] px-2.5 py-0.5 rounded-sm capitalize font-medium">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 py-3">
                      {formatDate(order.updatedAt)}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-emerald-600 py-3">
                      <span className="bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 rounded-lg text-xs border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Order"
                          onClick={() => handleViewOrder(order.id.toString())}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 rounded-lg text-xs border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          title="View Receipt"
                          onClick={() => handleViewReceipt(order.id.toString())}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Receipt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOrderModal(false)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order Number</p>
                    <p className="text-lg font-semibold">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge variant={getStatusColor(selectedOrder.status)} className="capitalize">
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Customer</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Table</p>
                    <p className="font-medium">{selectedOrder.table.number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Waiter</p>
                    <p className="font-medium">{selectedOrder.waiterName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-lg font-bold text-green-600">${selectedOrder.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{item.foodItem.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                          <span className="font-semibold">${item.unitPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Receipt Options</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReceiptModal(false)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-50 rounded">
                  <p className="font-semibold">Order #{selectedOrder.orderNumber}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerName}</p>
                  <p className="text-lg font-bold text-green-600">${selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handlePrintReceipt}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Print Receipt
                  </Button>
                  <Button
                    onClick={handleEmailReceipt}
                    variant="outline"
                    className="flex-1"
                  >
                    Email Receipt
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
