"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { sidebarConfig, SidebarItem, Role } from "../sidebar/sidebar.config";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "../ui/sidebar";

interface AppSidebarMenuProps {
  userRole: Role;
}

function filterItemsByRole(items: SidebarItem[], role: Role): SidebarItem[] {
  return items
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      children: item.children ? filterItemsByRole(item.children, role) : undefined,
    }));
}

export default function AppSidebarMenu({ userRole }: AppSidebarMenuProps) {
  const pathname = usePathname();
  const items = filterItemsByRole(sidebarConfig, userRole);

  return (
    <SidebarContent className="pt-4">
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.label}>
            {item.children ? (
              <>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.route || "")}
                  icon={<item.icon className="w-5 h-5" />}
                  className="justify-between"
                >
                  <div className="flex items-center gap-2">
                    {item.addon && (
                      <SidebarMenuBadge className="bg-red-500 text-white ml-2">Addon</SidebarMenuBadge>
                    )}
                    <span>{item.label}</span>
                  </div>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {item.children.map((sub) => (
                    <SidebarMenuSubItem key={sub.label}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === sub.route}
                        icon={<sub.icon className="w-4 h-4" />}
                      >
                        <Link href={sub.route || "#"}>{sub.label}</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </>
            ) : (
              <SidebarMenuButton
                asChild
                isActive={pathname === item.route}
                icon={<item.icon className="w-5 h-5" />}
                className="justify-between"
              >
                <Link href={item.route || "#"} className="flex items-center gap-2">
                  {item.addon && (
                    <SidebarMenuBadge className="bg-red-500 text-white ml-2">Addon</SidebarMenuBadge>
                  )}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarContent>
  );
} 