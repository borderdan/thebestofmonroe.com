'use server'

import { type ActionResult } from '@/lib/supabase/helpers';

import * as Sentry from '@sentry/nextjs';

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function claimNfcTag(guid: string, pin: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required to claim hardware.' }
  }

  // Get user's business_id
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.business_id) {
    return { success: false, error: 'Tenant profile not found.' }
  }

  // Atomic update: only updates if pin matches and status is unclaimed
  const { data, error } = await supabase
    .from('nfc_tags')
    .update({ 
      business_id: profile.business_id, 
      status: 'active' 
    })
    .match({ guid: guid, claim_pin: pin, status: 'unclaimed' })
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: 'Invalid GUID/PIN combination or tag is already claimed.' }
  }

  // Update activity log
  await supabase.from('activity_log').insert({
    business_id: profile.business_id,
    user_id: user.id,
    action: 'claim_nfc_tag',
    metadata: { guid, tag_id: data.id }
  })

  revalidatePath('/[locale]/app/keyrings', 'page')
  return { success: true, tag: data }
}

export async function updateNfcTag(id: string, updates: { target_type?: string; target_url?: string; status?: string }) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('nfc_tags')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[locale]/app/keyrings', 'page')
  return { success: true, tag: data }
}
