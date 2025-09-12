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
import { Textarea } from "@/components/ui/textarea";
import {
    AlertCircle,
    Building2,
    Edit,
    Filter,
    MapPin,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Department {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        staff: number;
    };
}

interface DepartmentFormData {
    name: string;
    description: string;
    isActive: boolean;
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Form data
    const [formData, setFormData] = useState<DepartmentFormData>({
        name: "",
        description: "",
        isActive: true
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchDepartments();
    }, [currentPage, searchTerm, statusFilter]);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter !== 'all' && { status: statusFilter })
            });

            const response = await fetch(`${apiBaseUrl}/api/hr/departments?${params}`);
            if (!response.ok) throw new Error('Failed to fetch departments');

            const data = await response.json();
            setDepartments(data.departments);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Department name is required');
            return;
        }

        try {
            setFormSubmitting(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/departments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create department');
            }

            toast.success('Department created successfully');
            setIsCreateModalOpen(false);
            resetForm();
            fetchDepartments();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleUpdateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDepartment) return;

        try {
            setFormSubmitting(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/departments/${selectedDepartment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update department');
            }

            toast.success('Department updated successfully');
            setIsEditModalOpen(false);
            setSelectedDepartment(null);
            resetForm();
            fetchDepartments();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeleteDepartment = async () => {
        if (!selectedDepartment) return;

        try {
            setFormSubmitting(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/departments/${selectedDepartment.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete department');
            }

            toast.success('Department deleted successfully');
            setIsDeleteModalOpen(false);
            setSelectedDepartment(null);
            fetchDepartments();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            isActive: true
        });
    };

    const openEditModal = (department: Department) => {
        setSelectedDepartment(department);
        setFormData({
            name: department.name,
            description: department.description || "",
            isActive: department.isActive
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (department: Department) => {
        setSelectedDepartment(department);
        setIsDeleteModalOpen(true);
    };

    // Predefined departments as per SRS 2.1
    const suggestedDepartments = [
        { name: "Front Office", description: "Reception, guest services, and customer support" },
        { name: "Kitchen", description: "Food preparation, cooking, and culinary operations" },
        { name: "Housekeeping", description: "Room cleaning, maintenance, and guest amenities" },
        { name: "Maintenance", description: "Building maintenance, repairs, and technical support" },
        { name: "Security", description: "Property security, surveillance, and safety" },
        { name: "Management", description: "Executive management and administration" },
        { name: "Accounting", description: "Financial management, accounting, and bookkeeping" },
        { name: "Reception", description: "Guest check-in/check-out and front desk operations" }
    ];

    const createSuggestedDepartment = async (suggested: { name: string; description: string }) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/hr/departments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(suggested),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            toast.success(`${suggested.name} department created`);
            fetchDepartments();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (loading && departments.length === 0) {
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
                        <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                        Departments
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage organizational departments and staff assignments
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button onClick={fetchDepartments} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Department
                            </Button>
                        </DialogTrigger>
                    </Dialog>
                </div>
            </div>

            {/* Quick Setup - Suggested Departments */}
            {departments.length === 0 && !loading && (
                <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
                    <CardHeader>
                        <CardTitle className="text-center text-gray-600">
                            <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            No Departments Yet
                        </CardTitle>
                        <p className="text-center text-sm text-gray-500">
                            Get started by creating departments for your hotel organization
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center mb-4">
                            <h3 className="font-semibold text-gray-700 mb-3">Quick Setup - Suggested Departments:</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {suggestedDepartments.map((dept) => (
                                    <Button
                                        key={dept.name}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => createSuggestedDepartment(dept)}
                                        className="text-xs"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        {dept.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="text-center">
                            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={resetForm}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Custom Department
                                    </Button>
                                </DialogTrigger>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters and Search */}
            {departments.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search departments..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <Filter className="w-4 h-4 mr-2" />
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

            {/* Departments Table */}
            {departments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                                <MapPin className="w-5 h-5 mr-2" />
                                Departments ({departments.length})
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Department Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-center">Staff Count</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {departments.map((department) => (
                                        <TableRow key={department.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <Building2 className="w-4 h-4 text-gray-500" />
                                                    <span>{department.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <span className="text-sm text-gray-600 truncate">
                                                    {department.description || 'No description'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center space-x-1">
                                                    <Users className="w-4 h-4 text-gray-500" />
                                                    <Badge variant="secondary">
                                                        {department._count.staff}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={department.isActive ? "default" : "secondary"}>
                                                    {department.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-gray-500">
                                                {new Date(department.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditModal(department)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDeleteModal(department)}
                                                        disabled={department._count.staff > 0}
                                                        className={department._count.staff > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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

            {/* Create Department Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleCreateDepartment}>
                        <DialogHeader>
                            <DialogTitle>Create New Department</DialogTitle>
                            <DialogDescription>
                                Add a new department to organize your staff structure.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Department Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Front Office, Kitchen, Housekeeping"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of department responsibilities"
                                    rows={3}
                                />
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
                                {formSubmitting ? 'Creating...' : 'Create Department'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Department Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleUpdateDepartment}>
                        <DialogHeader>
                            <DialogTitle>Edit Department</DialogTitle>
                            <DialogDescription>
                                Update department information.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Department Name *</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Department name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of department responsibilities"
                                    rows={3}
                                />
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
                                {formSubmitting ? 'Updating...' : 'Update Department'}
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
                            Delete Department
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the department "{selectedDepartment?.name}"?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedDepartment && selectedDepartment._count.staff > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-800">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                This department has {selectedDepartment._count.staff} staff member(s) assigned.
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
                            onClick={handleDeleteDepartment}
                            disabled={formSubmitting || (!!selectedDepartment && selectedDepartment._count.staff > 0)}
                        >
                            {formSubmitting ? 'Deleting...' : 'Delete Department'}
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