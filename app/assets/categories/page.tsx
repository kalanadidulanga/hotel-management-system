"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    Edit,
    Eye,
    Filter,
    FolderOpen,
    MoreHorizontal,
    Package,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Utensils
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Category {
    id: number;
    name: string;
    description: string | null;
    assetType: "FIXED_ASSET" | "UTENSIL";
    createdAt: string;
    updatedAt: string;
    _count: {
        assets: number;
    };
}

interface CategoryFormData {
    name: string;
    description: string;
    assetType: "FIXED_ASSET" | "UTENSIL";
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [assetTypeFilter, setAssetTypeFilter] = useState("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<CategoryFormData>({
        name: "",
        description: "",
        assetType: "FIXED_ASSET"
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, [assetTypeFilter]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
            const params = new URLSearchParams();
            if (assetTypeFilter !== "all") {
                params.append("assetType", assetTypeFilter);
            }
            const response = await fetch(`${baseUrl}/api/assets/categories?${params}`);

            if (!response.ok) {
                throw new Error("Failed to fetch categories");
            }

            const data = await response.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Failed to load categories");
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!formData.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        if (!formData.assetType) {
            toast.error("Asset type is required");
            return;
        }

        try {
            setFormLoading(true);
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
            const response = await fetch(`${baseUrl}/api/assets/categories`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create category");
            }

            await fetchCategories();
            setIsCreateDialogOpen(false);
            setFormData({ name: "", description: "", assetType: "FIXED_ASSET" });
            toast.success("Category created successfully");
        } catch (error) {
            console.error("Error creating category:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create category");
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditCategory = async () => {
        if (!selectedCategory || !formData.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        if (!formData.assetType) {
            toast.error("Asset type is required");
            return;
        }

        try {
            setFormLoading(true);
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
            const response = await fetch(`${baseUrl}/api/assets/categories`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: selectedCategory.id,
                    ...formData,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update category");
            }

            await fetchCategories();
            setIsEditDialogOpen(false);
            setSelectedCategory(null);
            setFormData({ name: "", description: "", assetType: "FIXED_ASSET" });
            toast.success("Category updated successfully");
        } catch (error) {
            console.error("Error updating category:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update category");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;

        try {
            setFormLoading(true);
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
            const response = await fetch(`${baseUrl}/api/assets/categories`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: selectedCategory.id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete category");
            }

            await fetchCategories();
            setIsDeleteDialogOpen(false);
            setSelectedCategory(null);
            toast.success("Category deleted successfully");
        } catch (error) {
            console.error("Error deleting category:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete category");
        } finally {
            setFormLoading(false);
        }
    };

    const openEditDialog = (category: Category) => {
        setSelectedCategory(category);
        setFormData({
            name: category.name,
            description: category.description || "",
            assetType: category.assetType
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteDialogOpen(true);
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAssetTypeIcon = (type: string) => {
        return type === 'FIXED_ASSET' ?
            <Package className="w-4 h-4 text-blue-600" /> :
            <Utensils className="w-4 h-4 text-green-600" />;
    };

    const getAssetTypeColor = (type: string) => {
        return type === 'FIXED_ASSET' ?
            'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800';
    };

    const getAssetTypeStats = () => {
        const fixedAssets = categories.filter(cat => cat.assetType === 'FIXED_ASSET');
        const utensils = categories.filter(cat => cat.assetType === 'UTENSIL');

        return {
            fixedAssets: {
                count: fixedAssets.length,
                assets: fixedAssets.reduce((sum, cat) => sum + cat._count.assets, 0)
            },
            utensils: {
                count: utensils.length,
                assets: utensils.reduce((sum, cat) => sum + cat._count.assets, 0)
            }
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const stats = getAssetTypeStats();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/assets">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Assets
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center">
                            <FolderOpen className="w-8 h-8 text-blue-600 mr-3" />
                            Asset Categories
                        </h1>
                        <p className="text-gray-600 mt-1">Manage your asset categories and organize your inventory</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Button onClick={fetchCategories} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Category</DialogTitle>
                                <DialogDescription>
                                    Add a new category to organize your assets better.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Category Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter category name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="assetType">Asset Type *</Label>
                                    <Select
                                        value={formData.assetType}
                                        onValueChange={(value: "FIXED_ASSET" | "UTENSIL") =>
                                            setFormData({ ...formData, assetType: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select asset type" />
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
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter category description (optional)"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreateDialogOpen(false);
                                        setFormData({ name: "", description: "", assetType: "FIXED_ASSET" });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateCategory} disabled={formLoading}>
                                    {formLoading ? "Creating..." : "Create Category"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <FolderOpen className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Fixed Assets</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.fixedAssets.count}</p>
                                <p className="text-xs text-gray-500">{stats.fixedAssets.assets} assets</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Utensils</p>
                                <p className="text-2xl font-bold text-green-600">{stats.utensils.count}</p>
                                <p className="text-xs text-gray-500">{stats.utensils.assets} assets</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <Utensils className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {categories.reduce((sum, cat) => sum + cat._count.assets, 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Package className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Search & Filter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Search Categories</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search categories..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Asset Type</Label>
                            <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Asset Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Asset Types</SelectItem>
                                    <SelectItem value="FIXED_ASSET">
                                        <div className="flex items-center">
                                            <Package className="w-4 h-4 mr-2" />
                                            Fixed Assets
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="UTENSIL">
                                        <div className="flex items-center">
                                            <Utensils className="w-4 h-4 mr-2" />
                                            Utensils
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm("");
                                    setAssetTypeFilter("all");
                                }}
                                className="w-full"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Categories Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name & Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Assets Count</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCategories.map((category) => (
                                    <TableRow key={category.id} className="hover:bg-gray-50">
                                        <TableCell>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <FolderOpen className="w-5 h-5 text-blue-600" />
                                                    <span className="font-medium">{category.name}</span>
                                                </div>
                                                <Badge className={getAssetTypeColor(category.assetType)} variant="outline">
                                                    {getAssetTypeIcon(category.assetType)}
                                                    <span className="ml-1">
                                                        {category.assetType === 'FIXED_ASSET' ? 'Fixed Asset' : 'Utensil'}
                                                    </span>
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-xs">
                                                {category.description ? (
                                                    <span className="text-sm text-gray-600">
                                                        {category.description}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">
                                                        No description
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={category._count.assets > 0 ? "default" : "secondary"}>
                                                {category._count.assets} assets
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-600">
                                                {formatDate(category.createdAt)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-600">
                                                {formatDate(category.updatedAt)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => openEditDialog(category)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Category
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/assets?category=${category.id}`}
                                                            className="cursor-pointer"
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Assets
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => openDeleteDialog(category)}
                                                        className="cursor-pointer text-red-600 hover:text-red-700"
                                                        disabled={category._count.assets > 0}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Category
                                                    </DropdownMenuItem>
                                                    {category._count.assets > 0 && (
                                                        <div className="px-2 py-1 text-xs text-gray-500">
                                                            Cannot delete: has {category._count.assets} assets
                                                        </div>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredCategories.length === 0 && (
                        <div className="text-center py-12">
                            {searchTerm || assetTypeFilter !== "all" ? (
                                <>
                                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                                    <p className="text-gray-600 mb-4">
                                        No categories match your current filters. Try adjusting your search terms.
                                    </p>
                                    <Button onClick={() => {
                                        setSearchTerm("");
                                        setAssetTypeFilter("all");
                                    }} variant="outline">
                                        Clear Filters
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                                    <p className="text-gray-600 mb-4">
                                        Create your first asset category to organize your inventory.
                                    </p>
                                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create First Category
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>
                            Update the category information.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Category Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter category name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-assetType">Asset Type *</Label>
                            <Select
                                value={formData.assetType}
                                onValueChange={(value: "FIXED_ASSET" | "UTENSIL") =>
                                    setFormData({ ...formData, assetType: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select asset type" />
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
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter category description (optional)"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditDialogOpen(false);
                                setSelectedCategory(null);
                                setFormData({ name: "", description: "", assetType: "FIXED_ASSET" });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleEditCategory} disabled={formLoading}>
                            {formLoading ? "Updating..." : "Update Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the category
                            "{selectedCategory?.name}" and remove it from the system.
                            {selectedCategory?._count.assets && selectedCategory._count.assets > 0 && (
                                <span className="block mt-2 text-red-600 font-medium">
                                    This category has {selectedCategory._count.assets} assets assigned to it.
                                    Please reassign or remove the assets before deleting this category.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCategory}
                            disabled={formLoading || !!(selectedCategory?._count.assets && selectedCategory._count.assets > 0)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {formLoading ? "Deleting..." : "Delete Category"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}