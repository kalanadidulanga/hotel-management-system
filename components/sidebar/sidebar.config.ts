import {
  LucideIcon,
  Home,
  Waves,
  Utensils,
  Wrench,
  Calendar,
  Truck,
  MessageCircle,
  FileText,
  List,
  Users,
  UtensilsCrossed,
  Settings,
  Plus,
  Bed,
  CreditCard,
  User,
  Cog,
  Car,
  Facebook,
  RotateCcw,
  HelpCircle,
  Archive,
  Clock,
  CheckCircle,
  XCircle,
  Monitor,
  Volume2,
  Table,
  Layers3,
  Coffee,
  Award,
  ReceiptEuro,
  Users2Icon,
} from "lucide-react";

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
    icon: User,
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
    label: "Room Facilities",
    icon: User,
    addon: true,
    roles: ["superadmin", "manager"],
    children: [
      {
        label: "Facility List",
        icon: FileText,
        route: "/room-facilities/room-facilities-list",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Facility Deatils List",
        icon: List,
        route: "/room-facilities/room-facilities-details-list",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Room Size List",
        icon: List,
        route: "/room-facilities/room-size-list",
        roles: ["superadmin", "manager"],
      },
    ],
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
        route: "/room-reservation/check-in",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Check Out",
        icon: List,
        route: "/room-reservation/check-out",
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
    label: "Human Resource",
    icon: Users,
    addon: true,
    roles: ["superadmin", "manager"],
    children: [
      {
        label: "Attendance",
        icon: FileText,
        route: "/human-resource/attendance",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Award",
        icon: Award,
        route: "/human-resource/award",
        roles: ["superadmin", "manager"],
      },
      {
        label: "Recruitment",
        icon: ReceiptEuro,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "New Candidate",
            icon: Plus,
            route: "/human-resource/recruitment/new-candidate",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Manage Candidate",
            icon: List,
            route: "/human-resource/recruitment/manage-candidate",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Candidate Shortlist",
            icon: List,
            route: "/human-resource/recruitment/shortlist",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Interview",
            icon: Calendar,
            route: "/human-resource/recruitment/interview",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Candidate Selection",
            icon: List,
            route: "/human-resource/recruitment/selection",
            roles: ["superadmin", "manager"],
          },
        ],
      },
      {
        label: "Department",
        icon: Users,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Department List",
            icon: List,
            route: "/human-resource/recruitment/department",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Division List",
            icon: List,
            route: "/human-resource/recruitment/division",
            roles: ["superadmin", "manager"],
          },
        ],
      },
      {
        label: "Employee",
        icon: Users2Icon,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Position",
            icon: List,
            route: "/human-resource/employee/positions",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Add Employee",
            icon: Settings,
            route: "/human-resource/employee/employee-setting",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Manage Employee",
            icon: List,
            route: "/human-resource/employee/manage-employee",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Employee Performance",
            icon: ReceiptEuro,
            route: "/human-resource/employee/performance",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Manage Employee Salary",
            icon: ReceiptEuro,
            route: "/human-resource/employee/salary",
            roles: ["superadmin", "manager"],
          },
        ],
      },
      {
        label: "Leave",
        icon: Calendar,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Weekly Holiday",
            icon: Calendar,
            route: "/human-resource/leave/weekly-holiday",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Holiday",
            icon: Settings,
            route: "/human-resource/leave/holiday",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Leave Type",
            icon: List,
            route: "/human-resource/leave/type",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Leave Application",
            icon: FileText,
            route: "/human-resource/leave/application",
            roles: ["superadmin", "manager"],
          },
        ],
      },
      {
        label: "Loan",
        icon: ReceiptEuro,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Grant Loan",
            icon: Plus,
            route: "/human-resource/loan/grant",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Loan Installment",
            icon: ReceiptEuro,
            route: "/human-resource/loan/installment",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Loan Report",
            icon: List,
            route: "/human-resource/loan/report",
            roles: ["superadmin", "manager"],
          },
        ],
      },
      {
        label: "Payroll",
        icon: ReceiptEuro,
        roles: ["superadmin", "manager"],
        children: [
          {
            label: "Salary Type Setup",
            icon: Settings,
            route: "/human-resource/payroll/salary-type",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Salary Setup",
            icon: FileText,
            route: "/human-resource/payroll/setup",
            roles: ["superadmin", "manager"],
          },
          {
            label: "Salary Genarate",
            icon: List,
            route: "/human-resource/payroll/genarate",
            roles: ["superadmin", "manager"],
          },
        ],
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
