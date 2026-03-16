import { Cloud, MapPin, AlertCircle, Clock } from 'lucide-react'
import { UniversalSearch } from './universal-search'

interface OverviewStripProps {
  weather?: { temp: number; condition: string }
  activeAlerts?: number
}

export function OverviewStrip({ weather, activeAlerts = 0 }: OverviewStripProps) {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="w-full bg-background/95 backdrop-blur border-b border-border/40 py-3 px-6 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium z-30 sticky top-16">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <MapPin className="w-4 h-4 text-monroe-accent" />
          Monroe, NC
        </div>
        <div className="hidden lg:flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          {currentDate} • {currentTime}
        </div>
      </div>

      <div className="flex-1 flex justify-center max-w-sm md:max-w-md w-full">
         <UniversalSearch />
      </div>
      
      <div className="flex items-center gap-6">
        {weather && (
          <div className="flex items-center gap-2 text-foreground">
            <Cloud className="w-4 h-4 text-sky-500" />
            {weather.temp}° {weather.condition}
          </div>
        )}
        
        {activeAlerts > 0 ? (
          <div className="flex items-center gap-1.5 text-red-600 bg-red-500/10 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            <AlertCircle className="w-3.5 h-3.5" />
            {activeAlerts} Active Alerts
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
            System Normal
          </div>
        )}
      </div>
    </div>
  )
}
