# Hotel Management System - SRS

## Overview
A comprehensive hotel management system designed to streamline operations across front office, human resources, customer management, restaurant services, inventory, and financial management.

## System Modules

### Module 01 - Front Office
- **1.1** Dedicated logins for each front office staff
- **1.2** Staff creation and assignment using HR module (2.3)
- **1.3** Room booking requests with customer details (NIC required)
- **1.4** Quick customer verification by NIC lookup
- **1.5** Recording of quick orders for in-room customers
- **1.6** Cash flow management with remarks

### Module 02 - Human Resource
- **2.1** Department creation (front office, kitchen, etc.)
- **2.2** Staff class management with salary structures (hourly/daily/monthly) and leave policies
- **2.3** Staff login creation with department assignment
- **2.4** Daily attendance tracking and leave management
- **2.5** Holiday limit monitoring with admin notifications
- **2.6** Night shift scheduling and staff assignment
- **2.7** Automated salary calculations
- **2.8** Advance settlement calculations for selected periods
- **2.9** Staff recruitment with complete biography and document storage
- **2.10** Staff appraisal scheduling with notifications
- **2.11** Custom access privilege assignment:
  - Access to add new users
  - Access to place restaurant orders
  - Access to inventory
  - Access to room setting
  - Access to Accounts (GL excluded)
  - Access to GL
  - Access to unit pricing

### Module 03 - Customer Management
- **3.1** Customer creation through front office
- **3.2** Dedicated staff CRUD operations for customers and VIP marking
- **3.3** VIP customer highlighting during NIC lookup

### Module 04 - Unit and Price
- **4.1** Unit creation for ingredients with cost management
- **4.2** End product creation with pricing
- **4.3** Ingredient mapping to end products
- **4.4** Product categorization (Small, Large, Portion)

### Module 05 - Fixed Assets
- **5.1** Fixed asset listing with maintenance scheduling
- **5.2** Maintenance date notifications
- **5.3** Maintenance logging with cost tracking
- **5.4** Utensil management with purchase price and maintenance dates
- **5.5** Asset search by item code or name

### Module 06 - Room Setting
- **6.1** Room class creation (Deluxe, Super Luxury, Single)
- **6.2** Pricing for night stays and day use
- **6.3** Cleaning frequency management (Admin only)
- **6.4** Customer billing integration for room services

### Module 07 - Room Reservation
- **7.1** Room availability checking by code or manual filtering
- **7.2** Reservation management with payment tracking
- **7.3** Monthly appointment viewing with income reports
- **7.4** Discount management (percentage or fixed amount)

### Module 08 - Restaurant
- **8.1** Access for restaurant staff and front office
- **8.2** Table management with capacity tracking
- **8.3** Order placement with staff assignment
- **8.4** Automatic inventory deduction for orders
- **8.5** KOT (Kitchen Order Ticket) generation
- **8.6** Customer bill preparation and printing

### Module 09 - Inventory and Supply Management
- **9.1** Supplier management with supply frequency tracking
- **9.2** Product creation with supplier pricing
- **9.3** Minor product addition without supplier requirement
- **9.4** Automatic inventory reduction for customer purchases
- **9.5** Stock alert level management
- **9.6** Monthly stock issuing graph generation

### Module 10 - Accounts
#### 10.1 General Ledger (GL)
- Automatic financial transaction recording
- Ledger report generation with filtering options

#### 10.2 Debtor's Management (Receivable)
- Outstanding customer balance tracking
- Debtor statement generation
- Overdue payment monitoring

#### 10.3 Creditor's Management (Account Payable)
- Supplier payable tracking
- Due date management with alerts
- Creditors aging report

#### 10.4 Cash and Bank
- Daily cash flow recording
- Cash reconciliation
- Multiple bank account management

#### 10.5 Expense Tracking
- Operational expense recording
- Expense categorization for reporting

#### 10.6 Salaries and Payroll Integration
- Automatic salary reflection in accounts
- Advance settlement recording
- Monthly payroll expense reports

#### 10.7 Income and Profit Analysis
- Revenue source summarization
- Income vs. expense analysis
- Department-wise profit analysis

#### 10.8 Taxation (Optional)
- Tax percentage configuration
- Automatic tax calculation during billing
- Tax report generation

