'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HeatmapDataPoint {
  day_of_week: number
  hour_of_day: number
  transaction_count: number
  total_revenue: number
}

interface SalesHeatmapProps {
  data: HeatmapDataPoint[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function SalesHeatmap({ data }: SalesHeatmapProps) {
  // Find max revenue for color scaling
  const maxRevenue = Math.max(...data.map(d => d.total_revenue), 1)

  const getCellData = (day: number, hour: number) => {
    return data.find(d => d.day_of_week === day && d.hour_of_day === hour)
  }

  const getIntensity = (revenue: number) => {
    if (revenue === 0) return 'bg-muted/30'
    const ratio = revenue / maxRevenue
    if (ratio > 0.8) return 'bg-emerald-600'
    if (ratio > 0.6) return 'bg-emerald-500'
    if (ratio > 0.4) return 'bg-emerald-400'
    if (ratio > 0.2) return 'bg-emerald-300'
    return 'bg-emerald-200'
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">Hourly Sales Activity (Heatmap)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[800px]">
            {/* Header: Hours */}
            <div className="grid grid-cols-[50px_repeat(24,1fr)] gap-1 mb-2">
              <div />
              {HOURS.map(h => (
                <div key={h} className="text-[10px] text-center text-muted-foreground font-medium">
                  {h === 0 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h-12}p` : `${h}a`}
                </div>
              ))}
            </div>

            {/* Rows: Days */}
            <TooltipProvider>
              <div className="space-y-1">
                {DAYS.map((dayName, dayIndex) => (
                  <div key={dayName} className="grid grid-cols-[50px_repeat(24,1fr)] gap-1">
                    <div className="text-xs flex items-center text-muted-foreground font-semibold">
                      {dayName}
                    </div>
                    {HOURS.map(hour => {
                      const cell = getCellData(dayIndex, hour)
                      const revenue = cell?.total_revenue || 0
                      return (
                        <Tooltip key={hour}>
                          <TooltipTrigger>
                            <div 
                              className={`h-8 rounded-sm transition-colors cursor-help ${getIntensity(revenue)}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="text-xs">
                              <div className="font-bold">{dayName} @ {hour}:00</div>
                              <div>Revenue: ${revenue.toFixed(2)}</div>
                              <div>Orders: {cell?.transaction_count || 0}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 justify-end text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          <span>Less Active</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-emerald-200 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-300 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-600 rounded-sm" />
          </div>
          <span>Busiest Hours</span>
        </div>
      </CardContent>
    </Card>
  )
}
