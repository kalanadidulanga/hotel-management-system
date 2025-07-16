"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  Eye,
  Edit,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Globe,
  CreditCard,
  FileText,
  Camera
} from "lucide-react";

interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  profession: string;
  city: string;
  gender: string;
  nationality: string;
  passportNo: string;
  photoIdentityType: string;
  photoIdentity: string;
  address: string;
  photoFront: string;
  photoBack: string;
  photoGuest: string;
  status: "Active" | "Inactive" | "Blocked";
  createdAt: string;
}

export default function CustomerDetailsPage() {
  // Mock customer data
  const customerData: CustomerData = {
    id: "1",
    firstName: "Ghghhj",
    lastName: "Chris",
    email: "admin@gmail.com",
    phone: "919868862826",
    dateOfBirth: "1990-05-15",
    profession: "Software Engineer",
    city: "New York",
    gender: "Male",
    nationality: "American",
    passportNo: "A12345678",
    photoIdentityType: "Passport",
    photoIdentity: "passport",
    address: "123 Main Street, Apartment 4B, New York, NY 10001, United States",
    photoFront: "/placeholder-id-front.jpg",
    photoBack: "/placeholder-id-back.jpg",
    photoGuest: "/placeholder-guest.jpg",
    status: "Active",
    createdAt: "2024-01-15"
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'Inactive':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Inactive</Badge>;
      case 'Blocked':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header Section */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
        <div className="px-4 py-4 space-y-4">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-4 h-4" /> Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/customer/customer-list" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Customer List
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/customer/details/${customerData.id}`} className="text-sm font-medium">
                  Customer Details
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Title & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Customer Details</h2>
                <p className="text-sm text-muted-foreground">
                  Customer ID: #{customerData.id} • {getStatusBadge(customerData.status)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = "/customer/customer-list"}
                variant="outline"
                className="h-10 px-6 rounded-full shadow-sm flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to List
              </Button>
              <Button 
                onClick={() => window.location.href = `/customer/edit/${customerData.id}`}
                className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Customer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Section */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg border border-border/50">
            <div className="p-6">
              {/* Customer Info Header */}
              <div className="border-b border-border/50 pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {customerData.firstName} {customerData.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Member since: {new Date(customerData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                 
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      First Name
                    </Label>
                    <Input
                      type="text"
                      value={customerData.firstName}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={customerData.email}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date of Birth
                    </Label>
                    <Input
                      type="date"
                      value={customerData.dateOfBirth}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      City
                    </Label>
                    <Input
                      type="text"
                      value={customerData.city}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Nationality */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Nationality
                    </Label>
                    <Input
                      type="text"
                      value={customerData.nationality}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Photo Identity Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Photo Identity Type
                    </Label>
                    <Input
                      type="text"
                      value={customerData.photoIdentityType}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Photo Front */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Photo Front
                    </Label>
                    <div className="w-20 h-14 bg-gray-100 border border-border/50 rounded-lg flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </Label>
                    <Textarea
                      value={customerData.address}
                      disabled
                      className="min-h-[100px] rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed resize-none"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Last Name
                    </Label>
                    <Input
                      type="text"
                      value={customerData.lastName}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </Label>
                    <Input
                      type="tel"
                      value={customerData.phone}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Profession */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Profession
                    </Label>
                    <Input
                      type="text"
                      value={customerData.profession}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Gender
                    </Label>
                    <Input
                      type="text"
                      value={customerData.gender}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Passport No */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Passport No
                    </Label>
                    <Input
                      type="text"
                      value={customerData.passportNo}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Photo Identity */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Photo Identity
                    </Label>
                    <Input
                      type="text"
                      value={customerData.photoIdentity}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 border-border/50 text-foreground cursor-not-allowed"
                    />
                  </div>

                  {/* Photo Back */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Photo Back
                    </Label>
                    <div className="w-20 h-14 bg-gray-100 border border-border/50 rounded-lg flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>

                  {/* Photo Guest */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Photo Guest
                    </Label>
                    <div className="w-20 h-14 bg-gray-100 border border-border/50 rounded-lg flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}