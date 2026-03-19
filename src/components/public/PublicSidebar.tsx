'use client';

import {
  Store,
  Briefcase,
  MapPin,
  Tag,
  Plane,
  Car,
  HardHat,
  CloudSun,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Wallet,
  UtensilsCrossed,
  FileText,
  LandPlot,
  Droplets,
  AlertTriangle,
  Video,
  Activity,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Directory", url: "/directory", icon: Store },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
  { title: "Map", url: "/map", icon: MapPin },
];

const submenus = [
  {
    title: "Monroe Pulse",
    icon: Activity,
    items: [
      { title: "Traffic & Alerts", url: "/pulse/traffic", icon: Car },
      { title: "Aviation (KEQY)", url: "/pulse/aviation", icon: Plane },
      { title: "Development", url: "/pulse/development", icon: HardHat },
      { title: "Weather", url: "/pulse/weather", icon: CloudSun },
    ],
  },
  {
    title: "City & Community",
    icon: Building2,
    items: [
      { title: "Inspections", url: "/community/restaurant-inspections", icon: UtensilsCrossed },
      { title: "Agendas & Minutes", url: "/community/agendas", icon: FileText },
      { title: "Property Sales", url: "/community/property-sales", icon: LandPlot },
      { title: "Water Quality", url: "/community/water-quality", icon: Droplets },
      { title: "FDA Recalls", url: "/community/recalls", icon: AlertTriangle },
      { title: "Council Meetings", url: "/council-meetings", icon: Video },
    ],
  },
  {
    title: "The Wallet",
    icon: Wallet,
    items: [
      { title: "Grocery Arbitrage", url: "/wallet/grocery", icon: Tag },
      { title: "Utility Rates", url: "/wallet/utilities", icon: ShieldAlert },
      { title: "Local Deals", url: "/wallet/deals", icon: Wallet },
    ],
  },
];

export function PublicSidebar({ locale }: { locale: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const isActive = (url: string) => {
    const fullUrl = `/${locale}${url === "/" ? "" : url}`;
    return pathname === fullUrl || (url !== "/" && pathname.startsWith(fullUrl));
  };

  const isSubmenuActive = (items: { url: string }[]) =>
    items.some((item) => isActive(item.url));

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-3">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-display text-sm font-black shrink-0 shadow-lg shadow-primary/20">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xs font-black text-sidebar-foreground tracking-tight leading-none uppercase">
                Best of Monroe
              </span>
              <span className="text-[8px] font-bold text-primary uppercase tracking-[0.2em] mt-0.5">Community OS</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-display text-sm font-black shadow-lg shadow-primary/20">
              M
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {/* Top-level nav */}
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    size="sm"
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    render={
                      <Link href={`/${locale}${item.url === "/" ? "" : item.url}`} className="flex items-center gap-2.5">
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground'}`} />
                        {!collapsed && <span className="text-xs font-semibold tracking-tight">{item.title}</span>}
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}

              {/* Collapsible submenus */}
              {submenus.map((group) => {
                const active = isSubmenuActive(group.items);
                const isOpen = openMenus.includes(group.title) || active;

                return (
                  <SidebarMenuItem key={group.title}>
                    <SidebarMenuButton
                      size="sm"
                      isActive={active}
                      onClick={() => toggleMenu(group.title)}
                      className="cursor-pointer"
                    >
                      <group.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      {!collapsed && (
                        <>
                          <span className="text-xs font-semibold tracking-tight flex-1">{group.title}</span>
                          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </SidebarMenuButton>

                    {isOpen && !collapsed && (
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              size="sm"
                              isActive={isActive(item.url)}
                              className={isActive(item.url) ? 'text-primary font-semibold' : 'text-muted-foreground'}
                              onClick={() => {}}
                              render={
                                <Link href={`/${locale}${item.url}`} className="flex items-center gap-2">
                                  <item.icon className="h-3 w-3 shrink-0" />
                                  <span className="text-xs">{item.title}</span>
                                </Link>
                              }
                            />
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <button className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase py-2 hover:opacity-90 transition-all">
            Submit Side-Hustle <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
