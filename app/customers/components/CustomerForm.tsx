"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertCircle,
    CheckCircle,
    CreditCard,
    Crown,
    Loader2,
    MapPin,
    Phone,
    User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomerFormData {
    title?: string;
    firstName: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string;
    anniversary?: string;
    nationality: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    countryCode?: string;
    contactType?: string;
    occupation?: string;
    country?: string;
    state?: string;
    city?: string;
    zipcode?: string;
    address: string;
    identityType?: string;
    identityNumber: string;
    specialRequests?: string;
    notes?: string;
    isVip?: boolean;
    vipLevel?: string;
}

interface CustomerFormProps {
    initialData?: Partial<CustomerFormData>;
    isEdit?: boolean;
    customerId?: number;
}

export default function CustomerForm({ initialData = {}, isEdit = false, customerId }: CustomerFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [nicValidating, setNicValidating] = useState(false);
    const [nicStatus, setNicStatus] = useState<{
        exists: boolean;
        isValidFormat: boolean;
        customer?: any;
        suggestedData?: any;
    } | null>(null);

    const [formData, setFormData] = useState<CustomerFormData>({
        title: initialData.title || '',
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        gender: initialData.gender || '',
        dateOfBirth: initialData.dateOfBirth || '',
        anniversary: initialData.anniversary || '',
        nationality: initialData.nationality || 'native',
        email: initialData.email || '',
        phone: initialData.phone || '',
        alternatePhone: initialData.alternatePhone || '',
        countryCode: initialData.countryCode || '+94',
        contactType: initialData.contactType || 'Personal',
        occupation: initialData.occupation || '',
        country: initialData.country || 'Sri Lanka',
        state: initialData.state || '',
        city: initialData.city || '',
        zipcode: initialData.zipcode || '',
        address: initialData.address || '',
        identityType: initialData.identityType || 'NIC',
        identityNumber: initialData.identityNumber || '',
        specialRequests: initialData.specialRequests || '',
        notes: initialData.notes || '',
        isVip: initialData.isVip || false,
        vipLevel: initialData.vipLevel || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validate NIC when it changes
    useEffect(() => {
        if (formData.identityNumber.length >= 10 && !isEdit) {
            validateNIC();
        }
    }, [formData.identityNumber]);

    const validateNIC = async () => {
        if (!formData.identityNumber || isEdit) return;

        setNicValidating(true);
        try {
            const response = await fetch('/api/customers/validate-nic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identityNumber: formData.identityNumber })
            });

            const data = await response.json();
            setNicStatus(data);

            if (data.exists) {
                setErrors(prev => ({
                    ...prev,
                    identityNumber: 'Customer with this NIC already exists'
                }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.identityNumber;
                    return newErrors;
                });

                // Auto-fill suggested data
                if (data.suggestedData) {
                    setFormData(prev => ({
                        ...prev,
                        gender: data.suggestedData.gender,
                        dateOfBirth: data.suggestedData.dateOfBirth,
                        nationality: data.suggestedData.nationality
                    }));
                }
            }
        } catch (error) {
            console.error('NIC validation error:', error);
        } finally {
            setNicValidating(false);
        }
    };

    const handleInputChange = (field: keyof CustomerFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.identityNumber.trim()) newErrors.identityNumber = 'Identity number is required';
        if (!formData.nationality) newErrors.nationality = 'Nationality is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone validation
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        if (nicStatus?.exists && !isEdit) {
            toast.error('Customer with this NIC already exists');
            return;
        }

        setLoading(true);
        try {
            const url = isEdit ? `/api/customers/${customerId}` : '/api/customers';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save customer');
            }

            toast.success(isEdit ? 'Customer updated successfully!' : 'Customer created successfully!');
            router.push('/customers');
        } catch (error: any) {
            toast.error(error.message || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <User className="w-5 h-5 mr-2" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Select value={formData.title} onValueChange={(value) => handleInputChange('title', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select title" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Mr">Mr</SelectItem>
                                    <SelectItem value="Mrs">Mrs</SelectItem>
                                    <SelectItem value="Miss">Miss</SelectItem>
                                    <SelectItem value="Ms">Ms</SelectItem>
                                    <SelectItem value="Dr">Dr</SelectItem>
                                    <SelectItem value="Prof">Prof</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                className={errors.firstName ? 'border-red-500' : ''}
                                placeholder="Enter first name"
                            />
                            {errors.firstName && (
                                <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                placeholder="Enter last name"
                            />
                        </div>

                        <div>
                            <Label htmlFor="gender">Gender *</Label>
                            <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.gender && (
                                <p className="text-sm text-red-500 mt-1">{errors.gender}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                            <Input
                                id="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                className={errors.dateOfBirth ? 'border-red-500' : ''}
                            />
                            {errors.dateOfBirth && (
                                <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="anniversary">Anniversary</Label>
                            <Input
                                id="anniversary"
                                type="date"
                                value={formData.anniversary}
                                onChange={(e) => handleInputChange('anniversary', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="nationality">Nationality *</Label>
                            <Select value={formData.nationality} onValueChange={(value) => handleInputChange('nationality', value)}>
                                <SelectTrigger className={errors.nationality ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select nationality" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="native">🇱🇰 Sri Lankan (Local)</SelectItem>
                                    <SelectItem value="foreigner">🌍 Foreign</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.nationality && (
                                <p className="text-sm text-red-500 mt-1">{errors.nationality}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                            id="occupation"
                            value={formData.occupation}
                            onChange={(e) => handleInputChange('occupation', e.target.value)}
                            placeholder="Enter occupation"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <Phone className="w-5 h-5 mr-2" />
                        Contact Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={errors.email ? 'border-red-500' : ''}
                                placeholder="Enter email address"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className={errors.phone ? 'border-red-500' : ''}
                                placeholder="Enter phone number"
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="alternatePhone">Alternate Phone</Label>
                            <Input
                                id="alternatePhone"
                                value={formData.alternatePhone}
                                onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                                placeholder="Enter alternate phone"
                            />
                        </div>

                        <div>
                            <Label htmlFor="countryCode">Country Code</Label>
                            <Input
                                id="countryCode"
                                value={formData.countryCode}
                                onChange={(e) => handleInputChange('countryCode', e.target.value)}
                                placeholder="+94"
                            />
                        </div>

                        <div>
                            <Label htmlFor="contactType">Contact Type</Label>
                            <Select value={formData.contactType} onValueChange={(value) => handleInputChange('contactType', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Personal">Personal</SelectItem>
                                    <SelectItem value="Business">Business</SelectItem>
                                    <SelectItem value="Emergency">Emergency</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <MapPin className="w-5 h-5 mr-2" />
                        Address Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                value={formData.country}
                                onChange={(e) => handleInputChange('country', e.target.value)}
                                placeholder="Enter country"
                            />
                        </div>

                        <div>
                            <Label htmlFor="state">State/Province</Label>
                            <Input
                                id="state"
                                value={formData.state}
                                onChange={(e) => handleInputChange('state', e.target.value)}
                                placeholder="Enter state"
                            />
                        </div>

                        <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                placeholder="Enter city"
                            />
                        </div>

                        <div>
                            <Label htmlFor="zipcode">Zip Code</Label>
                            <Input
                                id="zipcode"
                                value={formData.zipcode}
                                onChange={(e) => handleInputChange('zipcode', e.target.value)}
                                placeholder="Enter zip code"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="address">Full Address *</Label>
                        <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            className={errors.address ? 'border-red-500' : ''}
                            placeholder="Enter full address"
                            rows={3}
                        />
                        {errors.address && (
                            <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Identity Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Identity Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="identityType">Identity Type</Label>
                            <Select value={formData.identityType} onValueChange={(value) => handleInputChange('identityType', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select ID type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NIC">National Identity Card (NIC)</SelectItem>
                                    <SelectItem value="Passport">Passport</SelectItem>
                                    <SelectItem value="Driver's License">Driver's License</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="identityNumber">Identity Number * (NIC for quick search)</Label>
                            <div className="relative">
                                <Input
                                    id="identityNumber"
                                    value={formData.identityNumber}
                                    onChange={(e) => handleInputChange('identityNumber', e.target.value)}
                                    className={errors.identityNumber ? 'border-red-500' : ''}
                                    placeholder="Enter NIC or ID number"
                                />
                                {nicValidating && (
                                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                                )}
                                {nicStatus && !nicValidating && (
                                    <div className="absolute right-3 top-3">
                                        {nicStatus.exists ? (
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                        ) : nicStatus.isValidFormat ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                            {errors.identityNumber && (
                                <p className="text-sm text-red-500 mt-1">{errors.identityNumber}</p>
                            )}
                            {nicStatus?.exists && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-700">
                                        Customer already exists: <strong>{nicStatus.customer?.fullName}</strong>
                                    </p>
                                    <p className="text-xs text-red-600">
                                        Customer ID: {nicStatus.customer?.customerID}
                                    </p>
                                </div>
                            )}
                            {nicStatus && !nicStatus.exists && !nicStatus.isValidFormat && (
                                <p className="text-sm text-yellow-600 mt-1">
                                    Invalid NIC format. Please check the number.
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* VIP Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <Crown className="w-5 h-5 mr-2 text-purple-600" />
                        VIP Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={formData.isVip}
                            onCheckedChange={(checked) => handleInputChange('isVip', checked)}
                        />
                        <Label>Mark as VIP Customer</Label>
                        {formData.isVip && (
                            <Badge className="bg-purple-100 text-purple-800">
                                <Crown className="w-3 h-3 mr-1" />
                                VIP
                            </Badge>
                        )}
                    </div>

                    {formData.isVip && (
                        <div>
                            <Label htmlFor="vipLevel">VIP Level</Label>
                            <Select value={formData.vipLevel} onValueChange={(value) => handleInputChange('vipLevel', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select VIP level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Silver">Silver</SelectItem>
                                    <SelectItem value="Gold">Gold</SelectItem>
                                    <SelectItem value="Platinum">Platinum</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        Additional Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="specialRequests">Special Requests</Label>
                        <Textarea
                            id="specialRequests"
                            value={formData.specialRequests}
                            onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                            placeholder="Enter any special requests (dietary, accessibility, etc.)"
                            rows={2}
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Internal Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Enter any internal notes about the customer"
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Form Actions */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/customers')}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || (nicStatus?.exists && !isEdit)}
                            className="min-w-32"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isEdit ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    {isEdit ? 'Update Customer' : 'Create Customer'}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}