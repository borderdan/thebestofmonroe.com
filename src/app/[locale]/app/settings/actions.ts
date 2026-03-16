'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBusinessProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userProfile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.business_id) throw new Error('Business not linked')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', userProfile.business_id)
    .single()

  return business
}

export async function updateBusinessProfile(payload: { 
  name: string; 
  city: string; 
  logo_url: string | null; 
  cover_url: string | null;
  contact?: Record<string, string>;
  location?: Record<string, string>;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userProfile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.business_id) throw new Error('Business not linked')

  const { error } = await supabase
    .from('businesses')
    .update({
      name: payload.name,
      city: payload.city,
      logo_url: payload.logo_url,
      cover_url: payload.cover_url,
      contact: payload.contact,
      location: payload.location
    })
    .eq('id', userProfile.business_id)

  if (error) throw new Error(error.message)

  revalidatePath('/app/settings')
  revalidatePath('/', 'layout') 
  return { success: true }
}

export async function getLoyaltyConfig() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userProfile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.business_id) throw new Error('Business not linked')

  const { data: config } = await supabase
    .from('loyalty_configs')
    .select('*')
    .eq('business_id', userProfile.business_id)
    .single()

  return config || {
    is_active: false,
    points_per_currency: 1.00,
    redemption_ratio: 0.05,
    min_points_to_redeem: 100
  }
}

export async function updateLoyaltyConfig(payload: {
  is_active: boolean
  points_per_currency: number
  redemption_ratio: number
  min_points_to_redeem: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userProfile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.business_id) throw new Error('Business not linked')

  const { error } = await supabase
    .from('loyalty_configs')
    .upsert({
      business_id: userProfile.business_id,
      ...payload,
      updated_at: new Date().toISOString()
    }, { onConflict: 'business_id' })

  if (error) throw new Error(error.message)

  revalidatePath('/app/settings')
  return { success: true }
}

export async function getReportConfig() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userProfile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.business_id) throw new Error('Business not linked')

  const { data: config } = await supabase
    .from('report_configs')
    .select('*')
    .eq('business_id', userProfile.business_id)
    .single()

  return config || {
    is_active: false,
    recipient_email: '',
    report_frequency: 'weekly'
  }
}

export async function updateReportConfig(payload: {
  is_active: boolean
  recipient_email: string
  report_frequency: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userProfile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.business_id) throw new Error('Business not linked')

  const { error } = await supabase
    .from('report_configs')
    .upsert({
      business_id: userProfile.business_id,
      ...payload,
      updated_at: new Date().toISOString()
    }, { onConflict: 'business_id' })

  if (error) throw new Error(error.message)

  revalidatePath('/app/settings')
  return { success: true }
}
