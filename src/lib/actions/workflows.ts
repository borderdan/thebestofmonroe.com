'use server'

import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import { getSessionWithProfile, type ActionResult } from '@/lib/supabase/helpers'

// ============================================================
// Types
// ============================================================

export interface Workflow {
  id: string
  business_id: string
  name: string
  description: string | null
  trigger_event: string
  conditions: Record<string, unknown>[]
  actions: Record<string, unknown>[]
  canvas_state: Record<string, unknown>
  is_active: boolean
  last_triggered_at: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  business_id: string
  trigger_event: string
  status: 'queued' | 'running' | 'success' | 'failed'
  record_id: string | null
  input_payload: Record<string, unknown> | null
  output_payload: Record<string, unknown> | null
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

// ============================================================
// CRUD
// ============================================================

export async function getWorkflows(): Promise<ActionResult<Workflow[]>> {
  try {
    const { supabase, profile } = await getSessionWithProfile()
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('business_id', profile.business_id)
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as Workflow[] }
  } catch (err) {
    Sentry.captureException(err)
    return { success: false, error: 'Failed to fetch workflows' }
  }
}

export async function getWorkflow(id: string): Promise<ActionResult<Workflow>> {
  try {
    const { supabase } = await getSessionWithProfile()
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as Workflow }
  } catch (err) {
    Sentry.captureException(err)
    return { success: false, error: 'Failed to fetch workflow' }
  }
}

interface SaveWorkflowPayload {
  id?: string
  name: string
  description?: string
  trigger_event: string
  conditions: Record<string, unknown>[]
  actions: Record<string, unknown>[]
  canvas_state: Record<string, unknown>
}

export async function saveWorkflow(payload: SaveWorkflowPayload): Promise<ActionResult<Workflow>> {
  try {
    const { supabase, profile } = await getSessionWithProfile()

    if (payload.id) {
      // Update existing
      const { data, error } = await supabase
        .from('workflows')
        .update({
          name: payload.name,
          description: payload.description || null,
          trigger_event: payload.trigger_event,
          conditions: payload.conditions,
          actions: payload.actions,
          canvas_state: payload.canvas_state,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id)
        .eq('business_id', profile.business_id)
        .select()
        .single()

      if (error) return { success: false, error: error.message }
      revalidatePath('/[locale]/app/workflows', 'page')
      return { success: true, data: data as Workflow }
    } else {
      // Create new
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          business_id: profile.business_id,
          name: payload.name,
          description: payload.description || null,
          trigger_event: payload.trigger_event,
          conditions: payload.conditions,
          actions: payload.actions,
          canvas_state: payload.canvas_state,
        })
        .select()
        .single()

      if (error) return { success: false, error: error.message }
      revalidatePath('/[locale]/app/workflows', 'page')
      return { success: true, data: data as Workflow }
    }
  } catch (err) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : 'Failed to save workflow'
    return { success: false, error: message }
  }
}

export async function deleteWorkflow(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getSessionWithProfile()
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/[locale]/app/workflows', 'page')
    return { success: true }
  } catch (err) {
    Sentry.captureException(err)
    return { success: false, error: 'Failed to delete workflow' }
  }
}

export async function toggleWorkflow(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await getSessionWithProfile()
    const { error } = await supabase
      .from('workflows')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/[locale]/app/workflows', 'page')
    return { success: true }
  } catch (err) {
    Sentry.captureException(err)
    return { success: false, error: 'Failed to toggle workflow' }
  }
}

// ============================================================
// Execution Logs
// ============================================================

export async function getWorkflowExecutions(workflowId?: string): Promise<ActionResult<WorkflowExecution[]>> {
  try {
    const { supabase, profile } = await getSessionWithProfile()
    let query = supabase
      .from('workflow_execution_logs')
      .select('*')
      .eq('business_id', profile.business_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (workflowId) {
      query = query.eq('workflow_id', workflowId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as WorkflowExecution[] }
  } catch (err) {
    Sentry.captureException(err)
    return { success: false, error: 'Failed to fetch execution logs' }
  }
}
