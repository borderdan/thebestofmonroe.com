import { getPlatformStats } from '@/lib/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Store, Landmark, ShoppingCart, TrendingUp } from 'lucide-react'
import { RevenueChart } from '@/components/dashboard/revenue-chart'

export default async function AdminDashboardPage() {
  const { summary, monthlyRevenue } = await getPlatformStats()

  const stats = [
    { title: 'Total Tenants', value: summary.total_tenants, icon: Store, color: 'text-blue-500' },
    { title: 'Global Customers', value: summary.total_customers, icon: Users, color: 'text-emerald-500' },
    { title: 'Total Sales', value: summary.total_transactions, icon: ShoppingCart, color: 'text-orange-500' },
    { 
        title: 'Platform GTV (MXN)', 
        value: `$${Number(summary.total_platform_revenue_mxn || 0).toLocaleString()}`, 
        icon: Landmark, 
        color: 'text-purple-500' 
    },
  ]

  // Transform for RevenueChart component
  const chartData = [...monthlyRevenue].reverse().map(d => {
    const label = new Date(d.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    return {
      date: d.month,
      label,
      revenue: Number(d.revenue)
    }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter">PLATFORM OVERVIEW</h1>
        <p className="text-zinc-500 font-medium">Real-time health of the The Best of Monroe network.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.title} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{s.title}</CardTitle>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Monthly Gross Transaction Volume</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <RevenueChart data={chartData} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span>Infrastructure</span>
                <span className="text-emerald-500">Operational</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span>Edge Sync Latency</span>
                <span className="text-emerald-500">42ms</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[98%]" />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-mono italic">
                    * GTV reflects total sales across all MXN, USD, and EUR transactions converted to MXN base.
                </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
