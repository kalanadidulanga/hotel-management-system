"use client";

import { useState } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { categories, products } from "@/data/pos-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Calculator, Plus } from "lucide-react";
import Image from "next/image";

const PAGE_SIZE = 12;

export default function POSInvoicePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter((p) => p.category === selectedCategory);
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.ceil(filteredProducts.length / PAGE_SIZE);

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header Section */}
      <div className="flex-shrink-0 bg-card border-b border-border shadow-sm">
        <div className="px-4 py-4 space-y-4">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/restaurant" className="flex items-center gap-2 text-sm">
                  <Home className="w-4 h-4" /> Restaurant
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/restaurant/pos-invoice" className="text-sm font-medium">
                  POS Invoice
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Order Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default" size="sm" className="h-9 px-4 rounded-[var(--radius-lg)] shadow-sm">
              <Home className="w-4 h-4 mr-2" /> New Order
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-[var(--radius-lg)]">
              On Going Order
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-[var(--radius-lg)] flex items-center gap-2">
              Online Order 
              <Badge variant="destructive" className="px-2 py-0.5 text-xs rounded-full">0</Badge>
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-[var(--radius-lg)]">
              Today Order
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 pb-20 overflow-y-auto">
        {/* Left Panel - Products Section */}
        <div className="lg:col-span-2 flex flex-col space-y-4 min-h-0">
          {/* Category Filter */}
          <Card className="bg-card border border-border rounded-[var(--radius-lg)] shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category);
                      setPage(1);
                    }}
                    className="h-8 px-3 rounded-[var(--radius-lg)] text-sm font-medium transition-all duration-200"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <Card className="flex-1 bg-card border border-border rounded-[var(--radius-lg)] shadow-sm min-h-0">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full overflow-y-auto pr-2">
                  {paginatedProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className="group cursor-pointer bg-background border border-border rounded-[var(--radius-lg)] shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] flex flex-col h-40"
                    >
                      <div className="relative flex-1 rounded-t-[var(--radius-lg)] overflow-hidden bg-muted">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          unoptimized
                        />
                      </div>
                      <div className="p-3 flex flex-col justify-between flex-shrink-0">
                        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary">
                            ${product.price}
                          </span>
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0 rounded-full">
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* Pagination */}
              {pageCount > 1 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Pagination>
                    <PaginationContent className="flex justify-center">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(Math.max(1, page - 1))}
                          className={`${page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-[var(--radius-lg)]`}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                        let pageNum;
                        if (pageCount <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pageCount - 2) {
                          pageNum = pageCount - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                              className="cursor-pointer rounded-[var(--radius-lg)] hover:bg-accent"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(Math.min(pageCount, page + 1))}
                          className={`${page === pageCount ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-[var(--radius-lg)]`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Order Form */}
        <div className="lg:col-span-1 flex flex-col space-y-4 min-h-0 max-h-full overflow-y-auto">
          <Card className="bg-card border border-border rounded-[var(--radius-lg)] shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Order Details</h2>
              
              <form className="space-y-4">
                {/* Customer Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Customer Name (Check In) <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select className="flex-1 h-10 px-3 py-2 bg-background border border-border rounded-[var(--radius-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent">
                      <option>Select Customer</option>
                    </select>
                    <Button type="button" size="sm" className="h-10 w-10 p-0 rounded-[var(--radius-lg)]">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Customer Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Customer Type <span className="text-destructive">*</span>
                  </label>
                  <select className="w-full h-10 px-3 py-2 bg-background border border-border rounded-[var(--radius-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent">
                    <option>Walk In Customer</option>
                    <option>Member</option>
                  </select>
                </div>

                {/* Waiter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Waiter <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select className="flex-1 h-10 px-3 py-2 bg-background border border-border rounded-[var(--radius-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent">
                      <option>Select Waiter</option>
                      <option>Waiter 1</option>
                      <option>Waiter 2</option>
                    </select>
                    <Button type="button" variant="outline" size="sm" className="h-10 px-3 rounded-[var(--radius-lg)]">
                      Person
                    </Button>
                  </div>
                </div>

                {/* Table Map */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Table Map <span className="text-destructive">*</span>
                  </label>
                  <select className="w-full h-10 px-3 py-2 bg-background border border-border rounded-[var(--radius-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent">
                    <option>Select Table</option>
                    <option>Table 1</option>
                    <option>Table 2</option>
                  </select>
                </div>

                {/* Cooking Time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cooking Time</label>
                  <Input 
                    type="text" 
                    placeholder="00:00:00" 
                    className="h-10 rounded-[var(--radius-lg)] border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Order Summary Section */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">VAT/Tax (10%):</span>
                <Input type="number" defaultValue={0} className="w-16 h-8 text-sm rounded-[var(--radius-lg)]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Service Charge (%):</span>
                <Input type="number" defaultValue={0} className="w-16 h-8 text-sm rounded-[var(--radius-lg)]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-foreground">Grand Total:</span>
                <span className="bg-primary text-primary-foreground rounded-[var(--radius-lg)] px-4 py-2 text-lg font-bold shadow-sm">
                  $0.00
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-[var(--radius-lg)]">
                <Calculator className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-9 px-4 rounded-[var(--radius-lg)]">
                Cancel
              </Button>
              <Button variant="secondary" size="sm" className="h-9 px-4 rounded-[var(--radius-lg)]">
                Quick Order
              </Button>
              <Button variant="default" size="sm" className="h-9 px-6 rounded-[var(--radius-lg)] shadow-sm">
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}