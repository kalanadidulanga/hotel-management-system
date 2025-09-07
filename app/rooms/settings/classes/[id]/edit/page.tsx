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
    ArrowLeft,
    Bath,
    Building,
    Car,
    CheckCircle,
    Coffee,
    DollarSign,
    Edit,
    Home,
    Loader2,
    Plus,
    Save,
    Shield,
    Star,
    Tv,
    Users,
    Wifi,
    Wind,
    X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditRoomClassData {
    id: number;
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
    _count: {
        rooms: number;
        reservations: number;
        roomImages: number;
        roomOffers: number;
        complementaryItems: number;
    };
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

export default function EditRoomClassPage() {
    const router = useRouter();
    const params = useParams();
    const roomClassId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<EditRoomClassData | null>(null);
    const [customAmenity, setCustomAmenity] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    useEffect(() => {
        if (roomClassId) {
            fetchRoomClass();
        }
    }, [roomClassId]);

    const fetchRoomClass = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/classes/${roomClassId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error('Room class not found');
                    router.push('/rooms/settings/classes');
                    return;
                }
                throw new Error('Failed to fetch room class');
            }

            const data = await response.json();
            const roomClass = data.roomClass;

            // Parse amenities from JSON string to array
            let amenitiesArray: string[] = [];
            if (roomClass.amenities) {
                try {
                    amenitiesArray = JSON.parse(roomClass.amenities);
                } catch {
                    amenitiesArray = [];
                }
            }

            setFormData({
                ...roomClass,
                amenities: amenitiesArray,
                description: roomClass.description || '',
                roomSize: roomClass.roomSize || '',
                bedConfiguration: roomClass.bedConfiguration || '',
                specialFeatures: roomClass.specialFeatures || '',
                hourlyRate: roomClass.hourlyRate || 0,
                extraPersonCharge: roomClass.extraPersonCharge || 0,
                childCharge: roomClass.childCharge || 0,
            });

        } catch (error) {
            // console.error('Error fetching room class:', error);
            toast.error('Failed to load room class data');
            router.push('/rooms/settings/classes');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof EditRoomClassData, value: any) => {
        if (!formData) return;

        setFormData(prev => prev ? ({
            ...prev,
            [field]: value
        }) : null);

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleAmenityToggle = (amenity: string) => {
        if (!formData) return;

        setFormData(prev => prev ? ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }) : null);
    };

    const addCustomAmenity = () => {
        if (!formData) return;

        if (customAmenity.trim() && !formData.amenities.includes(customAmenity.trim())) {
            setFormData(prev => prev ? ({
                ...prev,
                amenities: [...prev.amenities, customAmenity.trim()]
            }) : null);
            setCustomAmenity('');
        }
    };

    const removeAmenity = (amenity: string) => {
        if (!formData) return;

        setFormData(prev => prev ? ({
            ...prev,
            amenities: prev.amenities.filter(a => a !== amenity)
        }) : null);
    };

    const validateForm = (): boolean => {
        if (!formData) return false;

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

        if (!formData || !validateForm()) {
            toast.error('Please fix the form errors before submitting');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/settings/classes/${roomClassId}/edit`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description?.trim() || null,
                    ratePerNight: formData.ratePerNight,
                    rateDayUse: formData.rateDayUse,
                    hourlyRate: formData.hourlyRate || null,
                    extraPersonCharge: formData.extraPersonCharge || 0,
                    childCharge: formData.childCharge || 0,
                    maxOccupancy: formData.maxOccupancy,
                    standardOccupancy: formData.standardOccupancy,
                    roomSize: formData.roomSize?.trim() || null,
                    bedConfiguration: formData.bedConfiguration?.trim() || null,
                    cleaningFrequencyDays: formData.cleaningFrequencyDays,
                    amenities: JSON.stringify(formData.amenities), // Convert array to JSON string
                    specialFeatures: formData.specialFeatures?.trim() || null,
                    isActive: formData.isActive,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update room class');
            }

            const data = await response.json();
            toast.success(`Room class "${formData.name}" updated successfully!`);

            // Redirect to room class detail page or list
            router.push(`/rooms/settings/classes/${roomClassId}`);

        } catch (error) {
            // console.error('Update error:', error);
            toast.error('Failed to update room class: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading room class...</p>
                </div>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Room Class Not Found</h3>
                    <p className="text-gray-600 mb-4">The room class you're looking for doesn't exist.</p>
                    <Link href="/rooms/settings/classes">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Classes
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

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
                            <Edit className="w-8 h-8 text-blue-600 mr-3" />
                            Edit Room Class
                            <Badge variant="outline" className="ml-3 text-xs">
                                {formData.name}
                            </Badge>
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Update room type configuration, pricing, and amenities
                        </p>
                    </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                            <Home className="w-4 h-4 mr-1" />
                            {formData._count.rooms} rooms
                        </span>
                        <span>{formData._count.reservations} bookings</span>
                    </div>
                </div>
            </div>

            {/* Warning for Active Rooms */}
            {formData._count.rooms > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-orange-900">Active Room Class</h4>
                                <p className="text-sm text-orange-700 mt-1">
                                    This room class has {formData._count.rooms} active room(s) and {formData._count.reservations} booking(s).
                                    Changes to pricing will affect future reservations only.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                            {!formData.isActive && (
                                <Badge variant="secondary" className="ml-2">Inactive</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <DollarSign className="w-5 h-5 mr-2" />
                            Pricing Configuration
                            {formData._count.reservations > 0 && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                    Has Active Bookings
                                </Badge>
                            )}
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
                                * Changes will be saved immediately and affect future bookings
                            </div>
                            <div className="flex space-x-3">
                                <Link href="/rooms/settings/classes">
                                    <Button variant="outline" disabled={saving}>
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={saving}>
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}