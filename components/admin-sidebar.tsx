"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Menu,
    X,
    Hotel,
    ChevronDown,
    ChevronRight,
    Package,
    Settings,
    Waves,
    UtensilsCrossed,
    Sparkles,
    ClipboardList,
    QrCode,
    Shirt,
    FileText,
    BarChart3,
    User,
    Circle
} from "lucide-react"

interface MenuItem {
    title: string
    icon: React.ComponentType<{ className?: string }>
    href?: string
    isAddon?: boolean
    isActive?: boolean
    subItems?: MenuItem[]
}

interface AdminSidebarProps {
    className?: string
}

const menuItems: MenuItem[] = [
    {
        title: "Unit and Products",
        icon: Package,
        href: "/admin/units-products",
    },
    {
        title: "Room Setting",
        icon: Settings,
        href: "/admin/room-setting",
    },
    {
        title: "Pool Booking",
        icon: Waves,
        href: "/admin/pool-booking",
        isAddon: true,
    },
    {
        title: "Restaurant",
        icon: UtensilsCrossed,
        href: "/admin/restaurant",
        isAddon: true,
    },
    {
        title: "House Keeping",
        icon: Sparkles,
        isAddon: true,
        isActive: true,
        subItems: [
            {
                title: "Assign Room Cleaning",
                icon: ClipboardList,
                href: "/admin/house_keeping/assign-room-cleaning",
            },
            {
                title: "Room Cleaning",
                icon: Sparkles,
                href: "/admin/house_keeping/room-cleaning",
            },
            {
                title: "Checklist",
                icon: ClipboardList,
                href: "/admin/house_keeping/checklist",
            },
            {
                title: "Room QR List",
                icon: QrCode,
                href: "/admin/house_keeping/room-qr-list",
            },
        ],
    },
    {
        title: "Laundry",
        icon: Shirt,
        href: "/admin/laundry",
    },
    {
        title: "Records",
        icon: FileText,
        href: "/admin/records",
    },
    {
        title: "Reports",
        icon: BarChart3,
        href: "/admin/reports",
    },
]

export function AdminSidebar({ className }: AdminSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [expandedItems, setExpandedItems] = useState<string[]>(["House Keeping"])
    const pathname = usePathname()

    const toggleExpanded = (title: string) => {
        setExpandedItems(prev =>
            prev.includes(title)
                ? prev.filter(item => item !== title)
                : [...prev, title]
        )
    }

    const isActive = (href?: string) => {
        if (!href) return false
        return pathname === href || pathname.startsWith(href)
    }

    const renderMenuItem = (item: MenuItem) => {
        const hasSubItems = item.subItems && item.subItems.length > 0
        const isExpanded = expandedItems.includes(item.title)
        const itemIsActive = isActive(item.href)

        if (hasSubItems) {
            return (
                <Collapsible
                    key={item.title}
                    open={isExpanded}
                    onOpenChange={() => toggleExpanded(item.title)}
                >
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 h-10 px-3 text-gray-300 hover:text-white hover:bg-gray-700/50",
                                item.isActive && "bg-green-900/50 text-green-100 hover:bg-green-900/70",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1 text-left">{item.title}</span>
                                    <div className="flex items-center gap-2">
                                        {item.isAddon && (
                                            <Badge
                                                variant="outline"
                                                className="bg-green-100 text-green-800 border-green-200 text-xs"
                                            >
                                                Addon
                                            </Badge>
                                        )}
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </div>
                                </>
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    {!isCollapsed && (
                        <CollapsibleContent className="pl-4 space-y-1">
                            {item.subItems?.map((subItem) => (
                                <Link key={subItem.title} href={subItem.href || "#"}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-3 h-9 px-3 text-gray-400 hover:text-white hover:bg-gray-700/50",
                                            isActive(subItem.href) && "bg-blue-900/50 text-blue-100 hover:bg-blue-900/70 font-medium"
                                        )}
                                    >
                                        <subItem.icon className="h-3.5 w-3.5" />
                                        <span className="text-sm">{subItem.title}</span>
                                    </Button>
                                </Link>
                            ))}
                        </CollapsibleContent>
                    )}
                </Collapsible>
            )
        }

        return (
            <Link key={item.title} href={item.href || "#"}>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start gap-3 h-10 px-3 text-gray-300 hover:text-white hover:bg-gray-700/50",
                        itemIsActive && "bg-blue-900/50 text-blue-100 hover:bg-blue-900/70 font-medium",
                        isCollapsed && "justify-center px-2"
                    )}
                >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                        <>
                            <span className="flex-1 text-left">{item.title}</span>
                            {item.isAddon && (
                                <Badge
                                    variant="outline"
                                    className="bg-red-100 text-red-800 border-red-200 text-xs"
                                >
                                    Addon
                                </Badge>
                            )}
                        </>
                    )}
                </Button>
            </Link>
        )
    }

    return (
        <div
            className={cn(
                "bg-gray-900 text-white transition-all duration-300 flex flex-col h-screen",
                isCollapsed ? "w-16" : "w-64",
                className
            )}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <Hotel className="h-8 w-8 text-blue-400" />
                            <span className="text-xl font-bold">Hotel Admin</span>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                    >
                        {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* User Role */}
            {!isCollapsed && (
                <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Super Admin</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                <span>Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
                <nav className="space-y-1">
                    {menuItems.map(renderMenuItem)}
                </nav>
            </ScrollArea>
        </div>
    )
}