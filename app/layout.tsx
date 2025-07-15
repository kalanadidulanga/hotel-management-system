import "./globals.css";
import type { Metadata } from "next";
import ResponsiveSidebar from "../components/layout/ResponsiveSidebar";

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
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen bg-background antialiased overflow-hidden" suppressHydrationWarning>
        <ResponsiveSidebar userRole={userRole}>
          {children}
        </ResponsiveSidebar>
      </body>
    </html>
  );
}
