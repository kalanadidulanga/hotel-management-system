"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Users,
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  CreditCard,
  Building,
  Globe,
  AlertCircle,
  Eye,
  Settings,
  DollarSign,
  FileText,
  Clock,
  Activity
} from "lucide-react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import Link from "next/link";

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  profession: string;
  nationality: "native" | "foreigner";
  nationalId: string;
  address: string;
  createdAt: string;
  updatedAt?: string;
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch customer details');
  return res.json();
});

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch customer details with SWR
  const { data: customer, error: customerError, isLoading: isLoadingCustomer, mutate } = useSWR<Customer>(
    customerId ? `/api/customer/customer-list/${customerId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onError: (error) => {
        toast.error("Failed to load customer details");
        console.error("Error loading customer:", error);
      }
    }
  );

  // Delete customer
  const handleDelete = async () => {
    if (!customer) return;

    const customerName = `${customer.firstName} ${customer.lastName}`;

    if (!confirm(`Are you sure you want to delete "${customerName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/customer/customer-list`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: customer.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete customer");
      }

      toast.success("Customer deleted successfully!", {
        description: `${customerName} has been removed from the system.`,
      });

      // Redirect to customer list
      router.push("/customer/customer-list");

    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete customer. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate age
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Error state
  if (customerError) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Customer</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Customer with ID #{customerId} could not be found or loaded.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => mutate()} variant="outline">
                Try Again
              </Button>
              <Link href="/customer/customer-list">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingCustomer) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        {/* Header Section */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
          <div className="px-4 py-4 space-y-4">
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
                  <span className="text-sm font-medium">Customer Details</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-primary" />
              <div>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex-1 overflow-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Customer Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The customer you're looking for doesn't exist.
            </p>
            <Link href="/customer/customer-list">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                <span className="text-sm font-medium">Customer Details</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Title & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Customer Details</h1>
                <p className="text-sm text-muted-foreground">
                  {customer.firstName} {customer.lastName} • ID: #{customer.id}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/customer/customer-list">
                <Button variant="outline" className="h-10 px-6 rounded-full shadow-md flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Customer List
                </Button>
              </Link>
              <Link href={`/customer/customer-list/update/${customer.id}`}>
                <Button className="h-10 px-6 rounded-full shadow-md flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Customer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Customer Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Profile Card */}
              <Card className="shadow-lg border border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 border-2 border-primary/20">
                        <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                          {customer.firstName[0]?.toUpperCase()}{customer.lastName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">
                          {customer.firstName} {customer.lastName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                          <span className="text-sm text-muted-foreground">
                            {customer.nationality === 'native' ? 'Native' : 'Foreigner'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="rounded-full border-red-200 hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{customer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{customer.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">
                            {formatDate(customer.dateOfBirth)} ({calculateAge(customer.dateOfBirth)} years old)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Profession</p>
                          <p className="font-medium">{customer.profession}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">National ID</p>
                          <p className="font-medium">{customer.nationalId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nationality</p>
                          <p className="font-medium capitalize">{customer.nationality}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Address
                    </h3>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-foreground">{customer.address}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Account Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Member Since</p>
                          <p className="font-medium">{formatDate(customer.createdAt)}</p>
                        </div>
                      </div>
                      {customer.updatedAt && (
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <Edit className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Last Updated</p>
                            <p className="font-medium">{formatDate(customer.updatedAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              {/* Customer Info Summary */}
              <Card className="shadow-lg border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">Customer ID</div>
                    <div className="text-2xl font-bold text-blue-600">#{customer.id}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-800 mb-1">Age</div>
                    <div className="text-2xl font-bold text-green-600">
                      {calculateAge(customer.dateOfBirth)} years
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium text-purple-800 mb-1">Member For</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.floor((new Date().getTime() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                </CardContent>
              </Card>

            

              {/* Additional Info */}
              <Card className="shadow-lg border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Additional Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Nationality</span>
                    <span className="text-sm font-medium capitalize">{customer.nationality}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Profession</span>
                    <span className="text-sm font-medium">{customer.profession}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}