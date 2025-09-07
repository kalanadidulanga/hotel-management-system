"use client";

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Eye, Edit, Plus, Search, Filter, RefreshCw, Home, User, Phone, Mail, Clock, Trash2, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

const PAGE_SIZE = 10;

const formatDate = (value: string | number | Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));

interface Waiter {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  shift: string;
  status: string;
  experience?: number;
  joinDate: string;
  salary?: number;
}

// Stats card configuration
const STATS_CONFIG = [
  {
    id: 'total',
    title: 'Total Waiters',
    subtitle: 'All waiters',
    icon: Users,
    gradient: 'from-blue-50 to-blue-100/50',
    textColor: 'text-blue-700',
    numberColor: 'text-blue-900',
    subtitleColor: 'text-blue-600',
    iconBg: 'bg-blue-500',
    getValue: (waiters: Waiter[]) => waiters.length,
    format: (value: number) => value.toString()
  },
  {
    id: 'active',
    title: 'Active',
    subtitle: 'Currently working',
    icon: User,
    gradient: 'from-emerald-50 to-emerald-100/50',
    textColor: 'text-emerald-700',
    numberColor: 'text-emerald-900',
    subtitleColor: 'text-emerald-600',
    iconBg: 'bg-emerald-500',
    getValue: (waiters: Waiter[]) => waiters.filter(w => w.status === 'ACTIVE').length,
    format: (value: number) => value.toString()
  },
  {
    id: 'onleave',
    title: 'On Leave',
    subtitle: 'Currently away',
    icon: Clock,
    gradient: 'from-orange-50 to-orange-100/50',
    textColor: 'text-orange-700',
    numberColor: 'text-orange-900',
    subtitleColor: 'text-orange-600',
    iconBg: 'bg-orange-500',
    getValue: (waiters: Waiter[]) => waiters.filter(w => w.status === 'ON_LEAVE').length,
    format: (value: number) => value.toString()
  },
  {
    id: 'experience',
    title: 'Avg Experience',
    subtitle: 'Years of service',
    icon: User,
    gradient: 'from-purple-50 to-purple-100/50',
    textColor: 'text-purple-700',
    numberColor: 'text-purple-900',
    subtitleColor: 'text-purple-600',
    iconBg: 'bg-purple-500',
    getValue: (waiters: Waiter[]) => waiters.length > 0 ? waiters.reduce((acc, w) => acc + (w.experience || 0), 0) / waiters.length : 0,
    format: (value: number) => `${value.toFixed(1)} yrs`
  }
] as const;

// Mock data for waiters
const mockWaiters: Waiter[] = [
  {
    id: 1,
    name: "Alice Johnson",
    phone: "+1234567890",
    email: "alice@hotel.com",
    shift: "MORNING",
    status: "ACTIVE",
    experience: 2,
    joinDate: "2023-01-15",
    salary: 25000
  },
  {
    id: 2,
    name: "Bob Smith",
    phone: "+1234567891",
    email: "bob@hotel.com",
    shift: "EVENING",
    status: "ACTIVE",
    experience: 3,
    joinDate: "2022-08-20",
    salary: 28000
  },
  {
    id: 3,
    name: "Carol Davis",
    phone: "+1234567892",
    email: "carol@hotel.com",
    shift: "NIGHT",
    status: "ON_LEAVE",
    experience: 1,
    joinDate: "2023-06-10",
    salary: 22000
  },
  {
    id: 4,
    name: "David Wilson",
    phone: "+1234567893",
    email: "david@hotel.com",
    shift: "MORNING",
    status: "ACTIVE",
    experience: 4,
    joinDate: "2021-12-05",
    salary: 32000
  },
  {
    id: 5,
    name: "Eva Brown",
    phone: "+1234567894",
    email: "eva@hotel.com",
    shift: "EVENING",
    status: "INACTIVE",
    experience: 2,
    joinDate: "2023-03-22",
    salary: 26000
  }
];

