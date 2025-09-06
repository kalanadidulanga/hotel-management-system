"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { 
  Monitor, Home, Clock, ChefHat, Timer, 
  UtensilsCrossed, RefreshCw, Eye, Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// Using live data from /api/restaurant/dashboard

type DashboardTable = { id: number; tableNumber: string; capacity: number; status: string };
type DashboardQueueItem = {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  estimatedTime: number | null;
  customerName?: string | null;
  table: { tableNumber: string } | null;
};

export default function CounterDashboardPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const router = useRouter();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ordersCount, setOrdersCount] = useState({ pending: 0, preparing: 0, ready: 0 });
  const [kitchenEfficiency, setKitchenEfficiency] = useState({ activeKOTs: 0, overdueKOTs: 0, avgPrepTime: 0 });
  const [tablesList, setTablesList] = useState<DashboardTable[]>([]);
  const [tableCounts, setTableCounts] = useState({ available: 0, occupied: 0, reserved: 0 });
  const [queue, setQueue] = useState<DashboardQueueItem[]>([]);

  async function loadDashboard() {
    try {
      const res = await fetch('/api/restaurant/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      const data = await res.json();
      setOrdersCount(data.orders);
      setKitchenEfficiency(data.kitchen);
      setTablesList(data.tables.list);
      setTableCounts({ available: data.tables.available, occupied: data.tables.occupied, reserved: data.tables.reserved });
      setQueue(data.queue);
    } catch (e) {
      console.error(e);
    } finally {
      /* no-op */
    }
  }

  useEffect(() => {
    // Set initial time on client mount to avoid hydration mismatch
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadDashboard();
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboard();
    setIsRefreshing(false);
  };

  // Handle table actions
  const handleTableClick = (table: DashboardTable) => {
    if (table.status === 'OCCUPIED') {
      router.push(`/restaurant/order-list?table=${encodeURIComponent(table.tableNumber)}`);
    } else if (table.status === 'AVAILABLE') {
      router.push(`/restaurant/pos-invoice?table=${encodeURIComponent(table.tableNumber)}`);
    } else if (table.status === 'RESERVED') {
      router.push(`/restaurant/manage-table/table-list?table=${table.id}`);
    }
  };

  const handleTableView = (table: DashboardTable, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/restaurant/manage-table/table-list?table=${table.id}`);
  };

  const handleTableAddOrder = (table: DashboardTable, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/restaurant/pos-invoice?table=${encodeURIComponent(table.tableNumber)}`);
  };


  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      <div className="flex-1 p-6 space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/restaurant">Restaurant</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Counter Dashboard</BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="mt-2">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Counter Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Real-time restaurant operations overview</p>
            </div>
          </div>
          
          {/* Quick Actions in Header */}
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
              onClick={() => router.push('/restaurant/order-list?status=pending')}
            >
              <Clock className="w-4 h-4" />
              Pending Orders
            </Button>
            <Button 
              size="sm" 
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
              onClick={() => router.push('/restaurant/pos-invoice')}
            >
              <ChefHat className="w-4 h-4" />
              Generate KOT
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={() => router.push('/restaurant/manage-table/table-list')}
            >
              <Monitor className="w-4 h-4" />
              Tables
            </Button>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}
              </div>
              <div className="text-xs text-gray-500">
                {currentTime ? currentTime.toLocaleDateString() : '--/--/----'}
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Compact Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="py-3 rounded-sm bg-gradient-to-br from-red-50 to-red-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => router.push('/restaurant/order-list?status=pending')}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700">Pending Orders</p>
                  <p className="text-2xl font-bold text-red-900">{ordersCount.pending}</p>
                  <p className="text-xs text-red-600">+2 from last hour</p>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-amber-50 to-amber-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => router.push('/restaurant/order-list?status=preparing')}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-700">Preparing</p>
                  <p className="text-2xl font-bold text-amber-900">{ordersCount.preparing}</p>
                  <p className="text-xs text-amber-600">In kitchen</p>
                </div>
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-blue-50 to-blue-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => router.push('/restaurant/order-list?status=ready')}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">Ready to Serve</p>
                  <p className="text-2xl font-bold text-blue-900">{ordersCount.ready}</p>
                  <p className="text-xs text-blue-600">Waiting pickup</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-green-50 to-green-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => router.push('/restaurant/pos-invoice')}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Active KOTs</p>
                  <p className="text-2xl font-bold text-green-900">{kitchenEfficiency.activeKOTs}</p>
                  <p className="text-xs text-green-600">Kitchen orders</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table Layout - Left (3 columns) */}
          <div className="lg:col-span-3">
            <Card className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold flex items-center gap-3 text-gray-900">
                    <Monitor className="w-6 h-6 text-blue-600" />
                    Restaurant Table Layout
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-medium">{tableCounts.occupied} Occupied</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium">{tableCounts.available} Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">{tableCounts.reserved} Reserved</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => router.push('/restaurant/manage-table/table-list')}
                    >
                      <Monitor className="w-4 h-4" />
                      Manage Tables
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-3">
                  {tablesList.map((table: DashboardTable) => (
                    <div
                      key={table.id}
                      className={`group relative p-3 rounded-lg border-2 text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                        table.status === 'OCCUPIED' ? 'bg-red-50 border-red-300 hover:bg-red-100' :
                        table.status === 'AVAILABLE' ? 'bg-green-50 border-green-300 hover:bg-green-100' :
                        table.status === 'RESERVED' ? 'bg-blue-50 border-blue-300 hover:bg-blue-100' :
                        'bg-orange-50 border-orange-300 hover:bg-orange-100'
                      }`}
                      onClick={() => handleTableClick(table)}
                    >
                      <div className="text-sm font-bold text-gray-900 mb-1">{table.tableNumber}</div>
                      <div className="text-xs text-gray-600 mb-2">{table.capacity} seats</div>
                      
                      {/* Status indicator */}
                      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                        table.status === 'OCCUPIED' ? 'bg-red-500' :
                        table.status === 'AVAILABLE' ? 'bg-green-500' :
                        table.status === 'RESERVED' ? 'bg-blue-500' :
                        'bg-orange-500'
                      }`}></div>
                      
                      {/* Status text */}
                      <div className={`text-xs font-medium capitalize ${
                        table.status === 'OCCUPIED' ? 'text-red-700' :
                        table.status === 'AVAILABLE' ? 'text-green-700' :
                        table.status === 'RESERVED' ? 'text-blue-700' :
                        'text-orange-700'
                      }`}>
                        {table.status.toLowerCase()}
                      </div>
                      
                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 bg-black/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                            onClick={(e) => handleTableView(table, e)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {table.status === 'AVAILABLE' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                              onClick={(e) => handleTableAddOrder(table, e)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Kitchen Status */}
          <div className="space-y-6">
            <Card className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <ChefHat className="w-5 h-5 text-green-600" />
                  Kitchen Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">{kitchenEfficiency.activeKOTs}</div>
                    <div className="text-sm font-medium text-blue-700">Active KOTs</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center border border-red-100">
                    <div className="text-2xl font-bold text-red-600">{kitchenEfficiency.overdueKOTs}</div>
                    <div className="text-sm font-medium text-red-700">Overdue Orders</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{kitchenEfficiency.avgPrepTime} min</div>
                    <div className="text-sm font-medium text-gray-700">Avg Prep Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Queue - Below Table Layout */}
        <Card className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-3 text-gray-900">
                <Timer className="w-6 h-6 text-orange-600" />
                Order Queue
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => router.push('/restaurant/order-list')}
              >
                <Timer className="w-4 h-4" />
                View All Orders
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.slice(0, 6).length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <Timer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-500">No orders in queue</p>
                  <p className="text-sm text-gray-400">All orders are up to date</p>
                </div>
              ) : (
                queue.slice(0, 6).map((order: DashboardQueueItem) => (
                  <div key={order.id} className="group p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          order.status.toUpperCase() === 'PENDING' ? 'bg-red-500' : 'bg-orange-500'
                        }`}></div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          order.status.toUpperCase() === 'PENDING' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => router.push(`/restaurant/order-list?order=${order.orderNumber}`)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-gray-900">{order.orderNumber}</span>
                        <span className="text-lg font-bold text-emerald-600">Rs. {order.total.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Table: <span className="font-medium text-gray-900">{order.table?.tableNumber ?? 'N/A'}</span></span>
                        <span className="text-gray-600">
                          {order.estimatedTime ? `${order.estimatedTime} min` : 'Estimating...'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Customer: <span className="font-medium text-gray-900">{order.customerName ?? 'Walk-in'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
