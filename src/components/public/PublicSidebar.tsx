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
  Radio,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

/* ── Section color map (mission-control semantics) ──────────────── */
const sectionColors = {
  nav: { active: 'text-blue-400', border: 'border-l-blue-400', glow: 'shadow-blue-500/20' },
  pulse: { active: 'text-amber-400', border: 'border-l-amber-400', glow: 'shadow-amber-500/20' },
  community: { active: 'text-emerald-400', border: 'border-l-emerald-400', glow: 'shadow-emerald-500/20' },
  wallet: { active: 'text-purple-400', border: 'border-l-purple-400', glow: 'shadow-purple-500/20' },
} as const;

type SectionKey = keyof typeof sectionColors;

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Directory", url: "/directory", icon: Store },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
  { title: "Map", url: "/map", icon: MapPin },
];

const submenus: { title: string; icon: typeof Activity; section: SectionKey; items: { title: string; url: string; icon: typeof Activity }[] }[] = [
  {
    title: "Monroe Pulse",
    icon: Activity,
    section: 'pulse',
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
    section: 'community',
    items: [
      { title: "Inspections", url: "/community/restaurant-inspections", icon: UtensilsCrossed },
      { title: "Agendas", url: "/community/agendas", icon: FileText },
      { title: "Property Sales", url: "/community/property-sales", icon: LandPlot },
      { title: "Water Quality", url: "/community/water-quality", icon: Droplets },
      { title: "FDA Recalls", url: "/community/recalls", icon: AlertTriangle },
      { title: "Council Meetings", url: "/council-meetings", icon: Video },
    ],
  },
  {
    title: "The Wallet",
    icon: Wallet,
    section: 'wallet',
    items: [
      { title: "Price Intel", url: "/wallet/grocery", icon: Tag },
      { title: "Utility Rates", url: "/wallet/utilities", icon: ShieldAlert },
      { title: "Local Deals", url: "/wallet/deals", icon: Wallet },
    ],
  },
];

export function PublicSidebar({ locale }: { locale: string }) {
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
    <Sidebar
      collapsible="none"
      className="border-r border-white/[0.06]"
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <SidebarHeader className="bg-[#070B14] px-4 pt-4 pb-3">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-mono text-sm font-black shrink-0 shadow-lg shadow-blue-500/30">
            M
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight leading-none uppercase">
              Best of Monroe
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Radio className="h-2 w-2 text-emerald-400 animate-pulse" />
              <span className="font-mono text-[8px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Live</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* ── Content ─────────────────────────────────────────────── */}
      <SidebarContent className="bg-[#070B14] px-2 py-2">
        {/* Section label */}
        <div className="px-3 pt-1 pb-2">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/25">
            Navigation
          </span>
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-0.5">
          {mainNav.map((item) => {
            const active = isActive(item.url);
            return (
              <Link
                key={item.title}
                href={`/${locale}${item.url === "/" ? "" : item.url}`}
                className={`
                  group flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-all duration-200 border-l-2
                  ${active
                    ? `${sectionColors.nav.border} bg-white/[0.06] ${sectionColors.nav.active} font-semibold shadow-sm ${sectionColors.nav.glow}`
                    : 'border-l-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                  }
                `}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium tracking-tight">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="mx-3 my-2 h-px bg-white/[0.06]" />

        {/* Collapsible submenus */}
        <nav className="flex flex-col gap-0.5">
          {submenus.map((group) => {
            const active = isSubmenuActive(group.items);
            const isOpen = openMenus.includes(group.title) || active;
            const colors = sectionColors[group.section];

            return (
              <div key={group.title}>
                {/* Group trigger */}
                <button
                  onClick={() => toggleMenu(group.title)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-all duration-200 border-l-2 cursor-pointer
                    ${active
                      ? `${colors.border} bg-white/[0.06] ${colors.active} font-semibold`
                      : 'border-l-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <group.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium tracking-tight flex-1 text-left">{group.title}</span>
                  <ChevronDown className={`h-3 w-3 opacity-40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Sub-items */}
                {isOpen && (
                  <div className="ml-3 mt-0.5 mb-1 pl-3 border-l border-white/[0.06] flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const subActive = isActive(item.url);
                      return (
                        <Link
                          key={item.title}
                          href={`/${locale}${item.url}`}
                          className={`
                            flex items-center gap-2 px-2 py-1 rounded text-[11px] transition-all duration-200
                            ${subActive
                              ? `${colors.active} font-semibold bg-white/[0.04]`
                              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                            }
                          `}
                        >
                          <item.icon className="h-3 w-3 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </SidebarContent>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <SidebarFooter className="bg-[#070B14] p-3 border-t border-white/[0.06]">
        <button className="w-full flex items-center justify-center gap-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.10] text-white/70 hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider py-2 transition-all duration-200 border border-white/[0.08]">
          Submit Hustle <ChevronRight className="h-3 w-3" />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
