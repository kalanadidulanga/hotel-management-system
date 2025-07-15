import { LucideIcon, Home, Waves, Utensils, Wrench, Calendar, Truck, MessageCircle, 
  FileText, List, Zap, Users, UtensilsCrossed, Settings, Plus, Bed, CreditCard,
  User, Cog, Car, Facebook, RotateCcw, HelpCircle } from "lucide-react";

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
        icon: Zap,
        route: "/restaurant/pending-order",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Complete Order",
        icon: FileText,
        route: "/restaurant/complete-order",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Cancel Order",
        icon: FileText,
        route: "/restaurant/cancel-order",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Counter Dashboard",
        icon: Home,
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
        icon: Settings,
        route: "/restaurant/sound-setting",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Manage Table",
        icon: UtensilsCrossed,
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
        route: "/restaurant/customer-type",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Manage Category",
        icon: List,
        route: "/restaurant/manage-category",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Manage Food",
        icon: UtensilsCrossed,
        route: "/restaurant/manage-food",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Manage Add-ons",
        icon: Plus,
        route: "/restaurant/manage-addons",
        roles: ["superadmin", "manager"],
      },
    ],
  },
  {
    label: "House Keeping",
    icon: Wrench,
    route: "/house-keeping",
    addon: true,
    roles: ["superadmin", "manager"],
    children: [
      {
        label: "Assign Room Cleaning",
        icon: FileText,
        route: "/house_keeping/assign-room-cleaning",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Room Cleaning",
        icon: List,
        route: "/house_keeping/room-cleaning",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Cheklist",
        icon: Zap,
        route: "/house_keeping/checklist",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Room QR List",
        icon: FileText,
        route: "/house_keeping/room-qrcode",
        roles: ["superadmin", "manager"],
      },

      {
        label: "Laundry",
        icon: UtensilsCrossed,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Laundry Products List",
            icon: List,
            route: "/house_keeping/product-laundry",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Item List",
            icon: Settings,
            route: "/house_keeping/item_cost",
            roles: ["superadmin", "manager"],
          },
        ],
      },
      {
        label: "Customer Type",
        icon: Users,
        route: "/restaurant/customer-type",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Manage Category",
        icon: List,
        route: "/restaurant/manage-category",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Manage Food",
        icon: UtensilsCrossed,
        route: "/restaurant/manage-food",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Manage Add-ons",
        icon: Plus,
        route: "/restaurant/manage-addons",
        roles: ["superadmin", "manager"],
      },
    ],
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
    route: "/room-reservation",
    roles: ["superadmin", "manager"],
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
    label: "Customer",
    icon: Users,
    route: "/customer",
    roles: ["superadmin", "manager"],
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