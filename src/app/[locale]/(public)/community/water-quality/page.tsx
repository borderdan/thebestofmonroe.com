import PublicLayout from '@/components/public/PublicLayout';
import PublicHeader from '@/components/public/PublicHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, AlertCircle, Clock, ExternalLink, Waves, Activity, Info } from 'lucide-react';

// USGS stream gauges near Monroe, NC
const GAUGES = [
  { id: '02143500', name: 'Twelvemile Creek at Monroe' },
  { id: '02147015', name: 'Richardson Creek near Monroe' },
];

const USGS_URL = `https://waterservices.usgs.gov/nwis/iv/?sites=${GAUGES.map((g) => g.id).join(',')}&parameterCd=00060,00065&format=json&siteStatus=active`;

type USGSTimeSeries = {
  sourceInfo: { siteName: string; siteCode: { value: string }[] };
  variable: { variableName: string; unit: { unitCode: string }; variableCode: { value: string }[] };
  values: { value: { value: string; dateTime: string; qualifiers: string[] }[] }[];
};

type GaugeReading = {
  siteId: string;
  siteName: string;
  gaugeName: string;
  discharge: { value: number; dateTime: string } | null;
  gaugeHeight: { value: number; dateTime: string } | null;
  // Trend data: compare last two readings
  dischargePrev: number | null;
  gaugeHeightPrev: number | null;
};

async function fetchUSGSData(): Promise<GaugeReading[]> {
  const res = await fetch(USGS_URL, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`USGS API error: ${res.status}`);
  const data = await res.json();
  const series: USGSTimeSeries[] = data?.value?.timeSeries ?? [];

  const byGauge: Record<string, GaugeReading> = {};
  for (const ts of series) {
    const siteId = ts.sourceInfo.siteCode[0]?.value ?? '';
    const paramCode = ts.variable.variableCode[0]?.value ?? '';
    const validValues = ts.values[0]?.value?.filter((v) => v.value !== '-999999') ?? [];
    const latest = validValues.at(-1);
    const prev = validValues.length >= 2 ? validValues.at(-2) : null;

    if (!byGauge[siteId]) {
      const gaugeInfo = GAUGES.find((g) => g.id === siteId);
      byGauge[siteId] = {
        siteId,
        siteName: ts.sourceInfo.siteName,
        gaugeName: gaugeInfo?.name ?? ts.sourceInfo.siteName,
        discharge: null,
        gaugeHeight: null,
        dischargePrev: null,
        gaugeHeightPrev: null,
      };
    }

    if (latest) {
      const reading = { value: parseFloat(latest.value), dateTime: latest.dateTime };
      if (paramCode === '00060') {
        byGauge[siteId].discharge = reading;
        byGauge[siteId].dischargePrev = prev ? parseFloat(prev.value) : null;
      }
      if (paramCode === '00065') {
        byGauge[siteId].gaugeHeight = reading;
        byGauge[siteId].gaugeHeightPrev = prev ? parseFloat(prev.value) : null;
      }
    }
  }

  return Object.values(byGauge);
}

function floodStatus(heightFt: number | null): { label: string; variant: 'default' | 'secondary' | 'destructive'; color: string } {
  if (!heightFt) return { label: 'No Data', variant: 'secondary', color: 'gray' };
  if (heightFt >= 15) return { label: 'Major Flood Stage', variant: 'destructive', color: 'red' };
  if (heightFt >= 10) return { label: 'Moderate Flood Stage', variant: 'destructive', color: 'red' };
  if (heightFt >= 7) return { label: 'Minor Flood Stage', variant: 'destructive', color: 'orange' };
  if (heightFt >= 5) return { label: 'Action Stage', variant: 'secondary', color: 'yellow' };
  return { label: 'Normal', variant: 'default', color: 'green' };
}

function TrendArrow({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  const pct = previous !== 0 ? ((diff / previous) * 100).toFixed(1) : '0';
  if (Math.abs(diff) < 0.01) {
    return <span className="text-xs text-muted-foreground ml-1">steady</span>;
  }
  if (diff > 0) {
    return (
      <span className="text-xs text-red-500 ml-1 flex items-center gap-0.5">
        <svg width="10" height="10" viewBox="0 0 10 10" className="fill-current"><path d="M5 0 L10 7 L0 7 Z" /></svg>
        +{pct}%
      </span>
    );
  }
  return (
    <span className="text-xs text-green-500 ml-1 flex items-center gap-0.5">
      <svg width="10" height="10" viewBox="0 0 10 10" className="fill-current"><path d="M5 10 L10 3 L0 3 Z" /></svg>
      {pct}%
    </span>
  );
}

function GaugeBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : color === 'orange' ? 'bg-orange-500' : color === 'red' ? 'bg-red-500' : 'bg-gray-400';

  return (
    <div className="w-full">
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>0 ft</span>
        <span>Normal (5 ft)</span>
        <span>{max} ft</span>
      </div>
    </div>
  );
}

