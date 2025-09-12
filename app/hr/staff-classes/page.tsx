"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    AlertCircle,
    Calendar,
    Clock,
    DollarSign,
    Edit,
    Filter,
    Moon,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    Users,
    Briefcase
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface StaffClass {
    id: number;
    name: string;
    salaryType: 'HOURLY' | 'DAILY' | 'MONTHLY';
    baseSalary: number;
    maxLeavesPerMonth: number;
    maxLeavesPerYear: number;
    nightShiftRate: number | null;
    overtimeRate: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        staff: number;
    };
}

interface StaffClassFormData {
    name: string;
    salaryType: 'HOURLY' | 'DAILY' | 'MONTHLY';
    baseSalary: string;
    maxLeavesPerMonth: string;
    maxLeavesPerYear: string;
    nightShiftRate: string;
    overtimeRate: string;
    isActive: boolean;
}

interface StaffClassStats {
    total: number;
    active: number;
    salaryTypes: Record<string, { count: number; avgSalary: number }>;
}

export default function StaffClassesPage() {
    const [staffClasses, setStaffClasses] = useState<StaffClass[]>([]);
    const [stats, setStats] = useState<StaffClassStats>({
        total: 0,
        active: 0,
        salaryTypes: {}
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [salaryTypeFilter, setSalaryTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedStaffClass, setSelectedStaffClass] = useState<StaffClass | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Form data
    const [formData, setFormData] = useState<StaffClassFormData>({
        name: "",
        salaryType: "MONTHLY",
        baseSalary: "",
        maxLeavesPerMonth: "2",
        maxLeavesPerYear: "24",
        nightShiftRate: "",
        overtimeRate: "",
        isActive: true
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchStaffClasses();
    }, [currentPage, searchTerm, salaryTypeFilter, statusFilter]);

    const fetchStaffClasses = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                ...(searchTerm && { search: searchTerm }),
                ...(salaryTypeFilter !== 'all' && { salaryType: salaryTypeFilter }),
                ...(statusFilter !== 'all' && { status: statusFilter })
            });

            const response = await fetch(`${apiBaseUrl}/api/hr/staff-classes?${params}`);
            if (!response.ok) throw new Error('Failed to fetch staff classes');

            const data = await response.json();
            setStaffClasses(data.staffClasses);
            setStats(data.stats);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error('Error fetching staff classes:', error);
            toast.error('Failed to load staff classes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaffClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.baseSalary) {
            toast.error('Name and base salary are required');
            return;
        }

        try {
            setFormSubmitting(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/staff-classes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create staff class');
            }

            toast.success('Staff class created successfully');
            setIsCreateModalOpen(false);
            resetForm();
            fetchStaffClasses();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleUpdateStaffClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStaffClass) return;

        try {
            setFormSubmitting(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/staff-classes/${selectedStaffClass.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update staff class');
            }

            toast.success('Staff class updated successfully');
            setIsEditModalOpen(false);
            setSelectedStaffClass(null);
            resetForm();
            fetchStaffClasses();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeleteStaffClass = async () => {
        if (!selectedStaffClass) return;

        try {
            setFormSubmitting(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/staff-classes/${selectedStaffClass.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete staff class');
            }

            toast.success('Staff class deleted successfully');
            setIsDeleteModalOpen(false);
            setSelectedStaffClass(null);
            fetchStaffClasses();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            salaryType: "MONTHLY",
            baseSalary: "",
            maxLeavesPerMonth: "2",
            maxLeavesPerYear: "24",
            nightShiftRate: "",
            overtimeRate: "",
            isActive: true
        });
    };

    const openEditModal = (staffClass: StaffClass) => {
        setSelectedStaffClass(staffClass);
        setFormData({
            name: staffClass.name,
            salaryType: staffClass.salaryType,
            baseSalary: staffClass.baseSalary.toString(),
            maxLeavesPerMonth: staffClass.maxLeavesPerMonth.toString(),
            maxLeavesPerYear: staffClass.maxLeavesPerYear.toString(),
            nightShiftRate: staffClass.nightShiftRate?.toString() || "",
            overtimeRate: staffClass.overtimeRate?.toString() || "",
            isActive: staffClass.isActive
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (staffClass: StaffClass) => {
        setSelectedStaffClass(staffClass);
        setIsDeleteModalOpen(true);
    };

    // Predefined staff classes as per SRS 2.2
    const suggestedStaffClasses = [
        { name: "Receptionist", salaryType: "MONTHLY", baseSalary: "45000", description: "Front desk operations" },
        { name: "Minor Staff", salaryType: "DAILY", baseSalary: "1500", description: "General support staff" },
        { name: "Housekeeping Supervisor", salaryType: "MONTHLY", baseSalary: "40000", description: "Room cleaning supervisor" },
        { name: "Kitchen Helper", salaryType: "DAILY", baseSalary: "1200", description: "Kitchen assistance" },
        { name: "Security Guard", salaryType: "MONTHLY", baseSalary: "35000", description: "Property security" },
        { name: "Maintenance Technician", salaryType: "MONTHLY", baseSalary: "50000", description: "Technical maintenance" },
        { name: "Waiter", salaryType: "MONTHLY", baseSalary: "30000", description: "Restaurant service" },
        { name: "Manager", salaryType: "MONTHLY", baseSalary: "80000", description: "Department management" }
    ];

    const createSuggestedStaffClass = async (suggested: any) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/hr/staff-classes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...suggested,
                    maxLeavesPerMonth: 2,
                    maxLeavesPerYear: 24
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            toast.success(`${suggested.name} class created`);
            fetchStaffClasses();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const getSalaryTypeDisplay = (type: string) => {
        switch (type) {
            case 'HOURLY': return { label: 'Hourly', icon: <Clock className="w-4 h-4" />, color: 'text-blue-600' };
            case 'DAILY': return { label: 'Daily', icon: <Calendar className="w-4 h-4" />, color: 'text-green-600' };
            case 'MONTHLY': return { label: 'Monthly', icon: <Briefcase className="w-4 h-4" />, color: 'text-purple-600' };
            default: return { label: type, icon: <DollarSign className="w-4 h-4" />, color: 'text-gray-600' };
        }
    };

    const formatSalary = (amount: number, type: string) => {
        const prefix = type === 'HOURLY' ? '/hr' : type === 'DAILY' ? '/day' : '/month';
        return `LKR ${amount.toLocaleString()}${prefix}`;
    };

    if (loading && staffClasses.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Shield className="w-8 h-8 text-blue-600 mr-3" />
                        Staff Classes
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage staff classifications with salary structures and benefits
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button onClick={fetchStaffClasses} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Staff Class
                            </Button>
                        </DialogTrigger>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-xs text-green-600 mt-1">
                                    {stats.active} active
                                </p>
                            </div>
                            <Shield className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Monthly Classes</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {stats.salaryTypes.MONTHLY?.count || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Avg: LKR {(stats.salaryTypes.MONTHLY?.avgSalary || 0).toLocaleString()}
                                </p>
                            </div>
                            <Briefcase className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Daily Classes</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {stats.salaryTypes.DAILY?.count || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Avg: LKR {(stats.salaryTypes.DAILY?.avgSalary || 0).toLocaleString()}
                                </p>
                            </div>
                            <Calendar className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Hourly Classes</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {stats.salaryTypes.HOURLY?.count || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Avg: LKR {(stats.salaryTypes.HOURLY?.avgSalary || 0).toLocaleString()}
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Setup - Suggested Staff Classes */}
            {staffClasses.length === 0 && !loading && (
                <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                    <CardHeader>
                        <CardTitle className="text-center text-gray-600">
                            <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            No Staff Classes Yet
                        </CardTitle>
                        <p className="text-center text-sm text-gray-500">
                            Set up staff classifications to organize salary structures
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center mb-4">
                            <h3 className="font-semibold text-gray-700 mb-3">Quick Setup - Suggested Classes:</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {suggestedStaffClasses.map((cls) => (
                                    <Button
                                        key={cls.name}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => createSuggestedStaffClass(cls)}
                                        className="text-xs flex-col h-auto p-3"
                                    >
                                        <Plus className="w-3 h-3 mb-1" />
                                        <span className="font-medium">{cls.name}</span>
                                        <span className="text-xs text-gray-500">
                                            LKR {parseInt(cls.baseSalary).toLocaleString()}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="text-center">
                            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={resetForm}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Custom Class
                                    </Button>
                                </DialogTrigger>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters and Search */}
            {staffClasses.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search staff classes..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Select value={salaryTypeFilter} onValueChange={setSalaryTypeFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="DAILY">Daily</SelectItem>
                                        <SelectItem value="HOURLY">Hourly</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active Only</SelectItem>
                                        <SelectItem value="inactive">Inactive Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Staff Classes Table */}
            {staffClasses.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                                <Shield className="w-5 h-5 mr-2" />
                                Staff Classes ({staffClasses.length})
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Class Name</TableHead>
                                        <TableHead className="text-center">Salary Type</TableHead>
                                        <TableHead className="text-right">Base Salary</TableHead>
                                        <TableHead className="text-center">Leave Policy</TableHead>
                                        <TableHead className="text-center">Extra Rates</TableHead>
                                        <TableHead className="text-center">Staff Count</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffClasses.map((staffClass) => {
                                        const salaryDisplay = getSalaryTypeDisplay(staffClass.salaryType);
                                        return (
                                            <TableRow key={staffClass.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <Shield className="w-4 h-4 text-gray-500" />
                                                        <span>{staffClass.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <span className={salaryDisplay.color}>
                                                            {salaryDisplay.icon}
                                                        </span>
                                                        <Badge variant="outline" className={salaryDisplay.color}>
                                                            {salaryDisplay.label}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatSalary(staffClass.baseSalary, staffClass.salaryType)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="text-xs text-gray-600">
                                                        <div>{staffClass.maxLeavesPerMonth}/month</div>
                                                        <div>{staffClass.maxLeavesPerYear}/year</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="text-xs space-y-1">
                                                        {staffClass.nightShiftRate && (
                                                            <div className="flex items-center justify-center space-x-1">
                                                                <Moon className="w-3 h-3 text-blue-500" />
                                                                <span>+{staffClass.nightShiftRate}%</span>
                                                            </div>
                                                        )}
                                                        {staffClass.overtimeRate && (
                                                            <div className="flex items-center justify-center space-x-1">
                                                                <Clock className="w-3 h-3 text-orange-500" />
                                                                <span>+{staffClass.overtimeRate}%</span>
                                                            </div>
                                                        )}
                                                        {!staffClass.nightShiftRate && !staffClass.overtimeRate && (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <Users className="w-4 h-4 text-gray-500" />
                                                        <Badge variant="secondary">
                                                            {staffClass._count.staff}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={staffClass.isActive ? "default" : "secondary"}>
                                                        {staffClass.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEditModal(staffClass)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openDeleteModal(staffClass)}
                                                            disabled={staffClass._count.staff > 0}
                                                            className={staffClass._count.staff > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center space-x-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Create Staff Class Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleCreateStaffClass}>
                        <DialogHeader>
                            <DialogTitle>Create New Staff Class</DialogTitle>
                            <DialogDescription>
                                Define a new staff classification with salary structure and benefits.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Class Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Receptionist, Minor Staff"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="salaryType">Salary Type *</Label>
                                    <Select
                                        value={formData.salaryType}
                                        onValueChange={(value: any) => setFormData({ ...formData, salaryType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MONTHLY">Monthly Salary</SelectItem>
                                            <SelectItem value="DAILY">Daily Wage</SelectItem>
                                            <SelectItem value="HOURLY">Hourly Rate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="baseSalary">Base Salary (LKR) *</Label>
                                <Input
                                    id="baseSalary"
                                    type="number"
                                    value={formData.baseSalary}
                                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                                    placeholder="Enter amount"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maxLeavesPerMonth">Max Leaves/Month</Label>
                                    <Input
                                        id="maxLeavesPerMonth"
                                        type="number"
                                        value={formData.maxLeavesPerMonth}
                                        onChange={(e) => setFormData({ ...formData, maxLeavesPerMonth: e.target.value })}
                                        min="0"
                                        max="31"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxLeavesPerYear">Max Leaves/Year</Label>
                                    <Input
                                        id="maxLeavesPerYear"
                                        type="number"
                                        value={formData.maxLeavesPerYear}
                                        onChange={(e) => setFormData({ ...formData, maxLeavesPerYear: e.target.value })}
                                        min="0"
                                        max="365"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nightShiftRate">Night Shift Rate (%)</Label>
                                    <Input
                                        id="nightShiftRate"
                                        type="number"
                                        value={formData.nightShiftRate}
                                        onChange={(e) => setFormData({ ...formData, nightShiftRate: e.target.value })}
                                        placeholder="Extra % for night shifts"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="overtimeRate">Overtime Rate (%)</Label>
                                    <Input
                                        id="overtimeRate"
                                        type="number"
                                        value={formData.overtimeRate}
                                        onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
                                        placeholder="Extra % for overtime"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                disabled={formSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formSubmitting}>
                                {formSubmitting ? 'Creating...' : 'Create Staff Class'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Staff Class Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleUpdateStaffClass}>
                        <DialogHeader>
                            <DialogTitle>Edit Staff Class</DialogTitle>
                            <DialogDescription>
                                Update staff class information and salary structure.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Class Name *</Label>
                                    <Input
                                        id="edit-name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Staff class name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-salaryType">Salary Type *</Label>
                                    <Select
                                        value={formData.salaryType}
                                        onValueChange={(value: any) => setFormData({ ...formData, salaryType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MONTHLY">Monthly Salary</SelectItem>
                                            <SelectItem value="DAILY">Daily Wage</SelectItem>
                                            <SelectItem value="HOURLY">Hourly Rate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-baseSalary">Base Salary (LKR) *</Label>
                                <Input
                                    id="edit-baseSalary"
                                    type="number"
                                    value={formData.baseSalary}
                                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                                    placeholder="Enter amount"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-maxLeavesPerMonth">Max Leaves/Month</Label>
                                    <Input
                                        id="edit-maxLeavesPerMonth"
                                        type="number"
                                        value={formData.maxLeavesPerMonth}
                                        onChange={(e) => setFormData({ ...formData, maxLeavesPerMonth: e.target.value })}
                                        min="0"
                                        max="31"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-maxLeavesPerYear">Max Leaves/Year</Label>
                                    <Input
                                        id="edit-maxLeavesPerYear"
                                        type="number"
                                        value={formData.maxLeavesPerYear}
                                        onChange={(e) => setFormData({ ...formData, maxLeavesPerYear: e.target.value })}
                                        min="0"
                                        max="365"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-nightShiftRate">Night Shift Rate (%)</Label>
                                    <Input
                                        id="edit-nightShiftRate"
                                        type="number"
                                        value={formData.nightShiftRate}
                                        onChange={(e) => setFormData({ ...formData, nightShiftRate: e.target.value })}
                                        placeholder="Extra % for night shifts"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-overtimeRate">Overtime Rate (%)</Label>
                                    <Input
                                        id="edit-overtimeRate"
                                        type="number"
                                        value={formData.overtimeRate}
                                        onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
                                        placeholder="Extra % for overtime"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select
                                    value={formData.isActive ? "active" : "inactive"}
                                    onValueChange={(value) => setFormData({ ...formData, isActive: value === "active" })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                disabled={formSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formSubmitting}>
                                {formSubmitting ? 'Updating...' : 'Update Staff Class'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            Delete Staff Class
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the staff class "{selectedStaffClass?.name}"?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedStaffClass && selectedStaffClass._count.staff > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-800">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                This class has {selectedStaffClass._count.staff} staff member(s) assigned.
                                Please reassign them before deleting.
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={formSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteStaffClass}
                            disabled={formSubmitting || !!(selectedStaffClass && selectedStaffClass._count.staff > 0)}
                        >
                            {formSubmitting ? 'Deleting...' : 'Delete Staff Class'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Navigation Back */}
            <div className="flex justify-center">
                <Link href="/hr">
                    <Button variant="outline">
                        ← Back to HR Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}