import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"

type KpiStatus = 'success' | 'warning' | 'critical' | 'neutral'

interface KpiCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  status?: KpiStatus
  icon?: LucideIcon
  className?: string
}

const statusConfig: Record<KpiStatus, { border: string; iconColor: string }> = {
  success: { border: 'border-success/30', iconColor: 'text-success' },
  warning: { border: 'border-warning/30', iconColor: 'text-warning' },
  critical: { border: 'border-critical/30', iconColor: 'text-critical' },
  neutral: { border: 'border-white/10', iconColor: 'text-muted-foreground' },
}

export function KpiCard({
  title,
  value,
  trend,
  trendLabel,
  status = 'neutral',
  icon: Icon,
  className,
}: KpiCardProps) {
  const { border, iconColor } = statusConfig[status]

  const TrendIcon = trend !== undefined
    ? trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
    : null

  const trendColor = trend !== undefined
    ? trend > 0 ? 'text-success' : trend < 0 ? 'text-critical' : 'text-muted-foreground'
    : ''

  return (
    <Card className={cn(border, className)}>
      <CardContent className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
              {TrendIcon && <TrendIcon className="h-3 w-3" />}
              <span>{trend > 0 ? '+' : ''}{trend}%</span>
              {trendLabel && (
                <span className="text-muted-foreground ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2 rounded-xl bg-white/5", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
