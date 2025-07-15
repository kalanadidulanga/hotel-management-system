import "./globals.css";
import type { Metadata } from "next";
import { Sidebar, SidebarProvider } from "../components/ui/sidebar";

export const metadata: Metadata = {
  title: "Hotel Management System",
  description: "Modern hotel management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-y-auto bg-background p-4 md:p-8">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
