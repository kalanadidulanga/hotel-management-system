"use client";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { categories, products } from "@/data/pos-data";
import { Calculator, Home, Plus, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const PAGE_SIZE = 15;

export default function POSInvoicePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products
    .filter(p => 
      (selectedCategory === "All" || p.category === selectedCategory) &&
      (searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.ceil(filteredProducts.length / PAGE_SIZE);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header Section */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-3 space-y-3">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/restaurant" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-3.5 h-3.5" /> Restaurant
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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="default" size="sm" className="h-8 px-3 rounded-full shadow-sm">
              <Home className="w-3.5 h-3.5 mr-1.5" /> New Order
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 rounded-full">
              On Going Order
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 rounded-full flex items-center gap-1.5">
              Online Order 
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px] rounded-full">0</Badge>
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 rounded-full">
              Today Order
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 p-2 pb-20 overflow-y-auto">
        {/* Left Panel - Products Section */}
        <div className="lg:col-span-2 flex flex-col space-y-4 min-h-0">
          {/* Search and Category Filter */}
          <div className="bg-white shadow-lg overflow-hidden">
            <div className="p-2 space-y-2">
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex gap-1.5 flex-nowrap overflow-x-auto pb-1">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category);
                      setPage(1);
                    }}
                    className={`h-7 px-3 rounded-full text-xs whitespace-nowrap transition-all duration-200 ${
                      selectedCategory === category ? "shadow-md" : "border-border/50 hover:border-border hover:shadow-sm"
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 bg-white rounded-lg shadow-lg min-h-0">
            <div className="pt-3 h-full flex flex-col">
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-5 gap-3 h-full overflow-y-auto pr-1 pb-2">
                  {paginatedProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className="group cursor-pointer bg-white rounded-sm shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col h-36 overflow-hidden border border-gray-200/40 "
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    >
                      <div className="relative flex-1 bg-gray-50/40">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                      <div className="p-2 flex flex-col justify-between h-14 bg-white">
                        <h3 className="text-xs font-medium text-gray-900 line-clamp-1 leading-tight mb-1">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-primary">
                            ${product.price}
                          </span>
                          <button className="h-5 w-5 rounded-full bg-white hover:bg-primary hover:text-primary-foreground transition-colors duration-200 flex items-center justify-center shadow-md border border-gray-200/50">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Pagination */}
              {pageCount > 1 && (
                <div>
                  <Pagination>
                    <PaginationContent className="flex justify-center">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(Math.max(1, page - 1))}
                          className={`${page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full shadow-sm`}
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
                              className={`cursor-pointer rounded-full hover:bg-accent ${page === pageNum ? "shadow-md" : "shadow-sm"}`}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(Math.min(pageCount, page + 1))}
                          className={`${page === pageCount ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"} rounded-full shadow-sm`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Order Form */}
        <div className="lg:col-span-1 flex flex-col space-y-2 min-h-0 max-h-full overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200/60">
            <div className="p-5">
              <h2 className="text-base font-medium text-foreground mb-4">Order Details</h2>
              
              <form className="space-y-3.5">
                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Customer Name (Check In) <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select className="flex-1 h-9 px-3 py-1.5 bg-white border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm">
                      <option>Select Customer</option>
                    </select>
                    <Button type="button" size="sm" className="h-9 w-9 p-0 rounded-lg shadow-sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Customer Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Customer Type <span className="text-destructive">*</span>
                  </label>
                  <select className="w-full h-9 px-3 py-1.5 bg-white border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm">
                    <option>Walk In Customer</option>
                    <option>Member</option>
                  </select>
                </div>

                {/* Waiter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Waiter <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select className="flex-1 h-9 px-3 py-1.5 bg-white border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm">
                      <option>Select Waiter</option>
                      <option>Waiter 1</option>
                      <option>Waiter 2</option>
                    </select>
                    <Button type="button" variant="outline" size="sm" className="h-9 px-2.5 rounded-lg shadow-sm">
                      Person
                    </Button>
                  </div>
                </div>

                {/* Table Map */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Table Map <span className="text-destructive">*</span>
                  </label>
                  <select className="w-full h-9 px-3 py-1.5 bg-white border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm">
                    <option>Select Table</option>
                    <option>Table 1</option>
                    <option>Table 2</option>
                  </select>
                </div>

                {/* Cooking Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Cooking Time</label>
                  <Input 
                    type="text" 
                    placeholder="00:00:00" 
                    className="h-9 rounded-lg border-border/50 focus:ring-1 focus:ring-ring focus:border-transparent shadow-sm"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-border/50 z-50 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Order Summary Section */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">VAT/Tax (10%):</span>
                <Input type="number" defaultValue={0} className="w-14 h-7 text-xs rounded-md shadow-sm" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Service Charge (%):</span>
                <Input type="number" defaultValue={0} className="w-14 h-7 text-xs rounded-md shadow-sm" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground">Grand Total:</span>
                <span className="bg-primary/10 text-primary rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm">
                  $0.00
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full shadow-sm">
                <Calculator className="w-3.5 h-3.5" />
              </Button>
              <Button variant="destructive" size="sm" className="h-8 px-3 rounded-full shadow-sm">
                Cancel
              </Button>
              <Button variant="secondary" size="sm" className="h-8 px-3 rounded-full shadow-sm">
                Quick Order
              </Button>
              <Button variant="default" size="sm" className="h-8 px-4 rounded-full shadow-md">
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}