'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) throw new Error('Forbidden: Super-Admin only')
  return { supabase, user }
}

export async function getPlatformStats() {
  const { supabase } = await requireSuperAdmin()
  
  const [summary, revenue] = await Promise.all([
    supabase.from('platform_summary_stats').select('*').single(),
    supabase.from('platform_monthly_revenue').select('*').limit(12)
  ])

  return {
    summary: summary.data,
    monthlyRevenue: revenue.data || []
  }
}

export async function getAllTenants() {
  const { supabase } = await requireSuperAdmin()
  
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, city, subscription_tier, created_at,
      owners:users(id, full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateTenantSubscription(businessId: string, tier: string) {
  const { supabase } = await requireSuperAdmin()
  
  const { error } = await supabase
    .from('businesses')
    .update({ 
        subscription_tier: tier,
        updated_at: new Date().toISOString() 
    })
    .eq('id', businessId)

  if (error) throw error
  revalidatePath('/admin/tenants')
  return { success: true }
}

export async function updateTenantBetaFeatures(businessId: string, features: string[]) {
  const { supabase } = await requireSuperAdmin()
  
  const { error } = await supabase
    .from('businesses')
    .update({ beta_features: features })
    .eq('id', businessId)

  if (error) throw error
  revalidatePath('/admin/tenants')
  return { success: true }
}
