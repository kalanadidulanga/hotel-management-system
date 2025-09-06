"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Home, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
}

interface Product {
  id: number;
  name: string;
  image?: string;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
  preparationTime: number;
  isVegetarian: boolean;
  isVegan: boolean;
  category: {
    id: number;
    name: string;
  };
}

export default function ManageProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | (Omit<Product,"id"|"category"> & { id: 0; category: { id: number; name: string }}) | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/restaurant/categories"),
          fetch("/api/restaurant/products")
        ]);
        setCategories(await catRes.json());
        setProducts(await prodRes.json());
      } catch {
        toast.error("Failed to load data");
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.category.name.toLowerCase().includes(q));
  }, [products, search]);

  const handleCreate = async (data: {
    name: string; categoryId: number; price: number; image?: string; stockQuantity: number; isAvailable: boolean; preparationTime: number; isVegetarian: boolean; isVegan: boolean;
  }) => {
    try {
      const res = await fetch("/api/restaurant/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setProducts(prev => [...prev, created]);
      toast.success("Product created");
      setEditingProduct(null);
    } catch {
      toast.error("Create failed");
    }
  };

  const handleUpdate = async (data: {
    id: number; name: string; categoryId: number; price: number; image?: string; stockQuantity: number; isAvailable: boolean; preparationTime: number; isVegetarian: boolean; isVegan: boolean;
  }) => {
    try {
      const res = await fetch("/api/restaurant/products", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      toast.success("Product updated");
      setEditingProduct(null);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/restaurant/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Product deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/restaurant">Restaurant</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Manage Products</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Manage Products
              </h1>
              <p className="text-gray-600 mt-1">Full-screen product management</p>
            </div>
            <div className="flex gap-2">
              <Link href="/restaurant/pos-invoice">
                <Button variant="outline" className="h-9 px-4">Back to POS</Button>
              </Link>
              <Button onClick={() => setEditingProduct({ id: 0, name: "", image: "", price: 0, stockQuantity: 0, isAvailable: true, preparationTime: 15, isVegetarian: false, isVegan: false, category: { id: categories[0]?.id || 1, name: categories[0]?.name || "" } })} className="h-9 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />Add Product
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or category" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <Card key={product.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category.name}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditingProduct(product)} className="h-8 w-8 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(product.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-600">Rs. {product.price}</span>
                    <span className={`text-xs px-2 py-1 rounded ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">Stock: {product.stockQuantity}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Product Form */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct?.id === 0 ? "Add New Product" : "Edit Product"}</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget as HTMLFormElement);
                const base = {
                  name: form.get("name") as string,
                  categoryId: parseInt(form.get("categoryId") as string),
                  price: parseFloat(form.get("price") as string),
                  image: form.get("image") as string,
                  stockQuantity: parseInt(form.get("stock") as string),
                  isAvailable: form.get("available") === "true",
                  preparationTime: parseInt((form.get("preparationTime") as string) || "15"),
                  isVegetarian: form.get("isVegetarian") === "true",
                  isVegan: form.get("isVegan") === "true",
                };
                if (editingProduct.id === 0) {
                  handleCreate(base);
                } else {
                  handleUpdate({ ...base, id: editingProduct.id });
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input name="name" defaultValue={editingProduct.name} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select name="categoryId" defaultValue={editingProduct.category.id.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <Input name="price" type="number" step="0.01" defaultValue={editingProduct.price} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <Input name="image" defaultValue={editingProduct.image} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <Input name="stock" type="number" defaultValue={editingProduct.stockQuantity} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Available</label>
                <Select name="available" defaultValue={editingProduct.isAvailable.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Available</SelectItem>
                    <SelectItem value="false">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">{editingProduct.id === 0 ? "Create" : "Update"}</Button>
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
