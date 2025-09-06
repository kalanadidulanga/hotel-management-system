"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, Home, Search, Filter, AlertTriangle, DollarSign, TrendingDown, RefreshCw, Eye, FileText, Undo } from "lucide-react";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { type RestaurantOrder } from "@/data/restaurant-data";


export default function CancelOrderPage() {
  const [search, setSearch] = useState("");
  const [selectedReason, setSelectedReason] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [processingRefund, setProcessingRefund] = useState<string[]>([]);

  // Mock cancelled orders
  const cancelledOrders = useMemo(() => [
    {
      id: 163,
      orderNumber: "ORD-163",
      tableId: 1,
      table: { id: 1, number: "T001", capacity: 4, status: 'available' as const, location: "Main Hall", shape: 'round' as const },
      customerId: 4,
      customerName: "Mike Johnson",
      customerType: 'walk-in' as const,
      items: [],
      status: 'cancelled' as const,
      waiterId: 1,
      waiterName: "John Smith",
      subtotal: 35.00,
      tax: 3.50,
      serviceCharge: 1.75,
      discount: 0.00,
      totalAmount: 40.25,
      paymentStatus: 'refunded' as const,
      createdAt: "2025-01-06T14:00:00Z",
      updatedAt: "2025-01-06T14:15:00Z",
      cancellationReason: "Customer changed mind",
    },
    {
      id: 164,
      orderNumber: "ORD-164",
      tableId: 2,
      table: { id: 2, number: "T002", capacity: 6, status: 'available' as const, location: "Main Hall", shape: 'rectangular' as const },
      customerId: 5,
      customerName: "Emma Wilson",
      customerType: 'member' as const,
      items: [],
      status: 'cancelled' as const,
      waiterId: 2,
      waiterName: "Sarah Johnson",
      subtotal: 52.00,
      tax: 5.20,
      serviceCharge: 2.60,
      discount: 5.00,
      totalAmount: 54.80,
      paymentStatus: 'refunded' as const,
      createdAt: "2025-01-06T13:30:00Z",
      updatedAt: "2025-01-06T13:45:00Z",
      cancellationReason: "Kitchen delay",
    },
    {
      id: 165,
      orderNumber: "ORD-165",
      tableId: 3,
      table: { id: 3, number: "T003", capacity: 2, status: 'available' as const, location: "Window Side", shape: 'square' as const },
      customerId: 6,
      customerName: "David Lee",
      customerType: 'hotel-guest' as const,
      items: [],
      status: 'cancelled' as const,
      waiterId: 1,
      waiterName: "John Smith",
      subtotal: 18.50,
      tax: 1.85,
      serviceCharge: 0.93,
      discount: 0.00,
      totalAmount: 21.28,
      paymentStatus: 'pending' as const,
      createdAt: "2025-01-06T12:45:00Z",
      updatedAt: "2025-01-06T12:50:00Z",
      cancellationReason: "Item unavailable",
    },
  ], []);

  const cancellationReasons = ["All", "Customer changed mind", "Kitchen delay", "Item unavailable", "Payment issue", "Other"];

  const filteredOrders = useMemo(() => {
    return cancelledOrders.filter(order => {
      const matchesSearch = search === '' || 
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.customerName.toLowerCase().includes(search.toLowerCase()) ||
        order.table.number.toLowerCase().includes(search.toLowerCase()) ||
        order.waiterName.toLowerCase().includes(search.toLowerCase());
      
      const matchesReason = selectedReason === 'All' || 
        order.cancellationReason === selectedReason;
      
      return matchesSearch && matchesReason;
    });
  }, [cancelledOrders, search, selectedReason]);


  const getReasonColor = (reason?: string) => {
    switch (reason) {
      case "Customer changed mind": return "default";
      case "Kitchen delay": return "destructive";
      case "Item unavailable": return "secondary";
      case "Payment issue": return "outline";
      default: return "secondary";
    }
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case "refunded": return "default";
      case "pending": return "destructive";
      case "processing": return "secondary";
      default: return "outline";
    }
  };

  const totalRefundAmount = cancelledOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingRefunds = cancelledOrders.filter(order => order.paymentStatus === 'pending').length;

  // Handler functions
  const handleViewOrder = (orderId: string) => {
    const order = cancelledOrders.find(o => o.id.toString() === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowOrderModal(true);
    }
  };

  const handleViewReceipt = (orderId: string) => {
    const order = cancelledOrders.find(o => o.id.toString() === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowReceiptModal(true);
    }
  };

  const handleProcessRefund = async (orderId: string) => {
    setProcessingRefund(prev => [...prev, orderId]);
    try {
      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Refund processed successfully');
      // TODO: Update order status in database
    } catch (error) {
      console.error('Failed to process refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setProcessingRefund(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Data refreshed successfully');
      // TODO: Fetch latest cancelled orders from API
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportReport = () => {
    const csvData = filteredOrders.map(order => ({
      'Order Number': order.orderNumber,
      'Customer': order.customerName,
      'Table': order.table.number,
      'Waiter': order.waiterName,
      'Reason': order.cancellationReason,
      'Status': order.paymentStatus,
      'Amount': order.totalAmount,
      'Cancelled At': new Date(order.updatedAt).toLocaleString()
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cancelled-orders-${new Date().toISOString().split('T')[0]}.csv`;
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
                <span className="text-sm font-medium text-gray-900">Cancel Orders</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Cancel Orders
                </h1>
                <p className="text-gray-600 mt-1">Monitor and manage cancelled orders</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  size="sm" 
                  className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={handleExportReport}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
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
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search cancelled orders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-sm text-sm bg-white/80"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <div className="flex gap-1.5">
                  {cancellationReasons.map((reason) => (
                    <Button
                      key={reason}
                      variant={selectedReason === reason ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedReason(reason)}
                      className="h-9 px-3 rounded-sm text-sm"
                    >
                      {reason}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="py-3 rounded-sm bg-gradient-to-br from-red-50 to-red-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700">Total Cancelled</p>
                  <p className="text-2xl font-bold text-red-900">{cancelledOrders.length}</p>
                  <p className="text-xs text-red-600">Orders</p>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-orange-50 to-orange-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-700">Refund Amount</p>
                  <p className="text-2xl font-bold text-orange-900">${totalRefundAmount.toFixed(2)}</p>
                  <p className="text-xs text-orange-600">Total refunded</p>
                </div>
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-700">Pending Refunds</p>
                  <p className="text-2xl font-bold text-yellow-900">{pendingRefunds}</p>
                  <p className="text-xs text-yellow-600">Awaiting process</p>
                </div>
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-purple-50 to-purple-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700">Cancel Rate</p>
                  <p className="text-2xl font-bold text-purple-900">{((cancelledOrders.length / (cancelledOrders.length + 50)) * 100).toFixed(1)}%</p>
                  <p className="text-xs text-purple-600">This month</p>
                </div>
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Orders Table */}

          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <XCircle className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium mb-1">No cancelled orders</p>
                  <p className="text-xs">All orders are processed</p>
                </div>
              ) : (
                filteredOrders.map((order: RestaurantOrder, idx: number) => (
                  <div key={order.id} className="p-4 hover:bg-gradient-to-r hover:from-red-50/30 hover:to-transparent transition-all duration-200 border-l-4 border-transparent hover:border-red-400">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">#{idx + 1}</span>
                          <span className="text-sm font-mono font-semibold text-gray-900 bg-red-50 px-2 py-1 rounded">{order.orderNumber}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-base">{order.customerName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            Table {order.table.number}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            {order.waiterName}
                          </span>
                        </div>
                      </div>
                      <Badge variant={getReasonColor(order.cancellationReason)} className="text-xs px-3 py-1 rounded-full font-medium">
                        {order.cancellationReason}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant={getRefundStatusColor(order.paymentStatus)} className="text-xs px-2 py-1 rounded-full capitalize">
                          {order.paymentStatus}
                        </Badge>
                        <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">${order.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 rounded-lg text-xs border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => handleViewOrder(order.id.toString())}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 rounded-lg text-xs border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          onClick={() => handleViewReceipt(order.id.toString())}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Receipt
                        </Button>
                        {order.paymentStatus === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="h-8 px-3 rounded-lg text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            onClick={() => handleProcessRefund(order.id.toString())}
                            disabled={processingRefund.includes(order.id.toString())}
                          >
                            <Undo className="w-3.5 h-3.5 mr-1" />
                            {processingRefund.includes(order.id.toString()) ? 'Processing...' : 'Refund'}
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
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 rounded-sm">Reason</TableHead>
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 rounded-sm">Status</TableHead>
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
                          <XCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-semibold mb-2 text-gray-700">No cancelled orders</p>
                        <p className="text-sm text-gray-500">All orders are processed</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order: RestaurantOrder, idx: number) => (
                    <TableRow key={order.id} className="border-b even:bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                      <TableCell className="text-sm text-gray-500 py-3 px-6 font-medium">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-sm text-[11px]">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-gray-900 py-3">
                        <span className="bg-red-50 px-2 py-0.5 rounded-sm border border-red-200">
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
                        <Badge variant={getReasonColor(order.cancellationReason)} className="text-[11px] px-2.5 py-0.5 rounded-sm font-medium">
                          {order.cancellationReason}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={getRefundStatusColor(order.paymentStatus)} className="text-[11px] px-2.5 py-0.5 rounded-sm capitalize font-medium">
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-bold text-red-600 py-3">
                        <span className="bg-red-50 px-2 py-0.5 rounded-sm border border-red-200">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 rounded-sm border-blue-200 text-blue-600 hover:bg-blue-50"
                            title="View Order Details"
                            onClick={() => handleViewOrder(order.id.toString())}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 rounded-sm border-gray-200 text-gray-600 hover:bg-gray-50"
                            title="View Receipt"
                            onClick={() => handleViewReceipt(order.id.toString())}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          {order.paymentStatus === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 rounded-sm border-blue-200 text-blue-600 hover:bg-blue-50"
                              title="Process Refund"
                              onClick={() => handleProcessRefund(order.id.toString())}
                              disabled={processingRefund.includes(order.id.toString())}
                            >
                              <Undo className={`w-4 h-4 ${processingRefund.includes(order.id.toString()) ? 'animate-pulse' : ''}`} />
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

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Cancelled Order Details</h2>
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
                    <Badge variant="destructive" className="capitalize">
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Customer</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Table</p>
                    <p className="font-medium">Table {selectedOrder.table.number}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Waiter</p>
                    <p className="font-medium">{selectedOrder.waiterName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cancellation Reason</p>
                    <Badge variant={getReasonColor(selectedOrder.cancellationReason)}>
                      {selectedOrder.cancellationReason}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Refund Status</p>
                    <Badge variant={getRefundStatusColor(selectedOrder.paymentStatus)} className="capitalize">
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-lg font-bold text-red-600">${selectedOrder.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{item.foodItem.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                            <span className="font-semibold">${item.unitPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No items available</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setShowOrderModal(false);
                      handleViewReceipt(selectedOrder.id.toString());
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Receipt
                  </Button>
                  {selectedOrder.paymentStatus === 'pending' && (
                    <Button
                      onClick={() => {
                        setShowOrderModal(false);
                        handleProcessRefund(selectedOrder.id.toString());
                      }}
                      className="flex-1"
                      disabled={processingRefund.includes(selectedOrder.id.toString())}
                    >
                      <Undo className="w-4 h-4 mr-2" />
                      Process Refund
                    </Button>
                  )}
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
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{selectedOrder.orderNumber}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerName}</p>
                  <p className="text-lg font-bold text-red-600">${selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      toast.success('Receipt printed successfully');
                      setShowReceiptModal(false);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Print Receipt
                  </Button>
                  <Button
                    onClick={() => {
                      toast.success('Receipt sent via email');
                      setShowReceiptModal(false);
                    }}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
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
