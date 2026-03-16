'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Updates a specific exchange rate.
 * Typically called by an automated task (n8n).
 */
export async function updateExchangeRate(from: string, to: string, rate: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('exchange_rates')
    .upsert({
      from_currency: from,
      to_currency: to,
      rate,
      updated_at: new Date().toISOString()
    }, { onConflict: 'from_currency, to_currency' })

  if (error) throw error
  return { success: true }
}

/**
 * Fetches supported currencies for a business and current global rates.
 */
export async function getCurrencySettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) throw new Error('Business not found')

  const [currencies, rates] = await Promise.all([
    supabase
      .from('business_currencies')
      .select('currency_code, is_default')
      .eq('business_id', profile.business_id)
      .eq('is_active', true),
    supabase
      .from('exchange_rates')
      .select('*')
  ])

  // Fallback to MXN if no currencies configured
  const activeCurrencies = (currencies.data || []).length > 0 
    ? currencies.data 
    : [{ currency_code: 'MXN', is_default: true }]

  return {
    currencies: activeCurrencies,
    rates: rates.data || []
  }
}

/**
 * Configures which currencies a business accepts.
 */
export async function updateBusinessCurrencies(codes: string[], defaultCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) throw new Error('Business not found')

  // Deactivate all
  await supabase
    .from('business_currencies')
    .update({ is_active: false, is_default: false })
    .eq('business_id', profile.business_id)

  // Upsert new ones
  const payload = codes.map(code => ({
    business_id: profile.business_id,
    currency_code: code,
    is_active: true,
    is_default: code === defaultCode
  }))

  const { error } = await supabase
    .from('business_currencies')
    .upsert(payload, { onConflict: 'business_id, currency_code' })

  if (error) throw error
  
  revalidatePath('/app/settings')
  return { success: true }
}
