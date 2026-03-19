/**
 * Evaluator API Route
 * 
 * Receives pg_net webhook payloads from Supabase database triggers,
 * queries matching active workflows, evaluates conditions, and dispatches
 * to Trigger.dev background tasks for execution.
 * 
 * POST /api/webhooks/evaluator
 * Headers: x-webhook-secret: <WEBHOOK_SECRET>
 * Body: { trigger_event, business_id, record }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { evaluateConditions, type WorkflowCondition } from '@/lib/utils/evaluate-conditions'
import { submitInvoiceRequest } from '@/lib/actions/invoices'

// Helper to get the admin client lazily
const getSupabase = () => getSupabaseAdmin()

interface EvaluatorPayload {
  trigger_event: string
  business_id: string
  record: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  // 1. Validate webhook secret
  const secret = req.headers.get('x-webhook-secret')
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: EvaluatorPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { trigger_event, business_id, record } = payload

  if (!trigger_event || !business_id) {
    return NextResponse.json({ error: 'Missing trigger_event or business_id' }, { status: 400 })
  }

  // 2. Fetch matching active workflows for this tenant + event
  const { data: workflows, error } = await supabase
    .from('workflows')
    .select('id, conditions, actions, name')
    .eq('business_id', business_id)
    .eq('trigger_event', trigger_event)
    .eq('is_active', true)

  if (error) {
    console.error('[Evaluator] Failed to fetch workflows:', error.message)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!workflows || workflows.length === 0) {
    return NextResponse.json({ status: 'no_matching_workflows', count: 0 })
  }

  // 3. Evaluate conditions and dispatch matching workflows
  const results = await Promise.allSettled(
    workflows.map(async (wf) => {
      const conditions = (wf.conditions as unknown as WorkflowCondition[]) || []
      const passes = evaluateConditions(conditions, record)

      if (!passes) {
        return { workflow_id: wf.id, status: 'skipped', reason: 'conditions_not_met' }
      }

      // Insert execution log (status: queued)
      const { data: execLog, error: logError } = await supabase
        .from('workflow_execution_logs')
        .insert({
          workflow_id: wf.id,
          business_id,
          trigger_event,
          status: 'queued',
          record_id: (record as Record<string, unknown>).id as string || null,
          input_payload: { trigger_event, record } as any,
        })
        .select('id')
        .single()

      if (logError) {
        console.error(`[Evaluator] Failed to log execution for workflow ${wf.id}:`, logError.message)
      }

      // Update workflow last_triggered_at
      await supabase
        .from('workflows')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', wf.id)

      // Dispatch to Trigger.dev (or process inline for now)
      // When Trigger.dev is configured, replace this with:
      // await executeWorkflowActions.trigger({ ... })
      try {
        await processWorkflowActions(wf.id, business_id, wf.actions as unknown as WorkflowAction[], record, execLog?.id)
      } catch (execError) {
        console.error(`[Evaluator] Workflow ${wf.id} execution failed:`, execError)
        if (execLog?.id) {
          await supabase
            .from('workflow_execution_logs')
            .update({
              status: 'failed',
              error_message: execError instanceof Error ? execError.message : 'Unknown error',
            })
            .eq('id', execLog.id)
        }
      }

      return { workflow_id: wf.id, status: 'dispatched', execution_id: execLog?.id }
    })
  )

  return NextResponse.json({
    status: 'processed',
    total: workflows.length,
    results: results.map((r) => (r.status === 'fulfilled' ? r.value : { status: 'error', reason: String(r.reason) })),
  })
}

// ============================================================
// Inline execution engine (will be migrated to Trigger.dev task)
// ============================================================

interface WorkflowAction {
  step_id: string
  type: string
  config: Record<string, unknown>
}

async function processWorkflowActions(
  workflowId: string,
  businessId: string,
  actions: WorkflowAction[],
  record: Record<string, unknown>,
  executionLogId?: string
) {
  const supabase = getSupabase()
  const startTime = Date.now()

  // Mark as running
  if (executionLogId) {
    await supabase
      .from('workflow_execution_logs')
      .update({ status: 'running' })
      .eq('id', executionLogId)
  }

  const results: Record<string, unknown>[] = []

  for (const action of actions) {
    try {
      const result = await executeAction(action, businessId, record)
      results.push({ step_id: action.step_id, status: 'success', result })
    } catch (err) {
      results.push({
        step_id: action.step_id,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      // Continue executing remaining actions even if one fails
    }
  }

  // Mark as complete
  const duration = Date.now() - startTime
  const hasFailures = results.some((r) => r.status === 'failed')

  if (executionLogId) {
    await supabase
      .from('workflow_execution_logs')
      .update({
        status: hasFailures ? 'failed' : 'success',
        output_payload: results as any,
        duration_ms: duration,
      })
      .eq('id', executionLogId)
  }
}

async function executeAction(
  action: WorkflowAction,
  businessId: string,
  record: Record<string, unknown>
): Promise<unknown> {
  const supabase = getSupabase()
  switch (action.type) {
    case 'send_webhook': {
      const url = action.config.url as string
      if (!url) throw new Error('Webhook URL is required')

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: { business_id: businessId, workflow_action: action.step_id },
          record,
        }),
      })
      return { status: response.status, ok: response.ok }
    }

    case 'send_email': {
      const to = action.config.to as string || (record.email as string)
      const subject = action.config.subject as string || 'Notification from The Best of Monroe'
      const body = action.config.body as string || ''

      if (!to) throw new Error('Email recipient is required')

      // Use Resend API directly
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured')
      }

      const fromEmail = process.env.RESEND_FROM_EMAIL;
      if (!fromEmail) {
        throw new Error('RESEND_FROM_EMAIL environment variable is not set');
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          text: body,
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Email send failed: ${err}`)
      }

      return { sent_to: to }
    }

    case 'send_whatsapp': {
      const to = (action.config.to as string) || (record.phone as string)
      const message = (action.config.message as string) || 'No message provided'

      if (!to) {
        throw new Error('WhatsApp action requires a "to" phone number')
      }

      if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_API_TOKEN) {
        throw new Error('WhatsApp API credentials are not configured')
      }

      const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''),
          type: 'text',
          text: {
            body: message
          }
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`WhatsApp send failed: ${err}`)
      }

      return { status: 'completed', sent_to: to, provider: 'whatsapp' }
    }

    case 'generate_cfdi': {
      const transactionId = record.id as string
      if (!transactionId) {
        throw new Error('generate_cfdi action requires a transaction id from the record')
      }

      const rfc = (action.config.rfc_receptor as string) || 'XAXX010101000'
      const nombre = (action.config.nombre_receptor as string) || 'PUBLICO EN GENERAL'
      const uso = (action.config.uso_cfdi as string) || 'S01'
      const regimen = (action.config.regimen_fiscal as string) || '616'
      const cp = (action.config.cp_receptor as string) || '00000'

      try {
        const result = await submitInvoiceRequest({
          transaction_id: transactionId,
          rfc_receptor: rfc,
          nombre_receptor: nombre,
          uso_cfdi: uso,
          regimen_fiscal: regimen,
          cp_receptor: cp
        })
        return { status: 'completed', provider: 'facturama', result }
      } catch (err: any) {
        throw new Error(`CFDI generation failed: ${err.message}`)
      }
    }

    case 'update_record': {
      const table = action.config.table as string
      const updates = action.config.updates as Record<string, unknown>
      const matchId = action.config.record_id as string || record.id as string

      if (!table || !updates || !matchId) {
        throw new Error('update_record requires table, updates, and record_id')
      }

      const { error } = await (supabase as any)
        .from(table)
        .update(updates)
        .eq('id', matchId)
        .eq('business_id', businessId)

      if (error) throw new Error(`Record update failed: ${error.message}`)
      return { updated: true }
    }

    default:
      console.warn(`[Workflow] Unknown action type: ${action.type}`)
      return { status: 'skipped', reason: `Unknown action type: ${action.type}` }
  }
}
