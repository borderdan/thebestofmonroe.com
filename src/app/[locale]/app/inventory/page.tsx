import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { MenuItemData } from '@/lib/types/entity-data'
import { InventoryClient } from '@/components/inventory/inventory-client'

export default async function InventoryPage({
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
    .select('business_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) redirect(`/${locale}/login`)

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', profile.business_id)
    .order('name', { ascending: true })

  const items = (products || []).map(p => ({
    id: p.id,
    data: {
      name: p.name,
      price: Number(p.price),
      stock_level: p.stock_quantity,
      barcode: p.barcode,
      sku: p.sku,
      category: p.category,
      description: p.description
    } as MenuItemData,
    is_active: p.is_active,
    sort_order: p.sort_order,
    created_at: p.created_at,
    sales_velocity_7d: Number(p.sales_velocity_7d || 0),
    predicted_out_of_stock_date: p.predicted_out_of_stock_date,
    restock_recommendation: p.restock_recommendation
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Manage your menu items and stock levels.</p>
      </div>
      <InventoryClient items={items} userRole={profile.role} />
    </div>
  )
}
