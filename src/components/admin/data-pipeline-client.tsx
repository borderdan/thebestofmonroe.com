'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Activity,
  Database,
  Bot,
  Rss,
  FileText,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Signal,
  Cpu,
  Layers,
  ArrowUpDown,
  Timer,
  Hash,
  Wrench,
  TrendingUp,
  Gauge,
  ShieldCheck,
  Radio,
  Server,
  ExternalLink,
  Eye,
  GitBranch,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/* ── Types ───────────────────────────────────────────────────────── */
interface DataSource {
  id: string;
  name: string;
  type: string;       // API, SCRAPER, BOT, RSS, PDF_AI
  category: string;   // TRAFFIC, WEATHER, AVIATION, etc.
  status: string;     // OPERATIONAL, ERROR, MAINTENANCE, DEPRECATED
  last_sync_at: string | null;
  next_sync_at: string | null;
  success_rate: number;
  latency_ms: number;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface IngestionLog {
  id: string;
  source_name: string;
  status: string;     // success, failure, partial
  message: string;
  error_details: any;
  items_processed: number;
  created_at: string;
}

/* ── Category metadata ───────────────────────────────────────────── */
const categoryMeta: Record<string, { color: string; bg: string; label: string }> = {
  TRAFFIC: { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Traffic' },
  WEATHER: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Weather' },
  AVIATION: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Aviation' },
  JOBS: { color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Jobs' },
  EVENTS: { color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Events' },
  ALERTS: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Alerts' },
  POIS: { color: 'text-teal-400', bg: 'bg-teal-500/10', label: 'POIs' },
  GROCERY: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Grocery' },
  PERMITS: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Permits' },
  ECONOMY: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Economy' },
  INSPECTIONS: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Inspections' },
  COUNCIL: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'Council' },
  AGENDAS: { color: 'text-sky-400', bg: 'bg-sky-500/10', label: 'Agendas' },
  PROPERTY: { color: 'text-lime-400', bg: 'bg-lime-500/10', label: 'Property' },
};

const typeMeta: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  API: { icon: Globe, color: 'text-blue-400', label: 'REST API' },
  SCRAPER: { icon: Cpu, color: 'text-purple-400', label: 'Web Scraper' },
  BOT: { icon: Bot, color: 'text-amber-400', label: 'Headless Bot' },
  RSS: { icon: Rss, color: 'text-orange-400', label: 'RSS Feed' },
  PDF_AI: { icon: FileText, color: 'text-pink-400', label: 'PDF + AI' },
};

const statusMeta: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  OPERATIONAL: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Operational' },
  ERROR: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
  MAINTENANCE: { icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Maintenance' },
  BROKEN: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Broken' },
  NOT_SCHEDULED: { icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: 'Not Scheduled' },
  DEPRECATED: { icon: AlertTriangle, color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: 'Deprecated' },
};

/* ── All known pipeline sources (comprehensive) ──────────────────── */
type PipelineStatus = 'OPERATIONAL' | 'ERROR' | 'MAINTENANCE' | 'NOT_SCHEDULED' | 'BROKEN';

interface PipelineDependency {
  page: string;       // route or component name
  description: string; // what it does with the data
  route?: string;      // user-facing URL path
}

const ALL_PIPELINES = [
  {
    name: 'NCDOT Traffic API', type: 'API', category: 'TRAFFIC', target: 'community_feed',
    script: 'ingest:traffic', endpoint: 'https://nc.prod.traveliq.co/api/incidents',
    schedule: 'Every 10 min', cron: '*/10 * * * *', automation: 'GitHub Actions (community-ingestion.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: ['NCDOT_API_KEY'],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, high-frequency job in community-ingestion.yml',
    dataRetrieved: 'Road incidents, closures, construction zones — title, description, severity, lat/lon, countyName, event_time',
    method: 'REST API → JSON → filter Union County/Monroe incidents → upsert community_feed',
    description: 'Real-time road incidents, closures, and construction alerts from NCDOT TravelIQ API. Filters by countyName or description keywords matching Monroe/Union County.',
    dependents: [
      { page: 'Live Header Banner', description: 'Scrolling ticker shows traffic alerts with critical/high severity', route: '/(public)/*' },
      { page: 'Community Hub', description: 'Community updates feed displays traffic incidents', route: '/(public)/community' },
      { page: 'Universal Search', description: 'Traffic incidents searchable via Cmd+K search dialog', route: '/(public)/*' },
    ] as PipelineDependency[],
  },
  {
    name: 'NWS Weather Alerts', type: 'API', category: 'WEATHER', target: 'community_feed',
    script: 'ingest:weather', endpoint: 'https://api.weather.gov/alerts/active?zone=NCC179',
    schedule: 'Every 10 min', cron: '*/10 * * * *', automation: 'GitHub Actions (community-ingestion.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: [],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, high-frequency job in community-ingestion.yml',
    dataRetrieved: 'Weather alerts (tornado, flood, heat), 7-day forecast — headline, description, severity, onset, expires, temperature',
    method: 'Public NWS API (no key) → active alerts for zone NCC179 + grid forecast GSP/101,60 → upsert community_feed',
    description: 'National Weather Service alerts and forecasts for Union County, NC. Uses public API — no API key required. Fetches both active alerts and 7-day grid-based forecast.',
    dependents: [
      { page: 'Live Header Banner', description: 'Weather alerts shown in scrolling ticker + "TONIGHT" forecast preview', route: '/(public)/*' },
      { page: 'Community Hub', description: 'Weather updates in community feed', route: '/(public)/community' },
      { page: 'Universal Search', description: 'Weather alerts searchable via search dialog', route: '/(public)/*' },
    ] as PipelineDependency[],
  },
  {
    name: 'FlightAware AeroAPI', type: 'API', category: 'AVIATION', target: 'community_feed',
    script: 'ingest:aviation', endpoint: 'https://aeroapi.flightaware.com/aeroapi/airports/KEQY/flights',
    schedule: 'Every 10 min', cron: '*/10 * * * *', automation: 'GitHub Actions (community-ingestion.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: ['FLIGHTAWARE_API_KEY'],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, high-frequency job in community-ingestion.yml',
    dataRetrieved: 'Flight arrivals/departures — flight_number, origin, destination, aircraft_type, ETA, gate, status',
    method: 'AeroAPI REST → arrivals + departures for KEQY → upsert community_feed',
    description: 'Monroe Executive Airport (KEQY) arrivals, departures, and METAR weather data from FlightAware AeroAPI. Requires paid API key.',
    dependents: [
      { page: 'Live Header Banner', description: 'Aviation alerts in scrolling ticker', route: '/(public)/*' },
      { page: 'Community Hub', description: 'Flight activity in community feed', route: '/(public)/community' },
    ] as PipelineDependency[],
  },
  {
    name: 'Adzuna Jobs API', type: 'API', category: 'JOBS', target: 'community_feed',
    script: 'ingest:jobs', endpoint: 'https://api.adzuna.com/v1/api/jobs/us/search/1',
    schedule: 'Daily 6am UTC', cron: '0 6 * * *', automation: 'GitHub Actions (community-ingestion.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: ['ADZUNA_APP_ID', 'ADZUNA_APP_KEY'],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, daily job in community-ingestion.yml',
    dataRetrieved: 'Job listings — title, company, salary_min, salary_max, location, description, redirect_url, category',
    method: 'REST API → geolocation search (15km radius, 34.985/-80.5495) → upsert community_feed',
    description: 'Job listings within 15km of Monroe, NC from Adzuna aggregator. Free API tier with app ID/key registration.',
    dependents: [
      { page: 'Community Hub', description: 'Job listings shown in community feed', route: '/(public)/community' },
      { page: 'Universal Search', description: 'Jobs searchable via search dialog', route: '/(public)/*' },
    ] as PipelineDependency[],
  },
  {
    name: 'NC OneMap POIs', type: 'API', category: 'POIS', target: 'pois',
    script: 'ingest:pois', endpoint: 'NC OneMap ArcGIS FeatureServers',
    schedule: 'Weekly (Sun midnight)', cron: '0 0 * * 0', automation: 'GitHub Actions (community-ingestion.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: [],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, weekly job in community-ingestion.yml',
    dataRetrieved: 'POI locations — name, category, address, lat/lon geometry (GeoJSON Point), metadata',
    method: 'ArcGIS REST (public) → Fire Stations, Law Enforcement, Libraries where County=Union → upsert pois table',
    description: 'Points of interest from NC state GIS including fire stations, law enforcement, and public libraries for Union County. Public API — no key required.',
    dependents: [
      { page: 'No active consumer', description: 'Table is populated but no page currently displays POI data — future map feature' },
    ] as PipelineDependency[],
  },
  {
    name: 'Monroe City RSS', type: 'RSS', category: 'ALERTS', target: 'community_feed',
    script: 'ingest:monroe-alerts', endpoint: 'https://www.monroenc.org/RSSFeed.aspx?ModID=11',
    schedule: 'Every 10 min', cron: '*/10 * * * *', automation: 'GitHub Actions (community-ingestion.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: [],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, high-frequency job in community-ingestion.yml',
    dataRetrieved: 'City announcements — title, description, link, pubDate, severity classification (low/med/high/critical)',
    method: 'RSS XML feed → parse items → classify severity (low/med/high/critical) → upsert community_feed',
    description: 'City of Monroe official announcements, emergency alerts, and public notices via RSS feed. Includes severity classification. No API key required.',
    dependents: [
      { page: 'Live Header Banner', description: 'Critical/high severity alerts shown prominently in ticker', route: '/(public)/*' },
      { page: 'Community Hub', description: 'City alerts in community updates feed', route: '/(public)/community' },
      { page: 'Universal Search', description: 'Alerts searchable via search dialog', route: '/(public)/*' },
    ] as PipelineDependency[],
  },
  {
    name: 'City Events Scraper', type: 'SCRAPER', category: 'EVENTS', target: 'community_feed',
    script: 'ingest:city-events', endpoint: 'https://www.monroenc.org/Events',
    schedule: 'Daily 6am UTC', cron: '0 6 * * *', automation: 'GitHub Actions (community-ingestion.yml)',
    defaultStatus: 'MAINTENANCE' as PipelineStatus,
    envVars: [],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, daily job in community-ingestion.yml',
    dataRetrieved: 'Community events — event_name, date, time, location, description (parsed from HTML)',
    method: 'HTTP fetch → Cheerio HTML parse (.event-item, .event-list-item selectors) → upsert community_feed',
    description: 'Community events scraped from Monroe city website via Cheerio HTML parser. Fragile — depends on specific CSS selectors that may change when the city updates their site.',
    dependents: [
      { page: 'Community Hub', description: 'Local events shown in community feed', route: '/(public)/community' },
    ] as PipelineDependency[],
  },
  {
    name: 'Flipp Grocery Flyers', type: 'API', category: 'GROCERY', target: 'grocery_prices',
    script: 'ingest:flipp', endpoint: 'https://backflipp.wishabi.com/flipp/flyers',
    schedule: 'Daily 6am UTC', cron: '0 6 * * *', automation: 'GitHub Actions (community-ingestion.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: [],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, daily job in community-ingestion.yml — no API key required',
    dataRetrieved: 'Weekly flyer items — name, brand, price, discount %, valid dates, product images for Food Lion, Walmart, ALDI, Lidl, Publix, Lowes Foods',
    method: 'Public REST API (no key) → fetch grocery flyers for ZIP 28112 → fetch items per flyer → parse prices → upsert grocery_prices',
    description: 'Weekly grocery flyer data from Flipp aggregator. Covers all major Monroe NC grocery stores with real weekly ad prices, deals, and product images. Public API — no key required, no anti-bot protection. Completely replaces the broken Playwright grocery scraper.',
    dependents: [
      { page: 'Price Intel', description: 'Full comparison table, Smart Basket builder, Split-Shop Optimizer', route: '/wallet/grocery' },
      { page: 'Price Intel Preview', description: 'Dashboard widget showing top items with biggest savings', route: '/' },
      { page: 'Live Header Banner', description: 'Recent prices shown as "Wallet" alerts in ticker', route: '/(public)/*' },
    ] as PipelineDependency[],
  },
  {
    name: 'Grocery Price Bot', type: 'BOT', category: 'GROCERY', target: 'grocery_prices',
    script: 'ingest:grocery', endpoint: 'Aldi, Food Lion, Harris Teeter websites',
    schedule: 'Not scheduled', cron: null, automation: 'None — manual only',
    defaultStatus: 'BROKEN' as PipelineStatus,
    envVars: [],
    runsOn: 'Local / Manual' as const,
    runsOnDetail: 'Run manually via npm run ingest:grocery — requires Playwright + Chromium installed locally',
    dataRetrieved: 'Grocery prices — store_name, item_name, category, price, unit, is_deal, deal_description, scraped_at',
    method: 'Playwright browser → attempt scrape → FALLS BACK TO MOCK PRICES for Food Lion & Harris Teeter (anti-bot protection)',
    description: 'DEPRECATED — replaced by Flipp Grocery Flyers pipeline which provides reliable structured data from weekly circulars. Headless browser scraping of grocery prices. Currently broken — Food Lion and Harris Teeter use anti-bot protection causing fallback to randomized mock data. Aldi scraping also unreliable. Currently using seed data instead.',
    dependents: [
      { page: 'Price Intel', description: 'Full comparison table, Smart Basket builder, Split-Shop Optimizer', route: '/wallet/grocery' },
      { page: 'Price Intel Preview', description: 'Dashboard widget showing top 6 items with biggest savings', route: '/' },
      { page: 'Live Header Banner', description: 'Recent prices shown as "Wallet" alerts in ticker', route: '/(public)/*' },
      { page: 'Business Dashboard', description: 'Widget showing 5 most recent grocery prices', route: '/app' },
      { page: 'Grocery Arbitrage', description: 'Hub widget showing best vs runner-up price per item', route: '/(public)/community' },
    ] as PipelineDependency[],
  },
  {
    name: 'NC Health Inspections', type: 'SCRAPER', category: 'INSPECTIONS', target: 'restaurant_inspections',
    script: 'ingest:restaurant-inspections', endpoint: 'https://public.cdpehs.com/NCENVPBL/ESTABLISHMENT/ShowESTABLISHMENTTablePage.aspx',
    schedule: 'Weekly (Mon 11am UTC)', cron: '0 11 * * 1', automation: 'GitHub Actions (ingest-community-data.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: [],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, weekly Monday job in ingest-community-data.yml (10 min timeout)',
    dataRetrieved: 'Inspection results — facility_id, name, address, city, score, grade (A/B/C), inspection_date, inspection_type, violations',
    method: 'ASP.NET form POST (ViewState + pagination mimicry) → CSV fallback → batch upsert with deduplication',
    description: 'Restaurant health inspection scores from NC DHHS CDPEHS portal for Union County (county code 90). Mimics browser form submissions to navigate ASP.NET pagination.',
    dependents: [
      { page: 'Restaurant Inspections', description: 'Full listing with grade filters, search, score ring visualization, violation counts', route: '/community/restaurant-inspections' },
      { page: 'Business Directory', description: 'Fuzzy-matched health scores shown on business listings', route: '/directory' },
    ] as PipelineDependency[],
  },
  {
    name: 'NC LINC Economy', type: 'API', category: 'ECONOMY', target: 'community_feed',
    script: 'ingest:economy', endpoint: 'https://linc.osbm.nc.gov/api/explore/v2.1/catalog/datasets',
    schedule: 'Not scheduled', cron: null, automation: 'None — not added to GitHub Actions',
    defaultStatus: 'NOT_SCHEDULED' as PipelineStatus,
    envVars: [],
    runsOn: 'Local / Manual' as const,
    runsOnDetail: 'Script exists but not in any GitHub Actions workflow — run manually via npm run ingest:economy',
    dataRetrieved: 'Economic indicators — labor_force, employed, unemployed, unemployment_rate, median_household_income for Union County',
    method: 'ODSQL REST API (public) → labor force + median income datasets for Union County → upsert community_feed',
    description: 'Economic indicators (labor force stats, median household income) for Union County from NC LINC. Script is written and functional but not yet added to any GitHub Actions workflow.',
    dependents: [
      { page: 'Community Hub', description: 'Would appear in community feed as economic updates (once scheduled)', route: '/(public)/community' },
    ] as PipelineDependency[],
  },
  {
    name: 'Union County Permits', type: 'BOT', category: 'PERMITS', target: 'community_feed',
    script: 'scrape:permits', endpoint: 'Evolve Public Portal + CityView Portal',
    schedule: 'Daily 6am UTC', cron: '0 6 * * *', automation: 'GitHub Actions (community-ingestion.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: ['GEMINI_API_KEY'],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20 + Playwright + Chromium, daily job in community-ingestion.yml',
    dataRetrieved: 'Building permits — permit_number, type, address, applicant, status, AI-generated summary of work description',
    method: 'Playwright browser → scrape Evolve (Union County) + CityView (Monroe) → Gemini AI summarization → upsert community_feed',
    description: 'Building permits from Union County Evolve portal and City of Monroe CityView portal. Uses Playwright for browser automation and Gemini 2.5 Flash for natural language summaries.',
    dependents: [
      { page: 'Community Hub', description: 'Permit activity shown in community feed with AI summaries', route: '/(public)/community' },
      { page: 'Universal Search', description: 'Permits searchable via search dialog', route: '/(public)/*' },
    ] as PipelineDependency[],
  },
  {
    name: 'Council Meeting Transcripts', type: 'PDF_AI', category: 'COUNCIL', target: 'council_meetings',
    script: 'ingest:council-meetings', endpoint: 'YouTube RSS → yt-dlp → Gemini File API',
    schedule: 'Weekly (Mon 11am UTC)', cron: '0 11 * * 1', automation: 'GitHub Actions (ingest-community-data.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: ['GEMINI_API_KEY'],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20 + yt-dlp + ffmpeg, weekly Monday job (30 min timeout)',
    dataRetrieved: 'Meeting transcripts — youtube_video_id, title, published_at, youtube_url, thumbnail_url, full transcript, AI summary (agenda_items, decisions, votes, action_items)',
    method: 'YouTube RSS feed → yt-dlp audio download (m4a) → upload to Gemini File API → transcribe + summarize → parse JSON → upsert council_meetings',
    description: 'Auto-transcription of City Council meetings from YouTube channel. Downloads audio via yt-dlp, processes with Gemini 2.5 Flash for transcript + structured summary (agenda items, decisions, votes, action items). Max 2 videos per run.',
    dependents: [
      { page: 'Council Meetings (via server actions)', description: 'Paginated meeting list with transcripts + AI summaries (getCouncilMeetings/getCouncilMeeting actions)', route: '/community/council' },
    ] as PipelineDependency[],
  },
  {
    name: 'CivicClerk Agendas', type: 'PDF_AI', category: 'AGENDAS', target: 'city_agendas',
    script: 'ingest:agendas', endpoint: 'https://monroenc.api.civicclerk.com/v1/Events',
    schedule: 'Weekly (Mon 11am UTC)', cron: '0 11 * * 1', automation: 'GitHub Actions (ingest-community-data.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: ['GEMINI_API_KEY'],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, weekly Monday job in ingest-community-data.yml (10 min timeout)',
    dataRetrieved: 'Meeting documents — title, meeting_date, meeting_body, document_type (agenda/minutes), document_url (PDF), AI summary (agenda_items, decisions, votes)',
    method: 'CivicClerk REST API → filter agenda/minutes PDFs → download PDF → Gemini AI summarization → upsert city_agendas',
    description: 'Meeting agendas and minutes from Monroe CivicClerk portal. Downloads PDFs, summarizes with Gemini 2.5 Flash (meeting body, agenda items, decisions, votes, action items). Max 3 documents per run.',
    dependents: [
      { page: 'City Agendas', description: 'Meeting agendas/minutes grouped by body (City Council, Planning Board), filterable by type, with AI summaries', route: '/community/agendas' },
    ] as PipelineDependency[],
  },
  {
    name: 'Union County Property Sales', type: 'API', category: 'PROPERTY', target: 'property_sales',
    script: 'ingest:property-sales', endpoint: 'https://gis.unioncountync.gov/server/rest/services/OperationalLayers/MapServer/215/query',
    schedule: 'Weekly (Mon 11am UTC)', cron: '0 11 * * 1', automation: 'GitHub Actions (ingest-community-data.yml)',
    defaultStatus: 'OPERATIONAL' as PipelineStatus,
    envVars: [],
    runsOn: 'GitHub Actions' as const,
    runsOnDetail: 'ubuntu-latest runner, Node 20, weekly Monday job in ingest-community-data.yml (5 min timeout)',
    dataRetrieved: 'Real estate transactions — parcel_id, address, sale_price, sale_date, property_type, sqft, year_built, buyer, seller',
    method: 'ArcGIS REST query → parcels sold in last 90 days (SALESAMT > $1000) → paginated 200/batch → upsert on parcel_id+sale_date',
    description: 'Real estate transactions from Union County GIS MapServer. Queries parcels sold in the last 90 days with sale amount over $1,000. Public API — no key required. Paginates in batches of 200.',
    dependents: [
      { page: 'Property Sales', description: 'Sales listing with avg/median price stats, price range filters, search by address/buyer/seller', route: '/community/property-sales' },
    ] as PipelineDependency[],
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function successRateColor(rate: number): string {
  if (rate >= 0.95) return 'text-emerald-400';
  if (rate >= 0.8) return 'text-amber-400';
  return 'text-red-400';
}

function successRateBarColor(rate: number): string {
  if (rate >= 0.95) return 'bg-emerald-500';
  if (rate >= 0.8) return 'bg-amber-500';
  return 'bg-red-500';
}

/* ── Component ───────────────────────────────────────────────────── */
export function DataPipelineClient({
  sources,
  logs,
  tableCounts,
}: {
  sources: DataSource[];
  logs: IngestionLog[];
  tableCounts: Record<string, number>;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  // Merge DB sources with our comprehensive pipeline definitions
  const pipelines = useMemo(() => {
    return ALL_PIPELINES.map(pipeline => {
      // Match by name or category
      const dbSource = sources.find(
        s => s.name === pipeline.name ||
        (s.category === pipeline.category && s.type === pipeline.type)
      );

      // Get logs for this source
      const sourceLogs = logs.filter(l =>
        l.source_name.toLowerCase().includes(pipeline.category.toLowerCase()) ||
        l.source_name.toLowerCase().includes(pipeline.name.toLowerCase().split(' ')[0].toLowerCase())
      );

      const totalItemsProcessed = sourceLogs.reduce((sum, l) => sum + (l.items_processed || 0), 0);
      const successLogs = sourceLogs.filter(l => l.status === 'success');
      const failureLogs = sourceLogs.filter(l => l.status === 'failure');

      return {
        ...pipeline,
        id: dbSource?.id || pipeline.name,
        status: dbSource?.status || pipeline.defaultStatus || 'OPERATIONAL',
        last_sync_at: dbSource?.last_sync_at || sourceLogs[0]?.created_at || null,
        success_rate: dbSource?.success_rate ?? (sourceLogs.length > 0 ? successLogs.length / sourceLogs.length : 1.0),
        latency_ms: dbSource?.latency_ms || 0,
        metadata: dbSource?.metadata || {},
        totalSyncs: sourceLogs.length,
        totalItemsProcessed,
        successCount: successLogs.length,
        failureCount: failureLogs.length,
        recentLogs: sourceLogs.slice(0, 10),
        tableRowCount: tableCounts[pipeline.target] || 0,
        hasDbRecord: !!dbSource,
      };
    });
  }, [sources, logs, tableCounts]);

  // Filters
  const filtered = useMemo(() => {
    let result = pipelines;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.endpoint.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter(p => p.status === statusFilter);
    if (typeFilter) result = result.filter(p => p.type === typeFilter);
    return result;
  }, [pipelines, search, statusFilter, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const operational = pipelines.filter(p => p.status === 'OPERATIONAL').length;
    const errors = pipelines.filter(p => p.status === 'ERROR' || p.status === 'BROKEN').length;
    const maintenance = pipelines.filter(p => p.status === 'MAINTENANCE').length;
    const notScheduled = pipelines.filter(p => p.status === 'NOT_SCHEDULED').length;
    const activePipelines = pipelines.filter(p => p.status === 'OPERATIONAL');
    const avgSuccess = activePipelines.length > 0
      ? activePipelines.reduce((sum, p) => sum + p.success_rate, 0) / activePipelines.length
      : 0;
    const totalItems = Object.values(tableCounts).reduce((sum, c) => sum + c, 0);
    const totalSyncs = pipelines.reduce((sum, p) => sum + p.totalSyncs, 0);
    const lastActivity = logs[0]?.created_at || null;
    return { total: pipelines.length, operational, errors, maintenance, notScheduled, avgSuccess, totalItems, totalSyncs, lastActivity };
  }, [pipelines, tableCounts, logs]);

  const uniqueTypes = [...new Set(pipelines.map(p => p.type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-100 uppercase">Data Pipeline</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {stats.total} data sources feeding Monroe&apos;s community intelligence platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.lastActivity && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
              Last activity: {relativeTime(stats.lastActivity)}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard
          label="Total Sources"
          value={stats.total}
          icon={<Layers className="h-4 w-4 text-blue-400" />}
          color="text-blue-400"
        />
        <StatCard
          label="Operational"
          value={stats.operational}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          color="text-emerald-400"
        />
        <StatCard
          label="Errors"
          value={stats.errors}
          icon={<XCircle className="h-4 w-4 text-red-400" />}
          color={stats.errors > 0 ? 'text-red-400' : 'text-zinc-500'}
          alert={stats.errors > 0}
        />
        <StatCard
          label="Maintenance"
          value={stats.maintenance}
          icon={<Wrench className="h-4 w-4 text-amber-400" />}
          color="text-amber-400"
        />
        <StatCard
          label="Not Scheduled"
          value={stats.notScheduled}
          icon={<Clock className="h-4 w-4 text-zinc-400" />}
          color="text-zinc-400"
        />
        <StatCard
          label="Avg Success"
          value={`${Math.round(stats.avgSuccess * 100)}%`}
          icon={<Gauge className="h-4 w-4 text-emerald-400" />}
          color={successRateColor(stats.avgSuccess)}
        />
        <StatCard
          label="Total Records"
          value={stats.totalItems.toLocaleString()}
          icon={<Database className="h-4 w-4 text-purple-400" />}
          color="text-purple-400"
        />
        <StatCard
          label="Total Syncs"
          value={stats.totalSyncs.toLocaleString()}
          icon={<RefreshCw className="h-4 w-4 text-cyan-400" />}
          color="text-cyan-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search pipelines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Status filters */}
          {(['OPERATIONAL', 'ERROR', 'BROKEN', 'MAINTENANCE', 'NOT_SCHEDULED'] as const).map(status => {
            const meta = statusMeta[status];
            const count = pipelines.filter(p => p.status === status).length;
            if (count === 0 && status !== 'OPERATIONAL') return null;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === status
                    ? `${meta.bg} ${meta.color} border border-current/20`
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                }`}
              >
                <meta.icon className="h-3 w-3" />
                {meta.label} ({count})
              </button>
            );
          })}

          <div className="w-px bg-zinc-800 mx-1 hidden sm:block" />

          {/* Type filters */}
          {uniqueTypes.map(type => {
            const meta = typeMeta[type] || { icon: Activity, color: 'text-zinc-400', label: type };
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  typeFilter === type
                    ? `bg-zinc-800 ${meta.color} border border-current/20`
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                }`}
              >
                <meta.icon className="h-3 w-3" />
                {meta.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowLogs(!showLogs)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ml-auto ${
            showLogs
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
          }`}
        >
          <BarChart3 className="h-3 w-3" />
          Activity Log
        </button>
      </div>

      {/* Activity Log Panel */}
      {showLogs && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.03] p-4 space-y-3 max-h-[300px] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2 sticky top-0 bg-zinc-950/80 backdrop-blur py-1">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-400">Recent Ingestion Activity</span>
            <span className="text-[10px] text-zinc-500 font-mono">{logs.length} entries</span>
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No ingestion logs recorded yet.</p>
          ) : (
            <div className="space-y-1">
              {logs.slice(0, 50).map(log => (
                <div key={log.id} className="flex items-center gap-3 text-[11px] py-1.5 px-2 rounded hover:bg-zinc-900/50">
                  {log.status === 'success' ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  ) : log.status === 'partial' ? (
                    <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                  )}
                  <span className="font-mono text-zinc-400 w-24 shrink-0 truncate">{log.source_name}</span>
                  <span className="text-zinc-500 flex-1 truncate">{log.message}</span>
                  <span className="font-mono text-zinc-600 shrink-0">{log.items_processed} items</span>
                  <span className="font-mono text-zinc-600 shrink-0 w-16 text-right">{relativeTime(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pipeline Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/30">
        {/* Header */}
        <div className="grid grid-cols-[2fr_100px_100px_120px_100px_90px_80px_80px_80px_60px] gap-0 bg-zinc-900 border-b border-zinc-800 px-4 py-2.5">
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500">Pipeline</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500">Status</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500">Runs On</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500">Method</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500">Schedule</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500">Last Sync</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500 text-right">Success</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500 text-right">Records</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500 text-right">Syncs</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500" />
        </div>

        {/* Rows */}
        {filtered.map((pipeline) => {
          const catMeta = categoryMeta[pipeline.category] || { color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: pipeline.category };
          const tMeta = typeMeta[pipeline.type] || { icon: Activity, color: 'text-zinc-400', label: pipeline.type };
          const sMeta = statusMeta[pipeline.status] || statusMeta.OPERATIONAL;
          const isExpanded = expandedSource === pipeline.name;
          const TypeIcon = tMeta.icon;
          const StatusIcon = sMeta.icon;

          return (
            <div key={pipeline.name}>
              {/* Main row */}
              <div
                className={`grid grid-cols-[2fr_100px_100px_120px_100px_90px_80px_80px_80px_60px] gap-0 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer ${
                  isExpanded ? 'bg-zinc-800/20' : ''
                }`}
                onClick={() => setExpandedSource(isExpanded ? null : pipeline.name)}
              >
                {/* Pipeline name + category */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${catMeta.bg} shrink-0`}>
                    <TypeIcon className={`h-3.5 w-3.5 ${catMeta.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-200 truncate">{pipeline.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge className={`text-[7px] h-4 ${catMeta.bg} ${catMeta.color} border-none px-1.5`}>
                        {catMeta.label}
                      </Badge>
                      <span className="text-[9px] text-zinc-600 truncate">{pipeline.endpoint}</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${sMeta.bg} ${sMeta.color}`}>
                    <StatusIcon className="h-2.5 w-2.5" />
                    {sMeta.label}
                  </div>
                </div>

                {/* Runs On */}
                <div className="flex items-center">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    pipeline.runsOn === 'GitHub Actions'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-zinc-500/10 text-zinc-500'
                  }`}>
                    {pipeline.runsOn === 'GitHub Actions' ? 'GH Actions' : 'Manual'}
                  </span>
                </div>

                {/* Method */}
                <div className="flex items-center">
                  <span className={`text-[10px] font-mono ${tMeta.color}`}>{tMeta.label}</span>
                </div>

                {/* Schedule */}
                <div className="flex items-center">
                  <span className="text-[10px] text-zinc-500">{pipeline.schedule}</span>
                </div>

                {/* Last Sync */}
                <div className="flex items-center">
                  <span className={`text-[10px] font-mono ${pipeline.last_sync_at ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {relativeTime(pipeline.last_sync_at)}
                  </span>
                </div>

                {/* Success Rate */}
                <div className="flex items-center justify-end gap-1.5">
                  <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${successRateBarColor(pipeline.success_rate)}`}
                      style={{ width: `${pipeline.success_rate * 100}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${successRateColor(pipeline.success_rate)}`}>
                    {Math.round(pipeline.success_rate * 100)}%
                  </span>
                </div>

                {/* Records */}
                <div className="flex items-center justify-end">
                  <span className="text-[10px] font-mono text-zinc-400">
                    {pipeline.tableRowCount.toLocaleString()}
                  </span>
                </div>

                {/* Syncs */}
                <div className="flex items-center justify-end">
                  <span className="text-[10px] font-mono text-zinc-500">
                    {pipeline.totalSyncs}
                  </span>
                </div>

                {/* Expand */}
                <div className="flex items-center justify-center">
                  <ChevronDown className={`h-3.5 w-3.5 text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="bg-zinc-900/60 border-b border-zinc-800 px-6 py-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Info */}
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">Details</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{pipeline.description}</p>
                      <div className="space-y-1.5">
                        <DetailRow label="Target Table" value={pipeline.target} mono />
                        <DetailRow label="npm Script" value={`npm run ${pipeline.script}`} mono />
                        <DetailRow label="Endpoint" value={pipeline.endpoint} />
                        <DetailRow label="Schedule" value={pipeline.schedule} />
                        {pipeline.cron && <DetailRow label="Cron Expression" value={pipeline.cron} mono />}
                        <DetailRow label="Automation" value={pipeline.automation} />
                        {pipeline.latency_ms > 0 && (
                          <DetailRow label="Avg Latency" value={`${pipeline.latency_ms.toLocaleString()}ms`} />
                        )}
                      </div>
                      {pipeline.envVars.length > 0 && (
                        <div className="mt-2">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Required Keys:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pipeline.envVars.map(v => (
                              <span key={v} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{v}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Method / How it works */}
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">How It Works</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-mono bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                        {pipeline.method}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">Performance</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <MiniStat label="Success Rate" value={`${Math.round(pipeline.success_rate * 100)}%`} color={successRateColor(pipeline.success_rate)} />
                        <MiniStat label="Total Syncs" value={pipeline.totalSyncs.toString()} color="text-cyan-400" />
                        <MiniStat label="Records in DB" value={pipeline.tableRowCount.toLocaleString()} color="text-purple-400" />
                        <MiniStat label="Items Processed" value={pipeline.totalItemsProcessed.toLocaleString()} color="text-blue-400" />
                        <MiniStat label="Successes" value={pipeline.successCount.toString()} color="text-emerald-400" />
                        <MiniStat label="Failures" value={pipeline.failureCount.toString()} color={pipeline.failureCount > 0 ? 'text-red-400' : 'text-zinc-500'} />
                      </div>
                    </div>

                    {/* Recent logs */}
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">Recent Activity</h4>
                      {pipeline.recentLogs.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 italic">No ingestion logs recorded</p>
                      ) : (
                        <div className="space-y-1 max-h-[160px] overflow-y-auto">
                          {pipeline.recentLogs.map(log => (
                            <div key={log.id} className="flex items-start gap-2 text-[10px] py-1">
                              {log.status === 'success' ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="text-zinc-400 truncate block">{log.message || log.status}</span>
                                <span className="text-zinc-600 font-mono">{relativeTime(log.created_at)} · {log.items_processed} items</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Infrastructure + Data + Dependents row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-zinc-800/50">
                    {/* Runs On */}
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
                        <Server className="h-3 w-3" /> Runs On
                      </h4>
                      <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            pipeline.runsOn === 'GitHub Actions'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            <GitBranch className="h-2.5 w-2.5 inline mr-1" />
                            {pipeline.runsOn}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">{pipeline.runsOnDetail}</p>
                      </div>
                    </div>

                    {/* Data Retrieved */}
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
                        <Database className="h-3 w-3" /> Data Retrieved
                      </h4>
                      <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                        <p className="text-[10px] text-zinc-400 leading-relaxed">{pipeline.dataRetrieved}</p>
                      </div>
                    </div>

                    {/* Pages / Features That Use This Data */}
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
                        <Eye className="h-3 w-3" /> Dependent Pages ({pipeline.dependents.length})
                      </h4>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                        {pipeline.dependents.map((dep, i) => (
                          <div key={i} className="bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700/50">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-semibold text-zinc-300">{dep.page}</span>
                              {dep.route && (
                                <span className="text-[8px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">{dep.route}</span>
                              )}
                            </div>
                            <p className="text-[9px] text-zinc-500 mt-0.5">{dep.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-zinc-800">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer">
                      <RefreshCw className="h-3 w-3" />
                      Sync Now
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200 transition-all cursor-pointer">
                      <Timer className="h-3 w-3" />
                      Edit Schedule
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200 transition-all cursor-pointer">
                      <Signal className="h-3 w-3" />
                      Test Connection
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-zinc-500 text-sm">
            No pipelines match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon,
  color,
  alert,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  alert?: boolean;
}) {
  return (
    <div className={`p-3 rounded-xl border ${alert ? 'border-red-500/30 bg-red-500/[0.05]' : 'border-zinc-800 bg-zinc-900/50'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500">{label}</span>
      </div>
      <div className={`text-xl font-black font-mono ${color}`}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <span className={`text-[10px] ${mono ? 'font-mono text-emerald-400' : 'text-zinc-300'} text-right truncate max-w-[200px]`}>
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2 rounded-lg bg-zinc-800/50">
      <div className="text-[8px] font-mono uppercase tracking-wider text-zinc-500 mb-0.5">{label}</div>
      <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
    </div>
  );
}
