'use client';

import {
  Home,
  Store,
  CalendarDays,
  Briefcase,
  MessageSquare,
  MapPin,
  Tag,
  Camera,
  Newspaper,
  Plane,
  Car,
  HardHat,
  CloudSun,
  ShieldAlert,
  ChevronRight,
  LayoutDashboard,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Business Directory", url: "/directory", icon: Store },
  { title: "Local Jobs", url: "/jobs", icon: Briefcase },
  { title: "Community Map", url: "/map", icon: MapPin },
];

const civicNav = [
  { title: "Traffic & Alerts", url: "/pulse/traffic", icon: Car },
  { title: "Aviation (KEQY)", url: "/pulse/aviation", icon: Plane },
  { title: "Development Watch", url: "/pulse/development", icon: HardHat },
  { title: "Weather Center", url: "/pulse/weather", icon: CloudSun },
];

const walletNav = [
  { title: "Grocery Arbitrage", url: "/wallet/grocery", icon: Tag },
  { title: "Utility Rates", url: "/wallet/utilities", icon: ShieldAlert },
  { title: "Local Deals", url: "/wallet/deals", icon: Wallet },
];

export function PublicSidebar({ locale }: { locale: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  const isActive = (url: string) => {
    const fullUrl = `/${locale}${url === "/" ? "" : url}`;
    return pathname === fullUrl || (url !== "/" && pathname.startsWith(fullUrl));
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-display text-lg font-black shrink-0 shadow-lg shadow-primary/20">
              M
            </div>
            <div className="flex flex-col">
                <span className="font-display text-sm font-black text-sidebar-foreground tracking-tight leading-none uppercase">
                Best of Monroe
                </span>
                <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Community OS</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-1">
            <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-display text-lg font-black shadow-lg shadow-primary/20">
              M
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3">
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-2 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={isActive(item.url)} 
                    tooltip={item.title}
                    render={
                        <Link href={`/${locale}${item.url === "/" ? "" : item.url}`} className="flex items-center gap-3 py-6">
                            <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground'}`} />
                            {!collapsed && <span className="font-bold text-sm tracking-tight">{item.title}</span>}
                        </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 opacity-50" />

        {/* Civic Plus */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-2 mb-2">
            Monroe Pulse
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {civicNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={isActive(item.url)} 
                    tooltip={item.title}
                    render={
                        <Link href={`/${locale}${item.url}`} className="flex items-center gap-3 py-6">
                            <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground'}`} />
                            {!collapsed && <span className="font-bold text-sm tracking-tight">{item.title}</span>}
                        </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 opacity-50" />

        {/* The Wallet */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-2 mb-2">
            The Wallet
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {walletNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={isActive(item.url)} 
                    tooltip={item.title}
                    render={
                        <Link href={`/${locale}${item.url}`} className="flex items-center gap-3 py-6">
                            <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.url) ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                            {!collapsed && <span className="font-bold text-sm tracking-tight">{item.title}</span>}
                        </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="rounded-2xl border border-border/50 bg-primary/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 text-center">Contribute</p>
            <button className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase py-3 hover:opacity-90 transition-all shadow-md shadow-primary/10">
              Submit Side-Hustle <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
