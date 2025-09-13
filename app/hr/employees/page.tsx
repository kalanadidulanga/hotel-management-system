"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertCircle,
    Building2,
    Clock,
    Edit,
    Eye,
    Filter,
    IdCard,
    Key,
    Mail,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Shield,
    ShieldCheck,
    SortAsc,
    SortDesc,
    Trash2,
    User,
    UserCheck,
    UserPlus,
    Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Employee {
    id: number;
    employeeId: string;
    joinDate: string;
    probationEnd: string | null;
    isActive: boolean;
    createdAt: string;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        nic: string | null;
        contact: string | null;
        address: string | null;
        dateOfBirth: string | null;
        createdAt: string;
    };
    department: {
        id: number;
        name: string;
    };
    staffClass: {
        id: number;
        name: string;
        salaryType: string;
        baseSalary: number;
    };
    privileges: {
        privilege: string;
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
    }[];
    _count: {
        attendance: number;
        leaves: number;
    };
}

interface EmployeeFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    nic: string;
    gender?: string;
    maritalStatus?: string;
    nationality?: string;
    religion?: string;
    emergencyName?: string;
    emergencyRelation?: string;
    emergencyPhone?: string;
    contact: string;
    address: string;
    dateOfBirth: string;
    employeeId: string;
    joinDate: string;
    departmentId: string;
    classId: string;
    probationEnd: string;
    // Privilege assignments
    selectedPrivileges: {
        privilege: string;
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
    }[];
}

interface Department {
    id: number;
    name: string;
    _count: { staff: number };
}

interface StaffClass {
    id: number;
    name: string;
    salaryType: string;
    baseSalary: number;
    _count: { staff: number };
}

interface EmployeeStats {
    total: number;
    active: number;
    inactive: number;
    recentHires: number;
    departments: Department[];
    staffClasses: StaffClass[];
}

