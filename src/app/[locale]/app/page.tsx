import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDashboardData } from '@/lib/queries/dashboard'
import { CivicGrid } from '@/components/hub/civic-grid'
import { StatsBar } from '@/components/hub/stats-bar'
import { EntityCard } from '@/components/hub/entity-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TrendingUp, ArrowRight, Package, AlertTriangle, ShoppingBag, BarChart3, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { SalesHeatmap } from '@/components/dashboard/sales-heatmap'
import { CategoryRevenueChart } from '@/components/dashboard/category-revenue-chart'
import { NotificationCenter } from '@/components/dashboard/notification-center'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, business_id, is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) redirect(`/${locale}/login`)

  const dashData = await getDashboardData(profile.business_id)
  const { 
    totalBusinesses, 
    communityUpdates, 
    groceryPrices, 
    kpis,
    chartData,
    recentTransactions,
    heatmapData,
    categoryData,
    inventoryHealth,
    notifications
  } = dashData

  const { data: trendingEntities } = await supabase
    .from('canonical_entities')
    .select('*')
    .order('vitality_score', { ascending: false })
    .limit(3)

  return (
    <div className="pb-20 space-y-8">
      {/* 1. Business Header */}
      <div className="flex justify-between items-end px-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Business Dashboard</h1>
          <p className="text-muted-foreground font-medium">Overview of your performance in Monroe.</p>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded-lg border border-border/50 uppercase font-bold">
          Last sync: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* 2. Primary KPI Cards (Priority #1 for Owners) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 px-4">
          <Card className="bg-primary/5 border-primary/10 shadow-sm rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenue Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">${kpis.todayRevenue.toLocaleString()}</div>
              <p className="text-[10px] text-emerald-500 font-bold">+{kpis.revenueDelta.toFixed(1)}% vs yesterday</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transactions</CardTitle>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{kpis.todayCount}</div>
              <p className="text-[10px] text-muted-foreground font-bold">Completed sales</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50 shadow-sm rounded-2xl relative overflow-hidden">
            {kpis.lowStockCount > 0 && <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inventory Alert</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{kpis.lowStockCount}</div>
              <p className="text-[10px] text-orange-500 font-bold">Low stock items</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Catalog</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{kpis.totalItems}</div>
              <p className="text-[10px] text-muted-foreground font-bold">Live menu items</p>
            </CardContent>
          </Card>
      </div>

      {/* 3. Main Analytics & Community Insights Section */}
      <div className="grid gap-8 lg:grid-cols-12 px-4">
        
        {/* Left Column: Business Operations & Growth */}
        <div className="lg:col-span-8 space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                    <RevenueChart data={chartData} />
                </div>
                <CategoryRevenueChart data={categoryData} />
                <NotificationCenter notifications={notifications} />
            </div>

            {/* Sales Heatmap (Restored) */}
            <div className="w-full">
                <SalesHeatmap data={heatmapData} />
            </div>

            {/* Community Context (The Made in Monroe Layer) */}
            <div className="pt-8 border-t border-border/40">
                <div className="flex items-center gap-2 mb-6">
                    <Globe className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-display font-bold tracking-tight">Community Pulse</h2>
                </div>
                <CivicGrid updates={communityUpdates} />
            </div>
        </div>

        {/* Right Column: Inventory, The Wallet & Activity */}
        <div className="lg:col-span-4 space-y-8">
            {/* Inventory Health Summary (Restored) */}
            <Card className="rounded-3xl border-amber-500/20 bg-amber-500/5 overflow-hidden shadow-sm">
                <CardHeader className="bg-amber-500/10 pb-4">
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-600" />
                        <CardTitle className="text-amber-700 text-sm font-black uppercase tracking-widest">Inventory Health</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col text-center p-3 bg-white/5 rounded-2xl border border-amber-500/10">
                            <span className="text-[10px] text-muted-foreground uppercase font-black">Low Stock</span>
                            <span className="text-2xl font-black text-amber-600">{(inventoryHealth as any).low_stock_count}</span>
                        </div>
                        <div className="flex flex-col text-center p-3 bg-white/5 rounded-2xl border border-destructive/10">
                            <span className="text-[10px] text-muted-foreground uppercase font-black">Restock</span>
                            <span className="text-2xl font-black text-destructive">{(inventoryHealth as any).critical_restock_count}</span>
                        </div>
                    </div>
                    <Separator className="bg-amber-500/10" />
                    <div className="flex items-center justify-between text-xs px-2">
                        <span className="text-muted-foreground font-medium">Daily Velocity</span>
                        <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-700 font-mono text-[10px]">
                            {Number((inventoryHealth as any).avg_sales_velocity).toFixed(1)} units/day
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Price Intel Summary */}
            <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/5 overflow-hidden shadow-sm">
                <CardHeader className="bg-emerald-500/10 pb-4">
                    <CardTitle className="text-emerald-700 flex items-center gap-2 text-lg font-black uppercase tracking-tighter text-center justify-center">
                        Price Intel
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-emerald-500/10">
                        {groceryPrices.map((item: any) => (
                            <div key={item.id} className="p-4 flex justify-between items-center hover:bg-emerald-500/5 transition-colors">
                                <div>
                                    <div className="text-sm font-bold">{item.item_name}</div>
                                    <div className="text-[9px] text-muted-foreground uppercase font-black">{item.store_name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-emerald-600">${item.price}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <StatsBar stats={{
                businesses: totalBusinesses,
                members: 1240,
                permits: communityUpdates.filter(u => u.type === 'permit').length,
                pulse: 88
            }} />

            <div className="w-full">
                <RecentTransactions transactions={recentTransactions} />
            </div>
        </div>
      </div>
    </div>
  )
}
