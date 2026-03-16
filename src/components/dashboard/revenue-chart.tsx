'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface ChartDataPoint {
  date: string
  revenue: number
  label: string
}

interface RevenueChartProps {
  data: ChartDataPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const t = useTranslations('dashboard')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('revenueChart')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.623 0.214 259.1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.623 0.214 259.1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(1 0 0 / 0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'oklch(0.704 0.022 261.3)' }}
                axisLine={{ stroke: 'oklch(1 0 0 / 0.1)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'oklch(0.704 0.022 261.3)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.105 0.027 265 / 0.95)',
                  border: '1px solid oklch(1 0 0 / 0.1)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: 'oklch(0.935 0.006 264.5)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px oklch(0 0 0 / 0.3)',
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, t('revenueChart').split('—')[0].trim()]}
                cursor={{ stroke: 'oklch(0.623 0.214 259.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="oklch(0.623 0.214 259.1)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
