"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import AppSidebarMenu from "./SidebarMenu";
import { Role } from "../sidebar/sidebar.config";
import { cn } from "../../lib/utils";

interface ResponsiveSidebarProps {
  userRole: Role;
  children: React.ReactNode;
}

export default function ResponsiveSidebar({ userRole, children }: ResponsiveSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDesktopSidebar = () => {
    setIsDesktopCollapsed(!isDesktopCollapsed);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop Toggle Button */}
      <button
        onClick={toggleDesktopSidebar}
        className="hidden lg:block fixed top-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-all duration-300"
        style={{
          left: isDesktopCollapsed ? '72px' : '276px'
        }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative top-0 left-0 h-full z-40 transform transition-transform duration-300 ease-in-out",
          // Mobile styles
          isMobile ? (
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          ) : (
            // Desktop styles
            "translate-x-0"
          )
        )}
      >
        <AppSidebarMenu 
          userRole={userRole} 
          collapsed={isMobile ? false : isDesktopCollapsed} 
        />
      </div>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 min-w-0 overflow-y-auto transition-all duration-300",
          isMobile ? "w-full" : (isDesktopCollapsed ? "ml-16" : "ml-64")
        )}
      >
        <div className={cn(
          "p-4 md:p-8 transition-all duration-300",
          isMobile ? "pt-16" : (isDesktopCollapsed ? "pt-16 lg:pt-8" : "pt-8")
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
