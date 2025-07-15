"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
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
  const [expandedItems, setExpandedItems] = useState<string[]>(["Restaurant", "Manage Table"]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isItemActive = (item: SidebarItem): boolean => {
    // Only mark as active if it's an exact route match, not for parent items
    if (item.route && pathname === item.route) return true;
    return false;
  };

  const renderMenuItem = (item: SidebarItem, level = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.label);
    const hasChildren = item.children && item.children.length > 0;

    if (collapsed && level === 0) {
      return (
        <div key={item.label} className="relative group mb-3">
          <Link
            href={item.route || "#"}
            className={cn(
              "flex items-center justify-center w-12 h-12 mx-2 transition-all duration-200 relative",
              isActive ? "" : "text-sidebar-foreground hover:text-sidebar-primary"
            )}
            style={{
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isActive ? 'var(--sidebar-primary)' : 'transparent',
              color: isActive ? 'var(--sidebar-primary-foreground)' : undefined,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <item.icon className="w-5 h-5" />
          </Link>
          {/* Tooltip for collapsed state */}
          <div 
            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border"
            style={{
              backgroundColor: 'var(--card)',
              color: 'var(--card-foreground)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {item.label}
          </div>
        </div>
      );
    }

    return (
      <div key={item.label} className="mb-2">
        <div
          className={cn(
            "flex items-center px-4 py-2 mx-2 cursor-pointer transition-all duration-200 group relative",
            level > 0 && "py-1.5 ml-4 text-sm bg-transparent",
            level > 1 && "py-1 ml-4 text-xs"
          )}
          style={{
            borderRadius: 'var(--radius-lg)',
            backgroundColor: isActive ? 'var(--sidebar-primary)' : 'transparent',
            color: isActive ? 'var(--sidebar-primary-foreground)' : 'var(--sidebar-foreground)',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = level > 0 ? 'var(--sidebar-accent)' : 'var(--sidebar-accent)';
              e.currentTarget.style.color = 'var(--sidebar-accent-foreground)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--sidebar-foreground)';
            }
          }}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.label);
            }
          }}
        >
          <Link
            href={item.route || "#"}
            className="flex items-center flex-1 gap-2"
            onClick={(e) => {
              if (hasChildren) {
                e.preventDefault();
              }
            }}
          >
            <item.icon className={cn("flex-shrink-0", 
              level === 0 ? "w-4 h-4" : 
              level === 1 ? "w-3.5 h-3.5" : "w-3 h-3"
            )} />
            <span className={cn("flex-1 text-left text-sm", 
              level === 0 ? "font-medium" : "font-normal"
            )}>{item.label}</span>
          </Link>
          <div className="flex items-center gap-2">
            {hasChildren && !collapsed && (
              <div>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--sidebar-foreground)' }} />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--sidebar-foreground)' }} />
                )}
              </div>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && !collapsed && (
          <div className={cn("mt-1", level === 0 ? "ml-2" : level === 1 ? "ml-4" : "ml-6")}>
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "h-full flex flex-col transition-all duration-300 border-r",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        backgroundColor: 'var(--sidebar)',
        color: 'var(--sidebar-foreground)',
        borderColor: 'var(--sidebar-border)'
      }}
    >
      {/* Header with logo */}
      <div className="flex items-center justify-center py-5 px-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <Link href="/" className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-full flex items-center justify-center border"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border)'
            }}
          >
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <span className="text-xs font-bold" style={{ color: 'var(--primary-foreground)' }}>X</span>
            </div>
          </div>
          {!collapsed && (
            <span className="text-xl font-bold">
              <span style={{ color: 'var(--sidebar-foreground)' }}>xain</span>
              <span style={{ color: 'var(--primary)' }}>Hotel</span>
            </span>
          )}
        </Link>
      </div>

      {/* User info */}
      <div className="flex items-center px-4 py-4 mb-2 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--chart-2)' }}></div>
        {!collapsed && (
          <div className="ml-2">
            <div className="text-sm font-semibold" style={{ color: 'var(--sidebar-foreground)' }}>Super Admin</div>
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className={cn(
        "flex-1 pb-4",
        collapsed ? "overflow-hidden" : "overflow-y-auto"
      )}>
        {items.map(item => renderMenuItem(item))}
      </div>
    </div>
  );
} 