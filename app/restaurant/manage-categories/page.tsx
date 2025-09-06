"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | (Omit<Category, "id"> & { id: 0 }) | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/restaurant/categories");
        setCategories(await res.json());
      } catch (e) {
        toast.error("Failed to load categories");
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const handleCreate = async (data: { name: string; description?: string; sortOrder: number }) => {
    try {
      const res = await fetch("/api/restaurant/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setCategories(prev => [...prev, created]);
      toast.success("Category created");
      setEditingCategory(null);
    } catch {
      toast.error("Create failed");
    }
  };

  const handleUpdate = async (data: { id: number; name: string; description?: string; sortOrder: number }) => {
    try {
      const res = await fetch("/api/restaurant/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast.success("Category updated");
      setEditingCategory(null);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/restaurant/categories?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success("Category deleted");
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
              <BreadcrumbItem>Manage Categories</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Manage Categories
              </h1>
              <p className="text-gray-600 mt-1">Full-screen category management</p>
            </div>
            <div className="flex gap-2">
              <Link href="/restaurant/pos-invoice">
                <Button variant="outline" className="h-9 px-4">Back to POS</Button>
              </Link>
              <Button onClick={() => setEditingCategory({ id: 0, name: "", description: "", sortOrder: categories.length + 1 })} className="h-9 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />Add Category
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-3 rounded-lg border">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search category" />
          </div>

          <div className="space-y-2">
            {filtered.map((category) => (
              <Card key={category.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditingCategory(category)} className="h-8 w-8 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(category.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Category Form */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory?.id === 0 ? "Add New Category" : "Edit Category"}</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget as HTMLFormElement);
                const base = {
                  name: form.get("name") as string,
                  description: form.get("description") as string,
                  sortOrder: editingCategory.sortOrder,
                };
                if (editingCategory.id === 0) {
                  handleCreate(base);
                } else {
                  handleUpdate({ ...base, id: editingCategory.id });
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input name="name" defaultValue={editingCategory.name} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input name="description" defaultValue={editingCategory.description} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">{editingCategory.id === 0 ? "Create" : "Update"}</Button>
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
