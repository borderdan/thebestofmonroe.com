import { format } from 'date-fns'
import { ArrowRight, Info, AlertTriangle, Cloud, Car, Plane, Home, Activity } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface IntelligenceFeedProps {
  updates: any[]
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'weather': return <Cloud className="w-4 h-4 text-sky-500" />
    case 'traffic': return <Car className="w-4 h-4 text-amber-500" />
    case 'aviation': return <Plane className="w-4 h-4 text-indigo-500" />
    case 'permit': return <Home className="w-4 h-4 text-orange-500" />
    case 'alert': return <AlertTriangle className="w-4 h-4 text-red-500" />
    default: return <Activity className="w-4 h-4 text-emerald-500" />
  }
}

export function IntelligenceFeed({ updates }: IntelligenceFeedProps) {
  // Sort by date, newest first, and take top 8
  let feed = [...updates]
    .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime())
    .slice(0, 8)

  if (feed.length === 0) {
    feed = [
      { id: 'mock-1', type: 'permit', title: 'New Commercial Construction', description: 'Permit issued for 100 W Jefferson St renovations', event_time: new Date().toISOString() },
      { id: 'mock-2', type: 'weather', title: 'Clear Skies Expected', description: 'Optimal conditions for outdoor dining this evening in downtown Monroe', event_time: new Date(Date.now() - 3600000).toISOString() },
      { id: 'mock-3', type: 'traffic', title: 'Scheduled Road Closure', description: 'Main St closed starting tomorrow at 6am for upcoming community festival prep', event_time: new Date(Date.now() - 7200000).toISOString() },
      { id: 'mock-4', type: 'alert', title: 'Utility Maintenance', description: 'Water service interruption expected near Stewart St between 2pm-4pm', event_time: new Date(Date.now() - 86400000).toISOString() }
    ]
  }

  return (
    <Card className="bg-card border-border/40 shadow-card rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-2xl font-medium tracking-tight">
            Community Intelligence
          </CardTitle>
          <Badge variant="secondary" className="bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest border-none">
            Live Feed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {feed.map((item) => (
            <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors group cursor-pointer">
              <div className="flex-shrink-0 mt-1">
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.type}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/70">
                    {format(new Date(item.event_time), "MMM d, h:mm a")}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-monroe-accent transition-colors">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pl-2 self-center">
                <ArrowRight className="w-4 h-4 text-monroe-accent" />
              </div>
            </div>
          ))}
          {feed.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No recent intelligence events in the area.
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border/40 bg-muted/20 text-center">
          <button className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">
            View Full Timeline
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
