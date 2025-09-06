"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Clock, Home, Search, Filter, AlertTriangle, ChefHat, Timer, Eye, CheckCircle, Bell, RefreshCw, DollarSign } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { restaurantOrders, kotList, type RestaurantOrder } from "@/data/restaurant-data";

// Deterministic date formatter to avoid hydration mismatches

// Stats card configuration
const STATS_CONFIG = [
  {
    id: 'pending',
    title: 'Pending',
    subtitle: 'Awaiting start',
    icon: Clock,
    gradient: 'from-red-50 to-red-100/50',
    textColor: 'text-red-700',
    numberColor: 'text-red-900',
    subtitleColor: 'text-red-600',
    iconBg: 'bg-red-500',
    getValue: (orders: RestaurantOrder[]) => orders.filter(o => o.status === 'pending').length
  },
  {
    id: 'preparing',
    title: 'Preparing',
    subtitle: 'In kitchen',
    icon: ChefHat,
    gradient: 'from-amber-50 to-amber-100/50',
    textColor: 'text-amber-700',
    numberColor: 'text-amber-900',
    subtitleColor: 'text-amber-600',
    iconBg: 'bg-amber-500',
    getValue: (orders: RestaurantOrder[]) => orders.filter(o => o.status === 'preparing').length
  },
  {
    id: 'overdue',
    title: 'Overdue',
    subtitle: 'Past time',
    icon: AlertTriangle,
    gradient: 'from-rose-50 to-rose-100/50',
    textColor: 'text-rose-700',
    numberColor: 'text-rose-900',
    subtitleColor: 'text-rose-600',
    iconBg: 'bg-rose-500',
    getValue: (orders: RestaurantOrder[]) => orders.filter(o => {
      const elapsed = Math.floor((new Date().getTime() - new Date(o.createdAt).getTime()) / 1000 / 60);
      return o.estimatedTime && elapsed > o.estimatedTime;
    }).length
  },
  {
    id: 'avgTime',
    title: 'Avg Time',
    subtitle: 'Minutes',
    icon: Timer,
    gradient: 'from-blue-50 to-blue-100/50',
    textColor: 'text-blue-700',
    numberColor: 'text-blue-900',
    subtitleColor: 'text-blue-600',
    iconBg: 'bg-blue-500',
    getValue: () => 18,
    format: (value: number) => `${value} min`
  }
] as const;

