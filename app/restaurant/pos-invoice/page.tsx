"use client";

import { useState } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { categories, products } from "@/data/pos-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home } from "lucide-react";
import Image from "next/image";

const PAGE_SIZE = 18;

export default function POSInvoicePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter((p) => p.category === selectedCategory);
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.ceil(filteredProducts.length / PAGE_SIZE);

  return (
    <div className="flex flex-col h-full w-full bg-muted">
      {/* Breadcrumb and Order Tabs */}
      <div className="flex flex-col gap-2 px-4 pt-4 bg-white">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/restaurant"><Home className="w-4 h-4 inline mr-1" /> Restaurant</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/restaurant/pos-invoice">POS Invoice</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* TODO: OrderTabs component */}
        <div className="flex items-center gap-2 mt-2">
          <Button variant="secondary" size="icon"><Home className="w-5 h-5" /></Button>
          <Button variant="outline" size="sm">New Order</Button>
          <Button variant="outline" size="sm">On Going Order</Button>
          <Button variant="outline" size="sm">Online Order <Badge className="ml-1 bg-red-500 text-white">0</Badge></Button>
          <Button variant="outline" size="sm">Today Order</Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <aside className="hidden md:flex flex-col w-40 bg-white border-r p-2 overflow-y-auto">
          {/* TODO: CategorySidebar component */}
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="mb-2 w-full"
              onClick={() => { setSelectedCategory(cat); setPage(1); }}
            >
              {cat}
            </Button>
          ))}
        </aside>

        {/* Main Product Grid and Order Form */}
        <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden items-start">
          {/* Product Grid - fixed card size, responsive grid, pagination fixed at bottom, always 3 rows */}
          <section className="flex-1 flex flex-col h-full relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 grid-rows-3 gap-2 w-full flex-1 min-h-[540px] h-full pb-6">
              {paginatedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="flex flex-col items-center bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-1 w-full max-w-[140px] min-w-[120px] h-[160px] mx-auto"
                >
                  <div className="relative w-full h-[80px] rounded-lg overflow-hidden mb-1 bg-gray-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 120px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="text-center text-[11px] font-medium line-clamp-2 w-full px-1 flex-1 flex items-center justify-center">{product.name}</div>
                </Card>
              ))}
            </div>
            <div className="w-full flex justify-center py-0.5 absolute left-0 right-0 bottom-0 z-10 text-xs">
               <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                     <PaginationPrevious className="px-1 py-0.5 text-xs min-w-0" onClick={() => setPage((p) => Math.max(1, p - 1))} isActive={page > 1} />
                    </PaginationItem>
                    {[...Array(pageCount)].map((_, i) => (
                      <PaginationItem key={i}>
                       <PaginationLink className="px-1 py-0.5 text-xs min-w-0" isActive={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                     <PaginationNext className="px-1 py-0.5 text-xs min-w-0" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} isActive={page < pageCount} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
            </div>
          </section>

          {/* Order Form */}
          <aside className="w-full md:w-[520px] bg-white rounded shadow p-4 md:p-6 flex flex-col gap-y-4 h-auto relative">
            <form className="grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-6 w-full">
              {/* Customer Name (Check In) */}
              <div className="flex flex-col col-span-1 min-w-0 w-full">
                <label className="text-sm font-medium mb-1">Customer Name(Check In)<span className="text-red-500">*</span></label>
                <div className="flex gap-2 w-full">
                  <select className="border rounded px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-0 w-full">
                    <option>Select Option</option>
                  </select>
                  <button type="button" className="bg-primary text-white rounded px-3 flex items-center justify-center text-lg font-bold">+</button>
                </div>
              </div>
              {/* Customer Type */}
              <div className="flex flex-col col-span-1 min-w-0 w-full">
                <label className="text-sm font-medium mb-1">Customer Type <span className="text-red-500">*</span></label>
                <select className="border rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-0">
                  <option>Walk In Customer</option>
                  <option>Member</option>
                </select>
              </div>
              {/* Waiter */}
              <div className="flex flex-col col-span-1 min-w-0 w-full">
                <label className="text-sm font-medium mb-1">Waiter <span className="text-red-500">*</span></label>
                <div className="flex gap-2 w-full">
                  <select className="border rounded px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-0 w-full">
                    <option>Waiter 1</option>
                  </select>
                  <button type="button" className="bg-primary text-white rounded px-3 flex items-center justify-center text-sm font-semibold">Person</button>
                </div>
              </div>
              {/* Table Map */}
              <div className="flex flex-col col-span-1 min-w-0 w-full">
                <label className="text-sm font-medium mb-1">Table Map <span className="text-red-500">*</span></label>
                <select className="border rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-0">
                  <option>Select Option</option>
                </select>
              </div>
              {/* Cooking Time */}
              <div className="flex flex-col col-span-1 min-w-0 w-full">
                <label className="text-sm font-medium mb-1">Cooking Time</label>
                <input type="text" className="border rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-0" placeholder="00:00:00" />
              </div>
            </form>
          </aside>
        </main>
      </div>

      {/* Order Actions and Summary (Bottom Bar) */}
      <footer className="sticky bottom-0 z-20 bg-white border-t flex items-center justify-between px-4 py-2 gap-4">
        {/* TODO: OrderSummary component */}
        <div className="flex gap-2 items-center">
          <span>Vat/Tax(10%):</span>
          <Input type="number" className="w-20" defaultValue={0} />
          <span>Service Charge(%):</span>
          <Input type="number" className="w-20" defaultValue={0} />
          <span className="font-semibold ml-4">Grand Total:</span>
          <span className="bg-primary text-white rounded px-4 py-1 text-lg">0 ৳</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon"><CalculatorIcon className="w-5 h-5" /></Button>
          <Button variant="destructive">Cancel</Button>
          <Button variant="secondary">Quick Order</Button>
          <Button variant="default">Place Order</Button>
        </div>
      </footer>
    </div>
  );
}

function CalculatorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth="2" />
      <rect x="8" y="7" width="8" height="2" rx="1" />
      <rect x="8" y="11" width="2" height="2" rx="1" />
      <rect x="8" y="15" width="2" height="2" rx="1" />
      <rect x="12" y="11" width="2" height="2" rx="1" />
      <rect x="12" y="15" width="2" height="2" rx="1" />
      <rect x="16" y="11" width="2" height="6" rx="1" />
    </svg>
  );
}