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
import { Switch } from "@/components/ui/switch";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    Check,
    Clock,
    Edit,
    Eye,
    IdCard,
    Key,
    Mail,
    Phone,
    Save,
    Shield,
    ShieldCheck,
    User,
    UserCheck,
    Users,
    X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
        name: string;
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
        id: number;
        privilege: string;
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
        grantedAt: string;
    }[];
    _count: {
        attendance: number;
        leaves: number;
        shifts: number;
    };
}

interface EmployeeFormData {
    name: string;
    email: string;
    role: string;
    nic: string;
    contact: string;
    address: string;
    dateOfBirth: string;
    departmentId: string;
    classId: string;
    probationEnd: string;
    isActive: boolean;
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

export default function EditEmployeePage() {
    const params = useParams();
    const router = useRouter();
    const employeeId = params.id as string;

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [staffClasses, setStaffClasses] = useState<StaffClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [currentTab, setCurrentTab] = useState("basic");

    // Form data
    const [formData, setFormData] = useState<EmployeeFormData>({
        name: "",
        email: "",
        role: "CASHIER",
        nic: "",
        contact: "",
        address: "",
        dateOfBirth: "",
        departmentId: "",
        classId: "",
        probationEnd: "",
        isActive: true,
    });

    // Password change
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: ""
    });

    // Original data for comparison
    const [originalData, setOriginalData] = useState<EmployeeFormData | null>(null);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchEmployeeData();
        fetchSupportingData();
    }, [employeeId]);

    useEffect(() => {
        if (originalData) {
            const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
            setHasChanges(hasChanges);
        }
    }, [formData, originalData]);

    const fetchEmployeeData = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/hr/employees/${employeeId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    toast.error('Employee not found');
                    router.push('/hr/employees');
                    return;
                }
                throw new Error('Failed to fetch employee');
            }

            const data = await response.json();
            setEmployee(data.employee);

            // Populate form data
            const emp = data.employee;
            const formData: EmployeeFormData = {
                name: emp.user.name,
                email: emp.user.email,
                role: emp.user.role,
                nic: emp.user.nic || "",
                contact: emp.user.contact || "",
                address: emp.user.address || "",
                dateOfBirth: emp.user.dateOfBirth ? emp.user.dateOfBirth.split('T')[0] : "",
                departmentId: emp.department.id.toString(),
                classId: emp.staffClass.id.toString(),
                probationEnd: emp.probationEnd ? emp.probationEnd.split('T')[0] : "",
                isActive: emp.isActive,
            };

            setFormData(formData);
            setOriginalData(formData);
        } catch (error) {
            console.error('Error fetching employee:', error);
            toast.error('Failed to load employee data');
        }
    };

    const fetchSupportingData = async () => {
        try {
            const [deptResponse, classResponse] = await Promise.all([
                fetch(`${apiBaseUrl}/api/hr/departments`),
                fetch(`${apiBaseUrl}/api/hr/staff-classes`)
            ]);

            if (deptResponse.ok) {
                const deptData = await deptResponse.json();
                setDepartments(deptData.departments || []);
            }

            if (classResponse.ok) {
                const classData = await classResponse.json();
                setStaffClasses(classData.staffClasses || []);
            }
        } catch (error) {
            console.error('Error fetching supporting data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        const requiredFields = ['name', 'email', 'nic', 'contact', 'departmentId', 'classId'];
        const missingFields = requiredFields.filter(field => !formData[field as keyof EmployeeFormData]);

        if (missingFields.length > 0) {
            toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        try {
            setSaving(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/employees/${employeeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update employee');
            }

            const result = await response.json();
            toast.success('Employee updated successfully');
            setOriginalData(formData);
            setHasChanges(false);

            // Refresh employee data
            await fetchEmployeeData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setSaving(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/employees/${employeeId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword: passwordData.newPassword }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update password');
            }

            toast.success('Password updated successfully');
            setShowPasswordChange(false);
            setPasswordData({ newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        if (originalData) {
            setFormData(originalData);
            setHasChanges(false);
        }
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <Card>
                    <CardContent className="p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Employee Not Found</h3>
                        <p className="text-gray-600 mb-6">
                            The employee you're looking for doesn't exist or has been removed.
                        </p>
                        <Link href="/hr/employees">
                            <Button>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Employees
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/hr/employees">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Edit className="w-8 h-8 text-blue-600 mr-3" />
                            Edit Employee
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Update {employee.user.name}'s information and settings
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {hasChanges && (
                        <Button variant="outline" onClick={resetForm} disabled={saving}>
                            <X className="w-4 h-4 mr-2" />
                            Reset Changes
                        </Button>
                    )}
                    <Button
                        onClick={handleSaveChanges}
                        disabled={!hasChanges || saving}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Employee Overview Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">{employee.user.name}</h3>
                                <div className="flex items-center space-x-3 mt-1">
                                    <Badge variant="outline">
                                        <IdCard className="w-3 h-3 mr-1" />
                                        {employee.employeeId}
                                    </Badge>
                                    <Badge className={getRoleColor(employee.user.role)}>
                                        {employee.user.role}
                                    </Badge>
                                    <Badge variant={employee.isActive ? "default" : "secondary"}>
                                        {employee.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                            <p>Joined: {new Date(employee.joinDate).toLocaleDateString()}</p>
                            <p>{employee._count.attendance} attendance records</p>
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Changes Indicator */}
            {hasChanges && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <p className="text-orange-800 font-medium">You have unsaved changes</p>
                            <Button
                                size="sm"
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className="ml-auto"
                            >
                                Save Now
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Edit className="w-5 h-5 mr-2" />
                        Employee Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">Basic Details</TabsTrigger>
                            <TabsTrigger value="employment">Employment</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                            <TabsTrigger value="privileges">Privileges</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 mb-3">
                                    <User className="w-4 h-4 text-blue-600" />
                                    <h4 className="font-semibold text-sm text-blue-600">Personal Information</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="John Doe"
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
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="contact">Contact *</Label>
                                        <Input
                                            id="contact"
                                            value={formData.contact}
                                            onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                                            placeholder="+94"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nic">NIC Number *</Label>
                                        <Input
                                            id="nic"
                                            value={formData.nic}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nic: e.target.value }))}
                                            placeholder="123456789V"
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

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="Complete address"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="employment" className="space-y-6">
                            {/* Employment Details */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 mb-3">
                                    <Building2 className="w-4 h-4 text-purple-600" />
                                    <h4 className="font-semibold text-sm text-purple-600">Employment Details</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Employee ID</Label>
                                        <Input
                                            value={employee.employeeId}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-xs text-gray-500">Employee ID cannot be changed</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Join Date</Label>
                                        <Input
                                            value={new Date(employee.joinDate).toLocaleDateString()}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-xs text-gray-500">Join date cannot be changed</p>
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
                                                {departments.map((dept) => (
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
                                                {staffClasses.map((cls) => (
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="probationEnd">Probation End Date</Label>
                                        <Input
                                            id="probationEnd"
                                            type="date"
                                            value={formData.probationEnd}
                                            onChange={(e) => setFormData(prev => ({ ...prev, probationEnd: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="isActive">Account Status</Label>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="isActive"
                                                checked={formData.isActive}
                                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                                            />
                                            <Label htmlFor="isActive" className="cursor-pointer">
                                                {formData.isActive ? 'Active' : 'Inactive'}
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Current Employment Stats */}
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm text-gray-600">Employment Statistics</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 border rounded-lg">
                                        <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{employee._count.attendance}</p>
                                        <p className="text-sm text-gray-600">Attendance Records</p>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{employee._count.leaves}</p>
                                        <p className="text-sm text-gray-600">Leave Records</p>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{employee._count.shifts}</p>
                                        <p className="text-sm text-gray-600">Shift Assignments</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="security" className="space-y-6">
                            {/* Security Settings */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 mb-3">
                                    <Key className="w-4 h-4 text-red-600" />
                                    <h4 className="font-semibold text-sm text-red-600">Security Settings</h4>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center justify-between">
                                            <span>Password Management</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowPasswordChange(!showPasswordChange)}
                                            >
                                                {showPasswordChange ? 'Cancel' : 'Change Password'}
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    {showPasswordChange && (
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword">New Password</Label>
                                                    <Input
                                                        id="newPassword"
                                                        type="password"
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                        placeholder="Enter new password"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                                    <Input
                                                        id="confirmPassword"
                                                        type="password"
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                        placeholder="Confirm new password"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handlePasswordChange}
                                                disabled={!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword || saving}
                                                className="w-full"
                                            >
                                                {saving ? 'Updating...' : 'Update Password'}
                                            </Button>
                                        </CardContent>
                                    )}
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Account Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm text-gray-600">Email</Label>
                                                <div className="flex items-center space-x-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">{employee.user.email}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-gray-600">Account Created</Label>
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">{new Date(employee.user.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="privileges" className="space-y-6">
                            {/* Privileges Management */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <ShieldCheck className="w-4 h-4 text-orange-600" />
                                        <h4 className="font-semibold text-sm text-orange-600">Access Privileges</h4>
                                    </div>
                                    <Link href={`/hr/employees/${employeeId}/privileges`}>
                                        <Button variant="outline" size="sm">
                                            <Shield className="w-4 h-4 mr-2" />
                                            Manage Privileges
                                        </Button>
                                    </Link>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Current Privileges ({employee.privileges.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {employee.privileges.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {employee.privileges.map((priv) => {
                                                    const template = AVAILABLE_PRIVILEGES.find(p => p.name === priv.privilege);
                                                    return (
                                                        <div key={priv.id} className="border rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    {getPrivilegeIcon(priv.privilege)}
                                                                    <span className="font-medium">{priv.privilege}</span>
                                                                </div>
                                                                {template && (
                                                                    <Badge className={getRiskLevelColor(template.riskLevel)}>
                                                                        {template.riskLevel}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex space-x-2 mb-2">
                                                                {priv.canRead && <Badge variant="outline" className="text-green-600 text-xs">Read</Badge>}
                                                                {priv.canWrite && <Badge variant="outline" className="text-blue-600 text-xs">Write</Badge>}
                                                                {priv.canDelete && <Badge variant="outline" className="text-red-600 text-xs">Delete</Badge>}
                                                            </div>
                                                            {template && (
                                                                <p className="text-xs text-gray-600">{template.description}</p>
                                                            )}
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Granted: {new Date(priv.grantedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Privileges Assigned</h3>
                                                <p className="text-gray-600 mb-4">
                                                    This employee doesn't have any system privileges assigned.
                                                </p>
                                                <Link href={`/hr/employees/${employeeId}/privileges`}>
                                                    <Button>
                                                        <Shield className="w-4 h-4 mr-2" />
                                                        Assign Privileges
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Link href={`/hr/employees/${employeeId}`}>
                            <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                            </Button>
                        </Link>
                        <Link href={`/hr/employees/${employeeId}/privileges`}>
                            <Button variant="outline" size="sm">
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Manage Privileges
                            </Button>
                        </Link>
                        <Link href={`/hr/employees/${employeeId}/documents`}>
                            <Button variant="outline" size="sm">
                                <IdCard className="w-4 h-4 mr-2" />
                                Documents
                            </Button>
                        </Link>
                        <Button variant="outline" size="sm" disabled>
                            <Calendar className="w-4 h-4 mr-2" />
                            Attendance (Coming Soon)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}