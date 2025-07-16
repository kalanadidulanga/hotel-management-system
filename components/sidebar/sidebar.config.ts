import { LucideIcon, Home, Waves, Utensils, Wrench, Calendar, Truck, MessageCircle, 
  FileText, List, Users, UtensilsCrossed, Settings, Plus, Bed, CreditCard,
  User, Cog, Car, Facebook, RotateCcw, HelpCircle, Archive, Clock,
  CheckCircle, XCircle, Monitor, Volume2, Table, Layers3, Coffee } from "lucide-react";

export type Role = "superadmin" | "manager" | "cashier";

export type SidebarItem = {
  label: string;
  icon: LucideIcon;
  route?: string;
  addon?: boolean;
  roles: Role[];
  children?: SidebarItem[];
};

export const sidebarConfig: SidebarItem[] = [
  {
    label: "Pool Booking",
    icon: Waves,
    route: "/pool-booking",
    addon: true,
    roles: ["superadmin"],
  },
  {
    label: "Customer",
    icon: Users,
    addon: true,
    roles: ["superadmin", "manager"],
    children: [
      {
        label: "Customer List",
        icon: FileText,
        route: "/customer/customer-list",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Guest List",
        icon: List,
        route: "/customer/guest-list",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Wake Up Call List",
        icon: List,
        route: "/customer/wakeup-call",
        roles: ["superadmin", "manager"],
      },
    ],
  },
  {
    label: "Restaurant",
    icon: Utensils,
    addon: true,
    roles: ["superadmin", "manager"],
    children: [
      {
        label: "POS Invoice",
        icon: FileText,
        route: "/restaurant/pos-invoice",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Order List",
        icon: List,
        route: "/restaurant/order-list",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Pending Order",
        icon: Clock,
        route: "/restaurant/pending-order",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Complete Order",
        icon: CheckCircle,
        route: "/restaurant/complete-order",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Cancel Order",
        icon: XCircle,
        route: "/restaurant/cancel-order",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Counter Dashboard",
        icon: Monitor,
        route: "/restaurant/counter-dashboard",
        roles: ["superadmin", "manager"],
      },
      {
        label: "POS Setting",
        icon: Settings,
        route: "/restaurant/pos-setting",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Sound Setting",
        icon: Volume2,
        route: "/restaurant/sound-setting",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Manage Table",
        icon: Table,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Table List",
            icon: List,
            route: "/restaurant/manage-table/table-list",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Table Setting",
            icon: Settings,
            route: "/restaurant/manage-table/table-setting",
            roles: ["superadmin", "manager"],
          },
        ],
      },
      {
        label: "Customer Type",
        icon: Users,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Customer Type List",
            icon: List,
            route: "/restaurant/customer-type/list",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Card Terminal List",
            icon: CreditCard,
            route: "/restaurant/customer-type/card-terminal",
            roles: ["superadmin", "manager"],
          },
        ],
      },
      {
        label: "Manage Category",
        icon: Layers3,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Add Category",
            icon: Plus,
            route: "/restaurant/manage-category/add",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Category List",
            icon: List,
            route: "/restaurant/manage-category/list",
            roles: ["superadmin", "manager"],
          },
        ],
      },
      {
        label: "Manage Food",
        icon: Coffee,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Add Food",
            icon: Plus,
            route: "/restaurant/manage-food/add",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Food List",
            icon: List,
            route: "/restaurant/manage-food/list",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Food Variant",
            icon: UtensilsCrossed,
            route: "/restaurant/manage-food/variant",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Food Availability",
            icon: CheckCircle,
            route: "/restaurant/manage-food/availability",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Menu Type",
            icon: FileText,
            route: "/restaurant/manage-food/menu-type",
            roles: ["superadmin", "manager"],
          },
        ],
      },
      {
        label: "Manage Add-ons",
        icon: Plus,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Add Add-ons",
            icon: Plus,
            route: "/restaurant/manage-addons/add",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Add-ons List",
            icon: List,
            route: "/restaurant/manage-addons/list",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Add-ons Assign List",
            icon: Archive,
            route: "/restaurant/manage-addons/assign-list",
            roles: ["superadmin", "manager"],
          },
        ],
      },
    ],
  },
  {
    label: "House Keeping",
    icon: Wrench,
    route: "/house-keeping",
    addon: true,
    roles: ["superadmin", "manager"],
  },
  {
    label: "Duty Roster",
    icon: Calendar,
    route: "/duty-roster",
    addon: true,
    roles: ["superadmin", "manager"],
  },
  {
    label: "Transport Facility",
    icon: Truck,
    route: "/transport-facility",
    addon: true,
    roles: ["superadmin"],
  },
  {
    label: "Whatsapp",
    icon: MessageCircle,
    route: "/whatsapp",
    addon: true,
    roles: ["superadmin"],
  },
  {
    label: "Room Reservation",
    icon: Bed,
    addon: true,
    roles: ["superadmin", "manager"],
    children: [
      {
        label: "Booking List",
        icon: FileText,
        route: "/room-reservation/booking-list",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Check In",
        icon: List,
        route: "/room-reservation/checkin-list",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Check Out",
        icon: List,
        route: "/room-reservation/checkout-list",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Room Status",
        icon: List,
        route: "/room-reservation/room-status",
        roles: ["superadmin", "manager"],
      },
    ],
  },

  {
    label: "Room Facilities",
    icon: Bed,
    route: "/room-facilities",
    roles: ["superadmin", "manager"],
  },
  {
    label: "Hall Room",
    icon: Home,
    route: "/hall-room",
    roles: ["superadmin", "manager"],
  },
  {
    label: "Payment Setting",
    icon: CreditCard,
    route: "/payment-setting",
    roles: ["superadmin"],
  },
  {
    label: "Profile",
    icon: User,
    route: "/profile",
    roles: ["superadmin", "manager", "cashier"],
  },
  {
    label: "Settings",
    icon: Cog,
    route: "/settings",
    roles: ["superadmin"],
  },

  {
    label: "Car",
    icon: Car,
    route: "/car",
    roles: ["superadmin"],
  },
  {
    label: "Facebook",
    icon: Facebook,
    route: "/facebook",
    roles: ["superadmin"],
  },
  {
    label: "Sync",
    icon: RotateCcw,
    route: "/sync",
    roles: ["superadmin"],
  },
  {
    label: "Help",
    icon: HelpCircle,
    route: "/help",
    roles: ["superadmin", "manager", "cashier"],
  },
]; 