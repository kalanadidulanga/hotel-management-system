"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Building,
    ArrowLeft,
    Save,
    Plus,
    DollarSign,
    Users,
    Bed,
    Clock,
    Star,
    Wifi,
    Car,
    Coffee,
    Tv,
    Wind,
    Bath,
    Shield,
    X,
    AlertCircle,
    CheckCircle,
    ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CreateRoomClassData {
    name: string;
    description: string;
    ratePerNight: number;
    rateDayUse: number;
    hourlyRate: number;
    extraPersonCharge: number;
    childCharge: number;
    maxOccupancy: number;
    standardOccupancy: number;
    roomSize: string;
    bedConfiguration: string;
    cleaningFrequencyDays: number;
    amenities: string[];
    specialFeatures: string;
    isActive: boolean;
}

const COMMON_AMENITIES = [
    { name: 'Free Wi-Fi', icon: Wifi },
    { name: 'Air Conditioning', icon: Wind },
    { name: 'Private Bathroom', icon: Bath },
    { name: 'Flat-screen TV', icon: Tv },
    { name: 'Coffee/Tea Maker', icon: Coffee },
    { name: 'Parking', icon: Car },
    { name: 'Room Service', icon: Star },
    { name: 'Safe Deposit Box', icon: Shield },
];

const BED_CONFIGURATIONS = [
    'Single Bed',
    'Double Bed',
    'Queen Bed',
    'King Bed',
    'Twin Beds',
    '2 Single Beds',
    '1 King + 1 Single',
    'Sofa Bed',
    'Bunk Bed',
];

