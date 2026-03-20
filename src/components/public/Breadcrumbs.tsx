'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

/* ── Segment → label map ─────────────────────────────────────────── */
const segmentLabels: Record<string, string> = {
  directory: 'Directory',
  jobs: 'Jobs',
  map: 'Map',
  pulse: 'Monroe Pulse',
  traffic: 'Traffic & Alerts',
  aviation: 'Aviation (KEQY)',
  development: 'Development',
  weather: 'Weather',
  community: 'City & Community',
  'restaurant-inspections': 'Inspections',
  agendas: 'Agendas',
  'property-sales': 'Property Sales',
  'water-quality': 'Water Quality',
  recalls: 'FDA Recalls',
  'council-meetings': 'Council Meetings',
  wallet: 'The Wallet',
  grocery: 'Price Intel',
  utilities: 'Utility Rates',
  deals: 'Local Deals',
  events: 'Events',
  news: 'Local News',
  login: 'Log In',
  claim: 'Claim Business',
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Strip locale prefix (e.g. /en or /es)
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0]; // 'en' or 'es'
  const pathSegments = segments.slice(1); // everything after locale

  // Dashboard = root, no crumbs needed beyond Home
  if (pathSegments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-white/40">
        <Home className="h-3 w-3 text-white/50" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/60">Dashboard</span>
      </nav>
    );
  }

  // Build crumb list
  const crumbs = pathSegments.map((segment, index) => {
    const href = `/${locale}/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segmentLabels[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const isLast = index === pathSegments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs">
      {/* Home */}
      <Link
        href={`/${locale}`}
        className="flex items-center text-white/40 hover:text-white/70 transition-colors"
      >
        <Home className="h-3 w-3" />
      </Link>

      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-white/20" />
          {crumb.isLast ? (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/60">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="font-mono text-[10px] font-medium uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
