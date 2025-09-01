"use client";

import { useState } from "react";
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  User,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EmployeeFormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  hireDate: Date | null;
  status: string;

  // Positional Info
  department: string;
  position: string;
  supervisor: string;
  employmentType: string;

  // Benefits
  healthInsurance: boolean;
  dentalInsurance: boolean;
  visionInsurance: boolean;
  retirementPlan: boolean;

  // Class
  employeeClass: string;
  payGrade: string;

  // Biographical Info
  dateOfBirth: Date | null;
  gender: string;
  maritalStatus: string;
  nationality: string;

  // Contact Info
  homeEmail: string;
  businessEmail: string;
  homePhone: string;
  businessPhone: string;
  cellPhone: string;

  // Additional Address
  homeAddress: string;
  businessAddress: string;

  // Emergency Contact
  emergencyContact: string;
  emergencyHomePhone: string;
  emergencyWorkPhone: string;
  emergencyContactRelation: string;
  alterEmergencyContact: string;
  altEmergencyHomePhone: string;
  altEmergencyWorkPhone: string;

  // Custom Fields
  customFields: Array<{
    name: string;
    type: string;
    value: string;
  }>;
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

const NewEmployeePage = () => {
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: "",
    lastName: "",
    email: "",
    employeeId: "",
    hireDate: null,
    status: "Active",
    department: "",
    position: "",
    supervisor: "",
    employmentType: "",
    healthInsurance: false,
    dentalInsurance: false,
    visionInsurance: false,
    retirementPlan: false,
    employeeClass: "",
    payGrade: "",
    dateOfBirth: null,
    gender: "",
    maritalStatus: "",
    nationality: "",
    homeEmail: "",
    businessEmail: "",
    homePhone: "",
    businessPhone: "",
    cellPhone: "",
    homeAddress: "",
    businessAddress: "",
    emergencyContact: "",
    emergencyHomePhone: "",
    emergencyWorkPhone: "",
    emergencyContactRelation: "",
    alterEmergencyContact: "",
    altEmergencyHomePhone: "",
    altEmergencyWorkPhone: "",
    customFields: [],
  });

  const tabs = [
    { id: "basic", label: "Basic Information" },
    { id: "positional", label: "Positional Info" },
    { id: "benefits", label: "Benefits" },
    { id: "class", label: "Class" },
    { id: "supervisor", label: "Supervisor" },
    { id: "biographical", label: "Biographical Info" },
    { id: "address", label: "Additional Address" },
    { id: "emergency", label: "Emergency Contact" },
    { id: "custom", label: "Custom" },
  ];

  const updateFormData = (
    field: string,
    value: string | boolean | Date | null | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value || null }));
  };

  const addCustomField = () => {
    setFormData((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { name: "", type: "Text", value: "" },
      ],
    }));
  };

  const removeCustomField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  const updateCustomField = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.map((cf, i) =>
        i === index ? { ...cf, [field]: value } : cf
      ),
    }));
  };

  const getCurrentTabIndex = () =>
    tabs.findIndex((tab) => tab.id === activeTab);
  const isFirstTab = getCurrentTabIndex() === 0;
  const isLastTab = getCurrentTabIndex() === tabs.length - 1;

  const goToPreviousTab = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  const goToNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handleSubmit = () => {
    console.log("Employee Data:", formData);
    // Add API call here
    alert("Employee created successfully!");
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
          <BreadcrumbItem>Add New Employee</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Add New Employee</h1>
      </div>

      {/* Main Form */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-9 mb-6">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="text-xs whitespace-nowrap px-2"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) =>
                      updateFormData("employeeId", e.target.value)
                    }
                    placeholder="Enter employee ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hire Date *</Label>
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateFormData("status", value)}
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
              </div>
            </TabsContent>

            {/* Positional Info */}
            <TabsContent value="positional" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
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
                  <Label htmlFor="position">Position *</Label>
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
                  <Label htmlFor="supervisor">Supervisor</Label>
                  <Input
                    id="supervisor"
                    value={formData.supervisor}
                    onChange={(e) =>
                      updateFormData("supervisor", e.target.value)
                    }
                    placeholder="Enter supervisor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) =>
                      updateFormData("employmentType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Benefits */}
            <TabsContent value="benefits" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="healthInsurance"
                      checked={formData.healthInsurance}
                      onChange={(e) =>
                        updateFormData("healthInsurance", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="healthInsurance">Health Insurance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="dentalInsurance"
                      checked={formData.dentalInsurance}
                      onChange={(e) =>
                        updateFormData("dentalInsurance", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="dentalInsurance">Dental Insurance</Label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="visionInsurance"
                      checked={formData.visionInsurance}
                      onChange={(e) =>
                        updateFormData("visionInsurance", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="visionInsurance">Vision Insurance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="retirementPlan"
                      checked={formData.retirementPlan}
                      onChange={(e) =>
                        updateFormData("retirementPlan", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="retirementPlan">Retirement Plan</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Class */}
            <TabsContent value="class" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="employeeClass">Employee Class</Label>
                  <Select
                    value={formData.employeeClass}
                    onValueChange={(value) =>
                      updateFormData("employeeClass", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Senior Staff">Senior Staff</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Junior Staff">Junior Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payGrade">Pay Grade</Label>
                  <Select
                    value={formData.payGrade}
                    onValueChange={(value) => updateFormData("payGrade", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pay grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grade A">Grade A</SelectItem>
                      <SelectItem value="Grade B">Grade B</SelectItem>
                      <SelectItem value="Grade C">Grade C</SelectItem>
                      <SelectItem value="Grade D">Grade D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Supervisor */}
            <TabsContent value="supervisor" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="directSupervisor">Direct Supervisor</Label>
                  <Input
                    id="directSupervisor"
                    value={formData.supervisor}
                    onChange={(e) =>
                      updateFormData("supervisor", e.target.value)
                    }
                    placeholder="Enter direct supervisor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportingManager">Reporting Manager</Label>
                  <Input
                    id="reportingManager"
                    placeholder="Enter reporting manager"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Biographical Info */}
            <TabsContent value="biographical" className="space-y-6">
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
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
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
                <div className="space-y-2">
                  <Label htmlFor="homeEmail">Home Email</Label>
                  <Input
                    id="homeEmail"
                    type="email"
                    value={formData.homeEmail}
                    onChange={(e) =>
                      updateFormData("homeEmail", e.target.value)
                    }
                    placeholder="Home Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) =>
                      updateFormData("businessEmail", e.target.value)
                    }
                    placeholder="Business Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="homePhone">Home Phone *</Label>
                  <Input
                    id="homePhone"
                    value={formData.homePhone}
                    onChange={(e) =>
                      updateFormData("homePhone", e.target.value)
                    }
                    placeholder="735159"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    value={formData.businessPhone}
                    onChange={(e) =>
                      updateFormData("businessPhone", e.target.value)
                    }
                    placeholder="Work Phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cellPhone">Cell Phone *</Label>
                  <Input
                    id="cellPhone"
                    value={formData.cellPhone}
                    onChange={(e) =>
                      updateFormData("cellPhone", e.target.value)
                    }
                    placeholder="519537"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Additional Address */}
            <TabsContent value="address" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="homeAddress">Home Address</Label>
                  <Textarea
                    id="homeAddress"
                    value={formData.homeAddress}
                    onChange={(e) =>
                      updateFormData("homeAddress", e.target.value)
                    }
                    placeholder="Enter home address"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Textarea
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) =>
                      updateFormData("businessAddress", e.target.value)
                    }
                    placeholder="Enter business address"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Emergency Contact */}
            <TabsContent value="emergency" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      updateFormData("emergencyContact", e.target.value)
                    }
                    placeholder="897546123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyHomePhone">
                    Emergency Home Phone *
                  </Label>
                  <Input
                    id="emergencyHomePhone"
                    value={formData.emergencyHomePhone}
                    onChange={(e) =>
                      updateFormData("emergencyHomePhone", e.target.value)
                    }
                    placeholder="4521123789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyWorkPhone">
                    Emergency Work Phone *
                  </Label>
                  <Input
                    id="emergencyWorkPhone"
                    value={formData.emergencyWorkPhone}
                    onChange={(e) =>
                      updateFormData("emergencyWorkPhone", e.target.value)
                    }
                    placeholder="456897213"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelation">
                    Emergency Contact Relation
                  </Label>
                  <Input
                    id="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={(e) =>
                      updateFormData("emergencyContactRelation", e.target.value)
                    }
                    placeholder="Emergency Contact Relation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alterEmergencyContact">
                    Alter Emergency Contact
                  </Label>
                  <Input
                    id="alterEmergencyContact"
                    value={formData.alterEmergencyContact}
                    onChange={(e) =>
                      updateFormData("alterEmergencyContact", e.target.value)
                    }
                    placeholder="Alter Emergency Contact"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altEmergencyHomePhone">
                    Alt Emergency Home Phone
                  </Label>
                  <Input
                    id="altEmergencyHomePhone"
                    value={formData.altEmergencyHomePhone}
                    onChange={(e) =>
                      updateFormData("altEmergencyHomePhone", e.target.value)
                    }
                    placeholder="Alter Emergency Contact"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altEmergencyWorkPhone">
                    Alt Emergency Work Phone
                  </Label>
                  <Input
                    id="altEmergencyWorkPhone"
                    value={formData.altEmergencyWorkPhone}
                    onChange={(e) =>
                      updateFormData("altEmergencyWorkPhone", e.target.value)
                    }
                    placeholder="Alt Emergency Work Phone"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Custom Fields */}
            <TabsContent value="custom" className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Custom Fields</h3>
                  <Button
                    onClick={addCustomField}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add More
                  </Button>
                </div>

                {formData.customFields.map((field, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg relative"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomField(index)}
                      className="absolute top-2 right-2 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="space-y-2">
                      <Label>Custom Field Name</Label>
                      <Input
                        value={field.name}
                        onChange={(e) =>
                          updateCustomField(index, "name", e.target.value)
                        }
                        placeholder="Custom Field Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Custom Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) =>
                          updateCustomField(index, "type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Text">Text</SelectItem>
                          <SelectItem value="Number">Number</SelectItem>
                          <SelectItem value="Date">Date</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Custom Value</Label>
                      <Input
                        value={field.value}
                        onChange={(e) =>
                          updateCustomField(index, "value", e.target.value)
                        }
                        placeholder="custom value"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Navigation Footer */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={goToPreviousTab}
              disabled={isFirstTab}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {isLastTab ? (
              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700"
              >
                Update
              </Button>
            ) : (
              <Button onClick={goToNextTab} className="flex items-center gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewEmployeePage;