export default function CreateRoomClassPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateRoomClassData>({
        name: '',
        description: '',
        ratePerNight: 0,
        rateDayUse: 0,
        hourlyRate: 0,
        extraPersonCharge: 0,
        childCharge: 0,
        maxOccupancy: 2,
        standardOccupancy: 2,
        roomSize: '',
        bedConfiguration: '',
        cleaningFrequencyDays: 1,
        amenities: [],
        specialFeatures: '',
        isActive: true,
    });

    const [customAmenity, setCustomAmenity] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    const handleInputChange = (field: keyof CreateRoomClassData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleAmenityToggle = (amenity: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const addCustomAmenity = () => {
        if (customAmenity.trim() && !formData.amenities.includes(customAmenity.trim())) {
            setFormData(prev => ({
                ...prev,
                amenities: [...prev.amenities, customAmenity.trim()]
            }));
            setCustomAmenity('');
        }
    };

    const removeAmenity = (amenity: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.filter(a => a !== amenity)
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Room class name is required';
        }

        if (formData.ratePerNight <= 0) {
            newErrors.ratePerNight = 'Night rate must be greater than 0';
        }

        if (formData.rateDayUse <= 0) {
            newErrors.rateDayUse = 'Day rate must be greater than 0';
        }

        if (formData.maxOccupancy <= 0) {
            newErrors.maxOccupancy = 'Max occupancy must be greater than 0';
        }

        if (formData.standardOccupancy <= 0) {
            newErrors.standardOccupancy = 'Standard occupancy must be greater than 0';
        }

        if (formData.standardOccupancy > formData.maxOccupancy) {
            newErrors.standardOccupancy = 'Standard occupancy cannot exceed max occupancy';
        }

        if (formData.cleaningFrequencyDays <= 0) {
            newErrors.cleaningFrequencyDays = 'Cleaning frequency must be at least 1 day';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the form errors before submitting');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/classes/new`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    amenities: JSON.stringify(formData.amenities), // Convert array to JSON string
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create room class');
            }

            const data = await response.json();
            toast.success(`Room class "${formData.name}" created successfully!`);

            // Redirect to room classes list or to the new room class detail page
            router.push(`/rooms/settings/classes/${data.roomClass.id}`);

        } catch (error) {
            // console.error('Create error:', error);
            toast.error('Failed to create room class: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/rooms/settings/classes">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Classes
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Building className="w-8 h-8 text-purple-600 mr-3" />
                            Create Room Class
                            <Badge variant="outline" className="ml-3 text-xs">
                                New
                            </Badge>
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Define a new room type with pricing, capacity, and amenities
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Building className="w-5 h-5 mr-2" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Room Class Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Deluxe Room, Luxury Suite"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="roomSize">Room Size</Label>
                                <Input
                                    id="roomSize"
                                    placeholder="e.g., 25 sqm, 350 sq ft"
                                    value={formData.roomSize}
                                    onChange={(e) => handleInputChange('roomSize', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the room class features, view, and unique selling points..."
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                            />
                            <Label htmlFor="isActive">Active (available for bookings)</Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <DollarSign className="w-5 h-5 mr-2" />
                            Pricing Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ratePerNight">Night Rate (LKR) *</Label>
                                <Input
                                    id="ratePerNight"
                                    type="number"
                                    min="0"
                                    step="100"
                                    placeholder="5000"
                                    value={formData.ratePerNight || ''}
                                    onChange={(e) => handleInputChange('ratePerNight', parseFloat(e.target.value) || 0)}
                                    className={errors.ratePerNight ? 'border-red-500' : ''}
                                />
                                {errors.ratePerNight && (
                                    <p className="text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.ratePerNight}
                                    </p>
                                )}
                                {formData.ratePerNight > 0 && (
                                    <p className="text-sm text-green-600">
                                        {formatCurrency(formData.ratePerNight)} per night
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rateDayUse">Day Use Rate (LKR) *</Label>
                                <Input
                                    id="rateDayUse"
                                    type="number"
                                    min="0"
                                    step="100"
                                    placeholder="3000"
                                    value={formData.rateDayUse || ''}
                                    onChange={(e) => handleInputChange('rateDayUse', parseFloat(e.target.value) || 0)}
                                    className={errors.rateDayUse ? 'border-red-500' : ''}
                                />
                                {errors.rateDayUse && (
                                    <p className="text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.rateDayUse}
                                    </p>
                                )}
                                {formData.rateDayUse > 0 && (
                                    <p className="text-sm text-green-600">
                                        {formatCurrency(formData.rateDayUse)} per day
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hourlyRate">Hourly Rate (LKR)</Label>
                                <Input
                                    id="hourlyRate"
                                    type="number"
                                    min="0"
                                    step="50"
                                    placeholder="500"
                                    value={formData.hourlyRate || ''}
                                    onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="extraPersonCharge">Extra Person Charge (LKR)</Label>
                                <Input
                                    id="extraPersonCharge"
                                    type="number"
                                    min="0"
                                    step="100"
                                    placeholder="1000"
                                    value={formData.extraPersonCharge || ''}
                                    onChange={(e) => handleInputChange('extraPersonCharge', parseFloat(e.target.value) || 0)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="childCharge">Child Charge (LKR)</Label>
                                <Input
                                    id="childCharge"
                                    type="number"
                                    min="0"
                                    step="100"
                                    placeholder="500"
                                    value={formData.childCharge || ''}
                                    onChange={(e) => handleInputChange('childCharge', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Occupancy & Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Users className="w-5 h-5 mr-2" />
                            Occupancy & Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="standardOccupancy">Standard Occupancy *</Label>
                                <Input
                                    id="standardOccupancy"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.standardOccupancy}
                                    onChange={(e) => handleInputChange('standardOccupancy', parseInt(e.target.value) || 1)}
                                    className={errors.standardOccupancy ? 'border-red-500' : ''}
                                />
                                {errors.standardOccupancy && (
                                    <p className="text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.standardOccupancy}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxOccupancy">Maximum Occupancy *</Label>
                                <Input
                                    id="maxOccupancy"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.maxOccupancy}
                                    onChange={(e) => handleInputChange('maxOccupancy', parseInt(e.target.value) || 1)}
                                    className={errors.maxOccupancy ? 'border-red-500' : ''}
                                />
                                {errors.maxOccupancy && (
                                    <p className="text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.maxOccupancy}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cleaningFrequencyDays">Cleaning Frequency (Days) *</Label>
                                <Input
                                    id="cleaningFrequencyDays"
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={formData.cleaningFrequencyDays}
                                    onChange={(e) => handleInputChange('cleaningFrequencyDays', parseInt(e.target.value) || 1)}
                                    className={errors.cleaningFrequencyDays ? 'border-red-500' : ''}
                                />
                                {errors.cleaningFrequencyDays && (
                                    <p className="text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.cleaningFrequencyDays}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bedConfiguration">Bed Configuration</Label>
                            <Select
                                value={formData.bedConfiguration}
                                onValueChange={(value) => handleInputChange('bedConfiguration', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select bed configuration" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BED_CONFIGURATIONS.map((bed) => (
                                        <SelectItem key={bed} value={bed}>{bed}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Amenities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Star className="w-5 h-5 mr-2" />
                            Amenities & Features
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-3 block">
                                Select Amenities:
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {COMMON_AMENITIES.map(({ name, icon: Icon }) => (
                                    <div
                                        key={name}
                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.amenities.includes(name)
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleAmenityToggle(name)}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        <span className="text-sm">{name}</span>
                                        {formData.amenities.includes(name) && (
                                            <CheckCircle className="w-4 h-4 ml-auto text-purple-600" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom Amenity Input */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Add Custom Amenity:</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter custom amenity..."
                                    value={customAmenity}
                                    onChange={(e) => setCustomAmenity(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addCustomAmenity}
                                    disabled={!customAmenity.trim()}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Selected Amenities Display */}
                        {formData.amenities.length > 0 && (
                            <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Selected Amenities ({formData.amenities.length}):
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {formData.amenities.map((amenity) => (
                                        <Badge
                                            key={amenity}
                                            variant="secondary"
                                            className="flex items-center gap-1 px-2 py-1"
                                        >
                                            {amenity}
                                            <button
                                                type="button"
                                                onClick={() => removeAmenity(amenity)}
                                                className="ml-1 hover:text-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="specialFeatures">Special Features</Label>
                            <Textarea
                                id="specialFeatures"
                                placeholder="Describe any special features, views, or unique characteristics..."
                                value={formData.specialFeatures}
                                onChange={(e) => handleInputChange('specialFeatures', e.target.value)}
                                rows={2}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                * Required fields must be completed before saving
                            </div>
                            <div className="flex space-x-3">
                                <Link href="/rooms/settings/classes">
                                    <Button variant="outline" disabled={loading}>
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    {loading ? 'Creating...' : 'Create Room Class'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}