'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertTriangle, Info, ShieldAlert, Check } from 'lucide-react'
import { format } from 'date-fns'

interface Notification {
  id: string
  type: string
  priority: string
  title: string
  message: string
  created_at: string
  status: string
}

interface NotificationCenterProps {
  notifications: Notification[]
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-blue-500 bg-blue-50',
  normal: 'text-slate-500 bg-slate-50',
  high: 'text-amber-500 bg-amber-50',
  critical: 'text-destructive bg-destructive/10'
}

const ICONS: Record<string, React.ElementType> = {
  inventory_restock: AlertTriangle,
  security_alert: ShieldAlert,
  default: Info
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Platform Alerts</CardTitle>
          </div>
          {notifications.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5">{notifications.length} New</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] || ICONS.default
            return (
              <div key={n.id} className="p-4 hover:bg-muted/30 transition-colors flex gap-3 group">
                <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${PRIORITY_COLORS[n.priority]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-bold truncate leading-tight">{n.title}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{format(new Date(n.created_at), 'HH:mm')}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-emerald-50 rounded text-emerald-600">
                  <Check className="w-3 h-3" />
                </button>
              </div>
            )
          })}
          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic">
              <p className="text-xs">All clear! No pending alerts.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
