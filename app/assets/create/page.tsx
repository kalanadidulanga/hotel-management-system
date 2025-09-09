"use client";

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
import { Textarea } from "@/components/ui/textarea";
import {
    AlertCircle,
    Calendar,
    FileIcon,
    FileText,
    ImageIcon,
    Package,
    Save,
    Upload,
    Utensils,
    X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Category {
    id: number;
    name: string;
    assetType: string;
    description: string | null;
}

interface Staff {
    id: number;
    name: string;
    fullName: string | null;
    department: string | null;
    staffClass: string | null;
    isDedicated: boolean;
}

interface FormData {
    categories: Category[];
    staff: Staff[];
}

export default function CreateAssetPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormData | null>(null);

    // Form state - Removed assetId and code
    const [assetType, setAssetType] = useState<'FIXED_ASSET' | 'UTENSIL'>('FIXED_ASSET');
    const [formValues, setFormValues] = useState({
        name: '',
        description: '',
        categoryId: 'none',
        purchasePrice: '',
        purchaseDate: '',
        supplier: '',
        warrantyPeriod: '',
        quantity: '1',
        unit: '',
        location: '',
        serialNumber: '',
        model: '',
        brand: '',
        condition: 'Good',
        maintenanceDate: '',
        maintenanceInterval: '365',
        assignedToId: 'none',
    });

    // File states
    const [assetImage, setAssetImage] = useState<File | null>(null);
    const [assetDocument, setAssetDocument] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch form data on component mount
    useEffect(() => {
        fetchFormData();
    }, []);

    const fetchFormData = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/form-data`);
            if (!response.ok) throw new Error("Failed to fetch form data");

            const data = await response.json();
            setFormData(data);
        } catch (error) {
            console.error("Error fetching form data:", error);
            toast.error("Failed to load form data");
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormValues(prev => ({
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAssetImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAssetDocument(file);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Required fields - Removed assetId and code validation
        if (!formValues.name.trim()) newErrors.name = 'Asset name is required';
        if (!formValues.purchasePrice) newErrors.purchasePrice = 'Purchase price is required';
        if (!formValues.purchaseDate) newErrors.purchaseDate = 'Purchase date is required';
        if (!formValues.maintenanceDate) newErrors.maintenanceDate = 'Maintenance date is required';

        // Validate numeric fields
        if (formValues.purchasePrice && isNaN(Number(formValues.purchasePrice))) {
            newErrors.purchasePrice = 'Purchase price must be a valid number';
        }

        if (formValues.quantity && isNaN(Number(formValues.quantity))) {
            newErrors.quantity = 'Quantity must be a valid number';
        }

        // Validate dates
        if (formValues.purchaseDate) {
            const purchaseDate = new Date(formValues.purchaseDate);
            const today = new Date();
            if (purchaseDate > today) {
                newErrors.purchaseDate = 'Purchase date cannot be in the future';
            }
        }

        if (formValues.maintenanceDate && formValues.purchaseDate) {
            const maintenanceDate = new Date(formValues.maintenanceDate);
            const purchaseDate = new Date(formValues.purchaseDate);
            if (maintenanceDate <= purchaseDate) {
                newErrors.maintenanceDate = 'Maintenance date must be after purchase date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        setLoading(true);

        try {
            const submitFormData = new FormData();

            // Add form values
            Object.entries(formValues).forEach(([key, value]) => {
                submitFormData.append(key, value);
            });

            // Add asset type
            submitFormData.append('type', assetType);

            // Add files
            if (assetImage) {
                submitFormData.append('assetImage', assetImage);
            }
            if (assetDocument) {
                submitFormData.append('assetDocument', assetDocument);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/create`, {
                method: 'POST',
                body: submitFormData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create asset');
            }

            toast.success(`Asset created successfully! ID: ${data.asset.generatedAssetId}, Code: ${data.asset.generatedCode}`);
            router.push(`/assets/${data.asset.id}`);

        } catch (error) {
            console.error("Error creating asset:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create asset");
        } finally {
            setLoading(false);
        }
    };

    const calculateMaintenanceDate = (purchaseDate: string, interval: number) => {
        if (!purchaseDate) return '';

        const date = new Date(purchaseDate);
        date.setDate(date.getDate() + interval);
        return date.toISOString().split('T')[0];
    };

    const getFilteredCategories = () => {
        if (!formData) return [];
        return formData.categories.filter(cat => cat.assetType === assetType);
    };

    if (!formData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add New Asset</h1>
                    <p className="text-gray-600">Create a new fixed asset or utensil record</p>
                    <p className="text-sm text-blue-600 mt-1">
                        ✨ Asset ID and Code will be automatically generated by the system
                    </p>
                </div>
                <Link href="/assets/list">
                    <Button variant="outline">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Asset Type Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Asset Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${assetType === 'FIXED_ASSET'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => setAssetType('FIXED_ASSET')}
                            >
                                <div className="flex items-center space-x-3">
                                    <Package className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <h3 className="font-semibold">Fixed Asset</h3>
                                        <p className="text-sm text-gray-600">
                                            Furniture, equipment, machinery, etc.
                                        </p>
                                        <p className="text-xs text-blue-500 mt-1">
                                            ID Format: FURN-24XXXX
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${assetType === 'UTENSIL'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => setAssetType('UTENSIL')}
                            >
                                <div className="flex items-center space-x-3">
                                    <Utensils className="w-8 h-8 text-purple-600" />
                                    <div>
                                        <h3 className="font-semibold">Utensil</h3>
                                        <p className="text-sm text-gray-600">
                                            Kitchen items, cutlery, dishes, etc.
                                        </p>
                                        <p className="text-xs text-purple-500 mt-1">
                                            ID Format: UTIL-24XXXX
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Basic Information - Removed Asset ID and Code fields */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">
                                    Asset Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formValues.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder={assetType === 'FIXED_ASSET' ? 'e.g., Reception Desk' : 'e.g., Dinner Plates'}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formValues.categoryId}
                                    onValueChange={(value) => handleInputChange('categoryId', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No category</SelectItem>
                                        {getFilteredCategories().map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formValues.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Detailed description of the asset"
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Purchase Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            
                            Purchase Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="purchasePrice">
                                    Purchase Price LKR <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="purchasePrice"
                                    type="number"
                                    step="0.01"
                                    value={formValues.purchasePrice}
                                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                                    placeholder="0.00"
                                    className={errors.purchasePrice ? 'border-red-500' : ''}
                                />
                                {errors.purchasePrice && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.purchasePrice}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="purchaseDate">
                                    Purchase Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="purchaseDate"
                                    type="date"
                                    value={formValues.purchaseDate}
                                    onChange={(e) => {
                                        handleInputChange('purchaseDate', e.target.value);
                                        // Auto-calculate maintenance date
                                        if (e.target.value && formValues.maintenanceInterval) {
                                            const maintenanceDate = calculateMaintenanceDate(
                                                e.target.value,
                                                parseInt(formValues.maintenanceInterval)
                                            );
                                            handleInputChange('maintenanceDate', maintenanceDate);
                                        }
                                    }}
                                    className={errors.purchaseDate ? 'border-red-500' : ''}
                                />
                                {errors.purchaseDate && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.purchaseDate}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="supplier">Supplier</Label>
                                <Input
                                    id="supplier"
                                    value={formValues.supplier}
                                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                                    placeholder="Supplier name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="warrantyPeriod">Warranty Period (months)</Label>
                                <Input
                                    id="warrantyPeriod"
                                    type="number"
                                    value={formValues.warrantyPeriod}
                                    onChange={(e) => handleInputChange('warrantyPeriod', e.target.value)}
                                    placeholder="12"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Physical Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Package className="w-5 h-5 mr-2" />
                            Physical Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="quantity">
                                    Quantity <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={formValues.quantity}
                                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                                    placeholder={assetType === 'UTENSIL' ? '100' : '1'}
                                    className={errors.quantity ? 'border-red-500' : ''}
                                />
                                {errors.quantity && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.quantity}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="unit">Unit</Label>
                                <Input
                                    id="unit"
                                    value={formValues.unit}
                                    onChange={(e) => handleInputChange('unit', e.target.value)}
                                    placeholder={assetType === 'UTENSIL' ? 'pieces' : 'units'}
                                />
                            </div>

                            <div>
                                <Label htmlFor="condition">Condition</Label>
                                <Select
                                    value={formValues.condition}
                                    onValueChange={(value) => handleInputChange('condition', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Excellent">Excellent</SelectItem>
                                        <SelectItem value="Good">Good</SelectItem>
                                        <SelectItem value="Fair">Fair</SelectItem>
                                        <SelectItem value="Poor">Poor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formValues.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    placeholder="e.g., Reception, Kitchen, Room 101"
                                />
                            </div>

                            <div>
                                <Label htmlFor="serialNumber">Serial Number</Label>
                                <Input
                                    id="serialNumber"
                                    value={formValues.serialNumber}
                                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                                    placeholder="Manufacturer serial number"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="brand">Brand</Label>
                                <Input
                                    id="brand"
                                    value={formValues.brand}
                                    onChange={(e) => handleInputChange('brand', e.target.value)}
                                    placeholder="Brand name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="model">Model</Label>
                                <Input
                                    id="model"
                                    value={formValues.model}
                                    onChange={(e) => handleInputChange('model', e.target.value)}
                                    placeholder="Model number/name"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Maintenance Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Maintenance Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="maintenanceDate">
                                    Next Maintenance Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="maintenanceDate"
                                    type="date"
                                    value={formValues.maintenanceDate}
                                    onChange={(e) => handleInputChange('maintenanceDate', e.target.value)}
                                    className={errors.maintenanceDate ? 'border-red-500' : ''}
                                />
                                {errors.maintenanceDate && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.maintenanceDate}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="maintenanceInterval">Maintenance Interval (days)</Label>
                                <Input
                                    id="maintenanceInterval"
                                    type="number"
                                    value={formValues.maintenanceInterval}
                                    onChange={(e) => handleInputChange('maintenanceInterval', e.target.value)}
                                    placeholder="365"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="assignedTo">Assigned To</Label>
                            <Select
                                value={formValues.assignedToId}
                                onValueChange={(value) => handleInputChange('assignedToId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select staff member" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Not assigned</SelectItem>
                                    {formData.staff.map((staff) => (
                                        <SelectItem key={staff.id} value={staff.id.toString()}>
                                            {staff.fullName || staff.name}
                                            {staff.department && ` (${staff.department})`}
                                            {staff.isDedicated && ' 🔧'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* File Uploads */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Upload className="w-5 h-5 mr-2" />
                            Files & Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Asset Image Upload */}
                            <div>
                                <Label htmlFor="assetImage">Asset Image</Label>
                                <div className="mt-2">
                                    <Input
                                        id="assetImage"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="cursor-pointer"
                                    />
                                    {imagePreview && (
                                        <div className="mt-3">
                                            <div className="relative w-full h-32">
                                                <Image
                                                    src={imagePreview}
                                                    alt="Asset preview"
                                                    fill
                                                    className="object-cover rounded-lg border"
                                                    sizes="100vw"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {!imagePreview && (
                                        <div className="mt-3 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Upload asset image</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Document Upload */}
                            <div>
                                <Label htmlFor="assetDocument">Documents (Receipt, Manual, etc.)</Label>
                                <div className="mt-2">
                                    <Input
                                        id="assetDocument"
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={handleDocumentChange}
                                        className="cursor-pointer"
                                    />
                                    {assetDocument && (
                                        <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                                            <div className="flex items-center">
                                                <FileIcon className="w-5 h-5 text-blue-500 mr-2" />
                                                <span className="text-sm font-medium">{assetDocument.name}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {(assetDocument.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    )}
                                    {!assetDocument && (
                                        <div className="mt-3 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                            <FileIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Upload documents</p>
                                            <p className="text-xs text-gray-400 mt-1">PDF, DOC, or Image files</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-4 pt-4">
                    <Link href="/assets/list">
                        <Button type="button" variant="outline">
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Create Asset
                    </Button>
                </div>
            </form>
        </div>
    );
}