"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Edit, Plus, Search, RefreshCw, Home, Users, MapPin, Settings, Trash2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
// Using live DB tables via /api/restaurant/tables
import { toast } from "sonner";

type DBTable = {
  id: number;
  tableNumber: string;
  capacity: number;
  location?: string | null;
  status: string; // AVAILABLE, OCCUPIED, RESERVED, OUT_OF_ORDER
};

export default function TableListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<DBTable | null>(null);
  const [tables, setTables] = useState<DBTable[]>([]);
  const [newTable, setNewTable] = useState({
    number: "",
    capacity: 4,
    location: "Main Hall",
  });

  // Load tables from API
  useEffect(() => {
    const loadTables = async () => {
      try {
        const res = await fetch('/api/restaurant/tables');
        if (!res.ok) throw new Error('Failed to load tables');
        const data = await res.json();
        setTables(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadTables();
  }, []);

  const filteredTables = useMemo(() => {
    const q = search.toLowerCase();
    return tables.filter(table => {
      const matchesSearch = table.tableNumber.toLowerCase().includes(q) ||
        (table.location?.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === "All" || table.status === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, tables]);

  const handleAddTable = async () => {
    if (!newTable.number.trim()) {
      toast.error('Please enter a table number');
      return;
    }
    try {
      const res = await fetch('/api/restaurant/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: newTable.number.trim(),
          capacity: newTable.capacity,
          location: newTable.location,
        }),
      });
      if (!res.ok) throw new Error('Failed to add table');
      toast.success(`Table ${newTable.number} added successfully`);
      // refresh list
      const refreshed = await fetch('/api/restaurant/tables').then(r => r.json());
      setTables(refreshed);
      setShowAddModal(false);
      setNewTable({ number: "", capacity: 4, location: "Main Hall" });
    } catch (e) {
      console.error(e);
      toast.error('Failed to add table');
    }
  };

  const handleEditTable = () => {
    toast.success(`Table ${selectedTable?.tableNumber} updated successfully`);
    setShowEditModal(false);
    setSelectedTable(null);
  };

  const handleDeleteTable = (table: DBTable) => {
    toast.success(`Table ${table.tableNumber} deleted successfully`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OCCUPIED':
        return <Badge variant="destructive">Occupied</Badge>;
      case 'AVAILABLE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>;
      case 'RESERVED':
        return <Badge variant="default">Reserved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
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
                <BreadcrumbItem>Table Management</BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="mt-2">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Table Management
              </h1>
              <p className="text-gray-600 mt-1">Manage restaurant tables and seating capacity</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Table
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => {
              // manual refresh
              fetch('/api/restaurant/tables').then(r=>r.json()).then(setTables);
            }}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tables by number or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-sm text-sm bg-white/80"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 rounded-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Occupied">Occupied</SelectItem>
              <SelectItem value="Reserved">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="py-3 rounded-sm bg-gradient-to-br from-blue-50 to-blue-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">Total Tables</p>
                  <p className="text-2xl font-bold text-blue-900">{tables.length}</p>
                  <p className="text-xs text-blue-600">All locations</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-green-50 to-green-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Available</p>
                  <p className="text-2xl font-bold text-green-900">{tables.filter(t => t.status === 'AVAILABLE').length}</p>
                  <p className="text-xs text-green-600">Ready for guests</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-red-50 to-red-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700">Occupied</p>
                  <p className="text-2xl font-bold text-red-900">{tables.filter(t => t.status === 'OCCUPIED').length}</p>
                  <p className="text-xs text-red-600">Currently serving</p>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 rounded-sm bg-gradient-to-br from-amber-50 to-amber-100/50 border-1 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-700">Total Capacity</p>
                  <p className="text-2xl font-bold text-amber-900">{tables.reduce((sum, t) => sum + t.capacity, 0)}</p>
                  <p className="text-xs text-amber-600">Maximum seats</p>
                </div>
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables List */}
        <div className="overflow-x-auto rounded-sm border border-gray-200 bg-white">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-gray-50/80">
              <TableRow>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 px-6">Table</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Capacity</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Location</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Status</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTables.map((table) => (
                <TableRow key={table.id} className="border-b even:bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                  <TableCell className="py-3 px-6">
                    <div className="font-mono text-sm font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded text-center w-fit">
                      {table.tableNumber}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{table.capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{table.location ?? '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {getStatusBadge(table.status)}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 rounded-sm border-blue-200 text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setSelectedTable(table);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 rounded-sm border-red-200 text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteTable(table)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Add Table Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
              <DialogDescription>
                Create a new table for the restaurant
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="table-number">Table Number</Label>
                <Input
                  id="table-number"
                  placeholder="e.g., T001"
                  value={newTable.number}
                  onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="capacity">Seating Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="20"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || 4 })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Select value={newTable.location} onValueChange={(value) => setNewTable({ ...newTable, location: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Hall">Main Hall</SelectItem>
                    <SelectItem value="Private Room">Private Room</SelectItem>
                    <SelectItem value="Terrace">Terrace</SelectItem>
                    <SelectItem value="Garden">Garden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Shape is not stored in DB; removed from add UI */}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTable}>
                Add Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Table Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Table</DialogTitle>
              <DialogDescription>
                Update table information
              </DialogDescription>
            </DialogHeader>
            {selectedTable && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-table-number">Table Number</Label>
                  <Input
                    id="edit-table-number"
                    value={selectedTable.tableNumber}
                    onChange={(e) => setSelectedTable({ ...selectedTable, tableNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-capacity">Seating Capacity</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={selectedTable.capacity}
                    onChange={(e) => setSelectedTable({ ...selectedTable, capacity: parseInt(e.target.value) || 4 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Select value={selectedTable.location ?? 'Main Hall'} onValueChange={(value) => setSelectedTable({ ...selectedTable, location: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Main Hall">Main Hall</SelectItem>
                      <SelectItem value="Private Room">Private Room</SelectItem>
                      <SelectItem value="Terrace">Terrace</SelectItem>
                      <SelectItem value="Garden">Garden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Shape not stored in DB; removed from edit UI */}
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={selectedTable.status} onValueChange={(value: string) => setSelectedTable({ ...selectedTable, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="OCCUPIED">Occupied</SelectItem>
                      <SelectItem value="RESERVED">Reserved</SelectItem>
                      <SelectItem value="OUT_OF_ORDER">Out of Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTable}>
                Update Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
