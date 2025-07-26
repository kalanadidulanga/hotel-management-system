"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogTrigger,
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
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  FileText,
  Printer,
  Settings,
  GitBranch,
  Building2,
  Filter,
  Download,
} from "lucide-react";

interface Department {
  id: number;
  name: string;
}

interface Division {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

// Mock departments data
const mockDepartments: Department[] = [
  { id: 1, name: "Maintenance Department" },
  { id: 2, name: "Sales And Marketing Department" },
  { id: 3, name: "Security Department" },
  { id: 4, name: "Information Technology (It) Department" },
  { id: 5, name: "Food & Beverage Department" },
  { id: 6, name: "Room Reservation" },
  { id: 7, name: "Administrative Departments" },
];

// Mock divisions data
const mockDivisions: Division[] = [
  {
    id: 1,
    name: "Restaurants",
    departmentId: 5,
    departmentName: "Food & Beverage Department",
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Purchasing",
    departmentId: 7,
    departmentName: "Administrative Departments",
    status: "Active",
    createdAt: "2024-01-16",
  },
  {
    id: 3,
    name: "Laundry",
    departmentId: 1,
    departmentName: "Maintenance Department",
    status: "Active",
    createdAt: "2024-01-17",
  },
  {
    id: 4,
    name: "Housekeeping",
    departmentId: 1,
    departmentName: "Maintenance Department",
    status: "Active",
    createdAt: "2024-01-18",
  },
  {
    id: 5,
    name: "Guest Relations",
    departmentId: 6,
    departmentName: "Room Reservation",
    status: "Active",
    createdAt: "2024-01-19",
  },
  {
    id: 6,
    name: "Room Service",
    departmentId: 5,
    departmentName: "Food & Beverage Department",
    status: "Active",
    createdAt: "2024-01-20",
  },
  {
    id: 7,
    name: "Reservations Front Office",
    departmentId: 6,
    departmentName: "Room Reservation",
    status: "Active",
    createdAt: "2024-01-21",
  },
  {
    id: 8,
    name: "Maintenance & Engineering",
    departmentId: 1,
    departmentName: "Maintenance Department",
    status: "Active",
    createdAt: "2024-01-22",
  },
  {
    id: 9,
    name: "Accounting & Finance",
    departmentId: 7,
    departmentName: "Administrative Departments",
    status: "Active",
    createdAt: "2024-01-23",
  },
  {
    id: 10,
    name: "Human Resources",
    departmentId: 7,
    departmentName: "Administrative Departments",
    status: "Active",
    createdAt: "2024-01-24",
  },
];

const Division = () => {
  const [divisions, setDivisions] = useState<Division[]>(mockDivisions);
  const [departments] = useState<Department[]>(mockDepartments);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(
    null
  );
  const [newDivision, setNewDivision] = useState({
    name: "",
    departmentId: "",
  });

  // Filter and search divisions
  const filteredDivisions = useMemo(() => {
    return divisions.filter((division) => {
      const matchesSearch =
        division.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        division.departmentName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [divisions, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredDivisions.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentDivisions = filteredDivisions.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const handleAddDivision = () => {
    if (newDivision.name.trim() && newDivision.departmentId) {
      const department = departments.find(
        (d) => d.id === parseInt(newDivision.departmentId)
      );
      if (department) {
        const division: Division = {
          id: Math.max(...divisions.map((d) => d.id)) + 1,
          name: newDivision.name,
          departmentId: department.id,
          departmentName: department.name,
          status: "Active",
          createdAt: new Date().toISOString().split("T")[0],
        };
        setDivisions([...divisions, division]);
        setNewDivision({
          name: "",
          departmentId: "",
        });
        setIsAddDialogOpen(false);
      }
    }
  };

  const handleEditDivision = () => {
    if (
      selectedDivision &&
      newDivision.name.trim() &&
      newDivision.departmentId
    ) {
      const department = departments.find(
        (d) => d.id === parseInt(newDivision.departmentId)
      );
      if (department) {
        const updatedDivisions = divisions.map((division) =>
          division.id === selectedDivision.id
            ? {
                ...division,
                name: newDivision.name,
                departmentId: department.id,
                departmentName: department.name,
              }
            : division
        );
        setDivisions(updatedDivisions);
        setIsEditDialogOpen(false);
        setSelectedDivision(null);
        setNewDivision({
          name: "",
          departmentId: "",
        });
      }
    }
  };

  const handleDeleteDivision = (id: number) => {
    if (confirm("Are you sure you want to delete this division?")) {
      setDivisions(divisions.filter((division) => division.id !== id));
    }
  };

  const openEditDialog = (division: Division) => {
    setSelectedDivision(division);
    setNewDivision({
      name: division.name,
      departmentId: division.departmentId.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setNewDivision({
      name: "",
      departmentId: "",
    });
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
            <BreadcrumbLink href="/human-resource/recruitment">
              Recruitment
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Division</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Division List</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Division
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Division</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="division-name">Division Name *</Label>
                  <Input
                    id="division-name"
                    value={newDivision.name}
                    onChange={(e) =>
                      setNewDivision((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Division Name"
                  />
                </div>
                <div>
                  <Label htmlFor="department-name">Department Name *</Label>
                  <Select
                    value={newDivision.departmentId}
                    onValueChange={(value) =>
                      setNewDivision((prev) => ({
                        ...prev,
                        departmentId: value,
                      }))
                    }
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
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsAddDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleAddDivision}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Divisions
            </CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{divisions.length}</div>
            <p className="text-xs text-muted-foreground">
              {divisions.filter((d) => d.status === "Active").length} active
              divisions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total departments with divisions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Divisions
            </CardTitle>
            <Badge variant="secondary" className="text-green-600">
              {divisions.filter((d) => d.status === "Active").length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                (divisions.filter((d) => d.status === "Active").length /
                  divisions.length) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Division activity rate
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
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileText className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Filter className="h-4 w-4" />
                  Column visibility
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search:"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Division Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <div className="flex items-center gap-1">
                    SL
                    <div className="flex flex-col">
                      <button className="text-xs">▲</button>
                      <button className="text-xs">▼</button>
                    </div>
                  </div>
                </TableHead>
                <TableHead>Division Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDivisions.length > 0 ? (
                currentDivisions.map((division, index) => (
                  <TableRow key={division.id}>
                    <TableCell className="font-medium">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {division.name}
                    </TableCell>
                    <TableCell>{division.departmentName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(division)}
                          className="bg-green-600 hover:bg-green-700 text-white p-1 h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDivision(division.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-1 h-8 w-8"
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
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No divisions found
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
                  filteredDivisions.length
                )}{" "}
                of {filteredDivisions.length} entries
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
                          className={`cursor-pointer ${
                            currentPage === page
                              ? "bg-green-600 text-white"
                              : ""
                          }`}
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

      {/* Edit Division Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Division</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-division-name">Division Name *</Label>
              <Input
                id="edit-division-name"
                value={newDivision.name}
                onChange={(e) =>
                  setNewDivision((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Division Name"
              />
            </div>
            <div>
              <Label htmlFor="edit-department-name">Department Name *</Label>
              <Select
                value={newDivision.departmentId}
                onValueChange={(value) =>
                  setNewDivision((prev) => ({
                    ...prev,
                    departmentId: value,
                  }))
                }
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
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsEditDialogOpen(false);
                  setSelectedDivision(null);
                }}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                onClick={handleEditDivision}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Division;