export default async function WaterQualityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let gauges: GaugeReading[] = [];
  let fetchError: string | null = null;

  try {
    gauges = await fetchUSGSData();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load USGS data';
  }

  const now = new Date();

  return (
    <PublicLayout locale={locale}>
      <PublicHeader locale={locale} />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Water Levels</h1>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                Live data as of {now.toLocaleString(locale)} (updates every 15 minutes)
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Real-time stream gauge readings from USGS monitoring stations near Monroe, NC.
            These gauges measure water flow and height to help monitor flood conditions.
          </p>
        </div>

        {/* Explanatory info card */}
        <Card className="mb-8 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30">
          <CardContent className="p-4 flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-semibold text-foreground">Gauge Height</span> measures the water surface elevation in feet. Normal levels are typically below 5 ft.</p>
              <p><span className="font-semibold text-foreground">Discharge</span> measures the volume of water flowing past the gauge in cubic feet per second (cfs). Higher values indicate faster-moving or higher-volume water.</p>
            </div>
          </CardContent>
        </Card>

        {fetchError ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">Unable to load water data</p>
              <p className="text-sm text-muted-foreground mt-2">{fetchError}</p>
              <p className="text-xs text-muted-foreground mt-4">
                The USGS water data service may be temporarily unavailable. Please try again later.
              </p>
            </CardContent>
          </Card>
        ) : gauges.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Waves className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">No gauge data available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Stream gauge data for Monroe area monitoring stations is currently unavailable.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {gauges.map((gauge) => {
              const status = floodStatus(gauge.gaugeHeight?.value ?? null);
              const updatedAt = gauge.gaugeHeight?.dateTime ?? gauge.discharge?.dateTime;
              const heightValue = gauge.gaugeHeight?.value ?? 0;

              return (
                <Card key={gauge.siteId} className={status.color === 'red' ? 'border-red-300 dark:border-red-800' : status.color === 'orange' ? 'border-orange-300 dark:border-orange-800' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${status.color === 'green' ? 'bg-green-500' : status.color === 'yellow' ? 'bg-yellow-500' : status.color === 'orange' ? 'bg-orange-500' : status.color === 'red' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                        <CardTitle className="text-base leading-tight">{gauge.gaugeName}</CardTitle>
                      </div>
                      <Badge variant={status.variant} className="shrink-0 text-xs">{status.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">USGS Station #{gauge.siteId}</p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Gauge meter */}
                    <GaugeBar value={heightValue} max={20} color={status.color} />

                    {/* Reading cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/50 p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2 flex items-center justify-center gap-1">
                          <Waves className="h-3 w-3" />
                          Gauge Height
                        </p>
                        <div className="flex items-baseline justify-center">
                          <p className="text-3xl font-black">
                            {gauge.gaugeHeight ? gauge.gaugeHeight.value.toFixed(2) : '--'}
                          </p>
                          <span className="text-xs text-muted-foreground ml-1">ft</span>
                        </div>
                        <TrendArrow current={gauge.gaugeHeight?.value ?? null} previous={gauge.gaugeHeightPrev} />
                      </div>
                      <div className="rounded-xl bg-muted/50 p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2 flex items-center justify-center gap-1">
                          <Activity className="h-3 w-3" />
                          Discharge
                        </p>
                        <div className="flex items-baseline justify-center">
                          <p className="text-3xl font-black">
                            {gauge.discharge ? gauge.discharge.value.toLocaleString() : '--'}
                          </p>
                          <span className="text-xs text-muted-foreground ml-1">cfs</span>
                        </div>
                        <TrendArrow current={gauge.discharge?.value ?? null} previous={gauge.dischargePrev} />
                      </div>
                    </div>

                    {/* Timestamp and link */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                      {updatedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(updatedAt).toLocaleString(locale)}
                        </span>
                      )}
                      <a
                        href={`https://waterdata.usgs.gov/monitoring-location/${gauge.siteId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        Full history <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Data source attribution */}
        <footer className="mt-10 border-t pt-6">
          <p className="text-xs text-center text-muted-foreground">
            Data from the{' '}
            <a href="https://waterdata.usgs.gov/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              USGS National Water Information System
            </a>
            . Stream gauge readings are provisional and subject to revision. Flood stage thresholds are approximate
            and may vary by location. For official flood warnings, consult the{' '}
            <a href="https://www.weather.gov/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              National Weather Service
            </a>.
          </p>
        </footer>
      </main>
    </PublicLayout>
  );
}
