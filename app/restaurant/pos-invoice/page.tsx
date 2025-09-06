"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Home, Plus, Search, ShoppingCart, Trash2, Minus, Receipt, RefreshCw, Settings, Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size: string;
}

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


export default function POSInvoicePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [waiterName, setWaiterName] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [taxRate] = useState(10);
  const [serviceCharge] = useState(5);
  const [discount, setDiscount] = useState(0);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("Regular");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  // Management is now on dedicated full-screen pages

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesRes = await fetch('/api/restaurant/categories');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
        
        // Fetch products
        const productsRes = await fetch('/api/restaurant/products?available=true');
        const productsData = await productsRes.json();
        setProducts(productsData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load restaurant data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category.name === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && product.isAvailable;
    });
  }, [selectedCategory, searchQuery, products]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const serviceChargeAmount = (subtotal * serviceCharge) / 100;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + taxAmount + serviceChargeAmount - discountAmount;

  const addToCart = (product: Product, size: string, quantity: number) => {
    const existingItem = cart.find(item => item.id === product.id && item.size === size);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id && item.size === size
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        size
      };
      setCart([...cart, newItem]);
    }
    
    toast.success(`${product.name} added to cart`);
    setShowProductModal(false);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (!selectedTable) {
      toast.error('Please select a table');
      return;
    }

    try {
      const orderData = {
        customerName: customerName.trim(),
        tableId: parseInt(selectedTable),
        waiterName: waiterName.trim() || 'Default Waiter',
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          size: item.size,
          price: item.price
        })),
        subtotal,
        taxAmount,
        serviceChargeAmount,
        discountAmount,
        total,
        notes: orderNotes.trim()
      };

      const response = await fetch('/api/restaurant/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const result = await response.json();
      
      toast.success(`Order #${result.invoiceNo} created successfully!`);
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setWaiterName('');
      setSelectedTable('');
      setOrderNotes('');
      setDiscount(0);
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    }
  };

  const updateCartItemQuantity = (id: number, size: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id, size);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === id && item.size === size
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (id: number, size: string) => {
    setCart(cart.filter(item => !(item.id === id && item.size === size)));
    toast.success("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
    toast.success("Cart cleared");
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize("Regular");
    setSelectedQuantity(1);
    setShowProductModal(true);
  };

  // Removed in favor of dedicated pages


  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
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
              <BreadcrumbItem>POS Invoice</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                POS Invoice
              </h1>
              <p className="text-gray-600 mt-1">Create and manage restaurant orders</p>
            </div>
            <div className="flex gap-2">
              <Link href="/restaurant/manage-categories">
                <Button 
                  variant="outline" 
                  className="h-9 px-4 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Categories
                </Button>
              </Link>
              <Link href="/restaurant/manage-products">
                <Button 
                  variant="outline" 
                  className="h-9 px-4 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Products
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={clearCart}
                className="h-9 px-4 border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
              <Button 
                onClick={handleSubmitOrder}
                className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Place Order
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Products Section */}
          <div className="xl:col-span-3 space-y-4">
            {/* Search and Filter */}
            <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-sm text-sm bg-white/80"
                  />
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === "All" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("All")}
                    className="h-8 px-3 rounded-sm text-sm font-medium"
                  >
                    All
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.name)}
                      className="h-8 px-3 rounded-sm text-sm font-medium"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Products Grid - Enhanced for Many Items */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-3">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading products...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-200 rounded-sm bg-white group overflow-hidden"
                          onClick={() => handleProductClick(product)}
                        >
                          <div className="p-3">
                            <div className="aspect-video relative mb-2 rounded-md overflow-hidden bg-gray-100">
                              <Image
                                src={product.image || '/placeholder-food.jpg'}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                                ${product.price}
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{product.name}</h4>
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                                {product.category.name.slice(0, 3)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {filteredProducts.length === 0 && !loading && (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-sm">No products found</p>
                        <p className="text-gray-400 text-xs mt-1">Try adjusting your search or category filter</p>
                      </div>
                    )}
                    
                    {filteredProducts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                          Showing {filteredProducts.length} of {products.length} products
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Order Form - Responsive Sidebar */}
          <div className="space-y-3">
            {/* Customer Details */}
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-3 space-y-3">
                <h3 className="font-semibold text-sm text-gray-900">Order Details</h3>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Customer Name *
                    </label>
                    <Input
                      placeholder="Customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Table Number *
                    </label>
                    <Input
                      placeholder="Table number"
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Waiter Name *
                    </label>
                    <Input
                      placeholder="Waiter name"
                      value={waiterName}
                      onChange={(e) => setWaiterName(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cart */}
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-900">
                    Cart ({cart.length})
                  </h3>
                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                </div>
                
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-6 text-sm">Cart is empty</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cart.map((item, index) => (
                      <div key={`${item.id}-${item.size}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-500">{item.size}</p>
                          <p className="text-[10px] font-medium text-emerald-600">
                            ${item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartItemQuantity(item.id, item.size, item.quantity - 1)}
                            className="h-5 w-5 p-0"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </Button>
                          <span className="text-xs font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartItemQuantity(item.id, item.size, item.quantity + 1)}
                            className="h-5 w-5 p-0"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.id, item.size)}
                            className="h-5 w-5 p-0 ml-1 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            {cart.length > 0 && (
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardContent className="p-3 space-y-3">
                  <h3 className="font-semibold text-sm text-gray-900">Summary</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span>Tax ({taxRate}%)</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span>Service ({serviceCharge}%)</span>
                      <span>${serviceChargeAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-green-600">${total.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span>Discount</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="w-12 h-6 text-[10px] px-1"
                          min="0"
                          max="100"
                        />
                        <span className="text-[10px]">%</span>
                        <span className="text-[10px]">-${discountAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-sm mb-3">
                        <span>Total</span>
                        <span className="text-emerald-600">${total.toFixed(2)}</span>
                      </div>
                      
                      <Button 
                        onClick={handleSubmitOrder}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={cart.length === 0}
                      >
                        Submit Order
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Cart</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={selectedProduct.image || '/placeholder-food.jpg'}
                    alt={selectedProduct.name}
                    width={200}
                    height={150}
                    className="rounded-lg object-cover mx-auto"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Category: <span className="font-medium">{selectedProduct.category.name}</span>
                  </p>
                  <div className="flex gap-2 mb-4">
                    {selectedProduct.isVegetarian && (
                      <Badge variant="outline" className="text-green-600 border-green-600">Vegetarian</Badge>
                    )}
                    {selectedProduct.isVegan && (
                      <Badge variant="outline" className="text-green-700 border-green-700">Vegan</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Prep time: <span className="font-medium">{selectedProduct.preparationTime} mins</span>
                  </p>
                  <p className="font-bold text-emerald-600 mt-2">
                    ${selectedProduct.price}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Size</label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Small">Small</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantity</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">
                      {selectedQuantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedProduct && addToCart(selectedProduct, selectedSize, selectedQuantity)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
