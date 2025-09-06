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
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    DollarSign,
    Edit,
    Eye,
    FileText,
    MapPin,
    Package,
    Save,
    Settings,
    Upload,
    User,
    Utensils,
    Wrench,
    X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Category {
    id: number;
    name: string;
    assetType: 'FIXED_ASSET' | 'UTENSIL';
    description: string | null;
}

interface Staff {
    id: number;
    name: string;
    fullName: string | null;
    department: 'MAINTENANCE' | 'HOUSEKEEPING' | 'KITCHEN' | 'RECEPTION' | 'SECURITY' | 'MANAGEMENT' | 'ACCOUNTING' | null;
    staffClass: 'TECHNICIAN' | 'SUPERVISOR' | 'MANAGER' | 'ASSISTANT' | 'SPECIALIST' | null;
    isDedicated: boolean;
}

interface Asset {
    id: number;
    assetId: string;
    code: string;
    name: string;
    description: string | null;
    type: 'FIXED_ASSET' | 'UTENSIL';
    status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DAMAGED' | 'OUT_OF_ORDER';
    condition: string | null;
    quantity: number;
    unit: string | null;
    purchasePrice: number;
    currentValue: number | null;
    depreciationRate: number | null;
    purchaseDate: string;
    supplier: string | null;
    warrantyPeriod: number | null;
    warrantyExpiry: string | null;
    location: string | null;
    serialNumber: string | null;
    model: string | null;
    brand: string | null;
    maintenanceDate: string;
    maintenanceInterval: number;
    maintenanceCost: number;
    imageUrl: string | null;
    documentUrl: string | null;
    assignedToId: number | null;
    category: {
        id: number;
        name: string;
        assetType: string;
    } | null;
    assignedTo: {
        id: number;
        name: string;
        fullName: string | null;
        department: string | null;
    } | null;
}

interface FormData {
    name: string;
    description: string;
    type: 'FIXED_ASSET' | 'UTENSIL';
    categoryId: string;
    purchasePrice: string;
    purchaseDate: string;
    supplier: string;
    warrantyPeriod: string;
    quantity: string;
    unit: string;
    location: string;
    serialNumber: string;
    model: string;
    brand: string;
    condition: string;
    status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DAMAGED' | 'OUT_OF_ORDER';
    maintenanceDate: string;
    maintenanceInterval: string;
    maintenanceCost: string;
    assignedToId: string;
    currentValue: string;
    depreciationRate: string;
    assetImage: File | null;
    assetDocument: File | null;
}

