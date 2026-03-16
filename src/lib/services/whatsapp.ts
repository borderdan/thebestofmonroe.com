'use server'

import * as Sentry from '@sentry/nextjs';

import { createClient } from '@/lib/supabase/server'

interface SendWhatsAppPayload {
  to: string
  type: 'receipt' | 'alert' | 'marketing'
  transactionId?: string
  businessId: string
  customerId?: string
  metadata?: Record<string, unknown>
}

/**
 * Triggers the n8n WhatsApp Automation Workflow.
 * Logs the attempt in whatsapp_logs.
 */
export async function sendWhatsAppMessage(payload: SendWhatsAppPayload) {
  try {
    const supabase = await createClient()
    
    // 1. Log the pending message
    const { data: log, error: logError } = await supabase
      .from('whatsapp_logs')
      .insert({
        business_id: payload.businessId,
        customer_id: payload.customerId,
        transaction_id: payload.transactionId,
        message_type: payload.type,
        status: 'pending'
      })
      .select('id')
      .single()

    if (logError) throw logError

    // 2. Trigger n8n Webhook
    // Note: In production, the N8N_WEBHOOK_URL would be in env vars
    const n8nUrl = process.env.N8N_WHATSAPP_WEBHOOK_URL
    if (!n8nUrl) {
        console.warn('N8N_WHATSAPP_WEBHOOK_URL not configured')
        return { success: false, error: 'WhatsApp service not configured' }
    }

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        logId: log.id
      })
    })

    if (!response.ok) throw new Error('n8n request failed')

    return { success: true }
  } catch (error: unknown) {
    Sentry.captureException(error);
    console.error('WhatsApp dispatch error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
