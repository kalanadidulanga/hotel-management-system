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
    Minus,
    Phone,
    Plus,
    Save,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    Trash2,
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
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    department: {
        id: number;
        name: string;
    };
    staffClass: {
        id: number;
        name: string;
    };
    privileges: {
        id: number;
        privilege: string;
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
        grantedAt: string;
    }[];
}

interface PrivilegeTemplate {
    name: string;
    description: string;
    category: string;
    recommendedRoles: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface NewPrivilege {
    privilege: string;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
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

export default function EmployeePrivilegesPage() {
    const params = useParams();
    const router = useRouter();
    const employeeId = params.id as string;

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddPrivilege, setShowAddPrivilege] = useState(false);
    const [searchFilter, setSearchFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [riskFilter, setRiskFilter] = useState("all");
    const [currentTab, setCurrentTab] = useState("current");

    // New privilege form
    const [newPrivilege, setNewPrivilege] = useState<NewPrivilege>({
        privilege: "",
        canRead: true,
        canWrite: false,
        canDelete: false,
    });

    // Delete confirmation
    const [privilegeToDelete, setPrivilegeToDelete] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        fetchEmployeeData();
    }, [employeeId]);

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
        } catch (error) {
            console.error('Error fetching employee:', error);
            toast.error('Failed to load employee data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPrivilege = async () => {
        if (!newPrivilege.privilege) {
            toast.error('Please select a privilege');
            return;
        }

        if (!newPrivilege.canRead && !newPrivilege.canWrite && !newPrivilege.canDelete) {
            toast.error('Please select at least one permission');
            return;
        }

        try {
            setSaving(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/employees/${employeeId}/privileges`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPrivilege),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to assign privilege');
            }

            toast.success('Privilege assigned successfully');
            setShowAddPrivilege(false);
            setNewPrivilege({
                privilege: "",
                canRead: true,
                canWrite: false,
                canDelete: false,
            });
            await fetchEmployeeData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePrivilege = async (privilegeId: number) => {
        try {
            setSaving(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/employees/${employeeId}/privileges/${privilegeId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove privilege');
            }

            toast.success('Privilege removed successfully');
            setShowDeleteConfirm(false);
            setPrivilegeToDelete(null);
            await fetchEmployeeData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePrivilege = async (privilegeId: number, updatedPermissions: Partial<NewPrivilege>) => {
        try {
            setSaving(true);
            const response = await fetch(`${apiBaseUrl}/api/hr/employees/${employeeId}/privileges/${privilegeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedPermissions),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update privilege');
            }

            toast.success('Privilege updated successfully');
            await fetchEmployeeData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
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

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'bg-green-100 text-green-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'HIGH': return 'bg-orange-100 text-orange-800';
            case 'CRITICAL': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRiskLevelIcon = (level: string) => {
        switch (level) {
            case 'LOW': return <ShieldCheck className="w-4 h-4" />;
            case 'MEDIUM': return <Shield className="w-4 h-4" />;
            case 'HIGH': return <ShieldAlert className="w-4 h-4" />;
            case 'CRITICAL': return <ShieldOff className="w-4 h-4" />;
            default: return <Shield className="w-4 h-4" />;
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

    const getAvailablePrivileges = () => {
        const currentPrivileges = employee?.privileges.map(p => p.privilege) || [];
        return AVAILABLE_PRIVILEGES.filter(p => !currentPrivileges.includes(p.name));
    };

    const getRecommendedPrivileges = () => {
        if (!employee) return [];
        const userRole = employee.user.role;
        return getAvailablePrivileges().filter(p => p.recommendedRoles.includes(userRole));
    };

    const getFilteredPrivileges = () => {
        let privileges = AVAILABLE_PRIVILEGES;

        if (searchFilter) {
            privileges = privileges.filter(p =>
                p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                p.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
                p.category.toLowerCase().includes(searchFilter.toLowerCase())
            );
        }

        if (categoryFilter !== 'all') {
            privileges = privileges.filter(p => p.category === categoryFilter);
        }

        if (riskFilter !== 'all') {
            privileges = privileges.filter(p => p.riskLevel === riskFilter);
        }

        return privileges;
    };

    const categories = [...new Set(AVAILABLE_PRIVILEGES.map(p => p.category))];
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

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
                    <Link href={`/hr/employees/${employeeId}/edit`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Edit
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <ShieldCheck className="w-8 h-8 text-orange-600 mr-3" />
                            Manage Privileges
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Configure access permissions for {employee.user.name}
                        </p>
                    </div>
                </div>
                <Button onClick={() => setShowAddPrivilege(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Privilege
                </Button>
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
                                    <Badge variant="outline">
                                        {employee.department.name}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Current Privileges</p>
                            <p className="text-2xl font-bold text-blue-600">{employee.privileges.length}</p>
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Privileges Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Access Privileges
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="current">Current Privileges ({employee.privileges.length})</TabsTrigger>
                            <TabsTrigger value="available">Available ({getAvailablePrivileges().length})</TabsTrigger>
                            <TabsTrigger value="recommended">Recommended ({getRecommendedPrivileges().length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="current" className="space-y-4">
                            {employee.privileges.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {employee.privileges.map((priv) => {
                                        const template = AVAILABLE_PRIVILEGES.find(p => p.name === priv.privilege);
                                        return (
                                            <Card key={priv.id} className="relative">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            {getPrivilegeIcon(priv.privilege)}
                                                            <h4 className="font-semibold text-sm">{priv.privilege}</h4>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            {template && (
                                                                <Badge className={getRiskLevelColor(template.riskLevel)}>
                                                                    {getRiskLevelIcon(template.riskLevel)}
                                                                    <span className="ml-1 text-xs">{template.riskLevel}</span>
                                                                </Badge>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setPrivilegeToDelete(priv.id);
                                                                    setShowDeleteConfirm(true);
                                                                }}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {template && (
                                                        <p className="text-xs text-gray-600">{template.description}</p>
                                                    )}

                                                    {/* Permission toggles */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs">Read Access</Label>
                                                            <Checkbox
                                                                checked={priv.canRead}
                                                                onCheckedChange={(checked) =>
                                                                    handleUpdatePrivilege(priv.id, { canRead: checked as boolean })
                                                                }
                                                                disabled={saving}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs">Write Access</Label>
                                                            <Checkbox
                                                                checked={priv.canWrite}
                                                                onCheckedChange={(checked) =>
                                                                    handleUpdatePrivilege(priv.id, { canWrite: checked as boolean })
                                                                }
                                                                disabled={saving}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs">Delete Access</Label>
                                                            <Checkbox
                                                                checked={priv.canDelete}
                                                                onCheckedChange={(checked) =>
                                                                    handleUpdatePrivilege(priv.id, { canDelete: checked as boolean })
                                                                }
                                                                disabled={saving}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t">
                                                        <p className="text-xs text-gray-500">
                                                            Granted: {new Date(priv.grantedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <ShieldOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Privileges Assigned</h3>
                                    <p className="text-gray-600 mb-6">
                                        This employee doesn't have any system privileges assigned yet.
                                    </p>
                                    <Button onClick={() => setShowAddPrivilege(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Privilege
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="available" className="space-y-4">
                            {/* Filters */}
                            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-64">
                                    <Label className="text-sm">Search</Label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                        <Input
                                            placeholder="Search privileges..."
                                            value={searchFilter}
                                            onChange={(e) => setSearchFilter(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm">Category</Label>
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm">Risk Level</Label>
                                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            {riskLevels.map(level => (
                                                <SelectItem key={level} value={level}>{level}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Available privileges */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getFilteredPrivileges().map((privilege) => {
                                    const isAssigned = employee.privileges.some(p => p.privilege === privilege.name);
                                    if (isAssigned) return null;

                                    return (
                                        <Card key={privilege.name} className="hover:shadow-md transition-shadow">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        {getPrivilegeIcon(privilege.name)}
                                                        <h4 className="font-semibold text-sm">{privilege.name}</h4>
                                                    </div>
                                                    <Badge className={getRiskLevelColor(privilege.riskLevel)}>
                                                        {getRiskLevelIcon(privilege.riskLevel)}
                                                        <span className="ml-1 text-xs">{privilege.riskLevel}</span>
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <Badge variant="outline" className="text-xs">
                                                    {privilege.category}
                                                </Badge>
                                                <p className="text-xs text-gray-600">{privilege.description}</p>

                                                {privilege.recommendedRoles.includes(employee.user.role) && (
                                                    <Badge className="text-xs bg-green-100 text-green-800">
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Recommended for {employee.user.role}
                                                    </Badge>
                                                )}

                                                <Button
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => {
                                                        setNewPrivilege({
                                                            privilege: privilege.name,
                                                            canRead: true,
                                                            canWrite: privilege.recommendedRoles.includes(employee.user.role),
                                                            canDelete: false,
                                                        });
                                                        setShowAddPrivilege(true);
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Assign Privilege
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </TabsContent>

                        <TabsContent value="recommended" className="space-y-4">
                            {getRecommendedPrivileges().length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {getRecommendedPrivileges().map((privilege) => (
                                        <Card key={privilege.name} className="border-green-200 bg-green-50">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        {getPrivilegeIcon(privilege.name)}
                                                        <h4 className="font-semibold text-sm">{privilege.name}</h4>
                                                    </div>
                                                    <Badge className={getRiskLevelColor(privilege.riskLevel)}>
                                                        {getRiskLevelIcon(privilege.riskLevel)}
                                                        <span className="ml-1 text-xs">{privilege.riskLevel}</span>
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <Badge variant="outline" className="text-xs">
                                                    {privilege.category}
                                                </Badge>
                                                <p className="text-xs text-gray-600">{privilege.description}</p>

                                                <Badge className="text-xs bg-green-100 text-green-800">
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Recommended for {employee.user.role}
                                                </Badge>

                                                <Button
                                                    size="sm"
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                    onClick={() => {
                                                        setNewPrivilege({
                                                            privilege: privilege.name,
                                                            canRead: true,
                                                            canWrite: true,
                                                            canDelete: false,
                                                        });
                                                        setShowAddPrivilege(true);
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Assign Privilege
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">All Recommended Privileges Assigned</h3>
                                    <p className="text-gray-600">
                                        This employee has all the privileges recommended for their role: {employee.user.role}
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Add Privilege Dialog */}
            <Dialog open={showAddPrivilege} onOpenChange={setShowAddPrivilege}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Privilege</DialogTitle>
                        <DialogDescription>
                            Assign a new privilege to {employee.user.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Privilege</Label>
                            <Select
                                value={newPrivilege.privilege}
                                onValueChange={(value) => setNewPrivilege(prev => ({ ...prev, privilege: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a privilege" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailablePrivileges().map((priv) => (
                                        <SelectItem key={priv.name} value={priv.name}>
                                            <div className="flex items-center space-x-2">
                                                {getPrivilegeIcon(priv.name)}
                                                <span>{priv.name}</span>
                                                <Badge className={getRiskLevelColor(priv.riskLevel)}>
                                                    {priv.riskLevel}
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {newPrivilege.privilege && (
                            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    {AVAILABLE_PRIVILEGES.find(p => p.name === newPrivilege.privilege)?.description}
                                </p>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Permissions</Label>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="canRead"
                                                checked={newPrivilege.canRead}
                                                onCheckedChange={(checked) =>
                                                    setNewPrivilege(prev => ({ ...prev, canRead: checked as boolean }))
                                                }
                                            />
                                            <Label htmlFor="canRead" className="text-sm">Read Access</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="canWrite"
                                                checked={newPrivilege.canWrite}
                                                onCheckedChange={(checked) =>
                                                    setNewPrivilege(prev => ({ ...prev, canWrite: checked as boolean }))
                                                }
                                            />
                                            <Label htmlFor="canWrite" className="text-sm">Write Access</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="canDelete"
                                                checked={newPrivilege.canDelete}
                                                onCheckedChange={(checked) =>
                                                    setNewPrivilege(prev => ({ ...prev, canDelete: checked as boolean }))
                                                }
                                            />
                                            <Label htmlFor="canDelete" className="text-sm">Delete Access</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddPrivilege(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddPrivilege} disabled={saving || !newPrivilege.privilege}>
                            {saving ? 'Adding...' : 'Add Privilege'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove Privilege</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this privilege? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => privilegeToDelete && handleDeletePrivilege(privilegeToDelete)}
                            disabled={saving}
                        >
                            {saving ? 'Removing...' : 'Remove Privilege'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}