### Module 11 - Reporting
- **11.1** Daily Income Report (cash + card + credit)
- **11.2** Profit & Loss Statement
- **11.3** Balance Sheet
- **11.4** Cash Flow Statement
- **11.5** Customized financial reports (PDF/Excel export)
- **11.6** Manual invoice generation
- **11.7** Manual quotation generation

## Database Design (Suggested)

### Key Tables Structure

#### Module 02 - Human Resources
- **Department**: department management
- **StaffClass**: staff classification with salary structures
- **Staff**: employee information with department assignment
- **StaffPrivileges**: custom access control
- **Attendance**: daily attendance tracking
- **Shift**: shift management
- **Salary**: salary calculations and payments

#### Module 03 - Customer Management
- **Customer**: customer information with VIP status

#### Module 01+07 - Front Office and Reservations
- **RoomClass**: room type definitions
- **Room**: individual room management
- **Reservation**: booking management
- **QuickOrder**: in-room service orders
- **CashFlow**: cash management tracking

#### Module 04 - Pricing
- **Unit**: measurement units
- **Ingredient**: inventory items
- **Product**: end products
- **ProductCategory**: product variations
- **ProductIngredient**: recipe management

#### Module 05 - Assets
- **Asset**: fixed assets and utensils
- **MaintenanceLog**: maintenance tracking

#### Module 08 - Restaurant
- **TableRestaurant**: table management
- **FoodOrder**: order processing
- **KOT**: kitchen order tickets
- **Bill**: customer billing

#### Module 09 - Inventory
- **Supplier**: supplier management
- **SupplierProduct**: supplier-product relationships
- **StockTransaction**: inventory movements
- **StockAlert**: stock level alerts

#### Module 10 - Accounts
- **Ledger**: general ledger entries
- **Debtor**: receivable management
- **Creditor**: payable management
- **BankAccount**: bank account management
- **Expense**: expense tracking

## Development Workflow (Suggested by ChatGPT)

### Phase 1 - Foundation Setup
- Authentication & Role Management
- Database schema setup
- Privilege system implementation
- Basic dashboard layout

### Phase 2 - Core Operations (Front Office & Customers)
1. **Module 03** - Customer Management
2. **Module 01** - Front Office
3. **Module 06** - Room Setting
4. **Module 07** - Room Reservation

*Milestone: Basic hotel booking + customer + front office workflow operational*

### Phase 3 - Human Resource Management (Module 02)
1. Departments & Staff Classes
2. Staff creation + login assignment
3. Attendance + Leave tracking
4. Shift management
5. Salary auto calculation & advance settlements
6. Staff recruitment docs & appraisals

*Milestone: Functioning HR system connected with payroll*

### Phase 4 - Restaurant & Orders
1. **Module 04** - Unit & Pricing
2. **Module 08** - Restaurant

*Milestone: Room + restaurant orders + billing working smoothly*

### Phase 5 - Inventory & Assets
1. **Module 09** - Inventory & Supply Management
2. **Module 05** - Fixed Assets

*Milestone: Smooth supply + maintenance tracking*

### Phase 6 - Accounts & Finance
1. **Module 10** - Accounts

*Milestone: All income & expenses integrated into finance*

### Phase 7 - Reporting & Analytics
1. **Module 11** - Reporting

*Milestone: Complete system ready for decision-making*

## Parallel Work Possibilities
- **Team 1**: Front Office + Customers + Rooms
- **Team 2**: HR Module (Staff + Attendance + Salary)
- **Later**: Restaurant & Inventory development in parallel

## Key Features
- **Role-based Access Control**: Customizable permissions for different staff levels
- **Real-time Inventory Management**: Automatic stock updates with order processing
- **Integrated Financial System**: Complete accounting with automated ledger entries
- **Comprehensive Reporting**: Multiple report formats with PDF/Excel export
- **Customer Relationship Management**: VIP customer tracking and history
- **Staff Management**: Complete HR solution with attendance and payroll
- **Multi-departmental Operations**: Seamless integration across hotel departments

## Technical Requirements
- Database management system for data storage
- User authentication and authorization system
- Report generation capabilities (PDF/Excel)
- Print functionality for KOT and bills
- Date/time management for scheduling
- Notification system for alerts and reminders

## Access Levels
- **Admin**: Full system access including GL and staff management
- **Front Office Staff**: Customer management, reservations, cash flow
- **Dedicated Staff**: Specialized access based on assigned privileges
- **Restaurant Staff**: Order management and billing
- **Department Staff**: Role-specific access to relevant modules