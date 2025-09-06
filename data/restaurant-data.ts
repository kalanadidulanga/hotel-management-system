// Restaurant Module Mock Data

export interface Table {
  id: number;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  location: string;
  shape: 'round' | 'square' | 'rectangular';
  currentOrder?: number;
  reservedBy?: string;
  reservedTime?: string;
}

export interface FoodCategory {
  id: number;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  sortOrder: number;
}

export interface FoodVariant {
  id: number;
  name: string;
  price: number;
  size: 'Small' | 'Medium' | 'Large';
}

export interface Addon {
  id: number;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export interface FoodItem {
  id: number;
  name: string;
  categoryId: number;
  category: string;
  basePrice: number;
  variants: FoodVariant[];
  addons: number[];
  availability: boolean;
  image: string;
  description: string;
  preparationTime: number;
  isVegetarian: boolean;
  isSpicy: boolean;
  ingredients: string[];
}

export interface OrderItem {
  id: number;
  foodItemId: number;
  foodItem: FoodItem;
  variantId: number;
  variant: FoodVariant;
  quantity: number;
  addons: Addon[];
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface RestaurantOrder {
  id: number;
  orderNumber: string;
  tableId: number;
  table: Table;
  customerId?: number;
  customerName: string;
  customerType: 'walk-in' | 'member' | 'hotel-guest';
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  waiterId: number;
  waiterName: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  totalAmount: number;
  paymentMethod?: 'cash' | 'card' | 'online';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number;
  actualTime?: number;
  notes?: string;
  cancellationReason?: string;
}

export interface KOTItem {
  name: string;
  quantity: number;
  specialInstructions?: string;
}

export interface KOT {
  id: number;
  orderNumber: string;
  tableNumber: string;
  items: KOTItem[];
  customerName: string;
  waiterName: string;
  orderTime: Date;
  priority: 'low' | 'normal' | 'high';
  status: 'active' | 'preparing' | 'ready' | 'completed';
  estimatedTime: number;
  specialNotes?: string;
}

export interface CustomerType {
  id: number;
  name: string;
  description: string;
  discountPercentage: number;
  isActive: boolean;
}

export interface PaymentTerminal {
  id: number;
  name: string;
  type: 'card' | 'mobile' | 'online';
  status: 'active' | 'inactive' | 'maintenance';
  location: string;
  lastTransaction?: string;
}

// Mock Data

export const tables: Table[] = [
  {
    id: 1,
    number: "T001",
    capacity: 4,
    status: 'occupied',
    location: "Main Hall",
    shape: 'round',
    currentOrder: 160,
  },
  {
    id: 2,
    number: "T002",
    capacity: 6,
    status: 'available',
    location: "Main Hall",
    shape: 'rectangular',
  },
  {
    id: 3,
    number: "T003",
    capacity: 2,
    status: 'reserved',
    location: "Window Side",
    shape: 'square',
    reservedBy: "John Doe",
    reservedTime: "19:30",
  },
  {
    id: 4,
    number: "T004",
    capacity: 8,
    status: 'cleaning',
    location: "Private Room",
    shape: 'rectangular',
  },
  {
    id: 5,
    number: "T005",
    capacity: 4,
    status: 'available',
    location: "Terrace",
    shape: 'round',
  },
];

export const foodCategories: FoodCategory[] = [
  {
    id: 1,
    name: "Appetizers",
    description: "Start your meal with our delicious appetizers",
    image: "https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=400&q=80",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 2,
    name: "Main Course",
    description: "Hearty main dishes for your satisfaction",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 3,
    name: "Beverages",
    description: "Refreshing drinks and beverages",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 4,
    name: "Desserts",
    description: "Sweet endings to your meal",
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=400&q=80",
    isActive: true,
    sortOrder: 4,
  },
];

export const addons: Addon[] = [
  {
    id: 1,
    name: "Extra Cheese",
    price: 2.50,
    category: "Dairy",
    isAvailable: true,
  },
  {
    id: 2,
    name: "Extra Spicy",
    price: 0.50,
    category: "Spice",
    isAvailable: true,
  },
  {
    id: 3,
    name: "Extra Sauce",
    price: 1.00,
    category: "Sauce",
    isAvailable: true,
  },
  {
    id: 4,
    name: "No Onions",
    price: 0.00,
    category: "Customization",
    isAvailable: true,
  },
];

export const foodItems: FoodItem[] = [
  {
    id: 1,
    name: "Chicken Caesar Salad",
    categoryId: 1,
    category: "Appetizers",
    basePrice: 12.50,
    variants: [
      { id: 1, name: "Regular", price: 12.50, size: 'Medium' },
      { id: 2, name: "Large", price: 16.50, size: 'Large' },
    ],
    addons: [1, 3],
    availability: true,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=400&q=80",
    description: "Fresh romaine lettuce with grilled chicken, parmesan cheese, and caesar dressing",
    preparationTime: 15,
    isVegetarian: false,
    isSpicy: false,
    ingredients: ["Romaine lettuce", "Grilled chicken", "Parmesan cheese", "Caesar dressing", "Croutons"],
  },
  {
    id: 2,
    name: "Margherita Pizza",
    categoryId: 2,
    category: "Main Course",
    basePrice: 18.00,
    variants: [
      { id: 3, name: "Personal", price: 14.00, size: 'Small' },
      { id: 4, name: "Regular", price: 18.00, size: 'Medium' },
      { id: 5, name: "Family", price: 24.00, size: 'Large' },
    ],
    addons: [1, 2],
    availability: true,
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&q=80",
    description: "Classic pizza with fresh mozzarella, tomato sauce, and basil",
    preparationTime: 25,
    isVegetarian: true,
    isSpicy: false,
    ingredients: ["Pizza dough", "Tomato sauce", "Fresh mozzarella", "Fresh basil", "Olive oil"],
  },
];

export const restaurantOrders: RestaurantOrder[] = [
  {
    id: 160,
    orderNumber: "ORD-160",
    tableId: 1,
    table: tables[0],
    customerId: 1,
    customerName: "Efe Chia",
    customerType: 'member',
    items: [
      {
        id: 1,
        foodItemId: 1,
        foodItem: foodItems[0],
        variantId: 1,
        variant: foodItems[0].variants[0],
        quantity: 2,
        addons: [addons[0]],
        unitPrice: 15.00,
        totalPrice: 30.00,
      },
    ],
    status: 'pending',
    waiterId: 1,
    waiterName: "John Smith",
    subtotal: 30.00,
    tax: 3.00,
    serviceCharge: 1.50,
    discount: 0.00,
    totalAmount: 34.50,
    paymentStatus: 'pending',
    createdAt: "2025-01-06T14:30:00Z",
    updatedAt: "2025-01-06T14:30:00Z",
    estimatedTime: 25,
  },
  {
    id: 161,
    orderNumber: "ORD-161",
    tableId: 2,
    table: tables[1],
    customerId: 2,
    customerName: "Aisha Khan",
    customerType: 'walk-in',
    items: [
      {
        id: 2,
        foodItemId: 2,
        foodItem: foodItems[1],
        variantId: 4,
        variant: foodItems[1].variants[1],
        quantity: 1,
        addons: [addons[1]],
        unitPrice: 18.00,
        totalPrice: 18.50,
      },
    ],
    status: 'preparing',
    waiterId: 2,
    waiterName: "Maria Lopez",
    subtotal: 18.50,
    tax: 1.85,
    serviceCharge: 0.93,
    discount: 0.00,
    totalAmount: 21.28,
    paymentStatus: 'pending',
    createdAt: "2025-01-06T15:10:00Z",
    updatedAt: "2025-01-06T15:15:00Z",
    estimatedTime: 20,
  },
  {
    id: 162,
    orderNumber: "ORD-162",
    tableId: 3,
    table: tables[2],
    customerId: 3,
    customerName: "Chen Wei",
    customerType: 'member',
    items: [
      {
        id: 3,
        foodItemId: 1,
        foodItem: foodItems[0],
        variantId: 2,
        variant: foodItems[0].variants[1],
        quantity: 1,
        addons: [addons[0]],
        unitPrice: 16.50,
        totalPrice: 19.00,
      },
    ],
    status: 'ready',
    waiterId: 3,
    waiterName: "Noah Patel",
    subtotal: 19.00,
    tax: 1.90,
    serviceCharge: 0.95,
    discount: 2.00,
    totalAmount: 19.85,
    paymentStatus: 'pending',
    createdAt: "2025-01-06T15:20:00Z",
    updatedAt: "2025-01-06T15:30:00Z",
    estimatedTime: 10,
  },
  {
    id: 163,
    orderNumber: "ORD-163",
    tableId: 4,
    table: tables[3],
    customerId: 4,
    customerName: "Priya Sharma",
    customerType: 'walk-in',
    items: [
      {
        id: 4,
        foodItemId: 2,
        foodItem: foodItems[1],
        variantId: 5,
        variant: foodItems[1].variants[2],
        quantity: 2,
        addons: [addons[0], addons[2]],
        unitPrice: 24.00,
        totalPrice: 50.00,
      },
    ],
    status: 'served',
    waiterId: 4,
    waiterName: "Liam Johnson",
    subtotal: 50.00,
    tax: 5.00,
    serviceCharge: 2.50,
    discount: 0.00,
    totalAmount: 57.50,
    paymentStatus: 'paid',
    paymentMethod: 'card',
    createdAt: "2025-01-05T18:45:00Z",
    updatedAt: "2025-01-05T19:10:00Z",
    actualTime: 30,
  },
  {
    id: 164,
    orderNumber: "ORD-164",
    tableId: 5,
    table: tables[4],
    customerId: 5,
    customerName: "Sarah Green",
    customerType: 'hotel-guest',
    items: [
      {
        id: 5,
        foodItemId: 1,
        foodItem: foodItems[0],
        variantId: 1,
        variant: foodItems[0].variants[0],
        quantity: 1,
        addons: [],
        unitPrice: 12.50,
        totalPrice: 12.50,
      },
      {
        id: 6,
        foodItemId: 2,
        foodItem: foodItems[1],
        variantId: 3,
        variant: foodItems[1].variants[0],
        quantity: 1,
        addons: [],
        unitPrice: 14.00,
        totalPrice: 14.00,
      },
    ],
    status: 'completed',
    waiterId: 2,
    waiterName: "Maria Lopez",
    subtotal: 26.50,
    tax: 2.65,
    serviceCharge: 1.33,
    discount: 0.00,
    totalAmount: 30.48,
    paymentStatus: 'paid',
    paymentMethod: 'online',
    createdAt: "2024-12-31T20:10:00Z",
    updatedAt: "2024-12-31T20:40:00Z",
    actualTime: 28,
  },
  {
    id: 165,
    orderNumber: "ORD-165",
    tableId: 1,
    table: tables[0],
    customerId: 6,
    customerName: "David Park",
    customerType: 'walk-in',
    items: [
      {
        id: 7,
        foodItemId: 1,
        foodItem: foodItems[0],
        variantId: 1,
        variant: foodItems[0].variants[0],
        quantity: 3,
        addons: [addons[3]],
        unitPrice: 12.50,
        totalPrice: 37.50,
      },
    ],
    status: 'cancelled',
    waiterId: 1,
    waiterName: "John Smith",
    subtotal: 37.50,
    tax: 3.75,
    serviceCharge: 1.88,
    discount: 0.00,
    totalAmount: 43.13,
    paymentStatus: 'refunded',
    createdAt: "2024-12-28T12:00:00Z",
    updatedAt: "2024-12-28T12:20:00Z",
    cancellationReason: "Customer change of mind",
  },
  {
    id: 166,
    orderNumber: "ORD-166",
    tableId: 2,
    table: tables[1],
    customerId: 7,
    customerName: "Emma Wilson",
    customerType: 'member',
    items: [
      {
        id: 8,
        foodItemId: 2,
        foodItem: foodItems[1],
        variantId: 4,
        variant: foodItems[1].variants[1],
        quantity: 2,
        addons: [addons[0], addons[2]],
        unitPrice: 18.00,
        totalPrice: 38.00,
      },
    ],
    status: 'preparing',
    waiterId: 4,
    waiterName: "Liam Johnson",
    subtotal: 38.00,
    tax: 3.80,
    serviceCharge: 1.90,
    discount: 3.80,
    totalAmount: 39.90,
    paymentStatus: 'pending',
    createdAt: "2025-01-04T11:05:00Z",
    updatedAt: "2025-01-04T11:15:00Z",
    estimatedTime: 18,
  },
  {
    id: 167,
    orderNumber: "ORD-167",
    tableId: 5,
    table: tables[4],
    customerId: 8,
    customerName: "Olivia Martin",
    customerType: 'walk-in',
    items: [
      {
        id: 9,
        foodItemId: 1,
        foodItem: foodItems[0],
        variantId: 2,
        variant: foodItems[0].variants[1],
        quantity: 2,
        addons: [],
        unitPrice: 16.50,
        totalPrice: 33.00,
      },
    ],
    status: 'ready',
    waiterId: 3,
    waiterName: "Noah Patel",
    subtotal: 33.00,
    tax: 3.30,
    serviceCharge: 1.65,
    discount: 0.00,
    totalAmount: 37.95,
    paymentStatus: 'pending',
    createdAt: "2025-01-03T17:25:00Z",
    updatedAt: "2025-01-03T17:35:00Z",
    estimatedTime: 12,
  },
  {
    id: 168,
    orderNumber: "ORD-168",
    tableId: 3,
    table: tables[2],
    customerId: 9,
    customerName: "Ethan Brown",
    customerType: 'member',
    items: [
      {
        id: 10,
        foodItemId: 2,
        foodItem: foodItems[1],
        variantId: 3,
        variant: foodItems[1].variants[0],
        quantity: 1,
        addons: [addons[2]],
        unitPrice: 14.00,
        totalPrice: 15.00,
      },
    ],
    status: 'completed',
    waiterId: 2,
    waiterName: "Maria Lopez",
    subtotal: 15.00,
    tax: 1.50,
    serviceCharge: 0.75,
    discount: 1.00,
    totalAmount: 16.25,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    createdAt: "2025-01-02T13:10:00Z",
    updatedAt: "2025-01-02T13:45:00Z",
    actualTime: 20,
  },
];

export const kotList: KOT[] = [
  {
    id: 1,
    orderNumber: "ORD-160",
    tableNumber: "T001",
    items: [
      { name: "Chicken Caesar Salad", quantity: 2, specialInstructions: "Extra cheese" },
    ],
    customerName: "Efe Chia",
    waiterName: "John Smith",
    orderTime: new Date("2025-01-06T14:35:00Z"),
    priority: 'normal',
    estimatedTime: 25,
    status: 'preparing',
    specialNotes: "Handle with care",
  },
  {
    id: 2,
    orderNumber: "ORD-161",
    tableNumber: "T002",
    items: [
      { name: "Margherita Pizza", quantity: 1, specialInstructions: "Extra spicy" },
    ],
    customerName: "Aisha Khan",
    waiterName: "Maria Lopez",
    orderTime: new Date("2025-01-06T15:10:00Z"),
    priority: 'high',
    estimatedTime: 20,
    status: 'active',
  },
];

export const customerTypes: CustomerType[] = [
  {
    id: 1,
    name: "Walk-in Customer",
    description: "Regular walk-in customers",
    discountPercentage: 0,
    isActive: true,
  },
  {
    id: 2,
    name: "VIP Member",
    description: "VIP membership holders",
    discountPercentage: 15,
    isActive: true,
  },
  {
    id: 3,
    name: "Hotel Guest",
    description: "Guests staying at the hotel",
    discountPercentage: 10,
    isActive: true,
  },
];

export const paymentTerminals: PaymentTerminal[] = [
  {
    id: 1,
    name: "Main Counter Terminal",
    type: 'card',
    status: 'active',
    location: "Main Counter",
    lastTransaction: "2025-01-06T15:30:00Z",
  },
  {
    id: 2,
    name: "Mobile Terminal 1",
    type: 'mobile',
    status: 'active',
    location: "Table Service",
  },
  {
    id: 3,
    name: "Online Gateway",
    type: 'online',
    status: 'active',
    location: "Digital",
  },
];
