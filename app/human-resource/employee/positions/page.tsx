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
  Eye,
  Edit,
  Trash2,
  Copy,
  FileText,
  Printer,
  Users2,
  Filter,
  Download,
} from "lucide-react";

interface Position {
  id: number;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

const mockPositions: Position[] = [
  {
    id: 1,
    name: "Waiter",
    description: "Restaurant Waiter",
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Driver",
    description: "Drive a Specific Vehicle for Pic up & Drop off Customer",
    status: "Active",
    createdAt: "2024-01-16",
  },
  {
    id: 3,
    name: "Driver",
    description: "Drive a Specific Vehicle for Pic up & Drop off Customer",
    status: "Active",
    createdAt: "2024-01-17",
  },
  {
    id: 4,
    name: "Housekeeper",
    description:
      "Most waiters and waitresses, also called servers, work in full-service restaurants. They greet customers, take food orders, bring food and drinks to the tables and take payment and make change.",
    status: "Active",
    createdAt: "2024-01-18",
  },
  {
    id: 5,
    name: "Counter Manager",
    description:
      "Responsible for providing quick and efficient service to customers. Greets customers, takes their food and beverage orders, rings orders into register, and prepares and serves hot and cold drinks.",
    status: "Active",
    createdAt: "2024-01-19",
  },
  {
    id: 6,
    name: "Shift Manager",
    description: "Manage Working Shift",
    status: "Active",
    createdAt: "2024-01-20",
  },
  {
    id: 7,
    name: "Hotel Manager",
    description: "Manage Hotel",
    status: "Active",
    createdAt: "2024-01-21",
  },
  {
    id: 8,
    name: "Waiter",
    description: "Restaurant Waiter",
    status: "Active",
    createdAt: "2024-01-22",
  },
  {
    id: 9,
    name: "Accounts",
    description: "Play a key role in every restaurant.",
    status: "Active",
    createdAt: "2024-01-23",
  },
  {
    id: 10,
    name: "House Keeper",
    description:
      "House keepers are worked as room cleaner and laundry iteam carrier for the hotel",
    status: "Active",
    createdAt: "2024-01-24",
  },
  {
    id: 11,
    name: "Kitchen manager",
    description:
      "Supervises and coordinates activities concerning all back-of-the-house operations and personnel, including food preparation, kitchen and storeroom areas.",
    status: "Active",
    createdAt: "2024-01-25",
  },
  {
    id: 12,
    name: "HRM",
    description:
      "Recruits and hires qualified employees, creates in-house job-training programs, and assists employees with their career needs.",
    status: "Active",
    createdAt: "2024-01-26",
  },
  {
    id: 13,
    name: "Chef",
    description:
      "Responsible for the pastry shop in a foodservice establishment. Ensures that the products produced in the pastry shop meet the quality standards in conjunction with the executive chef.",
    status: "Active",
    createdAt: "2024-01-27",
  },
];

const EmployeePositions = () => {
  const [positions, setPositions] = useState<Position[]>(mockPositions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [newPosition, setNewPosition] = useState({
    name: "",
    description: "",
    status: "Active" as "Active" | "Inactive",
  });

  // Filter and search positions
  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesSearch =
        position.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        position.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || position.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [positions, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPositions.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentPositions = filteredPositions.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const handleAddPosition = () => {
    if (newPosition.name.trim() && newPosition.description.trim()) {
      const position: Position = {
        id: Math.max(...positions.map((p) => p.id)) + 1,
        name: newPosition.name,
        description: newPosition.description,
        status: newPosition.status,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setPositions([...positions, position]);
      setNewPosition({
        name: "",
        description: "",
        status: "Active",
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleEditPosition = () => {
    if (
      selectedPosition &&
      newPosition.name.trim() &&
      newPosition.description.trim()
    ) {
      const updatedPositions = positions.map((position) =>
        position.id === selectedPosition.id
          ? {
              ...position,
              name: newPosition.name,
              description: newPosition.description,
              status: newPosition.status,
            }
          : position
      );
      setPositions(updatedPositions);
      setIsEditDialogOpen(false);
      setSelectedPosition(null);
      setNewPosition({
        name: "",
        description: "",
        status: "Active",
      });
    }
  };

  const handleDeletePosition = (id: number) => {
    if (confirm("Are you sure you want to delete this position?")) {
      setPositions(positions.filter((position) => position.id !== id));
    }
  };

  const openEditDialog = (position: Position) => {
    setSelectedPosition(position);
    setNewPosition({
      name: position.name,
      description: position.description,
      status: position.status,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setNewPosition({
      name: "",
      description: "",
      status: "Active",
    });
  };

  const openViewDialog = (position: Position) => {
    setSelectedPosition(position);
    setIsViewDialogOpen(true);
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
          <BreadcrumbItem>Positions</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Employee Positions</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Position
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Position</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Position Name *</Label>
                  <Input
                    id="name"
                    value={newPosition.name}
                    onChange={(e) =>
                      setNewPosition((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter position name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newPosition.description}
                    onChange={(e) =>
                      setNewPosition((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter position description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newPosition.status}
                    onValueChange={(value: "Active" | "Inactive") =>
                      setNewPosition((prev) => ({ ...prev, status: value }))
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
                  <Button onClick={handleAddPosition} className="flex-1">
                    Add
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
              Total Positions
            </CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.length}</div>
            <p className="text-xs text-muted-foreground">
              {positions.filter((p) => p.status === "Active").length} active
              positions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Positions
            </CardTitle>
            <Badge variant="secondary" className="text-green-600">
              {positions.filter((p) => p.status === "Active").length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                (positions.filter((p) => p.status === "Active").length /
                  positions.length) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Position activity rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recently Added
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                positions.filter(
                  (p) =>
                    new Date(p.createdAt) >
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Positions added this week
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search positions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">SL</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPositions.length > 0 ? (
                currentPositions.map((position, index) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {position.name}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={position.description}>
                        {position.description.length > 80
                          ? `${position.description.substring(0, 80)}...`
                          : position.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          position.status === "Active" ? "default" : "secondary"
                        }
                        className={
                          position.status === "Active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {position.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{position.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(position)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(position)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePosition(position.id)}
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
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No positions found
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
                  filteredPositions.length
                )}{" "}
                of {filteredPositions.length} entries
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

      {/* View Position Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Position Details</DialogTitle>
          </DialogHeader>
          {selectedPosition && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Position Name
                </Label>
                <div className="text-sm font-medium p-3 bg-muted rounded-md">
                  {selectedPosition.name}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                <div className="text-sm p-3 bg-muted rounded-md min-h-[80px]">
                  {selectedPosition.description}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Status
                </Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedPosition.status === "Active"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      selectedPosition.status === "Active"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : ""
                    }
                  >
                    {selectedPosition.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Created Date
                </Label>
                <div className="text-sm font-medium p-3 bg-muted rounded-md">
                  {selectedPosition.createdAt}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setSelectedPosition(null);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    openEditDialog(selectedPosition);
                  }}
                  className="flex-1"
                >
                  Edit Position
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Position Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Position Name *</Label>
              <Input
                id="edit-name"
                value={newPosition.name}
                onChange={(e) =>
                  setNewPosition((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter position name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={newPosition.description}
                onChange={(e) =>
                  setNewPosition((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter position description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={newPosition.status}
                onValueChange={(value: "Active" | "Inactive") =>
                  setNewPosition((prev) => ({ ...prev, status: value }))
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
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsEditDialogOpen(false);
                  setSelectedPosition(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleEditPosition} className="flex-1">
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeePositions;
