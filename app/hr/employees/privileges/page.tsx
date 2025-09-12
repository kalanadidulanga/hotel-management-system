"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    Building2,
    Check,
    CheckCircle,
    ChevronDown,
    Eye,
    IdCard,
    Info,
    Plus,
    Save,
    Search,
    Settings,
    Shield,
    ShieldCheck,
    User,
    UserCog,
    Users,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Employee {
    id: number;
    employeeId: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    department: {
        name: string;
    };
    staffClass: {
        name: string;
    };
    isActive: boolean;
    currentPrivileges?: string[];
}

interface PrivilegeAssignment {
    employeeId: number;
    employee: Employee;
    privilege: string;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    notes: string;
}

interface PrivilegeType {
    name: string;
    description: string;
    category: string;
    icon: string;
    recommendedRoles: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const AVAILABLE_PRIVILEGES: PrivilegeType[] = [
    {
        name: 'ADD_USERS',
        description: 'Create and manage user accounts, assign roles and permissions',
        category: 'User Management',
        icon: 'User',
        recommendedRoles: ['ADMIN', 'MANAGER'],
        riskLevel: 'HIGH'
    },
    {
        name: 'RESTAURANT_ORDERS',
        description: 'Handle restaurant orders, billing, and POS operations',
        category: 'Restaurant',
        icon: 'UtensilsCrossed',
        recommendedRoles: ['CASHIER', 'FRONT_OFFICE', 'MANAGER'],
        riskLevel: 'MEDIUM'
    },
    {
        name: 'INVENTORY',
        description: 'Manage inventory levels, stock tracking, and procurement',
        category: 'Inventory',
        icon: 'Package',
        recommendedRoles: ['MANAGER', 'FRONT_OFFICE'],
        riskLevel: 'MEDIUM'
    },
    {
        name: 'ROOM_SETTING',
        description: 'Configure room settings, availability, and pricing',
        category: 'Room Management',
        icon: 'Home',
        recommendedRoles: ['ADMIN', 'MANAGER', 'FRONT_OFFICE'],
        riskLevel: 'MEDIUM'
    },
    {
        name: 'ACCOUNTS',
        description: 'Access financial accounts, transactions, and billing',
        category: 'Financial',
        icon: 'CreditCard',
        recommendedRoles: ['ADMIN', 'MANAGER'],
        riskLevel: 'HIGH'
    },
    {
        name: 'GENERAL_LEDGER',
        description: 'Manage general ledger entries and financial reports',
        category: 'Financial',
        icon: 'BookOpen',
        recommendedRoles: ['ADMIN'],
        riskLevel: 'CRITICAL'
    },
    {
        name: 'UNIT_PRICING',
        description: 'Set and modify pricing for rooms, services, and products',
        category: 'Pricing',
        icon: 'DollarSign',
        recommendedRoles: ['ADMIN', 'MANAGER'],
        riskLevel: 'HIGH'
    }
];

export default function NewPrivilegePage() {
    const router = useRouter();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
    const [assignments, setAssignments] = useState<PrivilegeAssignment[]>([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [selectedRole, setSelectedRole] = useState<string>("all");
    const [selectedPrivilege, setSelectedPrivilege] = useState<string>("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [showBulkAssign, setShowBulkAssign] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Bulk assignment form
    const [bulkForm, setBulkForm] = useState({
        privilege: "",
        canRead: true,
        canWrite: false,
        canDelete: false,
        notes: ""
    });

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        filterEmployees();
    }, [searchTerm, selectedDepartment, selectedRole, employees]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/employees`);
            if (response.ok) {
                const data = await response.json();
                const employeesWithPrivileges = await Promise.all(
                    data.employees.map(async (emp: Employee) => {
                        try {
                            const privResponse = await fetch(`${apiBaseUrl}/api/hr/employees/${emp.id}/privileges`);
                            if (privResponse.ok) {
                                const privData = await privResponse.json();
                                return {
                                    ...emp,
                                    currentPrivileges: privData.privileges?.map((p: any) => p.privilege) || []
                                };
                            }
                        } catch (error) {
                            console.error(`Error fetching privileges for employee ${emp.id}:`, error);
                        }
                        return { ...emp, currentPrivileges: [] };
                    })
                );
                setEmployees(employeesWithPrivileges);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const filterEmployees = () => {
        let filtered = employees.filter(emp => emp.isActive);

        if (searchTerm) {
            filtered = filtered.filter(emp =>
                emp.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedDepartment !== "all") {
            filtered = filtered.filter(emp => emp.department.name === selectedDepartment);
        }

        if (selectedRole !== "all") {
            filtered = filtered.filter(emp => emp.user.role === selectedRole);
        }

        setFilteredEmployees(filtered);
    };

    const addEmployeeToAssignment = (employee: Employee) => {
        if (selectedEmployees.find(emp => emp.id === employee.id)) {
            toast.warning('Employee already selected');
            return;
        }

        setSelectedEmployees(prev => [...prev, employee]);

        const newAssignment: PrivilegeAssignment = {
            employeeId: employee.id,
            employee,
            privilege: "",
            canRead: true,
            canWrite: false,
            canDelete: false,
            notes: ""
        };

        setAssignments(prev => [...prev, newAssignment]);
        setShowUserSelector(false);
    };

    const removeEmployeeFromAssignment = (employeeId: number) => {
        setSelectedEmployees(prev => prev.filter(emp => emp.id !== employeeId));
        setAssignments(prev => prev.filter(assignment => assignment.employeeId !== employeeId));
    };

    const updateAssignment = (employeeId: number, field: keyof PrivilegeAssignment, value: any) => {
        setAssignments(prev => prev.map(assignment =>
            assignment.employeeId === employeeId
                ? { ...assignment, [field]: value }
                : assignment
        ));
    };

    const handleBulkAssign = () => {
        if (!bulkForm.privilege) {
            toast.error('Please select a privilege type');
            return;
        }

        if (selectedEmployees.length === 0) {
            toast.error('Please select at least one employee');
            return;
        }

        const updatedAssignments = assignments.map(assignment => ({
            ...assignment,
            privilege: bulkForm.privilege,
            canRead: bulkForm.canRead,
            canWrite: bulkForm.canWrite,
            canDelete: bulkForm.canDelete,
            notes: bulkForm.notes
        }));

        setAssignments(updatedAssignments);
        setShowBulkAssign(false);
        toast.success('Bulk assignment applied successfully');
    };

    const validateAssignments = () => {
        const errors = [];

        for (const assignment of assignments) {
            if (!assignment.privilege) {
                errors.push(`Privilege not selected for ${assignment.employee.user.name}`);
            }

            if (!assignment.canRead && !assignment.canWrite && !assignment.canDelete) {
                errors.push(`No permissions selected for ${assignment.employee.user.name}`);
            }

            // Check if employee already has this privilege
            if (assignment.employee.currentPrivileges?.includes(assignment.privilege)) {
                errors.push(`${assignment.employee.user.name} already has ${assignment.privilege} privilege`);
            }
        }

        return errors;
    };

    const handleSaveAssignments = async () => {
        const errors = validateAssignments();
        if (errors.length > 0) {
            toast.error(errors[0]);
            return;
        }

        try {
            setSaving(true);

            const requests = assignments.map(assignment =>
                fetch(`${apiBaseUrl}/api/hr/employees/${assignment.employeeId}/privileges`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        privilege: assignment.privilege,
                        canRead: assignment.canRead,
                        canWrite: assignment.canWrite,
                        canDelete: assignment.canDelete,
                        notes: assignment.notes
                    })
                })
            );

            const results = await Promise.allSettled(requests);
            const successful = results.filter(result => result.status === 'fulfilled').length;
            const failed = results.length - successful;

            if (successful > 0) {
                toast.success(`Successfully assigned privileges to ${successful} employee(s)`);
            }

            if (failed > 0) {
                toast.error(`Failed to assign privileges to ${failed} employee(s)`);
            }

            if (successful === results.length) {
                router.push('/hr/privileges');
            }
        } catch (error) {
            console.error('Error saving assignments:', error);
            toast.error('Failed to save privilege assignments');
        } finally {
            setSaving(false);
        }
    };

    const getPrivilegeIcon = (privilege: string) => {
        switch (privilege) {
            case 'ADD_USERS': return <User className="w-4 h-4" />;
            case 'RESTAURANT_ORDERS': return <UtensilsCrossed className="w-4 h-4" />;
            case 'INVENTORY': return <Package className="w-4 h-4" />;
            case 'ROOM_SETTING': return <IdCard className="w-4 h-4" />;
            case 'ACCOUNTS': return <Building2 className="w-4 h-4" />;
            case 'GENERAL_LEDGER': return <Building2 className="w-4 h-4" />;
            case 'UNIT_PRICING': return <Settings className="w-4 h-4" />;
            default: return <Shield className="w-4 h-4" />;
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

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-100 text-red-800';
            case 'MANAGER': return 'bg-purple-100 text-purple-800';
            case 'FRONT_OFFICE': return 'bg-green-100 text-green-800';
            case 'CASHIER': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getUniqueValues = (key: string) => {
        switch (key) {
            case 'departments':
                return [...new Set(employees.map(e => e.department.name))];
            case 'roles':
                return [...new Set(employees.map(e => e.user.role))];
            default:
                return [];
        }
    };

    if (loading) {
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
                <div className="flex items-center space-x-4">
                    <Link href="/hr/privileges">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <ShieldCheck className="w-8 h-8 text-blue-600 mr-3" />
                            Assign New Privileges
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Select employees and assign system privileges with custom permissions
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {assignments.length > 0 && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setShowBulkAssign(true)}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Bulk Configure
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowPreview(true)}
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                            </Button>
                            <Button
                                onClick={handleSaveAssignments}
                                disabled={saving || assignments.length === 0}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : `Save ${assignments.length} Assignment(s)`}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Employee Selection Panel */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                Select Employees
                            </div>
                            <Badge variant="secondary">
                                {selectedEmployees.length} selected
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Search and Filters */}
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <Input
                                    placeholder="Search employees..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {getUniqueValues('departments').map((dept) => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {getUniqueValues('roles').map((role) => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Employee List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredEmployees.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">No employees found</p>
                                </div>
                            ) : (
                                filteredEmployees.map((employee) => {
                                    const isSelected = selectedEmployees.find(emp => emp.id === employee.id);
                                    return (
                                        <div
                                            key={employee.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${isSelected
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'hover:bg-gray-50 border-gray-200'
                                                }`}
                                            onClick={() => !isSelected && addEmployeeToAssignment(employee)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{employee.user.name}</p>
                                                        <p className="text-xs text-gray-500">{employee.employeeId}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {employee.department.name}
                                                    </Badge>
                                                    <Badge className={`${getRoleColor(employee.user.role)} text-xs`}>
                                                        {employee.user.role}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {employee.currentPrivileges && employee.currentPrivileges.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {employee.currentPrivileges.slice(0, 3).map((priv) => (
                                                        <Badge key={priv} variant="secondary" className="text-xs">
                                                            {priv}
                                                        </Badge>
                                                    ))}
                                                    {employee.currentPrivileges.length > 3 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            +{employee.currentPrivileges.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {isSelected && (
                                                <div className="mt-2 flex items-center text-blue-600">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    <span className="text-xs">Selected</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Assignment Configuration Panel */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Shield className="w-5 h-5 mr-2" />
                            Configure Privilege Assignments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {assignments.length === 0 ? (
                            <div className="text-center py-12">
                                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Selected</h3>
                                <p className="text-gray-600 mb-4">
                                    Select employees from the left panel to start configuring privilege assignments.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {assignments.map((assignment) => (
                                    <div key={assignment.employeeId} className="border rounded-lg p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{assignment.employee.user.name}</h4>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {assignment.employee.department.name}
                                                        </Badge>
                                                        <Badge className={`${getRoleColor(assignment.employee.user.role)} text-xs`}>
                                                            {assignment.employee.user.role}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeEmployeeFromAssignment(assignment.employeeId)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Privilege Selection */}
                                            <div>
                                                <Label>Privilege Type</Label>
                                                <Select
                                                    value={assignment.privilege}
                                                    onValueChange={(value) => updateAssignment(assignment.employeeId, 'privilege', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select privilege" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {AVAILABLE_PRIVILEGES.map((priv) => {
                                                            const hasPrivilege = assignment.employee.currentPrivileges?.includes(priv.name);
                                                            return (
                                                                <SelectItem
                                                                    key={priv.name}
                                                                    value={priv.name}
                                                                    disabled={hasPrivilege}
                                                                >
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <div className="flex items-center space-x-2">
                                                                            {getPrivilegeIcon(priv.name)}
                                                                            <span>{priv.name}</span>
                                                                        </div>
                                                                        {hasPrivilege && (
                                                                            <Badge variant="secondary" className="text-xs ml-2">
                                                                                Already Assigned
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>

                                                {assignment.privilege && (
                                                    <div className="mt-2">
                                                        {(() => {
                                                            const privilegeInfo = AVAILABLE_PRIVILEGES.find(p => p.name === assignment.privilege);
                                                            return privilegeInfo && (
                                                                <div className="text-xs text-gray-600 space-y-1">
                                                                    <p>{privilegeInfo.description}</p>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {privilegeInfo.category}
                                                                        </Badge>
                                                                        <Badge className={`${getRiskLevelColor(privilegeInfo.riskLevel)} text-xs`}>
                                                                            {privilegeInfo.riskLevel} Risk
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Permissions */}
                                            <div>
                                                <Label>Permissions</Label>
                                                <div className="space-y-2 mt-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`${assignment.employeeId}-read`}
                                                            checked={assignment.canRead}
                                                            onCheckedChange={(checked) =>
                                                                updateAssignment(assignment.employeeId, 'canRead', Boolean(checked))
                                                            }
                                                        />
                                                        <Label htmlFor={`${assignment.employeeId}-read`} className="text-sm">
                                                            Read Access
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`${assignment.employeeId}-write`}
                                                            checked={assignment.canWrite}
                                                            onCheckedChange={(checked) =>
                                                                updateAssignment(assignment.employeeId, 'canWrite', Boolean(checked))
                                                            }
                                                        />
                                                        <Label htmlFor={`${assignment.employeeId}-write`} className="text-sm">
                                                            Write Access
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`${assignment.employeeId}-delete`}
                                                            checked={assignment.canDelete}
                                                            onCheckedChange={(checked) =>
                                                                updateAssignment(assignment.employeeId, 'canDelete', Boolean(checked))
                                                            }
                                                        />
                                                        <Label htmlFor={`${assignment.employeeId}-delete`} className="text-sm">
                                                            Delete Access
                                                        </Label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <Label htmlFor={`notes-${assignment.employeeId}`}>Notes (Optional)</Label>
                                            <Textarea
                                                id={`notes-${assignment.employeeId}`}
                                                placeholder="Add any additional notes or restrictions..."
                                                value={assignment.notes}
                                                onChange={(e) => updateAssignment(assignment.employeeId, 'notes', e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bulk Configuration Modal */}
            <Dialog open={showBulkAssign} onOpenChange={setShowBulkAssign}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <Settings className="w-5 h-5 mr-2" />
                            Bulk Configure Assignments
                        </DialogTitle>
                        <DialogDescription>
                            Apply the same privilege and permissions to all selected employees
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Privilege Type</Label>
                            <Select value={bulkForm.privilege} onValueChange={(value) => setBulkForm(prev => ({ ...prev, privilege: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select privilege" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AVAILABLE_PRIVILEGES.map((priv) => (
                                        <SelectItem key={priv.name} value={priv.name}>
                                            <div className="flex items-center space-x-2">
                                                {getPrivilegeIcon(priv.name)}
                                                <span>{priv.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Permissions</Label>
                            <div className="space-y-3 mt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="bulk-read"
                                        checked={bulkForm.canRead}
                                        onCheckedChange={(checked) => setBulkForm(prev => ({ ...prev, canRead: Boolean(checked) }))}
                                    />
                                    <Label htmlFor="bulk-read">Read Access</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="bulk-write"
                                        checked={bulkForm.canWrite}
                                        onCheckedChange={(checked) => setBulkForm(prev => ({ ...prev, canWrite: Boolean(checked) }))}
                                    />
                                    <Label htmlFor="bulk-write">Write Access</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="bulk-delete"
                                        checked={bulkForm.canDelete}
                                        onCheckedChange={(checked) => setBulkForm(prev => ({ ...prev, canDelete: Boolean(checked) }))}
                                    />
                                    <Label htmlFor="bulk-delete">Delete Access</Label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="bulk-notes">Notes (Optional)</Label>
                            <Textarea
                                id="bulk-notes"
                                placeholder="Add notes for all assignments..."
                                value={bulkForm.notes}
                                onChange={(e) => setBulkForm(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkAssign(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleBulkAssign}>
                            Apply to All ({assignments.length})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <Eye className="w-5 h-5 mr-2" />
                            Preview Assignments
                        </DialogTitle>
                        <DialogDescription>
                            Review all privilege assignments before saving
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-96 overflow-y-auto space-y-3">
                        {assignments.map((assignment) => (
                            <div key={assignment.employeeId} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{assignment.employee.user.name}</p>
                                            <p className="text-xs text-gray-500">{assignment.employee.employeeId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {assignment.privilege && getPrivilegeIcon(assignment.privilege)}
                                        <Badge variant="outline" className="text-xs">
                                            {assignment.privilege || 'No privilege selected'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex space-x-2 text-xs">
                                    {assignment.canRead && (
                                        <Badge variant="outline" className="text-green-600 border-green-300">
                                            Read
                                        </Badge>
                                    )}
                                    {assignment.canWrite && (
                                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                                            Write
                                        </Badge>
                                    )}
                                    {assignment.canDelete && (
                                        <Badge variant="outline" className="text-red-600 border-red-300">
                                            Delete
                                        </Badge>
                                    )}
                                </div>

                                {assignment.notes && (
                                    <p className="text-xs text-gray-600 mt-2 italic">{assignment.notes}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                setShowPreview(false);
                                handleSaveAssignments();
                            }}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {saving ? 'Saving...' : 'Save All Assignments'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Add these missing components for the icons
function UtensilsCrossed({ className }: { className: string }) {
    return <div className={className}>🍴</div>;
}

function Package({ className }: { className: string }) {
    return <div className={className}>📦</div>;
}