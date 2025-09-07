"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChefHat, Home, Printer, Clock, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
type DBOrderItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  product: { id: number; name: string };
  notes?: string | null;
};

type DBOrder = {
  id: number;
  orderNumber: string;
  status: string; // PENDING, PREPARING, etc.
  total: number;
  estimatedTime?: number | null;
  orderTime: string;
  customerName?: string | null;
  takenByStaff?: { name?: string | null } | null;
  table?: { tableNumber: string } | null;
  items: DBOrderItem[];
};

type KOTItem = { name: string; quantity: number; specialInstructions?: string };
type KOT = {
  id: number;
  orderNumber: string;
  tableNumber: string;
  items: KOTItem[];
  customerName?: string | null;
  waiterName?: string | null;
  orderTime: Date;
  priority: 'high' | 'normal';
  status: 'active' | 'done';
  estimatedTime: number;
  specialNotes?: string;
};

export default function KOTGenerationPage() {
  const [showKOTModal, setShowKOTModal] = useState(false);
  const [generatedKOT, setGeneratedKOT] = useState<KOT | null>(null);
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [avgPrepMinutes, setAvgPrepMinutes] = useState(0);

  async function loadData() {
    try {
      const [kotRes, dashRes] = await Promise.all([
        fetch('/api/restaurant/kot'),
        fetch('/api/restaurant/dashboard'),
      ]);
      if (!kotRes.ok) throw new Error('Failed to load KOT orders');
      const kotOrders: DBOrder[] = await kotRes.json();
      setOrders(kotOrders);

      if (dashRes.ok) {
        const dash = await dashRes.json();
        setActiveCount(dash.kitchen?.activeKOTs ?? 0);
        setAvgPrepMinutes(dash.kitchen?.avgPrepTime ?? 0);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load KOT data');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter orders that need KOT generation (PENDING and PREPARING; not yet generated)
  const ordersNeedingKOT = useMemo(() => {
    return orders.filter(order => order.status === 'PENDING' || order.status === 'PREPARING');
  }, [orders]);

  const generateKOT = async (order: DBOrder) => {
    try {
      const res = await fetch('/api/restaurant/kot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, estimatedTime: order.estimatedTime ?? 25 }),
      });
      if (!res.ok) throw new Error('Failed to mark KOT generated');

      const kotItems: KOTItem[] = order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        specialInstructions: item.notes ?? '',
      }));

      const newKOT: KOT = {
        id: Date.now(),
        orderNumber: order.orderNumber,
        tableNumber: order.table?.tableNumber ?? 'N/A',
        items: kotItems,
        customerName: order.customerName ?? '',
        waiterName: order.takenByStaff?.name ?? '',
        orderTime: new Date(order.orderTime),
        priority: order.status === 'PENDING' ? 'high' : 'normal',
        status: 'active',
        estimatedTime: order.estimatedTime ?? 25,
        specialNotes: undefined,
      };

      setGeneratedKOT(newKOT);
      setShowKOTModal(true);
      // Refresh list so it disappears from needing KOT
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate KOT');
    }
  };

  const printKOT = () => {
    if (generatedKOT) {
      // Create print content
      const printContent = `
        <div style="font-family: monospace; padding: 20px; max-width: 300px;">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
            <h2 style="margin: 0;">KITCHEN ORDER TICKET</h2>
            <p style="margin: 5px 0;">KOT #${generatedKOT.id}</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Order:</strong> ${generatedKOT.orderNumber}<br>
            <strong>Table:</strong> ${generatedKOT.tableNumber}<br>
            <strong>Customer:</strong> ${generatedKOT.customerName}<br>
            <strong>Waiter:</strong> ${generatedKOT.waiterName}<br>
            <strong>Time:</strong> ${generatedKOT.orderTime.toLocaleString()}<br>
            <strong>Priority:</strong> ${generatedKOT.priority.toUpperCase()}
          </div>
          
          <div style="border-top: 1px solid #000; padding-top: 10px; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0;">ITEMS:</h3>
            ${generatedKOT.items.map(item => `
              <div style="margin-bottom: 8px;">
                <strong>${item.quantity}x ${item.name}</strong>
                ${item.specialInstructions ? `<br><em>Note: ${item.specialInstructions}</em>` : ''}
              </div>
            `).join('')}
          </div>
          
          ${generatedKOT.specialNotes ? `
            <div style="border-top: 1px solid #000; padding-top: 10px; margin-bottom: 15px;">
              <strong>Special Notes:</strong><br>
              ${generatedKOT.specialNotes}
            </div>
          ` : ''}
          
          <div style="text-align: center; border-top: 2px solid #000; padding-top: 10px;">
            <strong>EST. TIME: ${generatedKOT.estimatedTime} MIN</strong>
          </div>
        </div>
      `;

      // Robust print via hidden iframe (avoids popup blockers)
      const html = `<!DOCTYPE html><html><head><title>KOT - ${generatedKOT.orderNumber}</title><style>body{margin:0;padding:0;}@media print{body{-webkit-print-color-adjust:exact;}}</style></head><body>${printContent}</body></html>`;
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        iframe.onload = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 100);
        };
      } else {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(html);
          w.document.close();
          w.onload = function () { w.print(); w.close(); };
        }
      }

      toast.success(`KOT generated and sent to printer for ${generatedKOT.orderNumber}`);
      setShowKOTModal(false);
      setGeneratedKOT(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Pending</Badge>;
      case 'preparing':
        return <Badge variant="default" className="gap-1 bg-orange-100 text-orange-800"><Clock className="w-3 h-3" />Preparing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? 'text-red-600 font-bold' : 'text-gray-600';
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
                <BreadcrumbItem>KOT Generation</BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="mt-2">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Kitchen Order Tickets
              </h1>
              <p className="text-gray-600 mt-1">Generate and print KOTs for kitchen staff</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="py-3 rounded-sm bg-gradient-to-br from-red-50 to-red-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700">Pending KOTs</p>
                  <p className="text-2xl font-bold text-red-900">{ordersNeedingKOT.filter(o => o.status === 'PENDING').length}</p>
                  <p className="text-xs text-red-600">Need generation</p>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-orange-50 to-orange-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-700">Active KOTs</p>
                  <p className="text-2xl font-bold text-orange-900">{activeCount}</p>
                  <p className="text-xs text-orange-600">In kitchen</p>
                </div>
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-blue-50 to-blue-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-900">{ordersNeedingKOT.length}</p>
                  <p className="text-xs text-blue-600">Requiring KOT</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-green-50 to-green-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Avg Prep Time</p>
                  <p className="text-2xl font-bold text-green-900">{avgPrepMinutes}</p>
                  <p className="text-xs text-green-600">Minutes</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Needing KOT */}
        <Card className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-3 text-gray-900">
              <ChefHat className="w-6 h-6 text-orange-600" />
              Orders Requiring KOT Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersNeedingKOT.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-500">All orders have KOTs generated</p>
                <p className="text-sm text-gray-400">No pending orders requiring KOT generation</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ordersNeedingKOT.map((order) => (
                  <div key={order.id} className="group p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status.toLowerCase())}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => generateKOT(order)}
                        className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
                      >
                        <FileText className="w-3 h-3" />
                        Generate KOT
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-gray-900">{order.orderNumber}</span>
                        <span className="text-lg font-bold text-emerald-600">${order.total.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Table: <span className="font-medium text-gray-900">{order.table?.tableNumber ?? 'N/A'}</span></span>
                        <span className={`${getPriorityColor(order.status === 'PENDING' ? 'high' : 'normal')}`}>{order.estimatedTime ? `${order.estimatedTime} min` : 'Estimating...'}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Customer: <span className="font-medium text-gray-900">{order.customerName ?? '-'}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Waiter: <span className="font-medium text-gray-900">{order.takenByStaff?.name ?? '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KOT Preview Modal */}
        <Dialog open={showKOTModal} onOpenChange={setShowKOTModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                KOT Preview
              </DialogTitle>
            </DialogHeader>
            {generatedKOT && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                  <div className="text-center border-b border-gray-300 pb-2 mb-3">
                    <h3 className="font-bold">KITCHEN ORDER TICKET</h3>
                    <p className="text-xs">KOT #{generatedKOT.id}</p>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    <div><strong>Order:</strong> {generatedKOT.orderNumber}</div>
                    <div><strong>Table:</strong> {generatedKOT.tableNumber}</div>
                    <div><strong>Customer:</strong> {generatedKOT.customerName}</div>
                    <div><strong>Waiter:</strong> {generatedKOT.waiterName}</div>
                    <div><strong>Time:</strong> {generatedKOT.orderTime.toLocaleString()}</div>
                    <div><strong>Priority:</strong> <span className={getPriorityColor(generatedKOT.priority)}>{generatedKOT.priority.toUpperCase()}</span></div>
                  </div>
                  
                  <div className="border-t border-gray-300 pt-2 mb-3">
                    <h4 className="font-bold mb-2">ITEMS:</h4>
                    {generatedKOT.items.map((item, index) => (
                      <div key={index} className="mb-2">
                        <div><strong>{item.quantity}x {item.name}</strong></div>
                        {item.specialInstructions && (
                          <div className="text-xs italic text-gray-600">Note: {item.specialInstructions}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {generatedKOT.specialNotes && (
                    <div className="border-t border-gray-300 pt-2 mb-3">
                      <strong>Special Notes:</strong><br />
                      {generatedKOT.specialNotes}
                    </div>
                  )}
                  
                  <div className="text-center border-t border-gray-300 pt-2">
                    <strong>EST. TIME: {generatedKOT.estimatedTime} MIN</strong>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowKOTModal(false)}>
                Cancel
              </Button>
              <Button onClick={printKOT} className="gap-2">
                <Printer className="w-4 h-4" />
                Print KOT
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
