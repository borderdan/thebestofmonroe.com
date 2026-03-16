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

  const sanitizeDuplicated = (val: string | number | null | undefined) => {
    if (typeof val === 'string') {
      const half = val.length / 2;
      if (val.length > 0 && val.length % 2 === 0) {
        const part1 = val.substring(0, half);
        const part2 = val.substring(half);
        if (part1 === part2) return part1;
      }
    }
    if (typeof val === 'number') {
      // If it looks like 1515 instead of 15
      const s = val.toString();
      const half = s.length / 2;
      if (s.length > 0 && s.length % 2 === 0) {
        const part1 = s.substring(0, half);
        const part2 = s.substring(half);
        if (part1 === part2) return Number(part1);
      }
    }
    return val;
  };

  const items = (products || []).map(p => ({
    id: p.id,
    data: {
      name: sanitizeDuplicated(p.name),
      price: sanitizeDuplicated(Number(p.price)),
      stock_level: p.stock_quantity,
      barcode: p.barcode,
      sku: p.sku,
      category: sanitizeDuplicated(p.category),
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
