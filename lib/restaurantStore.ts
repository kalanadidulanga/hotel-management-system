import { addons, foodItems, restaurantOrders, tables, type Addon, type FoodItem, type FoodVariant, type OrderItem, type RestaurantOrder } from "@/data/restaurant-data";

// Simple in-memory store with pub/sub for client pages
// This will be reset on full reloads, which is fine for mock data usage

export type NewOrderItemInput = {
  foodItemId?: number; // optional if mapping from ad-hoc product
  name?: string;
  unitPrice: number;
  quantity: number;
  variantName?: string;
  size?: 'Small' | 'Medium' | 'Large';
  addonIds?: number[];
};

export type NewOrderInput = {
  customerName: string;
  customerType: RestaurantOrder['customerType'];
  waiterName: string;
  tableNumber?: string; // e.g., "T001"
  items: NewOrderItemInput[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  totalAmount: number;
};

let orders: RestaurantOrder[] = [...restaurantOrders];
const listeners = new Set<() => void>();

export function getOrders() {
  return orders;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  for (const l of listeners) l();
}

function genOrderNumber(): string {
  const maxId = orders.reduce((m, o) => Math.max(m, o.id), 0) + 1;
  return `ORD-${maxId}`;
}

function findOrMockFoodItem(input: NewOrderItemInput): { food: FoodItem; variant: FoodVariant } {
  // Try to resolve by foodItemId
  if (input.foodItemId) {
    const food = foodItems.find(f => f.id === input.foodItemId) || foodItems[0];
    const variant = food.variants[0];
    return { food, variant };
  }

  // Otherwise create a mock FoodItem from provided name/price
  const name = input.name ?? 'Custom Item';
  const basePrice = input.unitPrice;
  const mock: FoodItem = {
    id: 100000 + Math.floor(Math.random() * 100000),
    name,
    categoryId: 0,
    category: 'Custom',
    basePrice,
    variants: [
      { id: 900001, name: input.variantName ?? 'Regular', price: basePrice, size: input.size ?? 'Medium' }
    ],
    addons: [],
    availability: true,
    image: 'https://images.unsplash.com/photo-1551214012-84f95e060dee?q=80&w=400&auto=format&fit=crop',
    description: name,
    preparationTime: 10,
    isVegetarian: false,
    isSpicy: false,
    ingredients: []
  };
  return { food: mock, variant: mock.variants[0] };
}

export function addOrder(input: NewOrderInput): RestaurantOrder {
  const now = new Date().toISOString();
  const id = orders.reduce((m, o) => Math.max(m, o.id), 0) + 1;
  const orderNumber = genOrderNumber();

  // Resolve table by number (optional)
  const table = input.tableNumber ? (tables.find(t => t.number === input.tableNumber) ?? tables[0]) : tables[0];

  // Build items
  const items: OrderItem[] = input.items.map((it, idx) => {
    const { food, variant } = findOrMockFoodItem(it);
    const selectedAddons: Addon[] = (it.addonIds ?? []).map(aid => addons.find(a => a.id === aid)).filter(Boolean) as Addon[];
    const totalPrice = it.unitPrice * it.quantity + selectedAddons.reduce((s, a) => s + a.price, 0);
    return {
      id: idx + 1,
      foodItemId: food.id,
      foodItem: food,
      variantId: variant.id,
      variant,
      quantity: it.quantity,
      addons: selectedAddons,
      unitPrice: it.unitPrice,
      totalPrice,
    };
  });

  const order: RestaurantOrder = {
    id,
    orderNumber,
    tableId: table.id,
    table,
    customerId: undefined,
    customerName: input.customerName,
    customerType: input.customerType,
    items,
    status: 'pending',
    waiterId: 0,
    waiterName: input.waiterName,
    subtotal: input.subtotal,
    tax: input.tax,
    serviceCharge: input.serviceCharge,
    discount: input.discount,
    totalAmount: input.totalAmount,
    paymentStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  orders = [order, ...orders];
  emit();
  return order;
}

export function updateOrder(id: number, updates: Partial<RestaurantOrder>): RestaurantOrder | undefined {
  let updated: RestaurantOrder | undefined;
  orders = orders.map(o => {
    if (o.id === id) {
      updated = { ...o, ...updates, updatedAt: new Date().toISOString() };
      return updated;
    }
    return o;
  });
  emit();
  return updated;
}