interface PrivilegeTemplate {
    name: string;
    description: string;
    category: string;
    recommendedRoles: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const AVAILABLE_PRIVILEGES: PrivilegeTemplate[] = [
    {
        name: 'ADD_USERS',
        description: 'Create and manage user accounts, assign roles and permissions',
        category: 'User Management',
        recommendedRoles: ['ADMIN', 'MANAGER'],
        riskLevel: 'HIGH'
    },
    {
        name: 'RESTAURANT_ORDERS',
        description: 'Handle restaurant orders, billing, and POS operations',
        category: 'Restaurant',
        recommendedRoles: ['CASHIER', 'FRONT_OFFICE', 'MANAGER'],
        riskLevel: 'MEDIUM'
    },
    {
        name: 'INVENTORY',
        description: 'Manage inventory levels, stock tracking, and procurement',
        category: 'Inventory',
        recommendedRoles: ['MANAGER', 'FRONT_OFFICE'],
        riskLevel: 'MEDIUM'
    },
    {
        name: 'ROOM_SETTING',
        description: 'Configure room settings, availability, and pricing',
        category: 'Room Management',
        recommendedRoles: ['ADMIN', 'MANAGER', 'FRONT_OFFICE'],
        riskLevel: 'MEDIUM'
    },
    {
        name: 'ACCOUNTS',
        description: 'Access financial accounts, transactions, and billing',
        category: 'Financial',
        recommendedRoles: ['ADMIN', 'MANAGER'],
        riskLevel: 'HIGH'
    },
    {
        name: 'GENERAL_LEDGER',
        description: 'Manage general ledger entries and financial reports',
        category: 'Financial',
        recommendedRoles: ['ADMIN'],
        riskLevel: 'CRITICAL'
    },
    {
        name: 'UNIT_PRICING',
        description: 'Set and modify pricing for rooms, services, and products',
        category: 'Pricing',
        recommendedRoles: ['ADMIN', 'MANAGER'],
        riskLevel: 'HIGH'
    }
];

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [stats, setStats] = useState<EmployeeStats>({
        total: 0,
        active: 0,
        inactive: 0,
        recentHires: 0,
        departments: [],
        staffClasses: []
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        departmentId: "all",
        classId: "all",
        status: "all",
        sortBy: "createdAt",
        sortOrder: "desc"
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [currentTab, setCurrentTab] = useState("basic");

    // Form data
    const [formData, setFormData] = useState<EmployeeFormData>({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "CASHIER",
        nic: "",
        contact: "",
        gender: "",
        maritalStatus: "",
        nationality: "",
        religion: "",
        emergencyName: "",
        emergencyRelation: "",
        emergencyPhone: "",
        address: "",
        dateOfBirth: "",
        employeeId: "",
        joinDate: new Date().toISOString().split('T')[0],
        departmentId: "",
        classId: "",
        probationEnd: "",
        selectedPrivileges: []
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchEmployees();
    }, [currentPage, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== undefined) {
                setCurrentPage(1);
                fetchEmployees();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Auto-suggest privileges based on role
    useEffect(() => {
        if (formData.role) {
            const recommendedPrivileges = AVAILABLE_PRIVILEGES
                .filter(priv => priv.recommendedRoles.includes(formData.role))
                .map(priv => ({
                    privilege: priv.name,
                    canRead: true,
                    canWrite: priv.riskLevel === 'LOW' || priv.riskLevel === 'MEDIUM',
                    canDelete: false
                }));

            setFormData(prev => ({
                ...prev,
                selectedPrivileges: recommendedPrivileges
            }));
        }
    }, [formData.role]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                search: searchTerm,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([, value]) => value !== 'all')
                )
            });

            const response = await fetch(`${apiBaseUrl}/api/hr/employees?${params}`);
            if (!response.ok) throw new Error('Failed to fetch employees');

            const data = await response.json();
            setEmployees(data.employees || []);
            setStats(data.stats || {});
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();

        const requiredFields = ['firstName','lastName', 'email', 'gender', 'maritalStatus', 'password', 'employeeId', 'nic', 'contact', 'departmentId', 'classId'];
        const missingFields = requiredFields.filter(field => !formData[field as keyof EmployeeFormData]);

        if (missingFields.length > 0) {
            toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        try {
            setFormSubmitting(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create employee');
            }

            const result = await response.json();
            toast.success(`Employee created successfully with ${result.privilegesAssigned} privileges assigned`);
            setIsCreateModalOpen(false);
            resetForm();
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeleteEmployee = async () => {
        if (!selectedEmployee) return;

        try {
            setFormSubmitting(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/employees/${selectedEmployee.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete employee');
            }

            const result = await response.json();
            toast.success(result.message);
            setIsDeleteModalOpen(false);
            setSelectedEmployee(null);
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            role: "CASHIER",
            nic: "",
            contact: "",
            address: "",
            dateOfBirth: "",
            employeeId: "",
            joinDate: new Date().toISOString().split('T')[0],
            departmentId: "",
            classId: "",
            probationEnd: "",
            selectedPrivileges: []
        });
        setCurrentTab("basic");
    };

    const openViewModal = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsViewModalOpen(true);
    };

    const openDeleteModal = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsDeleteModalOpen(true);
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const generateEmployeeId = () => {
        const prefix = 'EMP';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        return `${prefix}${timestamp}${random}`;
    };

    const formatSalary = (amount: number, type: string) => {
        const prefix = type === 'HOURLY' ? '/hr' : type === 'DAILY' ? '/day' : '/month';
        return `LKR ${amount.toLocaleString()}${prefix}`;
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-100 text-red-800';
            case 'MANAGER': return 'bg-purple-100 text-purple-800';
            case 'FRONT_OFFICE': return 'bg-green-100 text-green-800';
            case 'CASHIER': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'bg-green-100 text-green-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'HIGH': return 'bg-orange-100 text-orange-800';
            case 'CRITICAL': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPrivilegeIcon = (privilege: string) => {
        switch (privilege) {
            case 'ADD_USERS': return <User className="w-4 h-4" />;
            case 'RESTAURANT_ORDERS': return <Clock className="w-4 h-4" />;
            case 'INVENTORY': return <Building2 className="w-4 h-4" />;
            case 'ROOM_SETTING': return <IdCard className="w-4 h-4" />;
            case 'ACCOUNTS': return <Building2 className="w-4 h-4" />;
            case 'GENERAL_LEDGER': return <Building2 className="w-4 h-4" />;
            case 'UNIT_PRICING': return <Shield className="w-4 h-4" />;
            default: return <Shield className="w-4 h-4" />;
        }
    };

    const updatePrivilege = (privilegeName: string, field: string, value: boolean) => {
        setFormData(prev => {
            const existingIndex = prev.selectedPrivileges.findIndex(p => p.privilege === privilegeName);

            if (existingIndex >= 0) {
                const updated = [...prev.selectedPrivileges];
                updated[existingIndex] = { ...updated[existingIndex], [field]: value };
                return { ...prev, selectedPrivileges: updated };
            } else {
                const newPrivilege = {
                    privilege: privilegeName,
                    canRead: field === 'canRead' ? value : true,
                    canWrite: field === 'canWrite' ? value : false,
                    canDelete: field === 'canDelete' ? value : false
                };
                return { ...prev, selectedPrivileges: [...prev.selectedPrivileges, newPrivilege] };
            }
        });
    };

    const removePrivilege = (privilegeName: string) => {
        setFormData(prev => ({
            ...prev,
            selectedPrivileges: prev.selectedPrivileges.filter(p => p.privilege !== privilegeName)
        }));
    };

    if (loading && employees.length === 0) {
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
                        <Users className="w-8 h-8 text-blue-600 mr-3" />
                        Employee Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Create employees with login credentials, departments, and custom privileges
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button onClick={fetchEmployees} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => {
                                resetForm();
                                setFormData(prev => ({
                                    ...prev,
                                    employeeId: generateEmployeeId()
                                }));
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Employee
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
                                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    +{stats.recentHires} this month
                                </p>
                            </div>
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {stats.inactive} inactive
                                </p>
                            </div>
                            <UserCheck className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Departments</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.departments.length}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Active departments
                                </p>
                            </div>
                            <Building2 className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Staff Classes</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.staffClasses.length}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Salary classifications
                                </p>
                            </div>
                            <Shield className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <Filter className="w-5 h-5 mr-2" />
                        Search & Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name, email, employee ID, NIC, or contact..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select
                            value={filters.departmentId}
                            onValueChange={(value) => handleFilterChange("departmentId", value)}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {stats.departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                        {dept.name} ({dept._count.staff})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.classId}
                            onValueChange={(value) => handleFilterChange("classId", value)}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {stats.staffClasses.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id.toString()}>
                                        {cls.name} ({cls._count.staff})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.status}
                            onValueChange={(value) => handleFilterChange("status", value)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active Only</SelectItem>
                                <SelectItem value="inactive">Inactive Only</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            onClick={() => handleFilterChange("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
                            className="w-auto"
                        >
                            {filters.sortOrder === "asc" ? (
                                <SortAsc className="w-4 h-4" />
                            ) : (
                                <SortDesc className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Employee List */}
            {employees.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                Employees ({employees.length})
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Staff Class</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Privileges</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{employee.user.firstName} {employee.user.lastName}</p>
                                                        <p className="text-sm text-gray-500">
                                                            <IdCard className="w-3 h-3 inline mr-1" />
                                                            {employee.employeeId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="flex items-center space-x-1 text-gray-500">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{employee.user.email}</span>
                                                    </div>
                                                    {employee.user.contact && (
                                                        <div className="flex items-center space-x-1">
                                                            <Phone className="w-3 h-3 text-gray-400" />
                                                            <span>{employee.user.contact}</span>
                                                        </div>
                                                    )}
                                                    {employee.user.nic && (
                                                        <p className="text-xs text-gray-500">
                                                            NIC: {employee.user.nic}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1">
                                                    <Building2 className="w-4 h-4 text-gray-500" />
                                                    <span>{employee.department.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="flex items-center space-x-1">
                                                        <Shield className="w-4 h-4 text-gray-500" />
                                                        <span className="font-medium">{employee.staffClass.name}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-mono">
                                                        {formatSalary(employee.staffClass.baseSalary, employee.staffClass.salaryType)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`text-xs ${getRoleColor(employee.user.role)}`}>
                                                    {employee.user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {employee.privileges.slice(0, 2).map((priv) => (
                                                        <Badge key={priv.privilege} variant="outline" className="text-xs">
                                                            {priv.privilege}
                                                        </Badge>
                                                    ))}
                                                    {employee.privileges.length > 2 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            +{employee.privileges.length - 2} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={employee.isActive ? "default" : "secondary"}>
                                                    {employee.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openViewModal(employee)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Link href={`/hr/employees/${employee.id}/edit`}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/hr/employees/${employee.id}/privileges`}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDeleteModal(employee)}
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
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'No employees found' : 'No employees yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchTerm
                                ? 'Try adjusting your search terms or filters'
                                : 'Get started by adding your first employee with login credentials and privileges'
                            }
                        </p>
                        {!searchTerm && (
                            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => {
                                        resetForm();
                                        setFormData(prev => ({
                                            ...prev,
                                            employeeId: generateEmployeeId()
                                        }));
                                    }}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Employee
                                    </Button>
                                </DialogTrigger>
                            </Dialog>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Create Employee Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleCreateEmployee}>
                        <DialogHeader>
                            <DialogTitle>Create New Employee</DialogTitle>
                            <DialogDescription>
                                Add a new employee with login credentials, department assignment, and custom privileges
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-4">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                                <TabsTrigger value="employment">Employment</TabsTrigger>
                                <TabsTrigger value="privileges">Privileges</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                {/* Login Credentials Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <Key className="w-4 h-4 text-blue-600" />
                                        <h4 className="font-semibold text-sm text-blue-600">Login Credentials</h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name *</Label>
                                            <Input
                                                id="firstName"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                                placeholder="John"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name *</Label>
                                            <Input
                                                id="lastName"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                                placeholder="Doe"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="john@hotel.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password *</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                                placeholder="Secure password"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role</Label>
                                            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CASHIER">Cashier</SelectItem>
                                                    <SelectItem value="FRONT_OFFICE">Front Office</SelectItem>
                                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Personal Details Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <User className="w-4 h-4 text-green-600" />
                                        <h4 className="font-semibold text-sm text-green-600">Personal Details</h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact">Contact *</Label>
                                            <Input
                                                id="contact"
                                                value={formData.contact}
                                                onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                                                placeholder="+94"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nic">NIC Number *</Label>
                                            <Input
                                                id="nic"
                                                value={formData.nic}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nic: e.target.value }))}
                                                placeholder="123456789V"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                            <Input
                                                id="dateOfBirth"
                                                type="date"
                                                value={formData.dateOfBirth}
                                                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="employeeId">Employee ID *</Label>
                                            <Input
                                                id="employeeId"
                                                value={formData.employeeId}
                                                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                                                placeholder="EMP001"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Textarea
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="Complete address"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select
                                            value={formData.gender ?? "none"}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value === "none" ? "" : value }))}
                                        >
                                            <SelectTrigger id="gender">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Not specified</SelectItem>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maritalStatus">Marital Status</Label>
                                        <Select
                                            value={formData.maritalStatus ?? "none"}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, maritalStatus: value === "none" ? "" : value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Not specified" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Not specified</SelectItem>
                                                <SelectItem value="Single">Single</SelectItem>
                                                <SelectItem value="Married">Married</SelectItem>
                                                <SelectItem value="Divorced">Divorced</SelectItem>
                                                <SelectItem value="Widowed">Widowed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nationality">Nationality</Label>
                                        <Input
                                            id="nationality"
                                            value={formData.nationality || ""}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                                            placeholder="Sri Lankan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="religion">Religion</Label>
                                        <Select
                                            value={formData.religion ?? "none"}
                                            onValueChange={(value) =>
                                                setFormData(prev => ({ ...prev, religion: value === "none" ? "" : value }))
                                            }
                                        >
                                            <SelectTrigger id="religion">
                                                <SelectValue placeholder="Select religion" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Not specified</SelectItem>
                                                <SelectItem value="Buddhist">Buddhist</SelectItem>
                                                <SelectItem value="Christian">Christian</SelectItem>
                                                <SelectItem value="Muslim">Muslim</SelectItem>
                                                <SelectItem value="Hindu">Hindu</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <User className="w-4 h-4 text-red-600" />
                                        <h4 className="font-semibold text-sm text-red-600">Emergency Contact</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="emergencyName">Name</Label>
                                            <Input
                                                id="emergencyName"
                                                value={formData.emergencyName || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, emergencyName: e.target.value }))}
                                                placeholder="Contact Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="emergencyRelation">Relation</Label>
                                            <Select
                                                value={formData.emergencyRelation ?? "none"}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, emergencyRelation: value === "none" ? "" : value }))}
                                            >
                                                <SelectTrigger id="emergencyRelation">
                                                    <SelectValue placeholder="Select relation" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Select relation</SelectItem>
                                                    <SelectItem value="Father">Father</SelectItem>
                                                    <SelectItem value="Mother">Mother</SelectItem>
                                                    <SelectItem value="Spouse">Spouse</SelectItem>
                                                    <SelectItem value="Friend">Friend</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="emergencyPhone">Phone</Label>
                                            <Input
                                                id="emergencyPhone"
                                                value={formData.emergencyPhone || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                                                placeholder="+94"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="employment" className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <Building2 className="w-4 h-4 text-purple-600" />
                                        <h4 className="font-semibold text-sm text-purple-600">Employment Details</h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="joinDate">Join Date</Label>
                                            <Input
                                                id="joinDate"
                                                type="date"
                                                value={formData.joinDate}
                                                onChange={(e) => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="probationEnd">Probation End</Label>
                                            <Input
                                                id="probationEnd"
                                                type="date"
                                                value={formData.probationEnd}
                                                onChange={(e) => setFormData(prev => ({ ...prev, probationEnd: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="departmentId">Department *</Label>
                                            <Select
                                                value={formData.departmentId}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stats.departments.map((dept) => (
                                                        <SelectItem key={dept.id} value={dept.id.toString()}>
                                                            {dept.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="classId">Staff Class *</Label>
                                            <Select
                                                value={formData.classId}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Class" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stats.staffClasses.map((cls) => (
                                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                                            <div className="flex justify-between items-center w-full">
                                                                <span>{cls.name}</span>
                                                                <span className="text-xs text-gray-500 ml-2">
                                                                    {formatSalary(cls.baseSalary, cls.salaryType)}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="privileges" className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <ShieldCheck className="w-4 h-4 text-orange-600" />
                                            <h4 className="font-semibold text-sm text-orange-600">Access Privileges</h4>
                                        </div>
                                        <Badge variant="secondary">
                                            {formData.selectedPrivileges.length} selected
                                        </Badge>
                                    </div>

                                    {formData.role && (
                                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                                            <p className="text-sm text-blue-700">
                                                Recommended privileges for <strong>{formData.role}</strong> role have been auto-selected.
                                                You can modify them below.
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {AVAILABLE_PRIVILEGES.map((privilege) => {
                                            const selected = formData.selectedPrivileges.find(p => p.privilege === privilege.name);
                                            const isRecommended = privilege.recommendedRoles.includes(formData.role);

                                            return (
                                                <div key={privilege.name} className={`border rounded-lg p-4 ${isRecommended ? 'border-blue-200 bg-blue-50' : ''}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            {getPrivilegeIcon(privilege.name)}
                                                            <div>
                                                                <div className="flex items-center space-x-2">
                                                                    <h5 className="font-medium">{privilege.name}</h5>
                                                                    <Badge className={getRiskLevelColor(privilege.riskLevel)}>
                                                                        {privilege.riskLevel}
                                                                    </Badge>
                                                                    {isRecommended && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            Recommended
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-600">{privilege.description}</p>
                                                                <p className="text-xs text-gray-500">{privilege.category}</p>
                                                            </div>
                                                        </div>

                                                        {selected ? (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => removePrivilege(privilege.name)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                Remove
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => updatePrivilege(privilege.name, 'canRead', true)}
                                                            >
                                                                Add
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {selected && (
                                                        <div className="flex space-x-6 mt-3 pl-7">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`${privilege.name}-read`}
                                                                    checked={selected.canRead}
                                                                    onCheckedChange={(checked) =>
                                                                        updatePrivilege(privilege.name, 'canRead', Boolean(checked))
                                                                    }
                                                                />
                                                                <Label htmlFor={`${privilege.name}-read`} className="text-sm">
                                                                    Read
                                                                </Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`${privilege.name}-write`}
                                                                    checked={selected.canWrite}
                                                                    onCheckedChange={(checked) =>
                                                                        updatePrivilege(privilege.name, 'canWrite', Boolean(checked))
                                                                    }
                                                                />
                                                                <Label htmlFor={`${privilege.name}-write`} className="text-sm">
                                                                    Write
                                                                </Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`${privilege.name}-delete`}
                                                                    checked={selected.canDelete}
                                                                    onCheckedChange={(checked) =>
                                                                        updatePrivilege(privilege.name, 'canDelete', Boolean(checked))
                                                                    }
                                                                />
                                                                <Label htmlFor={`${privilege.name}-delete`} className="text-sm">
                                                                    Delete
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                disabled={formSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formSubmitting}>
                                {formSubmitting ? 'Creating...' : 'Create Employee'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Employee Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Employee Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedEmployee && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm text-gray-600">Full Name</Label>
                                    <p className="font-medium">{selectedEmployee.user.firstName} {selectedEmployee.user.lastName}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Employee ID</Label>
                                    <p className="font-medium font-mono">{selectedEmployee.employeeId}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Email</Label>
                                    <p className="font-medium">{selectedEmployee.user.email}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Role</Label>
                                    <Badge className={getRoleColor(selectedEmployee.user.role)}>
                                        {selectedEmployee.user.role}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Contact</Label>
                                    <p className="font-medium">{selectedEmployee.user.contact || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">NIC</Label>
                                    <p className="font-medium">{selectedEmployee.user.nic || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm text-gray-600">Department</Label>
                                    <p className="font-medium flex items-center">
                                        <Building2 className="w-4 h-4 mr-1" />
                                        {selectedEmployee.department.name}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Staff Class</Label>
                                    <div>
                                        <p className="font-medium flex items-center">
                                            <Shield className="w-4 h-4 mr-1" />
                                            {selectedEmployee.staffClass.name}
                                        </p>
                                        <p className="text-sm text-gray-500 font-mono">
                                            {formatSalary(selectedEmployee.staffClass.baseSalary, selectedEmployee.staffClass.salaryType)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm text-gray-600">Join Date</Label>
                                    <p className="font-medium">{new Date(selectedEmployee.joinDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Status</Label>
                                    <Badge variant={selectedEmployee.isActive ? "default" : "secondary"}>
                                        {selectedEmployee.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </div>

                            {/* Privileges */}
                            <div>
                                <Label className="text-sm text-gray-600">Assigned Privileges</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedEmployee.privileges.length > 0 ? (
                                        selectedEmployee.privileges.map((priv) => (
                                            <div key={priv.privilege} className="flex items-center space-x-1">
                                                <Badge variant="outline" className="flex items-center space-x-1">
                                                    {getPrivilegeIcon(priv.privilege)}
                                                    <span>{priv.privilege}</span>
                                                </Badge>
                                                <div className="text-xs text-gray-500">
                                                    {priv.canRead && 'R'}
                                                    {priv.canWrite && 'W'}
                                                    {priv.canDelete && 'D'}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No privileges assigned</p>
                                    )}
                                </div>
                            </div>

                            {selectedEmployee.user.address && (
                                <div>
                                    <Label className="text-sm text-gray-600">Address</Label>
                                    <p className="font-medium">{selectedEmployee.user.address}</p>
                                </div>
                            )}

                            {selectedEmployee.user.dateOfBirth && (
                                <div>
                                    <Label className="text-sm text-gray-600">Date of Birth</Label>
                                    <p className="font-medium">{new Date(selectedEmployee.user.dateOfBirth).toLocaleDateString()}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                            Delete Employee
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate "{selectedEmployee?.user.firstName}"? This will disable their access and remove all privileges.
                        </DialogDescription>
                    </DialogHeader>
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
                            onClick={handleDeleteEmployee}
                            disabled={formSubmitting}
                        >
                            {formSubmitting ? 'Deactivating...' : 'Deactivate Employee'}
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