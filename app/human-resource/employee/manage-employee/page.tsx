"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Home,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  FileText,
  Printer,
  Users,
  Filter,
  Download,
  Calendar as CalendarIcon,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: string;
  status: "Active" | "Inactive";
  salary: number;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
}

interface EmployeeFormData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: Date | null;
  status: "Active" | "Inactive";
  salary: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  dateOfBirth: Date | null;
  gender: string;
  maritalStatus: string;
  nationality: string;
}

const mockDepartments = [
  "Maintenance Department",
  "Sales And Marketing Department",
  "Security Department",
  "Information Technology (IT) Department",
  "Food & Beverage Department",
  "Room Reservation",
  "Administrative Departments",
];

const mockPositions = [
  "Waiter",
  "Driver",
  "Housekeeper",
  "Counter Manager",
  "Shift Manager",
  "Hotel Manager",
  "Accounts",
  "House Keeper",
  "Kitchen manager",
  "HRM",
  "Chef",
];

const mockEmployees: Employee[] = [
  {
    id: 1,
    employeeId: "EMP001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@hotel.com",
    phone: "+1234567890",
    department: "Food & Beverage Department",
    position: "Waiter",
    hireDate: "2024-01-15",
    status: "Active",
    salary: 35000,
    address: "123 Main St, City",
    emergencyContact: "Jane Doe",
    emergencyPhone: "+1234567891",
    dateOfBirth: "1990-05-15",
    gender: "Male",
    maritalStatus: "Single",
    nationality: "American",
  },
  {
    id: 2,
    employeeId: "EMP002",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@hotel.com",
    phone: "+1234567892",
    department: "Room Reservation",
    position: "Counter Manager",
    hireDate: "2024-02-01",
    status: "Active",
    salary: 42000,
    address: "456 Oak Ave, City",
    emergencyContact: "Mike Johnson",
    emergencyPhone: "+1234567893",
    dateOfBirth: "1988-08-22",
    gender: "Female",
    maritalStatus: "Married",
    nationality: "American",
  },
  {
    id: 3,
    employeeId: "EMP003",
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@hotel.com",
    phone: "+1234567894",
    department: "Information Technology (IT) Department",
    position: "HRM",
    hireDate: "2024-01-20",
    status: "Active",
    salary: 55000,
    address: "789 Pine St, City",
    emergencyContact: "Lisa Chen",
    emergencyPhone: "+1234567895",
    dateOfBirth: "1985-12-10",
    gender: "Male",
    maritalStatus: "Married",
    nationality: "Asian",
  },
  {
    id: 4,
    employeeId: "EMP004",
    firstName: "Emma",
    lastName: "Wilson",
    email: "emma.wilson@hotel.com",
    phone: "+1234567896",
    department: "Maintenance Department",
    position: "Housekeeper",
    hireDate: "2024-03-01",
    status: "Active",
    salary: 32000,
    address: "321 Elm St, City",
    emergencyContact: "Tom Wilson",
    emergencyPhone: "+1234567897",
    dateOfBirth: "1992-03-18",
    gender: "Female",
    maritalStatus: "Single",
    nationality: "American",
  },
  {
    id: 5,
    employeeId: "EMP005",
    firstName: "Robert",
    lastName: "Davis",
    email: "robert.davis@hotel.com",
    phone: "+1234567898",
    department: "Food & Beverage Department",
    position: "Chef",
    hireDate: "2023-12-15",
    status: "Active",
    salary: 48000,
    address: "654 Maple Dr, City",
    emergencyContact: "Mary Davis",
    emergencyPhone: "+1234567899",
    dateOfBirth: "1982-07-05",
    gender: "Male",
    maritalStatus: "Married",
    nationality: "American",
  },
];