export default function PendingOrderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [kotGenerating, setKotGenerating] = useState<string[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{type: string, orderId: string} | null>(null);

  // Filter pending orders
  const pendingOrders = restaurantOrders.filter(order => 
    order.status === 'pending' || order.status === 'preparing'
  );

  // Filter KOTs
  const pendingKOTs = kotList.filter(kot => 
    kot.status === 'pending' || kot.status === 'preparing'
  );

  const filteredOrders = useMemo(() => {
    return pendingOrders.filter(order => {
      const matchesSearch = searchQuery === '' || 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.table.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.waiterName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = priorityFilter === 'All' || 
        (priorityFilter === 'Pending' && order.status === 'pending') ||
        (priorityFilter === 'Preparing' && order.status === 'preparing') ||
        (priorityFilter === 'Ready' && order.status === 'ready');
      
      return matchesSearch && matchesStatus;
    });
  }, [pendingOrders, searchQuery, priorityFilter]);

  const priorities = ["All", "Pending", "Preparing", "Ready"];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "destructive";
      case "preparing": return "default";
      case "ready": return "secondary";
      case "served": return "outline";
      default: return "outline";
    }
  };

  const getTimeRemaining = (createdAt: string, estimatedTime: number) => {
    const orderTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedMinutes = Math.floor((currentTime - orderTime) / (1000 * 60));
    const remainingMinutes = estimatedTime - elapsedMinutes;
    
    if (remainingMinutes <= 0) {
      return "Overdue";
    }
    
    return `${remainingMinutes} min`;
  };

  const handleViewOrder = (orderId: string) => {
    const order = pendingOrders.find(o => o.id.toString() === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowOrderModal(true);
    }
  };

  const handleGenerateKOT = async (orderId: string) => {
    setConfirmAction({type: 'kot', orderId});
    setShowConfirmModal(true);
  };

  const executeGenerateKOT = async (orderId: string) => {
    setKotGenerating(prev => [...prev, orderId]);
    try {
      // Simulate KOT generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('KOT generated for order:', orderId);
      // KOT generated successfully
      // TODO: Integrate with kitchen system
    } catch (error) {
      console.error('Failed to generate KOT:', error);
      // Failed to generate KOT
    } finally {
      setKotGenerating(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setConfirmAction({type: 'ready', orderId});
    setShowConfirmModal(true);
  };

  const executeMarkReady = async (orderId: string) => {
    try {
      console.log('Marking order as ready:', orderId);
      // Order marked as ready
      // TODO: Update order status in database
      // TODO: Notify front office staff
    } catch (error) {
      console.error('Failed to mark order as ready:', error);
      // Failed to mark order as ready
    }
  };

  const handlePrintBill = async (orderId: string) => {
    setConfirmAction({type: 'bill', orderId});
    setShowConfirmModal(true);
  };

  const executePrintBill = async (orderId: string) => {
    try {
      // Simulate bill generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Bill printed for order:', orderId);
      // Bill printed successfully
      // TODO: Integrate with billing system
      // TODO: Update accounts module
    } catch (error) {
      console.error('Failed to print bill:', error);
      // Failed to print bill
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Data refreshed');
      // Data refreshed successfully
      // TODO: Fetch latest orders from API
    } catch (error) {
      console.error('Failed to refresh data:', error);
      // Failed to refresh data
    } finally {
      setIsRefreshing(false);
    }
  };





  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    
    setShowConfirmModal(false);
    
    switch (confirmAction.type) {
      case 'kot':
        await executeGenerateKOT(confirmAction.orderId);
        break;
      case 'ready':
        await executeMarkReady(confirmAction.orderId);
        break;
      case 'bill':
        await executePrintBill(confirmAction.orderId);
        break;
    }
    
    setConfirmAction(null);
  };

  // Auto-refresh functionality (silent)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing) {
        setIsRefreshing(true);
        // Silent refresh - no user notification
        setTimeout(() => {
          console.log('Data refreshed silently');
          setIsRefreshing(false);
        }, 1000);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isRefreshing]);

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
                <span className="text-sm font-medium text-gray-900">Pending Orders</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Pending Orders
                </h1>
                <p className="text-gray-600 mt-1">Monitor and manage orders in progress</p>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
                <Button size="sm" variant="outline" className="h-9 px-4 border-gray-300 hover:bg-gray-50 transition-all duration-200">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Auto Refresh
                </Button>
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search pending orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-sm text-sm bg-white/80"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <div className="flex gap-1.5">
                  {priorities.map((priority) => (
                    <Button
                      key={priority}
                      variant={priorityFilter === priority ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriorityFilter(priority)}
                      className="h-9 px-3 rounded-sm text-sm"
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS_CONFIG.map(stat => {
            const Icon = stat.icon;
            const value = stat.getValue(pendingOrders);
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
          
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium mb-1">No pending orders</p>
                  <p className="text-xs">All orders are up to date</p>
                </div>
              ) : (
                filteredOrders.map((order: RestaurantOrder, idx: number) => (
                  <div key={order.id} className="p-4 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-200 border-l-4 border-transparent hover:border-blue-400">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">#{idx + 1}</span>
                          <span className="text-sm font-mono font-semibold text-gray-900 bg-blue-50 px-2 py-1 rounded">{order.orderNumber}</span>
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
                      <Badge variant={getStatusColor(order.status)} className="text-xs px-3 py-1 rounded-full font-medium capitalize shadow-sm">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{getTimeRemaining(order.createdAt, order.estimatedTime || 30)}</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">${order.totalAmount.toFixed(2)}</span>
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
                          className="h-8 px-3 rounded-lg text-xs border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
                          onClick={() => handleGenerateKOT(order.id.toString())}
                          disabled={kotGenerating.includes(order.id.toString())}
                        >
                          <ChefHat className={`w-3.5 h-3.5 mr-1 ${kotGenerating.includes(order.id.toString()) ? 'animate-pulse' : ''}`} />
                          {kotGenerating.includes(order.id.toString()) ? 'Generating...' : 'KOT'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 rounded-lg text-xs border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                          onClick={() => handleMarkReady(order.id.toString())}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Ready
                        </Button>
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
                  <TableHead className="sticky top-0 z-10 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 rounded-sm">Time</TableHead>
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
                          <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-semibold mb-2 text-gray-700">No pending orders</p>
                        <p className="text-sm text-gray-500">All orders are up to date</p>
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
                        <span className={`font-medium ${
                          getTimeRemaining(order.createdAt, order.estimatedTime || 30) === "Overdue" 
                            ? "text-red-600" 
                            : "text-gray-600"
                        }`}>
                          {getTimeRemaining(order.createdAt, order.estimatedTime || 30)}
                        </span>
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
                            className="h-8 w-8 p-0 rounded-sm border-blue-200 text-blue-600 hover:bg-blue-50"
                            title="View Order Details"
                            onClick={() => handleViewOrder(order.id.toString())}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 rounded-sm border-amber-200 text-amber-600 hover:bg-amber-50"
                            title="Generate KOT"
                            onClick={() => handleGenerateKOT(order.id.toString())}
                            disabled={kotGenerating.includes(order.id.toString())}
                          >
                            <ChefHat className={`w-4 h-4 ${kotGenerating.includes(order.id.toString()) ? 'animate-pulse' : ''}`} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 rounded-sm border-green-200 text-green-600 hover:bg-green-50"
                            title="Mark as Ready"
                            onClick={() => handleMarkReady(order.id.toString())}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 rounded-sm border-purple-200 text-purple-600 hover:bg-purple-50"
                            title="Print Bill"
                            onClick={() => handlePrintBill(order.id.toString())}
                            disabled={false}
                          >
                            <DollarSign className="w-4 h-4" />
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
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-lg font-bold text-emerald-600">${selectedOrder.totalAmount.toFixed(2)}</p>
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
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setShowOrderModal(false);
                      handleGenerateKOT(selectedOrder.id.toString());
                    }}
                    className="flex-1"
                    disabled={kotGenerating.includes(selectedOrder.id.toString())}
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Generate KOT
                  </Button>
                  <Button
                    onClick={() => {
                      setShowOrderModal(false);
                      handleMarkReady(selectedOrder.id.toString());
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Ready
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && confirmAction && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirm Action
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {confirmAction.type === 'kot' && 'Are you sure you want to generate KOT for this order?'}
                  {confirmAction.type === 'ready' && 'Are you sure you want to mark this order as ready?'}
                  {confirmAction.type === 'bill' && 'Are you sure you want to print the bill for this order?'}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmAction(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmAction}
                    className="flex-1"
                  >
                    Confirm
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

