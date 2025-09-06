# Restaurant Module - Product Requirements Document (PRD)

## Overview
Complete restaurant management system with comprehensive UI/UX for hotel operations, covering POS, order management, table management, food catalog, and reporting.

## Module 08 - Restaurant Requirements (From SRS)
- **8.1** Access for restaurant staff and front office
- **8.2** Table management with capacity tracking
- **8.3** Order placement with staff assignment
- **8.4** Automatic inventory deduction for orders
- **8.5** KOT (Kitchen Order Ticket) generation
- **8.6** Customer bill preparation and printing

## UI Pages Implementation Plan

### ✅ **Currently Implemented**
1. **POS Invoice** (`/restaurant/pos-invoice`) - Complete POS system
2. **Order List** (`/restaurant/order-list`) - Order management with filtering
3. **Table List** (`/restaurant/manage-table/table-list`) - Basic implementation
4. **Table Setting** (`/restaurant/manage-table/table-setting`) - Basic implementation

### 🔄 **Pages to Build**

#### **Core Order Management**
5. **Pending Order** (`/restaurant/pending-order`)
   - Real-time pending orders display
   - Order status updates
   - Kitchen notification system
   - Priority ordering

6. **Complete Order** (`/restaurant/complete-order`)
   - Completed orders history
   - Order completion tracking
   - Customer satisfaction feedback
   - Delivery confirmation

7. **Cancel Order** (`/restaurant/cancel-order`)
   - Cancelled orders log
   - Cancellation reasons
   - Refund processing
   - Inventory restoration

#### **Dashboard & Monitoring**
8. **Counter Dashboard** (`/restaurant/counter-dashboard`)
   - Real-time order status
   - Table occupancy overview
   - Staff performance metrics
   - Revenue tracking

#### **System Configuration**
9. **POS Setting** (`/restaurant/pos-setting`)
   - POS system configuration
   - Payment method settings
   - Tax configuration
   - Receipt customization

10. **Sound Setting** (`/restaurant/sound-setting`)
    - Order notification sounds
    - Kitchen alert tones
    - Volume controls
    - Sound preferences

#### **Table Management Enhancement**
11. **Enhanced Table List** (Upgrade existing)
    - Interactive table layout
    - Real-time occupancy status
    - Reservation integration
    - Table capacity management

12. **Enhanced Table Setting** (Upgrade existing)
    - Visual table designer
    - Seating arrangements
    - Table categories
    - Floor plan management

#### **Customer Management**
13. **Customer Type List** (`/restaurant/customer-type/list`)
    - Customer categories
    - Loyalty programs
    - Discount tiers
    - Member benefits

14. **Card Terminal List** (`/restaurant/customer-type/card-terminal`)
    - Payment terminals
    - Card processing setup
    - Terminal status monitoring
    - Transaction logs

#### **Category Management**
15. **Add Category** (`/restaurant/manage-category/add`)
    - Food category creation
    - Category hierarchy
    - Image uploads
    - Category descriptions

16. **Category List** (`/restaurant/manage-category/list`)
    - Category management
    - Edit/delete categories
    - Category analytics
    - Menu organization

#### **Food Management**
17. **Add Food** (`/restaurant/manage-food/add`)
    - Food item creation
    - Recipe management
    - Pricing setup
    - Nutritional information

18. **Food List** (`/restaurant/manage-food/list`)
    - Complete food catalog
    - Inventory tracking
    - Price management
    - Availability status

19. **Food Variant** (`/restaurant/manage-food/variant`)
    - Size variations (Small, Medium, Large)
    - Customization options
    - Variant pricing
    - Special preparations

20. **Food Availability** (`/restaurant/manage-food/availability`)
    - Real-time availability
    - Stock management
    - Out-of-stock notifications
    - Seasonal items

21. **Menu Type** (`/restaurant/manage-food/menu-type`)
    - Menu categories
    - Breakfast/Lunch/Dinner
    - Special menus
    - Seasonal offerings

#### **Add-ons Management**
22. **Add Add-ons** (`/restaurant/manage-addons/add`)
    - Extra items creation
    - Add-on pricing
    - Compatibility settings
    - Preparation instructions

23. **Add-ons List** (`/restaurant/manage-addons/list`)
    - Add-on catalog
    - Price management
    - Availability tracking
    - Popular add-ons

24. **Add-ons Assign List** (`/restaurant/manage-addons/assign-list`)
    - Food-addon relationships
    - Automatic suggestions
    - Combo deals
    - Bundle pricing

## UI/UX Design Principles

### **Consistent Design Language**
- Modern, clean interface matching existing pages
- Consistent color scheme and typography
- Responsive design for all screen sizes
- Intuitive navigation patterns

### **Key UI Components**
- **Search & Filter**: Advanced filtering on all list pages
- **Data Tables**: Sortable, paginated tables with actions
- **Forms**: Comprehensive forms with validation
- **Modals**: Quick actions and detailed views
- **Cards**: Visual representation of items
- **Status Badges**: Clear status indicators
- **Action Buttons**: Consistent button styles and placement

### **Mock Data Structure**
```typescript
// Table Management
interface Table {
  id: number;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  location: string;
  shape: 'round' | 'square' | 'rectangular';
}

// Food Items
interface FoodItem {
  id: number;
  name: string;
  category: string;
  price: number;
  variants: FoodVariant[];
  addons: Addon[];
  availability: boolean;
  image: string;
  description: string;
}

// Orders
interface RestaurantOrder {
  id: number;
  orderNumber: string;
  tableId: number;
  customerId?: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  waiterId: number;
  totalAmount: number;
  createdAt: Date;
}

// KOT (Kitchen Order Ticket)
interface KOT {
  id: number;
  orderId: number;
  items: KOTItem[];
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  status: 'pending' | 'preparing' | 'ready';
}
```

## Implementation Phases

### **Phase 1: Core Order Management** (Priority: High)
- Pending Order page
- Complete Order page  
- Cancel Order page
- Counter Dashboard

### **Phase 2: System Configuration** (Priority: Medium)
- POS Setting page
- Sound Setting page
- Enhanced Table Management

### **Phase 3: Food & Category Management** (Priority: Medium)
- Category management pages
- Food management pages
- Variant and availability management

### **Phase 4: Add-ons & Customer Management** (Priority: Low)
- Add-ons management pages
- Customer type management
- Card terminal management

## Success Criteria
- All 24 restaurant pages implemented with consistent UI/UX
- Mock data integration for realistic demonstrations
- Responsive design across all devices
- Intuitive user flows for restaurant operations
- Ready for backend integration
- Comprehensive PRD documentation

## Technical Notes
- Use existing UI component library (shadcn/ui)
- Follow established patterns from order-list and pos-invoice pages
- Implement proper TypeScript interfaces
- Use mock data files for easy backend transition
- Maintain consistent routing structure
- Ensure proper error handling and loading states
