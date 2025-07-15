"use client";

import { useState, useEffect } from "react";
import AppSidebarMenu from "./SidebarMenu";
import Header from "./header";
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
      {/* Sidebar - always on the left */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out bg-gray-900",
          // Mobile styles
          isMobile ? (
            `fixed top-0 left-0 h-full z-40 ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`
          ) : (
            // Desktop styles
            `relative h-full ${isDesktopCollapsed ? "w-16" : "w-64"}`
          )
        )}
      >
        <AppSidebarMenu 
          userRole={userRole} 
          collapsed={isMobile ? false : isDesktopCollapsed} 
        />
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header onToggleSidebar={isMobile ? toggleMobileMenu : toggleDesktopSidebar} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
