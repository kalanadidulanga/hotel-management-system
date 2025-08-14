"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home,
  Users,
  Edit,
  Trash2,
  AlertCircle,
  Eye,
  RefreshCw,
  User,
  ImageIcon
} from "lucide-react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import Link from "next/link";

// Customer interface based on your Prisma model
interface Customer {
  id: number;
  title?: string;
  firstName: string;
  lastName?: string;
  gender: string;
  dateOfBirth: string;
  anniversary?: string;
  nationality: "native" | "foreigner";
  isVip: boolean;
  occupation?: string;
  email: string;
  countryCode: string;
  phone: string;
  contactType?: string;
  country?: string;
  state?: string;
  city?: string;
  zipcode?: string;
  address: string;
  identityType?: string;
  identityNumber: string;
  frontIdUrl?: string;
  backIdUrl?: string;
  guestImageUrl?: string;
  createdAt: string;
  updatedAt: string;
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
  const {
    data: customer,
    error: customerError,
    isLoading: isLoadingCustomer,
    mutate
  } = useSWR<Customer>(
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

    const customerName = `${customer.firstName} ${customer.lastName || ''}`.trim();

    if (!confirm(`Are you sure you want to delete "${customerName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/customer/customer-list/${customer.id}`, {
        method: "DELETE",
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

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const PhotoPlaceholder = ({ label, imageUrl }: { label: string; imageUrl?: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="w-26 h-20 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
        {imageUrl ? (
          <Link href = { imageUrl } target = "_blank" rel = "noopener noreferrer" >

          <img src={imageUrl} alt={label} className="w-full h-full object-cover rounded-lg" />
          </Link>
        ) : (
          <ImageIcon className="w-6 h-6 text-gray-400" />
        )}
      </div>
    </div>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
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
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Link href="/customer/customer-list">
                <Button>
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
              <Button>Back to List</Button>
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
                  {customer.firstName} {customer.lastName || ''} • ID: #{customer.id}
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
              
             
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={customer.firstName || ''}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={customer.email || ''}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                      Date of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      value={customer.dateOfBirth ? formatDate(customer.dateOfBirth) : 'Date of Birth'}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-400"
                      placeholder="Date of Birth"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={customer.city || 'City'}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-400"
                      placeholder="City"
                    />
                  </div>

                  {/* Nationality */}
                  <div className="space-y-2">
                    <Label htmlFor="nationality" className="text-sm font-medium">
                      Nationality
                    </Label>
                    <Input
                      id="nationality"
                      value={customer.nationality ? (customer.nationality === 'native' ? 'Native' : 'Foreigner') : 'Nationality'}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-400"
                      placeholder="Nationality"
                    />
                  </div>

                  {/* Photo Identity Type */}
                  <div className="space-y-2">
                    <Label htmlFor="identityType" className="text-sm font-medium">
                      Photo Identity Type
                    </Label>
                    <Input
                      id="identityType"
                      value={customer.identityType || 'Photo Identity Type'}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-400"
                      placeholder="Photo Identity Type"
                    />
                  </div>

                  {/* Photo Front */}
                  <PhotoPlaceholder label="Photo Front" imageUrl={customer.frontIdUrl} />

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      value={customer.address || '413 21st Ave NE Center'}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700 min-h-[80px] resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={customer.lastName || 'Vladimir Diaz'}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={`${customer.countryCode || ''} ${customer.phone || '4342569705'}`}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700"
                    />
                  </div>

                  {/* Profession */}
                  <div className="space-y-2">
                    <Label htmlFor="occupation" className="text-sm font-medium">
                      Profession
                    </Label>
                    <Input
                      id="occupation"
                      value={customer.occupation || 'Profession'}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-400"
                      placeholder="Profession"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium">
                      Gender
                    </Label>
                    <Input
                      id="gender"
                      value={customer.gender || 'Gender'}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-400"
                      placeholder="Gender"
                    />
                  </div>

                  {/* Passport No */}
                  <div className="space-y-2">
                    <Label htmlFor="identityNumber" className="text-sm font-medium">
                      Passport No
                    </Label>
                    <Input
                      id="identityNumber"
                      value={customer.identityNumber || 'Passport No'}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-400"
                      placeholder="Passport No"
                    />
                  </div>

                  {/* Photo Identity */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Photo Identity
                    </Label>
                    <Input
                      value="Photo Identity"
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-400"
                      placeholder="Photo Identity"
                    />
                  </div>

                  {/* Photo Back */}
                  <PhotoPlaceholder label="Photo Back" imageUrl={customer.backIdUrl} />

                  {/* Photo Guest */}
                  <PhotoPlaceholder label="Photo Guest" imageUrl={customer.guestImageUrl} />
                </div>
              </div>

              {/* VIP Status Badge */}
              {customer.isVip && (
                <div className="mt-6 pt-6 border-t">
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-sm px-3 py-1">
                    VIP Customer
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}