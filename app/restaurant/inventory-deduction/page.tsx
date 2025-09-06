"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Home, AlertTriangle, TrendingDown, CheckCircle, Search, RefreshCw, Eye, History } from "lucide-react";
import { useState, useMemo } from "react";
import { restaurantOrders, type RestaurantOrder } from "@/data/restaurant-data";
import { toast } from "sonner";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

interface DeductionRecord {
  id: number;
  orderNumber: string;
  itemName: string;
  quantityDeducted: number;
  unit: string;
  deductedAt: string;
  deductedBy: string;
  reason: string;
}

const mockInventoryItems: InventoryItem[] = [
  {
    id: 1,
    name: "Chicken Breast",
    category: "Meat",
    currentStock: 25,
    unit: "kg",
    reorderLevel: 10,
    costPerUnit: 8.50,
    supplier: "Fresh Meat Co.",
    lastUpdated: "2025-01-06T10:30:00Z",
    status: 'in-stock'
  },
  {
    id: 2,
    name: "Mozzarella Cheese",
    category: "Dairy",
    currentStock: 5,
    unit: "kg",
    reorderLevel: 8,
    costPerUnit: 12.00,
    supplier: "Dairy Fresh Ltd.",
    lastUpdated: "2025-01-06T09:15:00Z",
    status: 'low-stock'
  },
  {
    id: 3,
    name: "Tomatoes",
    category: "Vegetables",
    currentStock: 0,
    unit: "kg",
    reorderLevel: 15,
    costPerUnit: 3.20,
    supplier: "Green Valley Farms",
    lastUpdated: "2025-01-05T18:45:00Z",
    status: 'out-of-stock'
  },
  {
    id: 4,
    name: "Pizza Dough",
    category: "Bakery",
    currentStock: 20,
    unit: "pieces",
    reorderLevel: 12,
    costPerUnit: 2.50,
    supplier: "Artisan Bakery",
    lastUpdated: "2025-01-06T08:00:00Z",
    status: 'in-stock'
  },
  {
    id: 5,
    name: "Romaine Lettuce",
    category: "Vegetables",
    currentStock: 8,
    unit: "heads",
    reorderLevel: 10,
    costPerUnit: 1.80,
    supplier: "Green Valley Farms",
    lastUpdated: "2025-01-06T07:30:00Z",
    status: 'low-stock'
  }
];

const mockDeductionRecords: DeductionRecord[] = [
  {
    id: 1,
    orderNumber: "ORD-160",
    itemName: "Chicken Breast",
    quantityDeducted: 0.5,
    unit: "kg",
    deductedAt: "2025-01-06T14:35:00Z",
    deductedBy: "System Auto",
    reason: "Order preparation"
  },
  {
    id: 2,
    orderNumber: "ORD-161",
    itemName: "Mozzarella Cheese",
    quantityDeducted: 0.3,
    unit: "kg",
    deductedAt: "2025-01-06T15:15:00Z",
    deductedBy: "System Auto",
    reason: "Order preparation"
  },
  {
    id: 3,
    orderNumber: "ORD-162",
    itemName: "Romaine Lettuce",
    quantityDeducted: 2,
    unit: "heads",
    deductedAt: "2025-01-06T15:30:00Z",
    deductedBy: "John Smith",
    reason: "Manual adjustment"
  }
];