const ManageEmployee = () => {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    hireDate: null,
    status: "Active",
    salary: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    dateOfBirth: null,
    gender: "",
    maritalStatus: "",
    nationality: "",
  });

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "personal", label: "Personal" },
    { id: "emergency", label: "Emergency" },
  ];

  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || employee.status === statusFilter;
      const matchesDepartment =
        departmentFilter === "all" || employee.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, searchQuery, statusFilter, departmentFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const updateFormData = (
    field: string,
    value: string | boolean | Date | null | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }));
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      hireDate: null,
      status: "Active",
      salary: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
      dateOfBirth: null,
      gender: "",
      maritalStatus: "",
      nationality: "",
    });
    setActiveTab("basic");
  };

  const handleAddEmployee = () => {
    if (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim()
    ) {
      const newEmployee: Employee = {
        id: Math.max(...employees.map((e) => e.id)) + 1,
        employeeId:
          formData.employeeId ||
          `EMP${String(employees.length + 1).padStart(3, "0")}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        hireDate: formData.hireDate
          ? format(formData.hireDate, "yyyy-MM-dd")
          : new Date().toISOString().split("T")[0],
        status: formData.status,
        salary: parseFloat(formData.salary) || 0,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        dateOfBirth: formData.dateOfBirth
          ? format(formData.dateOfBirth, "yyyy-MM-dd")
          : "",
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        nationality: formData.nationality,
      };

      setEmployees([...employees, newEmployee]);
      resetForm();
      setIsAddDialogOpen(false);
    }
  };

  const handleEditEmployee = () => {
    if (
      selectedEmployee &&
      formData.firstName.trim() &&
      formData.lastName.trim()
    ) {
      const updatedEmployees = employees.map((employee) =>
        employee.id === selectedEmployee.id
          ? {
              ...employee,
              employeeId: formData.employeeId,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              department: formData.department,
              position: formData.position,
              hireDate: formData.hireDate
                ? format(formData.hireDate, "yyyy-MM-dd")
                : employee.hireDate,
              status: formData.status,
              salary: parseFloat(formData.salary) || employee.salary,
              address: formData.address,
              emergencyContact: formData.emergencyContact,
              emergencyPhone: formData.emergencyPhone,
              dateOfBirth: formData.dateOfBirth
                ? format(formData.dateOfBirth, "yyyy-MM-dd")
                : employee.dateOfBirth,
              gender: formData.gender,
              maritalStatus: formData.maritalStatus,
              nationality: formData.nationality,
            }
          : employee
      );

      setEmployees(updatedEmployees);
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      resetForm();
    }
  };

  const handleDeleteEmployee = (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      setEmployees(employees.filter((employee) => employee.id !== id));
    }
  };

  const openViewDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      hireDate: new Date(employee.hireDate),
      status: employee.status,
      salary: employee.salary.toString(),
      address: employee.address,
      emergencyContact: employee.emergencyContact,
      emergencyPhone: employee.emergencyPhone,
      dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth) : null,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      nationality: employee.nationality,
    });
    setActiveTab("basic");
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/human-resource">
              Human Resource
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/human-resource/employee">
              Employee
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Manage Employees</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Manage Employees</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddDialog} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add New Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              {employees.filter((e) => e.status === "Active").length} active
              employees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Employees
            </CardTitle>
            <Badge variant="secondary" className="text-green-600">
              {employees.filter((e) => e.status === "Active").length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                (employees.filter((e) => e.status === "Active").length /
                  employees.length) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Employee activity rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(employees.map((e) => e.department)).size}
            </div>
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Salary</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {Math.round(
                employees.reduce((sum, e) => sum + e.salary, 0) /
                  employees.length
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Average employee salary
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="entries">Show</Label>
                <Select
                  value={entriesPerPage.toString()}
                  onValueChange={(value) => {
                    setEntriesPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="entries" className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">entries</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Filter className="h-4 w-4" />
                  Column visibility
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {mockDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">SL</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentEmployees.length > 0 ? (
                currentEmployees.map((employee, index) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {employee.employeeId}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employee.phone}
                      </div>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell className="max-w-48">
                      <div className="truncate" title={employee.department}>
                        {employee.department.length > 25
                          ? `${employee.department.substring(0, 25)}...`
                          : employee.department}
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.hireDate}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === "Active" ? "default" : "secondary"
                        }
                        className={
                          employee.status === "Active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(employee)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(
                  startIndex + entriesPerPage,
                  filteredEmployees.length
                )}{" "}
                of {filteredEmployees.length} entries
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Employee ID
                  </Label>
                  <div className="text-sm font-medium p-2 bg-muted rounded-md">
                    {selectedEmployee.employeeId}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </Label>
                  <div className="text-sm font-medium p-2 bg-muted rounded-md">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Email
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedEmployee.email}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedEmployee.phone}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Department
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedEmployee.department}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Position
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedEmployee.position}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Salary
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    ${selectedEmployee.salary.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Hire Date
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedEmployee.hireDate}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status
                  </Label>
                  <div className="flex items-center gap-2 p-2">
                    <Badge
                      variant={
                        selectedEmployee.status === "Active"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        selectedEmployee.status === "Active"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {selectedEmployee.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Emergency Contact
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedEmployee.emergencyContact}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Emergency Phone
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedEmployee.emergencyPhone}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Gender
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedEmployee.gender}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Marital Status
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedEmployee.maritalStatus}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Nationality
                  </Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {selectedEmployee.nationality}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Address
                </Label>
                <div className="text-sm p-2 bg-muted rounded-md">
                  {selectedEmployee.address}
                </div>
              </div>
              <div className="md:col-span-2 flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    openEditDialog(selectedEmployee);
                  }}
                  className="flex-1"
                >
                  Edit Employee
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Employee Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
            setSelectedEmployee(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddDialogOpen ? "Add New Employee" : "Edit Employee"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) =>
                      updateFormData("employeeId", e.target.value)
                    }
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Active" | "Inactive") =>
                      updateFormData("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      updateFormData("firstName", e.target.value)
                    }
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData("lastName", e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      updateFormData("department", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => updateFormData("position", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPositions.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hire Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.hireDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.hireDate ? (
                          format(formData.hireDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.hireDate || undefined}
                        onSelect={(date) => updateFormData("hireDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => updateFormData("salary", e.target.value)}
                    placeholder="Enter salary"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Personal Information */}
            <TabsContent value="personal" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateOfBirth ? (
                          format(formData.dateOfBirth, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dateOfBirth || undefined}
                        onSelect={(date) => updateFormData("dateOfBirth", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => updateFormData("gender", value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(value) =>
                      updateFormData("maritalStatus", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
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
                    value={formData.nationality}
                    onChange={(e) =>
                      updateFormData("nationality", e.target.value)
                    }
                    placeholder="Enter nationality"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Emergency Contact */}
            <TabsContent value="emergency" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">
                    Emergency Contact Name
                  </Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      updateFormData("emergencyContact", e.target.value)
                    }
                    placeholder="Enter emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">
                    Emergency Contact Phone
                  </Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      updateFormData("emergencyPhone", e.target.value)
                    }
                    placeholder="Enter emergency contact phone"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (isAddDialogOpen) setIsAddDialogOpen(false);
                if (isEditDialogOpen) setIsEditDialogOpen(false);
                resetForm();
                setSelectedEmployee(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={isAddDialogOpen ? handleAddEmployee : handleEditEmployee}
              className="flex-1"
            >
              {isAddDialogOpen ? "Add Employee" : "Update Employee"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageEmployee;
