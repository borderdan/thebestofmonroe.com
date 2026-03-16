'use client';

import { SidebarProvider } from "@/components/ui/sidebar";
import { PublicSidebar } from "@/components/public/PublicSidebar";

interface PublicLayoutProps {
  children: React.ReactNode;
  locale: string;
}

export default function PublicLayout({ children, locale }: PublicLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex w-full flex-1 min-h-screen bg-background">
        <PublicSidebar locale={locale} />
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
