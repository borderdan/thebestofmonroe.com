import { ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LiveSignalCardProps {
  title: string
  icon: ReactNode
  live?: boolean
  timestamp?: string
  className?: string
  children: ReactNode
}

export function LiveSignalCard({ title, icon, live, timestamp, className, children }: LiveSignalCardProps) {
  return (
    <Card className={cn("bg-card border-border/40 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 rounded-xl overflow-hidden group", className)}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground group-hover:text-foreground transition-colors">
            {icon}
          </div>
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">
            {title}
          </CardTitle>
        </div>
        {live && (
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        )}
      </CardHeader>
      <CardContent>
        {children}
        {timestamp && (
          <div className="mt-4 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            Last sync: {timestamp}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
