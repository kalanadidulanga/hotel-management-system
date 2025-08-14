"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Home,
    Users,
    UserCheck,
    RotateCcw,
    Save
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface CustomerFormData {
    firstName: string;
    lastName?: string;
    gender: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    occupation?: string;
    nationality: "native" | "foreigner";
    identityNumber?: string;
    address: string;
    contactType?: string;
    identityType?: string;
}

export default function EditCustomerPage() {
    const params = useParams();
    const customerId = params.id as string;

    const [formData, setFormData] = useState<CustomerFormData>({
        firstName: "",
        lastName: "",
        gender: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        occupation: "",
        nationality: "native",
        identityNumber: "",
        address: "",
        contactType: "",
        identityType: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch customer data
    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await fetch(`/api/customer/customer-list/${customerId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch customer data");
                }

                const customer = await response.json();

                // Format date for input (YYYY-MM-DD)
                const formatDate = (dateString: string) => {
                    if (!dateString) return "";
                    const date = new Date(dateString);
                    return date.toISOString().split('T')[0];
                };

                setFormData({
                    firstName: customer.firstName || "",
                    lastName: customer.lastName || "",
                    gender: customer.gender || "",
                    email: customer.email || "",
                    phone: customer.phone || "",
                    dateOfBirth: formatDate(customer.dateOfBirth),
                    occupation: customer.occupation || "",
                    nationality: customer.nationality || "native",
                    identityNumber: customer.identityNumber || "",
                    address: customer.address || "",
                    contactType: customer.contactType || "",
                    identityType: customer.identityType || "",
                });
            } catch (error) {
                console.error("Error fetching customer:", error);
                toast.error("Failed to load customer data");
            } finally {
                setIsLoadingData(false);
            }
        };

        if (customerId) {
            fetchCustomer();
        }
    }, [customerId]);

    // Handle form field changes
    const handleChange = (field: keyof CustomerFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field as string]) {
            setErrors(prev => ({ ...prev, [field as string]: "" }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }

        if (!formData.gender) {
            newErrors.gender = "Gender is required";
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

        if (!formData.nationality) {
            newErrors.nationality = "Nationality is required";
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

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/customer/customer-list/create`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: parseInt(customerId),
                    firstName: formData.firstName,
                    lastName: formData.lastName || null,
                    gender: formData.gender,
                    dateOfBirth: formData.dateOfBirth,
                    nationality: formData.nationality,
                    occupation: formData.occupation || null,
                    email: formData.email,
                    phone: formData.phone,
                    contactType: formData.contactType || null,
                    address: formData.address,
                    identityType: formData.identityType || null,
                    identityNumber: formData.identityNumber || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update customer");
            }

            toast.success("Customer updated successfully!");

        } catch (error) {
            console.error("Error updating customer:", error);
            toast.error((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    // Reset form to original data
    const handleReset = () => {
        // Refetch original data
        setIsLoadingData(true);
        const fetchCustomer = async () => {
            try {
                const response = await fetch(`/api/customer/customer-list/${customerId}`);
                if (response.ok) {
                    const customer = await response.json();
                    const formatDate = (dateString: string) => {
                        if (!dateString) return "";
                        const date = new Date(dateString);
                        return date.toISOString().split('T')[0];
                    };

                    setFormData({
                        firstName: customer.firstName || "",
                        lastName: customer.lastName || "",
                        gender: customer.gender || "",
                        email: customer.email || "",
                        phone: customer.phone || "",
                        dateOfBirth: formatDate(customer.dateOfBirth),
                        occupation: customer.occupation || "",
                        nationality: customer.nationality || "native",
                        identityNumber: customer.identityNumber || "",
                        address: customer.address || "",
                        contactType: customer.contactType || "",
                        identityType: customer.identityType || "",
                    });
                }
            } catch (error) {
                console.error("Error resetting form:", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchCustomer();
        setErrors({});
    };

    if (isLoadingData) {
        return (
            <div className="flex flex-col h-full bg-white relative">
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    <span className="ml-2 text-muted-foreground">Loading customer data...</span>
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
                                <BreadcrumbLink href={`/customer/edit/${customerId}`} className="text-sm font-medium">
                                    Edit Customer
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    {/* Title & Customer List Button */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <UserCheck className="w-6 h-6 text-primary" />
                            <h1 className="text-xl font-semibold text-foreground">Edit Customer</h1>
                        </div>
                        <Button
                            onClick={() => window.location.href = "/customer/customer-list"}
                            className="h-10 px-6 rounded-full shadow-md flex items-center gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Customer List
                        </Button>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-lg border border-border/50">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Three Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* First Column */}
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
                                        />
                                        {errors.firstName && (
                                            <p className="text-sm text-red-500">{errors.firstName}</p>
                                        )}
                                    </div>

                                    {/* Gender */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-foreground">
                                            Gender <span className="text-red-500">*</span>
                                        </Label>
                                        <RadioGroup
                                            value={formData.gender}
                                            onValueChange={(value) => handleChange("gender", value)}
                                            className="flex gap-6"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="male" id="male" />
                                                <Label htmlFor="male" className="text-sm text-foreground cursor-pointer">
                                                    Male
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="female" id="female" />
                                                <Label htmlFor="female" className="text-sm text-foreground cursor-pointer">
                                                    Female
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                        {errors.gender && (
                                            <p className="text-sm text-red-500">{errors.gender}</p>
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
                                            onValueChange={(value) => handleChange("nationality", value as "native" | "foreigner")}
                                            className="flex gap-6"
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
                                        {errors.nationality && (
                                            <p className="text-sm text-red-500">{errors.nationality}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Second Column */}
                                <div className="space-y-6">
                                    {/* Last Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                                            Last Name
                                        </Label>
                                        <Input
                                            id="lastName"
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => handleChange("lastName", e.target.value)}
                                            placeholder="Enter last name"
                                            className="h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
                                        />
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
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-500">{errors.email}</p>
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
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-red-500">{errors.phone}</p>
                                        )}
                                    </div>

                                    {/* Occupation */}
                                    <div className="space-y-2">
                                        <Label htmlFor="occupation" className="text-sm font-medium text-foreground">
                                            Occupation
                                        </Label>
                                        <Input
                                            id="occupation"
                                            type="text"
                                            value={formData.occupation}
                                            onChange={(e) => handleChange("occupation", e.target.value)}
                                            placeholder="Enter occupation"
                                            className="h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Third Column */}
                                <div className="space-y-6">
                                    {/* Contact Type */}
                                    <div className="space-y-2">
                                        <Label htmlFor="contactType" className="text-sm font-medium text-foreground">
                                            Contact Type
                                        </Label>
                                        <Select value={formData.contactType} onValueChange={(value) => handleChange("contactType", value)}>
                                            <SelectTrigger className="h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Personal">Personal</SelectItem>
                                                <SelectItem value="Business">Business</SelectItem>
                                                <SelectItem value="Emergency">Emergency</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Identity Type & Number */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="identityType" className="text-sm font-medium text-foreground">
                                                Identity Type
                                            </Label>
                                            <Select value={formData.identityType} onValueChange={(value) => handleChange("identityType", value)}>
                                                <SelectTrigger className="h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="National ID">National ID</SelectItem>
                                                    <SelectItem value="Passport">Passport</SelectItem>
                                                    <SelectItem value="Driver License">Driver License</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="identityNumber" className="text-sm font-medium text-foreground">
                                                Identity Number
                                            </Label>
                                            <Input
                                                id="identityNumber"
                                                type="text"
                                                value={formData.identityNumber}
                                                onChange={(e) => handleChange("identityNumber", e.target.value)}
                                                placeholder="Enter ID number"
                                                className="h-10 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
                                            />
                                        </div>
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
                                        />
                                        {errors.address && (
                                            <p className="text-sm text-red-500">{errors.address}</p>
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
                                    className="h-10 px-6 rounded-full shadow-sm flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="h-10 px-8 rounded-full shadow-md flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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