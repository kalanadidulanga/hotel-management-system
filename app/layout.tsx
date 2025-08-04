import "./globals.css";
import type { Metadata } from "next";
import ResponsiveSidebar from "../components/layout/ResponsiveSidebar";
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Hotel Management System",
  description: "Modern hotel management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Replace with real user role from auth context
  const userRole = "superadmin";

  return (
    <html lang="en">
      <body
        className="h-screen antialiased overflow-hidden"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <Toaster
        position="top-right"
         />
        <ResponsiveSidebar userRole={userRole}>
          {children}
        </ResponsiveSidebar>
      </body>
    </html>
  );
}