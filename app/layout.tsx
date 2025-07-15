import "./globals.css";
import type { Metadata } from "next";
import { Sidebar, SidebarProvider } from "../components/ui/sidebar";
import AppSidebarMenu from "../components/layout/SidebarMenu";

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
      <body className="min-h-screen bg-background antialiased">
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <Sidebar>
              <AppSidebarMenu userRole={userRole} />
            </Sidebar>
            <main className="flex-1 min-w-0 overflow-y-auto bg-background p-4 md:p-8">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
