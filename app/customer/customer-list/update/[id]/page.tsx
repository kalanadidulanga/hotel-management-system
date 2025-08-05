"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Home,
    Users,
    ArrowLeft,
    UserCheck,
    RotateCcw,
    Save,
    Edit,
    Loader2,
    AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import Link from "next/link";

interface CustomerFormData {
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
    status?: "Active" | "Inactive" | "Blocked";
    createdAt: string;
}

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch customer data');
    return res.json();
});

export default function UpdateCustomerPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = params.id as string;

    const [formData, setFormData] = useState<CustomerFormData>({
        id: 0,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        profession: "",
        nationality: "native",
        nationalId: "",
        address: "",
        status: "Active",
        createdAt: ""
    });

    const [originalData, setOriginalData] = useState<CustomerFormData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch customer data with SWR
    const { data: customerData, error: customerError, isLoading: isLoadingCustomer, mutate } = useSWR<CustomerFormData>(
        customerId ? `/api/customer/customer-list/${customerId}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            onSuccess: (data) => {
                // Format date for input
                const formattedData = {
                    ...data,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
                    status: data.status || 'Active'
                };
                setFormData(formattedData);
                setOriginalData(formattedData);
            },
            onError: (error) => {
                toast.error("Failed to load customer data");
                console.error("Error loading customer:", error);
            }
        }
    );

    // Handle form field changes
    const handleChange = (field: keyof CustomerFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\s/g, ""))) {
            newErrors.phone = "Please enter a valid phone number (10-15 digits)";
        }

        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = "Date of birth is required";
        }

        

        if (!formData.nationalId.trim()) {
            newErrors.nationalId = "National ID is required";
        }

        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fill in all required fields correctly");
            return;
        }

        setIsSubmitting(true);
        try {
            const updateData = {
                id: parseInt(customerId),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                dateOfBirth: formData.dateOfBirth,
                profession: formData.profession.trim(),
                nationality: formData.nationality,
                nationalId: formData.nationalId.trim(),
                address: formData.address.trim(),
            };

            const response = await fetch(`/api/customer/customer-list`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update customer");
            }

            const updatedCustomer = await response.json();

            // Refresh the data
            await mutate();

            toast.success("Customer updated successfully!", {
                description: `${updatedCustomer.firstName} ${updatedCustomer.lastName} has been updated.`,
                action: {
                    label: "View List",
                    onClick: () => router.push("/customer/customer-list")
                }
            });

            // Redirect to customer list after a short delay
            setTimeout(() => {
                router.push("/customer/customer-list");
            }, 1500);

        } catch (error) {
            console.error("Error updating customer:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to update customer. Please try again.",
                {
                    description: "Please check your input and try again.",
                }
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form to original data
    const handleReset = () => {
        if (originalData) {
            setFormData(originalData);
            setErrors({});
            toast.info("Form reset to original values");
        }
    };

    // Check if form has changes
    const hasChanges = originalData && JSON.stringify(formData) !== JSON.stringify(originalData);

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

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg border border-border/50 p-6">
                <div className="space-y-6">
                    <div className="border-b border-border/50 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
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
                                    <span className="text-sm font-medium">Edit Customer</span>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center gap-3">
                            <Edit className="w-6 h-6 text-primary" />
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
                                <span className="text-sm font-medium">Edit Customer</span>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Customer List Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Edit className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Edit Customer</h1>
                                <p className="text-sm text-muted-foreground">
                                    Customer ID: #{customerId} • {getStatusBadge(formData.status || 'Active')}
                                    {hasChanges && <span className="ml-2 text-orange-600">• Unsaved changes</span>}
                                </p>
                            </div>
                        </div>
                        <Link href="/customer/customer-list">
                            <Button className="h-10 px-6 rounded-full shadow-md flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Customer List
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-lg border border-border/50">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Customer Info Header */}
                            <div className="border-b border-border/50 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-medium text-foreground">Customer Information</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Member since: {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Status:</span>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => handleChange("status", e.target.value)}
                                            className="px-3 py-1 text-sm border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
                                            disabled={isSubmitting}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                            <option value="Blocked">Blocked</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* First Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                                            First Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="firstName"
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => handleChange("firstName", e.target.value)}
                                            placeholder="Enter first name"
                                            className={`h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm ${errors.firstName ? "border-red-500" : ""}`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.firstName && (
                                            <p className="text-sm text-red-500">{errors.firstName}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                            Email <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                            placeholder="Enter email address"
                                            className={`h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm ${errors.email ? "border-red-500" : ""}`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-500">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="space-y-2">
                                        <Label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
                                            Date of Birth <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                                            className={`h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm ${errors.dateOfBirth ? "border-red-500" : ""}`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.dateOfBirth && (
                                            <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
                                        )}
                                    </div>

                                    {/* Nationality */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-foreground">
                                            Nationality <span className="text-red-500">*</span>
                                        </Label>
                                        <RadioGroup
                                            value={formData.nationality}
                                            onValueChange={(value) => handleChange("nationality", value)}
                                            className="flex gap-6"
                                            disabled={isSubmitting}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="native" id="native" />
                                                <Label htmlFor="native" className="text-sm text-foreground cursor-pointer">
                                                    Native
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="foreigner" id="foreigner" />
                                                <Label htmlFor="foreigner" className="text-sm text-foreground cursor-pointer">
                                                    Foreigner
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="text-sm font-medium text-foreground">
                                            Address <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => handleChange("address", e.target.value)}
                                            placeholder="Enter full address"
                                            className={`min-h-[100px] rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm resize-none ${errors.address ? "border-red-500" : ""}`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.address && (
                                            <p className="text-sm text-red-500">{errors.address}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Last Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                                            Last Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="lastName"
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => handleChange("lastName", e.target.value)}
                                            placeholder="Enter last name"
                                            className={`h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm ${errors.lastName ? "border-red-500" : ""}`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.lastName && (
                                            <p className="text-sm text-red-500">{errors.lastName}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                                            Phone <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleChange("phone", e.target.value)}
                                            placeholder="1234567890"
                                            className={`h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm ${errors.phone ? "border-red-500" : ""}`}
                                            disabled={isSubmitting}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Note: Please don't include + sign. Format: 1234567890
                                        </p>
                                        {errors.phone && (
                                            <p className="text-sm text-red-500">{errors.phone}</p>
                                        )}
                                    </div>

                                    {/* Profession */}
                                    <div className="space-y-2">
                                        <Label htmlFor="profession" className="text-sm font-medium text-foreground">
                                            Profession <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="profession"
                                            type="text"
                                            value={formData.profession}
                                            onChange={(e) => handleChange("profession", e.target.value)}
                                            placeholder="Enter profession"
                                            className={`h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm ${errors.profession ? "border-red-500" : ""}`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.profession && (
                                            <p className="text-sm text-red-500">{errors.profession}</p>
                                        )}
                                    </div>

                                    {/* National ID */}
                                    <div className="space-y-2">
                                        <Label htmlFor="nationalId" className="text-sm font-medium text-foreground">
                                            National ID <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="nationalId"
                                            type="text"
                                            value={formData.nationalId}
                                            onChange={(e) => handleChange("nationalId", e.target.value)}
                                            placeholder="Enter national ID number"
                                            className={`h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm ${errors.nationalId ? "border-red-500" : ""}`}
                                            disabled={isSubmitting}
                                        />
                                        {errors.nationalId && (
                                            <p className="text-sm text-red-500">{errors.nationalId}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleReset}
                                    disabled={isSubmitting || !hasChanges}
                                    className="h-10 px-6 rounded-full shadow-sm flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !hasChanges}
                                    className="h-10 px-8 rounded-full shadow-md flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Update Customer
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}