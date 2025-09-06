"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Home, Printer, FileText, CheckCircle, Search, RefreshCw, Eye, Download, Mail } from "lucide-react";
import { useState, useMemo } from "react";
import { restaurantOrders, type RestaurantOrder } from "@/data/restaurant-data";
import { toast } from "sonner";

export default function BillPrintingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billFormat, setBillFormat] = useState<'thermal' | 'a4' | 'receipt'>('thermal');

  // Filter orders that can have bills printed (served, completed, paid)
  const billableOrders = useMemo(() => {
    return restaurantOrders.filter(order => 
      ['served', 'completed'].includes(order.status) || order.paymentStatus === 'paid'
    );
  }, []);

  // Filter orders based on search and status
  const filteredOrders = useMemo(() => {
    return billableOrders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.table.number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [billableOrders, searchTerm, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalBills = billableOrders.length;
    const paidBills = billableOrders.filter(order => order.paymentStatus === 'paid').length;
    const pendingBills = billableOrders.filter(order => order.paymentStatus === 'pending').length;
    const totalRevenue = billableOrders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    return { totalBills, paidBills, pendingBills, totalRevenue };
  }, [billableOrders]);

  const generateBill = (order: RestaurantOrder) => {
    setSelectedOrder(order);
    setShowBillModal(true);
  };

  const printBill = () => {
    if (!selectedOrder) return;

    const billContent = generateBillHTML(selectedOrder, billFormat);
    
    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(billContent);
      printWindow.document.close();
      printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
      };
    }

    toast.success(`Bill printed for ${selectedOrder.orderNumber}`);
    setShowBillModal(false);
  };

  const downloadBill = () => {
    if (!selectedOrder) return;

    const billContent = generateBillHTML(selectedOrder, 'a4');
    const blob = new Blob([billContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_${selectedOrder.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Bill downloaded for ${selectedOrder.orderNumber}`);
  };

  const emailBill = () => {
    if (!selectedOrder) return;
    
    // Simulate email functionality
    toast.success(`Bill emailed to customer for ${selectedOrder.orderNumber}`);
    setShowBillModal(false);
  };

  const generateBillHTML = (order: RestaurantOrder, format: string) => {
    const isReceipt = format === 'thermal' || format === 'receipt';
    const maxWidth = isReceipt ? '300px' : '210mm';
    const fontSize = isReceipt ? '12px' : '14px';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${order.orderNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: ${isReceipt ? '10px' : '20px'};
              font-size: ${fontSize};
              max-width: ${maxWidth};
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .hotel-name {
              font-size: ${isReceipt ? '16px' : '20px'};
              font-weight: bold;
              margin-bottom: 5px;
            }
            .bill-info {
              margin-bottom: 15px;
            }
            .bill-info div {
              margin-bottom: 3px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .items-table th,
            .items-table td {
              border-bottom: 1px solid #ccc;
              padding: 5px;
              text-align: left;
            }
            .items-table th {
              border-bottom: 2px solid #000;
              font-weight: bold;
            }
            .total-section {
              border-top: 2px solid #000;
              padding-top: 10px;
              margin-top: 15px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .grand-total {
              font-weight: bold;
              font-size: ${isReceipt ? '14px' : '16px'};
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              border-top: 1px solid #000;
              padding-top: 10px;
              font-size: ${isReceipt ? '10px' : '12px'};
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hotel-name">GRAND HOTEL RESTAURANT</div>
            <div>123 Main Street, City, State 12345</div>
            <div>Phone: (555) 123-4567</div>
          </div>
          
          <div class="bill-info">
            <div><strong>Bill No:</strong> ${order.orderNumber}</div>
            <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
            <div><strong>Table:</strong> ${order.table.number}</div>
            <div><strong>Customer:</strong> ${order.customerName}</div>
            <div><strong>Waiter:</strong> ${order.waiterName}</div>
            <div><strong>Customer Type:</strong> ${order.customerType}</div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    ${item.foodItem.name}
                    ${item.variant ? `<br><small>(${item.variant.size})</small>` : ''}
                    ${item.specialInstructions ? `<br><small>Note: ${item.specialInstructions}</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td>$${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>$${order.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-line">
              <span>Tax (${((order.tax / order.subtotal) * 100).toFixed(1)}%):</span>
              <span>$${order.tax.toFixed(2)}</span>
            </div>
            <div class="total-line">
              <span>Service Charge:</span>
              <span>$${order.serviceCharge.toFixed(2)}</span>
            </div>
            ${order.discount > 0 ? `
              <div class="total-line">
                <span>Discount:</span>
                <span>-$${order.discount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-line grand-total">
              <span>TOTAL AMOUNT:</span>
              <span>$${order.totalAmount.toFixed(2)}</span>
            </div>
            <div class="total-line">
              <span>Payment Method:</span>
              <span>${order.paymentMethod || 'Pending'}</span>
            </div>
            <div class="total-line">
              <span>Payment Status:</span>
              <span>${order.paymentStatus.toUpperCase()}</span>
            </div>
          </div>
          
          <div class="footer">
            <div>Thank you for dining with us!</div>
            <div>Visit us again soon</div>
            <div>---</div>
            <div>Generated on: ${new Date().toLocaleString()}</div>
          </div>
        </body>
      </html>
    `;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'served':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">Served</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
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
                <BreadcrumbItem>Bill Printing</BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="mt-2">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Bill Management
              </h1>
              <p className="text-gray-600 mt-1">Generate and print customer bills</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="h-9 px-4 border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders, customers, tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-sm text-sm bg-white/80"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 rounded-sm">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="py-3 rounded-sm bg-gradient-to-br from-blue-50 to-blue-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">Total Bills</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalBills}</p>
                  <p className="text-xs text-blue-600">Ready to print</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-green-50 to-green-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Paid Bills</p>
                  <p className="text-2xl font-bold text-green-900">{stats.paidBills}</p>
                  <p className="text-xs text-green-600">Completed</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-700">Pending Bills</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pendingBills}</p>
                  <p className="text-xs text-yellow-600">Awaiting payment</p>
                </div>
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-900">${stats.totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-emerald-600">From paid bills</p>
                </div>
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-3 text-gray-900">
              <Receipt className="w-6 h-6 text-blue-600" />
              Billable Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-sm border border-gray-200 bg-white">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-gray-50/80">
                  <TableRow>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Order</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Customer</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Table</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Order Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Payment</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-b even:bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                      <TableCell className="py-3">
                        <div className="font-mono text-sm font-bold text-gray-900">{order.orderNumber}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-500 capitalize">{order.customerType}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">{order.table.number}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-bold text-emerald-600">${order.totalAmount.toFixed(2)}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        {getOrderStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="py-3">
                        {getStatusBadge(order.paymentStatus)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm text-gray-600">{formatDate(order.createdAt)}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => generateBill(order)}
                            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                          >
                            <Printer className="w-3 h-3" />
                            Print
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

        {/* Bill Preview Modal */}
        <Dialog open={showBillModal} onOpenChange={setShowBillModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Bill Preview - {selectedOrder?.orderNumber}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">Print Format</label>
                    <Select value={billFormat} onValueChange={(value: 'thermal' | 'a4' | 'receipt') => setBillFormat(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thermal">Thermal Receipt (58mm)</SelectItem>
                        <SelectItem value="receipt">Standard Receipt (80mm)</SelectItem>
                        <SelectItem value="a4">A4 Format</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <div className="font-mono text-sm">
                    <div className="text-center border-b border-gray-300 pb-2 mb-3">
                      <div className="font-bold">GRAND HOTEL RESTAURANT</div>
                      <div className="text-xs">123 Main Street, City, State</div>
                    </div>
                    
                    <div className="space-y-1 mb-3 text-xs">
                      <div><strong>Bill:</strong> {selectedOrder.orderNumber}</div>
                      <div><strong>Table:</strong> {selectedOrder.table.number}</div>
                      <div><strong>Customer:</strong> {selectedOrder.customerName}</div>
                      <div><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</div>
                    </div>
                    
                    <div className="border-t border-gray-300 pt-2 mb-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-xs mb-1">
                          <div className="flex-1">
                            <div>{item.foodItem.name}</div>
                            <div className="text-gray-600">{item.quantity} x ${item.unitPrice.toFixed(2)}</div>
                          </div>
                          <div>${item.totalPrice.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-300 pt-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${selectedOrder.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span>${selectedOrder.serviceCharge.toFixed(2)}</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between">
                          <span>Discount:</span>
                          <span>-${selectedOrder.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                        <span>TOTAL:</span>
                        <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="text-center text-xs mt-3 border-t border-gray-300 pt-2">
                      <div>Thank you for dining with us!</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBillModal(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={downloadBill} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" onClick={emailBill} className="gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Button>
              <Button onClick={printBill} className="gap-2">
                <Printer className="w-4 h-4" />
                Print Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