export default function ManageWaitersPage() {
  // State management
  const [waiters, setWaiters] = useState<Waiter[]>(mockWaiters);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | (Omit<Waiter, "id"> & { id: 0 }) | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed values with memoization
  const statuses = useMemo(
    () => ["All", ...Array.from(new Set(waiters.map(waiter => waiter.status)))],
    [waiters]
  );

  const shifts = useMemo(
    () => ["All", ...Array.from(new Set(waiters.map(waiter => waiter.shift)))],
    [waiters]
  );

  const filteredWaiters = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return waiters.filter(waiter => {
      const matchesSearch = [
        waiter.name,
        waiter.phone,
        waiter.email
      ].some(field => field?.toLowerCase().includes(searchLower));
      
      const matchesStatus = statusFilter === "All" || waiter.status === statusFilter;
      const matchesShift = shiftFilter === "All" || waiter.shift === shiftFilter;
      return matchesSearch && matchesStatus && matchesShift;
    });
  }, [waiters, searchQuery, statusFilter, shiftFilter]);

  const paginatedWaiters = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredWaiters.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredWaiters, currentPage]);

  const totalPages = Math.ceil(filteredWaiters.length / PAGE_SIZE);

  const handleCreate = async (data: Omit<Waiter, "id">) => {
    try {
      const newWaiter = {
        ...data,
        id: Math.max(...waiters.map(w => w.id)) + 1
      };
      setWaiters(prev => [...prev, newWaiter]);
      toast.success("Waiter added successfully");
      setEditingWaiter(null);
    } catch {
      toast.error("Failed to add waiter");
    }
  };

  const handleUpdate = async (data: Waiter) => {
    try {
      setWaiters(prev => prev.map(w => w.id === data.id ? data : w));
      toast.success("Waiter updated successfully");
      setEditingWaiter(null);
    } catch {
      toast.error("Failed to update waiter");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setWaiters(prev => prev.filter(w => w.id !== id));
      toast.success("Waiter removed successfully");
    } catch {
      toast.error("Failed to remove waiter");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: "default",
      INACTIVE: "secondary", 
      ON_LEAVE: "outline"
    } as const;
    
    const colors = {
      ACTIVE: "bg-green-100 text-green-700 border-green-200",
      INACTIVE: "bg-red-100 text-red-700 border-red-200",
      ON_LEAVE: "bg-yellow-100 text-yellow-700 border-yellow-200"
    } as const;

    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getShiftBadge = (shift: string) => {
    const colors = {
      MORNING: "bg-blue-100 text-blue-700",
      EVENING: "bg-purple-100 text-purple-700", 
      NIGHT: "bg-indigo-100 text-indigo-700"
    } as const;

    return (
      <Badge className={colors[shift as keyof typeof colors] || "bg-gray-100 text-gray-700"}>
        {shift}
      </Badge>
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Waiters refreshed successfully');
    }, 1000);
  };

  const handleViewWaiter = (waiter: Waiter) => {
    setSelectedWaiter(waiter);
    setViewOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, newPage)));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      <div className="flex-1 p-6 space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/restaurant" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <Home className="w-4 h-4" /> Restaurant
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-sm font-medium text-gray-900">Waiter Management</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Waiter Management
              </h1>
              <p className="text-gray-600 mt-1">Manage restaurant staff and their schedules</p>
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
                onClick={() => setEditingWaiter({ 
                  id: 0, 
                  name: "", 
                  phone: "", 
                  email: "", 
                  shift: "MORNING", 
                  status: "ACTIVE", 
                  experience: 0, 
                  joinDate: new Date().toISOString().split('T')[0],
                  salary: 0
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Waiter
              </Button>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search waiters..."
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

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS_CONFIG.map(stat => {
            const Icon = stat.icon;
            const value = stat.getValue(waiters);
            const displayValue = 'format' in stat ? stat.format(value) : value.toString();
            
            return (
              <Card 
                key={stat.id} 
                className={`py-3 rounded-sm bg-gradient-to-br ${stat.gradient} border-1 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer`}
                onClick={() => {
                  if (stat.id === 'active') setStatusFilter('ACTIVE');
                  else if (stat.id === 'onleave') setStatusFilter('ON_LEAVE');
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

        {/* Mobile View - Cards */}
        <div className="block lg:hidden space-y-4">
          {paginatedWaiters.map((waiter, index) => (
            <Card key={waiter.id} className="p-4 hover:shadow-md transition-all duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{waiter.name}</h3>
                      <p className="text-sm text-gray-500">{waiter.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewWaiter(waiter)}
                      className="h-8 w-8 p-0 rounded-sm border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingWaiter(waiter)}
                      className="h-8 w-8 p-0 rounded-sm border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{waiter.shift}</span>
                  </div>
                  {getStatusBadge(waiter.status)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Joined: {formatDate(waiter.joinDate)}</span>
                  <span className="font-medium text-emerald-600">
                    {waiter.experience || 0} yrs exp
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden lg:block overflow-x-auto rounded-sm border border-gray-200 bg-white">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-gray-50/80">
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 px-6 bg-gray-100/50">
                  #
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">
                  Name
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">
                  Contact
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">
                  Shift
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">
                  Experience
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">
                  Join Date
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3">
                  Salary
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 py-3 text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedWaiters.map((waiter, index) => (
                <TableRow key={waiter.id} className="border-b even:bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                  <TableCell className="py-3 px-6">
                    <div className="w-6 h-6 bg-gray-100 rounded text-xs font-medium text-gray-600 flex items-center justify-center">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="font-medium text-gray-900">{waiter.name}</div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="space-y-1">
                      {waiter.phone && (
                        <div className="text-sm text-gray-600">{waiter.phone}</div>
                      )}
                      {waiter.email && (
                        <div className="text-xs text-gray-500">{waiter.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">{waiter.shift}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {getStatusBadge(waiter.status)}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm font-medium">{waiter.experience || 0} years</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-gray-600">{formatDate(waiter.joinDate)}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    {waiter.salary && (
                      <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm inline-block">
                        Rs. {waiter.salary.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewWaiter(waiter)}
                        className="h-8 w-8 p-0 rounded-sm border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingWaiter(waiter)}
                        className="h-8 w-8 p-0 rounded-sm border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* No Results */}
        {filteredWaiters.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No waiters found matching your criteria</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border p-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`rounded-lg ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100'}`}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className={`rounded-lg ${
                        currentPage === page 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`rounded-lg ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100'}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* View Waiter Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100/50 -m-6 mb-6 p-6 rounded-t-lg">
            <DialogTitle className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Waiter Details
            </DialogTitle>
          </DialogHeader>
          {selectedWaiter && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</label>
                      <p className="text-sm font-medium text-gray-900">{selectedWaiter.name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</label>
                      <p className="text-sm text-gray-700">{selectedWaiter.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                      <p className="text-sm text-gray-700">{selectedWaiter.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Work Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</label>
                      <p className="text-sm text-gray-700">{selectedWaiter.shift}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedWaiter.status)}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</label>
                      <p className="text-sm text-gray-700">{selectedWaiter.experience || 0} years</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Employment</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</label>
                      <p className="text-sm text-gray-700">{formatDate(selectedWaiter.joinDate)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</label>
                      <p className="text-sm font-medium text-emerald-600">
                        {selectedWaiter.salary ? `Rs. ${selectedWaiter.salary.toLocaleString()}` : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setViewOpen(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setViewOpen(false);
                    setEditingWaiter(selectedWaiter);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Waiter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Waiter Dialog */}
      <Dialog open={!!editingWaiter} onOpenChange={() => setEditingWaiter(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100/50 -m-6 mb-6 p-6 rounded-t-lg">
            <DialogTitle className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              {editingWaiter?.id === 0 ? (
                <>
                  <Plus className="w-5 h-5" />
                  Add New Waiter
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5" />
                  Edit Waiter
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {editingWaiter && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget as HTMLFormElement);
                const data = {
                  name: form.get("name") as string,
                  phone: form.get("phone") as string,
                  email: form.get("email") as string,
                  shift: form.get("shift") as string,
                  status: form.get("status") as string,
                  experience: parseInt((form.get("experience") as string) || "0"),
                  joinDate: form.get("joinDate") as string,
                  salary: parseFloat((form.get("salary") as string) || "0"),
                };
                
                if (editingWaiter.id === 0) {
                  handleCreate(data);
                } else {
                  handleUpdate({ ...data, id: editingWaiter.id });
                }
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Name *</label>
                      <Input 
                        name="name" 
                        defaultValue={editingWaiter.name} 
                        required 
                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Phone</label>
                      <Input 
                        name="phone" 
                        defaultValue={editingWaiter.phone} 
                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                      <Input 
                        name="email" 
                        type="email" 
                        defaultValue={editingWaiter.email} 
                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Work Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Shift *</label>
                      <Select name="shift" defaultValue={editingWaiter.shift}>
                        <SelectTrigger className="h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MORNING">Morning</SelectItem>
                          <SelectItem value="EVENING">Evening</SelectItem>
                          <SelectItem value="NIGHT">Night</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Status *</label>
                      <Select name="status" defaultValue={editingWaiter.status}>
                        <SelectTrigger className="h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="INACTIVE">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Inactive
                            </div>
                          </SelectItem>
                          <SelectItem value="ON_LEAVE">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              On Leave
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Experience (years)</label>
                      <Input 
                        name="experience" 
                        type="number" 
                        min="0" 
                        defaultValue={editingWaiter.experience} 
                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Join Date *</label>
                  <Input 
                    name="joinDate" 
                    type="date" 
                    defaultValue={editingWaiter.joinDate} 
                    required 
                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Monthly Salary (Rs.)</label>
                  <Input 
                    name="salary" 
                    type="number" 
                    min="0" 
                    defaultValue={editingWaiter.salary} 
                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    placeholder="e.g., 25000"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setEditingWaiter(null)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6"
                >
                  {editingWaiter.id === 0 ? "Add Waiter" : "Update Waiter"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
