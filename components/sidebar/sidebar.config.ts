import { LucideIcon, Home, Calendar, Utensils, Wrench, FileText, Truck, MessageCircle } from "lucide-react";

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
    label: "Dashboard",
    icon: Home,
    route: "/dashboard",
    roles: ["superadmin", "manager", "cashier"],
  },
  {
    label: "Pool Booking",
    icon: Calendar,
    route: "/pool-booking",
    addon: true,
    roles: ["superadmin"],
  },
  {
    label: "Restaurent",
    icon: Utensils,
    addon: true,
    roles: ["superadmin", "manager"],
    children: [
      { label: "POS Invoice", icon: FileText, route: "/restuarent/pos-invoice", roles: ["superadmin", "manager"] },
      { label: "Order List", icon: FileText, route: "/restuarent/order-list", roles: ["superadmin", "manager"] },
      {
        label: "Manage Table",
        icon: FileText,
        roles: ["superadmin", "manager"],
        children: [
          { label: "Table List", icon: FileText, route: "/restuarent/manage-table/table-list", roles: ["superadmin", "manager"] },
          { label: "Table Setting", icon: FileText, route: "/restuarent/manage-table/table-setting", roles: ["superadmin", "manager"] },
        ],
      },
      // Add more sub-items as needed
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
    icon: FileText,
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
  // Add more items as needed
]; 