export default function EditAssetPage() {
    const router = useRouter();
    const params = useParams();
    const assetId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [asset, setAsset] = useState<Asset | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        description: "",
        type: "FIXED_ASSET",
        categoryId: "",
        purchasePrice: "",
        purchaseDate: "",
        supplier: "",
        warrantyPeriod: "",
        quantity: "1",
        unit: "",
        location: "",
        serialNumber: "",
        model: "",
        brand: "",
        condition: "",
        status: "ACTIVE",
        maintenanceDate: "",
        maintenanceInterval: "365",
        maintenanceCost: "0",
        assignedToId: "",
        currentValue: "",
        depreciationRate: "",
        assetImage: null,
        assetDocument: null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [documentPreview, setDocumentPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, [assetId]);

    const fetchInitialData = async () => {
        try {
            setInitialLoading(true);

            // Fetch form data and asset details
            const [formDataResponse, assetResponse] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/form-data`),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/${assetId}/edit`)
            ]);

            if (!formDataResponse.ok || !assetResponse.ok) {
                throw new Error("Failed to fetch data");
            }

            const formDataResult = await formDataResponse.json();
            const assetResult = await assetResponse.json();

            setCategories(formDataResult.categories);
            setStaff(formDataResult.staff);
            setAsset(assetResult);

            // Populate form with asset data
            setFormData({
                name: assetResult.name || "",
                description: assetResult.description || "",
                type: assetResult.type,
                categoryId: assetResult.category?.id?.toString() || "",
                purchasePrice: assetResult.purchasePrice?.toString() || "",
                purchaseDate: assetResult.purchaseDate ? new Date(assetResult.purchaseDate).toISOString().split('T')[0] : "",
                supplier: assetResult.supplier || "",
                warrantyPeriod: assetResult.warrantyPeriod?.toString() || "",
                quantity: assetResult.quantity?.toString() || "1",
                unit: assetResult.unit || "",
                location: assetResult.location || "",
                serialNumber: assetResult.serialNumber || "",
                model: assetResult.model || "",
                brand: assetResult.brand || "",
                condition: assetResult.condition || "",
                status: assetResult.status || "ACTIVE",
                maintenanceDate: assetResult.maintenanceDate ? new Date(assetResult.maintenanceDate).toISOString().split('T')[0] : "",
                maintenanceInterval: assetResult.maintenanceInterval?.toString() || "365",
                maintenanceCost: assetResult.maintenanceCost?.toString() || "0",
                assignedToId: assetResult.assignedTo?.id?.toString() || "",
                currentValue: assetResult.currentValue?.toString() || "",
                depreciationRate: assetResult.depreciationRate?.toString() || "",
                assetImage: null,
                assetDocument: null,
            });

            // Set existing images
            if (assetResult.imageUrl) {
                setImagePreview(assetResult.imageUrl);
            }
            if (assetResult.documentUrl) {
                setDocumentPreview(assetResult.documentUrl);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load asset data");
            router.push("/assets/list");
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (field: keyof FormData, value: string | File | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (field: 'assetImage' | 'assetDocument', file: File | null) => {
        setFormData(prev => ({ ...prev, [field]: file }));

        if (file && field === 'assetImage') {
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }

        if (file && field === 'assetDocument') {
            setDocumentPreview(file.name);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, assetImage: null }));
        setImagePreview(asset?.imageUrl || null);
    };

    const removeDocument = () => {
        setFormData(prev => ({ ...prev, assetDocument: null }));
        setDocumentPreview(asset?.documentUrl || null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.purchasePrice || !formData.purchaseDate || !formData.maintenanceDate) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setLoading(true);

            const submitData = new FormData();

            // Add all form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'assetImage' || key === 'assetDocument') {
                    if (value instanceof File) {
                        submitData.append(key, value);
                    }
                } else if (value !== null && value !== undefined) {
                    submitData.append(key, value.toString());
                }
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/${assetId}/edit`, {
                method: "PUT",
                body: submitData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to update asset");
            }

            toast.success("Asset updated successfully!");
            router.push(`/assets/${assetId}`);

        } catch (error) {
            console.error("Error updating asset:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update asset");
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(cat => cat.assetType === formData.type);

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Asset Not Found</h2>
                    <Link href="/assets/list">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Assets
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Link href={`/assets/${assetId}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Edit className="w-8 h-8 text-blue-600 mr-3" />
                            Edit Asset
                        </h1>
                        <div className="flex items-center space-x-4 mt-2">
                            <p className="text-lg font-semibold text-blue-600">{asset.assetId}</p>
                            <Badge variant="outline" className="font-mono">{asset.code}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Link href={`/assets/${assetId}`}>
                        <Button variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            View Asset
                        </Button>
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="name">Asset Name *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    placeholder="Enter asset name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="type">Asset Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: 'FIXED_ASSET' | 'UTENSIL') => {
                                        handleInputChange("type", value);
                                        handleInputChange("categoryId", ""); // Reset category when type changes
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FIXED_ASSET">
                                            <div className="flex items-center">
                                                <Package className="w-4 h-4 mr-2" />
                                                Fixed Asset
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="UTENSIL">
                                            <div className="flex items-center">
                                                <Utensils className="w-4 h-4 mr-2" />
                                                Utensil
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(value) => handleInputChange("categoryId", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Category</SelectItem>
                                        {filteredCategories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DAMAGED' | 'OUT_OF_ORDER') => handleInputChange("status", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                        <SelectItem value="RETIRED">Retired</SelectItem>
                                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                                        <SelectItem value="OUT_OF_ORDER">Out of Order</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                placeholder="Enter asset description"
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Purchase Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <DollarSign className="w-5 h-5 mr-2" />
                            Purchase & Financial Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="purchasePrice">Purchase Price *</Label>
                                <Input
                                    id="purchasePrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.purchasePrice}
                                    onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="currentValue">Current Value</Label>
                                <Input
                                    id="currentValue"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.currentValue}
                                    onChange={(e) => handleInputChange("currentValue", e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="depreciationRate">Depreciation Rate (%)</Label>
                                <Input
                                    id="depreciationRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formData.depreciationRate}
                                    onChange={(e) => handleInputChange("depreciationRate", e.target.value)}
                                    placeholder="10.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                                <Input
                                    id="purchaseDate"
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="supplier">Supplier</Label>
                                <Input
                                    id="supplier"
                                    type="text"
                                    value={formData.supplier}
                                    onChange={(e) => handleInputChange("supplier", e.target.value)}
                                    placeholder="Enter supplier name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="warrantyPeriod">Warranty Period (months)</Label>
                                <Input
                                    id="warrantyPeriod"
                                    type="number"
                                    min="0"
                                    value={formData.warrantyPeriod}
                                    onChange={(e) => handleInputChange("warrantyPeriod", e.target.value)}
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
                            <MapPin className="w-5 h-5 mr-2" />
                            Physical Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <Label htmlFor="quantity">Quantity *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="unit">Unit</Label>
                                <Input
                                    id="unit"
                                    type="text"
                                    value={formData.unit}
                                    onChange={(e) => handleInputChange("unit", e.target.value)}
                                    placeholder="pieces, sets, kg"
                                />
                            </div>

                            <div>
                                <Label htmlFor="condition">Condition</Label>
                                <Select
                                    value={formData.condition}
                                    onValueChange={(value) => handleInputChange("condition", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Excellent">Excellent</SelectItem>
                                        <SelectItem value="Good">Good</SelectItem>
                                        <SelectItem value="Fair">Fair</SelectItem>
                                        <SelectItem value="Poor">Poor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange("location", e.target.value)}
                                    placeholder="Room 101, Kitchen"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Technical Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Settings className="w-5 h-5 mr-2" />
                            Technical Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="brand">Brand</Label>
                                <Input
                                    id="brand"
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => handleInputChange("brand", e.target.value)}
                                    placeholder="Enter brand name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="model">Model</Label>
                                <Input
                                    id="model"
                                    type="text"
                                    value={formData.model}
                                    onChange={(e) => handleInputChange("model", e.target.value)}
                                    placeholder="Enter model number"
                                />
                            </div>

                            <div>
                                <Label htmlFor="serialNumber">Serial Number</Label>
                                <Input
                                    id="serialNumber"
                                    type="text"
                                    value={formData.serialNumber}
                                    onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                                    placeholder="Enter serial number"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Maintenance Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Wrench className="w-5 h-5 mr-2" />
                            Maintenance Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <Label htmlFor="maintenanceDate">Next Maintenance Date *</Label>
                                <Input
                                    id="maintenanceDate"
                                    type="date"
                                    value={formData.maintenanceDate}
                                    onChange={(e) => handleInputChange("maintenanceDate", e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="maintenanceInterval">Maintenance Interval (days)</Label>
                                <Input
                                    id="maintenanceInterval"
                                    type="number"
                                    min="1"
                                    value={formData.maintenanceInterval}
                                    onChange={(e) => handleInputChange("maintenanceInterval", e.target.value)}
                                    placeholder="365"
                                />
                            </div>

                            <div>
                                <Label htmlFor="maintenanceCost">Annual Maintenance Cost</Label>
                                <Input
                                    id="maintenanceCost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.maintenanceCost}
                                    onChange={(e) => handleInputChange("maintenanceCost", e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="assignedTo">Assigned To</Label>
                                <Select
                                    value={formData.assignedToId}
                                    onValueChange={(value) => handleInputChange("assignedToId", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {staff.map((member) => (
                                            <SelectItem key={member.id} value={member.id.toString()}>
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-2" />
                                                    <div>
                                                        <p className="font-medium">{member.fullName || member.name}</p>
                                                        {member.department && (
                                                            <p className="text-xs text-gray-500">{member.department}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Media Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Upload className="w-5 h-5 mr-2" />
                            Media & Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Asset Image */}
                            <div>
                                <Label htmlFor="assetImage">Asset Image</Label>
                                <div className="mt-2">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <div className="w-full h-48 rounded-lg border overflow-hidden">
                                                <Image
                                                    src={imagePreview}
                                                    alt="Asset preview"
                                                    fill
                                                    style={{ objectFit: "cover" }}
                                                    className="rounded-lg"
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={removeImage}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 mb-2">Upload asset image</p>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange("assetImage", e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="assetImage"
                                            />
                                            <Label htmlFor="assetImage" className="cursor-pointer">
                                                <Button type="button" variant="outline" size="sm">
                                                    Choose File
                                                </Button>
                                            </Label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Asset Document */}
                            <div>
                                <Label htmlFor="assetDocument">Documents (Receipt/Manual)</Label>
                                <div className="mt-2">
                                    {documentPreview ? (
                                        <div className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <FileText className="w-6 h-6 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-600">
                                                        {typeof documentPreview === 'string' && documentPreview.startsWith('/uploads/') ? 'Uploaded Document' : documentPreview}
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={removeDocument}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 mb-2">Upload documents</p>
                                            <Input
                                                type="file"
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileChange("assetDocument", e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="assetDocument"
                                            />
                                            <Label htmlFor="assetDocument" className="cursor-pointer">
                                                <Button type="button" variant="outline" size="sm">
                                                    Choose File
                                                </Button>
                                            </Label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6">
                    <Link href={`/assets/${assetId}`}>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Update Asset
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}