"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { sidebarConfig, SidebarItem, Role } from "../sidebar/sidebar.config";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface AppSidebarMenuProps {
  userRole: Role;
  collapsed?: boolean;
}

function filterItemsByRole(items: SidebarItem[], role: Role): SidebarItem[] {
  return items
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children ? filterItemsByRole(item.children, role) : undefined,
    }));
}

export default function AppSidebarMenu({ userRole, collapsed = false }: AppSidebarMenuProps) {
  const pathname = usePathname();
  const items = filterItemsByRole(sidebarConfig, userRole);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Restaurant"]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isItemActive = (item: SidebarItem): boolean => {
    if (item.route && pathname === item.route) return true;
    if (item.children) {
      return item.children.some(child => isItemActive(child));
    }
    return false;
  };

  const renderMenuItem = (item: SidebarItem, level = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.label);
    const hasChildren = item.children && item.children.length > 0;

    if (collapsed && level === 0) {
      return (
        <div key={item.label} className="relative group">
          <Link
            href={item.route || "#"}
            className={cn(
              "flex items-center justify-center w-12 h-12 mx-2 my-1 rounded-lg transition-all duration-200 hover:bg-gray-700 relative",
              isActive ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.addon && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                Addon
              </span>
            )}
          </Link>
          {/* Tooltip for collapsed state */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {item.label}
          </div>
        </div>
      );
    }

    return (
      <div key={item.label} className={cn("", level > 0 && "")}>
        <div
          className={cn(
            "flex items-center px-3 py-2.5 mx-2 my-0.5 rounded-lg cursor-pointer transition-all duration-200 group",
            isActive ? "bg-green-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
            level > 0 && "py-2 text-sm ml-4"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.label);
            }
          }}
        >
          <Link
            href={item.route || "#"}
            className="flex items-center flex-1 gap-3"
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault();
              }
            }}
          >
            <item.icon className={cn("flex-shrink-0", level === 0 ? "w-5 h-5" : "w-4 h-4")} />
            <span className="flex-1 text-left font-medium">{item.label}</span>
            {item.addon && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                Addon
              </span>
            )}
          </Link>
          {hasChildren && (
            <div className="ml-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="overflow-hidden">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "h-full bg-gray-900 text-white flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header with logo */}
      <div className="flex items-center justify-center py-4 px-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="xainHotel Logo" width={32} height={32} />
          {!collapsed && (
            <span className="text-xl font-bold">
              <span className="text-white">xain</span>
              <span className="text-green-400">Hotel</span>
            </span>
          )}
        </Link>
      </div>

      {/* User info */}
      <div className="flex items-center px-4 py-3 border-b border-gray-800">
        <div className="w-2.5 h-2.5 bg-green-400 rounded-full flex-shrink-0"></div>
        {!collapsed && (
          <div className="ml-3">
            <div className="text-sm font-semibold text-white">Super Admin</div>
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className="flex-1 overflow-y-auto py-2">
        {items.map(item => renderMenuItem(item))}
      </div>
    </div>
  );
} 