import { createClient } from '@/lib/supabase/server'

/**
 * Dashboard query utilities — all filtered by the authenticated user's business_id.
 * Called from the Server Component dashboard page.
 */

export async function getDashboardData(businessId: string) {
  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
  const yesterdayEnd = todayStart
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()

  // All queries in parallel
  const [
    todayTx,
    yesterdayTx,
    weekTx,
    lowStockItems,
    recentTx,
    allProducts,
    hourlySales,
    categoryRevenue,
    inventoryHealthRes,
    notificationsRes,
    communityUpdatesRes,
    groceryPricesRes,
    totalBusinessesRes
  ] = await Promise.all([
    // ... rest of queries
    // Total businesses for stats
    supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true }),
    
    // ... rest
    // Today's completed transactions
    supabase
      .from('transactions')
      .select('total')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('created_at', todayStart),

    // Yesterday's completed transactions
    supabase
      .from('transactions')
      .select('total')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('created_at', yesterdayStart)
      .lt('created_at', yesterdayEnd),

    // Last 7 days transactions for chart
    supabase
      .from('transactions')
      .select('total, created_at')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true }),

    // Low stock items from products table
    supabase
      .from('products')
      .select('id, stock_quantity')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .lte('stock_quantity', 5),

    // Recent 10 transactions
    supabase
      .from('transactions')
      .select('id, total, status, created_at, currency, payment_method')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10),

    // All active products for total count
    supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('business_id', businessId)
      .eq('is_active', true),

    // Hourly sales for heatmap
    supabase
      .from('hourly_sales_analytics')
      .select('*')
      .eq('business_id', businessId),

    // Category revenue for pie chart
    supabase
      .from('category_revenue_analytics')
      .select('category, total_revenue')
      .eq('business_id', businessId),

    // Inventory Health Summary (New View)
    supabase
      .from('inventory_health_summary')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle(),

    // Notifications
    supabase
      .from('platform_notifications')
      .select('*')
      .eq('business_id', businessId)
      .in('status', ['pending', 'sent'])
      .order('created_at', { ascending: false })
      .limit(5),

    // Community Updates (Traffic, Weather, etc.)
    supabase
      .from('community_updates')
      .select('*')
      .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
      .order('event_time', { ascending: false })
      .limit(10),

    // Grocery Prices (The Wallet)
    supabase
      .from('grocery_prices' as any)
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(5)
  ])

  // Calculate KPIs
  const todayRevenue = (todayTx.data || []).reduce((sum, t) => sum + ((t as any).total || 0), 0)
  const yesterdayRevenue = (yesterdayTx.data || []).reduce((sum, t) => sum + ((t as any).total || 0), 0)
  const todayCount = (todayTx.data || []).length
  const revenueDelta = yesterdayRevenue > 0
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
    : todayRevenue > 0 ? 100 : 0

  const lowStockCount = lowStockItems.data?.length || 0
  const totalItems = allProducts.count || 0

  // Revenue by day for chart
  const revenueByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = d.toISOString().split('T')[0]
    revenueByDay[key] = 0
  }
  for (const tx of weekTx.data || []) {
    const day = (tx as any).created_at?.split('T')[0]
    if (day && day in revenueByDay) {
      revenueByDay[day] += (tx as any).total || 0
    }
  }
  const chartData = Object.entries(revenueByDay).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
    label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  }))

  return {
    kpis: {
      todayRevenue,
      yesterdayRevenue,
      revenueDelta,
      todayCount,
      lowStockCount,
      totalItems,
    },
    chartData,
    heatmapData: (hourlySales.data || []).map(d => ({
      day_of_week: Number((d as any).day_of_week),
      hour_of_day: Number((d as any).hour_of_day),
      transaction_count: Number((d as any).transaction_count),
      total_revenue: Number((d as any).total_revenue)
    })),
    categoryData: (categoryRevenue.data || []).map(d => ({
      category: d.category,
      revenue: Number((d as any).total_revenue)
    })),
    inventoryHealth: inventoryHealthRes.data || { low_stock_count: 0, critical_restock_count: 0, avg_sales_velocity: 0 },
    notifications: notificationsRes.data || [],
    communityUpdates: communityUpdatesRes.data || [],
    groceryPrices: groceryPricesRes.data || [],
    totalBusinesses: totalBusinessesRes.count || 0,
    recentTransactions: (recentTx.data || []).map(tx => ({
      id: tx.id,
      total: (tx as any).total,
      status: (tx as any).status,
      created_at: (tx as any).created_at,
      currency: (tx as any).currency || 'MXN',
      payment_method: (tx as any).payment_method || 'cash',
    })),
  }
}