export default function InventoryDeductionPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [manualDeductionQty, setManualDeductionQty] = useState("");
  const [deductionReason, setDeductionReason] = useState("");

  // Filter inventory items
  const filteredItems = useMemo(() => {
    return mockInventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalItems = mockInventoryItems.length;
    const lowStock = mockInventoryItems.filter(item => item.status === 'low-stock').length;
    const outOfStock = mockInventoryItems.filter(item => item.status === 'out-of-stock').length;
    const totalValue = mockInventoryItems.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
    
    return { totalItems, lowStock, outOfStock, totalValue };
  }, []);

  const processOrderDeduction = (order: RestaurantOrder) => {
    // Simulate automatic inventory deduction for an order
    const deductions = order.items.map(item => ({
      itemName: item.foodItem.name,
      quantity: item.quantity,
      ingredients: item.foodItem.ingredients
    }));

    toast.success(`Inventory automatically deducted for ${order.orderNumber}`);
    console.log("Processing deductions:", deductions);
  };

  const handleManualDeduction = () => {
    if (!selectedItem || !manualDeductionQty || !deductionReason) {
      toast.error("Please fill all required fields");
      return;
    }

    const qty = parseFloat(manualDeductionQty);
    if (qty > selectedItem.currentStock) {
      toast.error("Deduction quantity exceeds available stock");
      return;
    }

    toast.success(`Manually deducted ${qty} ${selectedItem.unit} of ${selectedItem.name}`);
    setShowDeductionModal(false);
    setManualDeductionQty("");
    setDeductionReason("");
    setSelectedItem(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">In Stock</Badge>;
      case 'low-stock':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">Low Stock</Badge>;
      case 'out-of-stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
                <BreadcrumbItem>Inventory Deduction</BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="mt-2">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Inventory Management
              </h1>
              <p className="text-gray-600 mt-1">Track and manage automatic inventory deductions</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="h-9 px-4 border-gray-300 hover:bg-gray-50 transition-all duration-200"
              onClick={() => setShowHistoryModal(true)}
            >
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
            <Button className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Stock
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-sm text-sm bg-white/80"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 rounded-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="py-3 rounded-sm bg-gradient-to-br from-blue-50 to-blue-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">Total Items</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalItems}</p>
                  <p className="text-xs text-blue-600">In inventory</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-700">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.lowStock}</p>
                  <p className="text-xs text-yellow-600">Need reorder</p>
                </div>
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-red-50 to-red-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-900">{stats.outOfStock}</p>
                  <p className="text-xs text-red-600">Urgent reorder</p>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-green-50 to-green-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Total Value</p>
                  <p className="text-2xl font-bold text-green-900">${stats.totalValue.toFixed(0)}</p>
                  <p className="text-xs text-green-600">Current stock</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-3 text-gray-900">
              <Package className="w-6 h-6 text-blue-600" />
              Current Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-sm border border-gray-200 bg-white">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-gray-50/80">
                  <TableRow>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Item Name</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Category</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Current Stock</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Reorder Level</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Cost/Unit</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="border-b even:bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                      <TableCell className="py-3">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.supplier}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-medium">{item.currentStock} {item.unit}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm text-gray-600">{item.reorderLevel} {item.unit}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-medium text-gray-900">${item.costPerUnit.toFixed(2)}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDeductionModal(true);
                            }}
                            className="h-8 w-8 p-0 rounded-sm border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <TrendingDown className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-sm border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders for Auto-Deduction */}
        <Card className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-3 text-gray-900">
              <RefreshCw className="w-6 h-6 text-orange-600" />
              Recent Orders - Auto Deduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurantOrders.slice(0, 6).map((order) => (
                <div key={order.id} className="group p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="font-mono text-sm font-bold text-gray-900">{order.orderNumber}</div>
                    <Button
                      size="sm"
                      onClick={() => processOrderDeduction(order)}
                      className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
                    >
                      <TrendingDown className="w-3 h-3" />
                      Process
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>Table: <span className="font-medium">{order.table.number}</span></div>
                    <div>Items: <span className="font-medium">{order.items.length}</span></div>
                    <div>Status: <Badge variant="outline" className="text-xs">{order.status}</Badge></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Manual Deduction Modal */}
        <Dialog open={showDeductionModal} onOpenChange={setShowDeductionModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Manual Inventory Deduction
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-900">{selectedItem.name}</div>
                  <div className="text-sm text-gray-600">Current Stock: {selectedItem.currentStock} {selectedItem.unit}</div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quantity to Deduct</label>
                  <Input
                    type="number"
                    placeholder={`Enter quantity in ${selectedItem.unit}`}
                    value={manualDeductionQty}
                    onChange={(e) => setManualDeductionQty(e.target.value)}
                    max={selectedItem.currentStock}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Reason</label>
                  <Select value={deductionReason} onValueChange={setDeductionReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order-preparation">Order Preparation</SelectItem>
                      <SelectItem value="waste">Waste/Spoilage</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="adjustment">Stock Adjustment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeductionModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleManualDeduction} className="gap-2">
                <TrendingDown className="w-4 h-4" />
                Deduct Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Modal */}
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Deduction History
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-sm border border-gray-200 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDeductionRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-sm">{record.orderNumber}</TableCell>
                        <TableCell>{record.itemName}</TableCell>
                        <TableCell>{record.quantityDeducted} {record.unit}</TableCell>
                        <TableCell className="text-sm">{formatDate(record.deductedAt)}</TableCell>
                        <TableCell>{record.deductedBy}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{record.reason}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHistoryModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
