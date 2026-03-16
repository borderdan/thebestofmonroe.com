'use server'

import { type ActionResult } from '@/lib/supabase/helpers';

import * as Sentry from '@sentry/nextjs';

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ====== ENTITIES (Links, Keyrings, etc) ======

export async function createEntity(type: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
  
  const { data: entity, error } = await supabase
    .from('entities')
    .insert({ business_id: profile!.business_id, type, data })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/[locale]/app', 'layout')
  return entity
}

export async function updateEntity(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: entity, error } = await supabase
    .from('entities')
    .update({ data })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/[locale]/app', 'layout')
  return entity
}

export async function deleteEntity(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('entities').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/[locale]/app', 'layout')
  return true
}

// ====== MODULES (Theme/Features) ======

export async function updateModules(config: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()

  const { data: module, error } = await supabase
    .from('modules')
    .update({ config })
    .eq('business_id', profile!.business_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/[locale]/app', 'layout')
  return module
}

// ====== BUSINESS SETTINGS ======

export async function updateBusinessProfile(updates: { name?: string, city?: string, category?: string, logo_url?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()

  const { data: business, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', profile!.business_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/[locale]/app', 'layout')
  return business
}
