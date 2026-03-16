'use server'

import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache'
import { getSessionWithProfile, type ActionResult } from '@/lib/supabase/helpers'
import { z } from 'zod'
import type { BlueprintProposal } from '@/components/architect/architect-client'

export interface Blueprint {
  id: string
  business_id: string
  name: string
  description: string | null
  status: 'draft' | 'deployed'
  content: BlueprintProposal
  created_at: string
  updated_at: string
}

export async function getBlueprints(): Promise<ActionResult<Blueprint[]>> {
  try {
    const { supabase, profile } = await getSessionWithProfile()
    const { data, error } = await supabase
      .from('blueprints')
      .select('*')
      .eq('business_id', profile.business_id)
      .order('updated_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as Blueprint[] }
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: 'Failed to fetch blueprints' }
  }
}

export async function getBlueprint(id: string): Promise<ActionResult<Blueprint>> {
  try {
    const { supabase, profile } = await getSessionWithProfile()
    const { data, error } = await supabase
      .from('blueprints')
      .select('*')
      .eq('id', id)
      .eq('business_id', profile.business_id)
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as Blueprint }
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: 'Failed to fetch blueprint' }
  }
}

export async function saveBlueprintDraft(
  name: string,
  content: BlueprintProposal,
  id?: string,
  description?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, profile } = await getSessionWithProfile()
    
    // Auto-generate name if empty
    const finalName = name.trim() || 'Untitled Architecture'

    const payload = {
      ...(id ? { id } : {}),
      business_id: profile.business_id,
      name: finalName,
      description: description || null,
      status: 'draft',
      content
    }

    const { data, error } = await supabase
      .from('blueprints')
      .upsert(payload as any)
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/architect', 'page')
    return { success: true, data: { id: data.id } }
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: 'Failed to save blueprint draft' }
  }
}

export async function updateBlueprintStatus(
  id: string,
  status: 'draft' | 'deployed'
): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getSessionWithProfile()
    const { error } = await supabase
      .from('blueprints')
      .update({ status })
      .eq('id', id)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/architect', 'page')
    return { success: true }
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: 'Failed to update blueprint status' }
  }
}

export async function deleteBlueprint(id: string): Promise<ActionResult> {
  try {
    const { supabase, profile } = await getSessionWithProfile()
    const { error } = await supabase
      .from('blueprints')
      .delete()
      .eq('id', id)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/architect', 'page')
    return { success: true }
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: 'Failed to delete blueprint' }
  }
}
