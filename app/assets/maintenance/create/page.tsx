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
    Calendar,
    CheckCircle,
    DollarSign,
    FileText,
    Package,
    Save,
    Settings,
    Star,
    Upload,
    User,
    Utensils,
    Wrench,
    X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Asset {
    id: number;
    assetId: string;
    name: string;
    type: string;
    location: string | null;
    status: string;
    category: {
        name: string;
    } | null;
}

interface Staff {
    id: number;
    name: string;
    fullName: string | null;
    department: string | null;
    staffClass: string | null;
}

interface FormData {
    assetId: string;
    staffId: string;
    maintenanceDate: string;
    scheduledDate: string;
    description: string;
    serviceType: string;
    serviceProvider: string;
    priority: string;
    status: string;
    cost: string;
    partsCost: string;
    laborCost: string;
    partsUsed: string;
    workOrderNumber: string;
    inspectedBy: string;
    qualityRating: string;
    remarks: string;
    issuesFound: string;
    recommendations: string;
    beforeImages: File | null;
    afterImages: File | null;
}

export default function CreateMaintenancePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    
    const [formData, setFormData] = useState<FormData>({
        assetId: "",
        staffId: "",
        maintenanceDate: "",
        scheduledDate: "",
        description: "",
        serviceType: "Preventive",
        serviceProvider: "",
        priority: "MEDIUM",
        status: "SCHEDULED",
        cost: "0",
        partsCost: "0",
        laborCost: "0",
        partsUsed: "",
        workOrderNumber: "",
        inspectedBy: "",
        qualityRating: "",
        remarks: "",
        issuesFound: "",
        recommendations: "",
        beforeImages: null,
        afterImages: null,
    });

    const [beforeImagePreview, setBeforeImagePreview] = useState<string | null>(null);
    const [afterImagePreview, setAfterImagePreview] = useState<string | null>(null);

    useEffect(() => {
        fetchFormData();
    }, []);

    useEffect(() => {
        // Set default maintenance date to today
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, maintenanceDate: today }));
    }, []);

    const fetchFormData = async () => {
        try {
            setInitialLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/maintenance/create`);

            if (!response.ok) {
                throw new Error("Failed to fetch form data");
            }

            const data = await response.json();
            setAssets(data.assets);
            setStaff(data.staff);
        } catch (error) {
            console.error("Error fetching form data:", error);
            toast.error("Failed to load form data");
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (field: keyof FormData, value: string | File | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Update selected asset when asset changes
        if (field === 'assetId') {
            const asset = assets.find(a => a.id.toString() === value);
            setSelectedAsset(asset || null);
        }
    };

    const handleFileChange = (field: 'beforeImages' | 'afterImages', file: File | null) => {
        setFormData(prev => ({ ...prev, [field]: file }));

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (field === 'beforeImages') {
                    setBeforeImagePreview(e.target?.result as string);
                } else {
                    setAfterImagePreview(e.target?.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (field: 'beforeImages' | 'afterImages') => {
        setFormData(prev => ({ ...prev, [field]: null }));
        if (field === 'beforeImages') {
            setBeforeImagePreview(null);
        } else {
            setAfterImagePreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.assetId || !formData.staffId || !formData.maintenanceDate || 
            !formData.description || !formData.priority || !formData.status) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setLoading(true);

            const submitData = new FormData();
            
            // Add all form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'beforeImages' || key === 'afterImages') {
                    if (value instanceof File) {
                        submitData.append(key, value);
                    }
                } else if (value !== null && value !== undefined) {
                    submitData.append(key, value.toString());
                }
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assets/maintenance/create`, {
                method: "POST",
                body: submitData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to create maintenance log");
            }

            toast.success("Maintenance log created successfully!");
            router.push("/maintenance");

        } catch (error) {
            console.error("Error creating maintenance log:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create maintenance log");
        } finally {
            setLoading(false);
        }
    };

    const getAssetTypeIcon = (type: string) => {
        return type === 'FIXED_ASSET' ? 
            <Package className="w-4 h-4" /> : 
            <Utensils className="w-4 h-4" />;
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'SCHEDULED': 'bg-yellow-100 text-yellow-800',
            'IN_PROGRESS': 'bg-blue-100 text-blue-800',
            'COMPLETED': 'bg-green-100 text-green-800',
            'OVERDUE': 'bg-red-100 text-red-800',
            'CANCELLED': 'bg-gray-100 text-gray-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            'LOW': 'bg-green-100 text-green-800',
            'MEDIUM': 'bg-yellow-100 text-yellow-800',
            'HIGH': 'bg-orange-100 text-orange-800',
            'CRITICAL': 'bg-red-100 text-red-800'
        };
        return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Link href="/maintenance">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <Wrench className="w-8 h-8 text-blue-600 mr-3" />
                            Log Maintenance
                        </h1>
                        <p className="text-gray-600 mt-1">Create a new maintenance log entry</p>
                    </div>
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
                                <Label htmlFor="assetId">Asset *</Label>
                                <Select
                                    value={formData.assetId}
                                    onValueChange={(value) => handleInputChange("assetId", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select asset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assets.map((asset) => (
                                            <SelectItem key={asset.id} value={asset.id.toString()}>
                                                <div className="flex items-center space-x-2">
                                                    {getAssetTypeIcon(asset.type)}
                                                    <div>
                                                        <p className="font-medium">{asset.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {asset.assetId} • {asset.category?.name}
                                                            {asset.location && ` • ${asset.location}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedAsset && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                {getAssetTypeIcon(selectedAsset.type)}
                                                <span className="font-medium">{selectedAsset.name}</span>
                                            </div>
                                            <Badge className={selectedAsset.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                                {selectedAsset.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            ID: {selectedAsset.assetId} {selectedAsset.location && `• Location: ${selectedAsset.location}`}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="staffId">Assigned Technician *</Label>
                                <Select
                                    value={formData.staffId}
                                    onValueChange={(value) => handleInputChange("staffId", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staff.map((member) => (
                                            <SelectItem key={member.id} value={member.id.toString()}>
                                                <div className="flex items-center space-x-2">
                                                    <User className="w-4 h-4" />
                                                    <div>
                                                        <p className="font-medium">{member.fullName || member.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {member.department} {member.staffClass && `• ${member.staffClass}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="maintenanceDate">Maintenance Date *</Label>
                                <Input
                                    id="maintenanceDate"
                                    type="date"
                                    value={formData.maintenanceDate}
                                    onChange={(e) => handleInputChange("maintenanceDate", e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                                <Input
                                    id="scheduledDate"
                                    type="date"
                                    value={formData.scheduledDate}
                                    onChange={(e) => handleInputChange("scheduledDate", e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="workOrderNumber">Work Order Number</Label>
                                <Input
                                    id="workOrderNumber"
                                    type="text"
                                    value={formData.workOrderNumber}
                                    onChange={(e) => handleInputChange("workOrderNumber", e.target.value)}
                                    placeholder="WO-2024-001"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                placeholder="Describe the maintenance work performed..."
                                rows={4}
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Service Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Settings className="w-5 h-5 mr-2" />
                            Service Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="serviceType">Service Type</Label>
                                <Select
                                    value={formData.serviceType}
                                    onValueChange={(value) => handleInputChange("serviceType", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Preventive">Preventive</SelectItem>
                                        <SelectItem value="Corrective">Corrective</SelectItem>
                                        <SelectItem value="Emergency">Emergency</SelectItem>
                                        <SelectItem value="Inspection">Inspection</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="serviceProvider">Service Provider</Label>
                                <Input
                                    id="serviceProvider"
                                    type="text"
                                    value={formData.serviceProvider}
                                    onChange={(e) => handleInputChange("serviceProvider", e.target.value)}
                                    placeholder="Internal staff or external company"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="priority">Priority *</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => handleInputChange("priority", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span>Low Priority</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="MEDIUM">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                <span>Medium Priority</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="HIGH">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                <span>High Priority</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="CRITICAL">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <span>Critical Priority</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="status">Status *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleInputChange("status", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SCHEDULED">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-4 h-4 text-yellow-600" />
                                                <span>Scheduled</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="IN_PROGRESS">
                                            <div className="flex items-center space-x-2">
                                                <Settings className="w-4 h-4 text-blue-600" />
                                                <span>In Progress</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="COMPLETED">
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span>Completed</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="CANCELLED">
                                            <div className="flex items-center space-x-2">
                                                <X className="w-4 h-4 text-gray-600" />
                                                <span>Cancelled</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cost Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <DollarSign className="w-5 h-5 mr-2" />
                            Cost Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="cost">Total Cost</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.cost}
                                    onChange={(e) => handleInputChange("cost", e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="partsCost">Parts Cost</Label>
                                <Input
                                    id="partsCost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.partsCost}
                                    onChange={(e) => handleInputChange("partsCost", e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="laborCost">Labor Cost</Label>
                                <Input
                                    id="laborCost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.laborCost}
                                    onChange={(e) => handleInputChange("laborCost", e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="partsUsed">Parts/Materials Used</Label>
                            <Textarea
                                id="partsUsed"
                                value={formData.partsUsed}
                                onChange={(e) => handleInputChange("partsUsed", e.target.value)}
                                placeholder="List parts and materials used..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Quality Control */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Star className="w-5 h-5 mr-2" />
                            Quality Control
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="inspectedBy">Inspected By</Label>
                                <Input
                                    id="inspectedBy"
                                    type="text"
                                    value={formData.inspectedBy}
                                    onChange={(e) => handleInputChange("inspectedBy", e.target.value)}
                                    placeholder="Inspector name"
                                />
                            </div>

                            <div>
                                <Label htmlFor="qualityRating">Quality Rating (1-5)</Label>
                                <Select
                                    value={formData.qualityRating}
                                    onValueChange={(value) => handleInputChange("qualityRating", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select rating" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">⭐⭐⭐⭐⭐ Excellent (5)</SelectItem>
                                        <SelectItem value="4">⭐⭐⭐⭐ Good (4)</SelectItem>
                                        <SelectItem value="3">⭐⭐⭐ Average (3)</SelectItem>
                                        <SelectItem value="2">⭐⭐ Fair (2)</SelectItem>
                                        <SelectItem value="1">⭐ Poor (1)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="issuesFound">Issues Found</Label>
                                <Textarea
                                    id="issuesFound"
                                    value={formData.issuesFound}
                                    onChange={(e) => handleInputChange("issuesFound", e.target.value)}
                                    placeholder="Describe any issues discovered..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="recommendations">Recommendations</Label>
                                <Textarea
                                    id="recommendations"
                                    value={formData.recommendations}
                                    onChange={(e) => handleInputChange("recommendations", e.target.value)}
                                    placeholder="Future maintenance recommendations..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="remarks">Additional Remarks</Label>
                            <Textarea
                                id="remarks"
                                value={formData.remarks}
                                onChange={(e) => handleInputChange("remarks", e.target.value)}
                                placeholder="Any additional notes or remarks..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Media Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Upload className="w-5 h-5 mr-2" />
                            Documentation Photos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Before Images */}
                            <div>
                                <Label htmlFor="beforeImages">Before Images</Label>
                                <div className="mt-2">
                                    {beforeImagePreview ? (
                                        <div className="relative">
                                            <Image
                                                src={beforeImagePreview || ""}
                                                alt="Before maintenance"
                                                width={600}
                                                height={192}
                                                className="w-full h-48 object-cover rounded-lg border"
                                                style={{ objectFit: "cover" }}
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={() => removeImage('beforeImages')}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 mb-2">Upload before images</p>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange("beforeImages", e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="beforeImages"
                                            />
                                            <Label htmlFor="beforeImages" className="cursor-pointer">
                                                <Button type="button" variant="outline" size="sm">
                                                    Choose File
                                                </Button>
                                            </Label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* After Images */}
                            <div>
                                <Label htmlFor="afterImages">After Images</Label>
                                <div className="mt-2">
                                    {afterImagePreview ? (
                                        <div className="relative">
                                            <Image
                                                src={afterImagePreview || ""}
                                                alt="After maintenance"
                                                width={600}
                                                height={192}
                                                className="w-full h-48 object-cover rounded-lg border"
                                                style={{ objectFit: "cover" }}
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={() => removeImage('afterImages')}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 mb-2">Upload after images</p>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange("afterImages", e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="afterImages"
                                            />
                                            <Label htmlFor="afterImages" className="cursor-pointer">
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

                {/* Preview Section */}
                {(formData.assetId || formData.priority || formData.status) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    {selectedAsset && (
                                        <div className="flex items-center space-x-2">
                                            {getAssetTypeIcon(selectedAsset.type)}
                                            <span className="font-medium">{selectedAsset.name}</span>
                                            <span className="text-gray-500">({selectedAsset.assetId})</span>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <Badge className={getPriorityColor(formData.priority)} variant="outline">
                                            {formData.priority} PRIORITY
                                        </Badge>
                                        <Badge className={getStatusColor(formData.status)} variant="outline">
                                            {formData.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {formData.cost && parseFloat(formData.cost) > 0 && (
                                        <p className="font-semibold text-green-600">
                                            ${parseFloat(formData.cost).toLocaleString()}
                                        </p>
                                    )}
                                    {formData.maintenanceDate && (
                                        <p className="text-sm text-gray-500">
                                            {new Date(formData.maintenanceDate).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6">
                    <Link href="/maintenance">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Create Maintenance Log
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}