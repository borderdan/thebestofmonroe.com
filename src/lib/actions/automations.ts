'use server'


import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const automationConfigSchema = z.object({
  id: z.string().optional(),
  trigger_type: z.enum(['inventory_low', 'eform_submission', 'pos_sale', 'crm_customer_new']),
  webhook_url: z.string().url(),
  is_active: z.boolean().default(true),
})

export type AutomationConfig = z.infer<typeof automationConfigSchema> & {
  id: string
  business_id: string
  workflow_id?: string
  created_at: string
}

export async function getAutomationConfigs(): Promise<ActionResult<AutomationConfig[]>> {
  try {
    await requireModuleAccess('automations')
    const { supabase, profile } = await getSessionWithProfile()
    const { error } = await supabase
      .from('automation_configs')
      .select('*')
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as AutomationConfig[] }
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: 'Failed to fetch automations' }
  }
}

export async function saveAutomationConfig(values: unknown): Promise<ActionResult> {
  try {
    await requireModuleAccess('automations')
    const { supabase, profile } = await getSessionWithProfile()
    const validated = automationConfigSchema.parse(values)

    // Check if an existing config exists for this trigger type if no ID is provided
    let configId = validated.id;
    if (!configId) {
      const { data: existing } = await supabase
        .from('automation_configs')
        .select('id')
        .eq('business_id', profile.business_id)
        .eq('trigger_type', validated.trigger_type)
        .single()
      
      if (existing) {
        configId = existing.id
      }
    }

    const { error } = await supabase
      .from('automation_configs')
      .upsert({
        ...(configId ? { id: configId } : {}),
        business_id: profile.business_id,
        trigger_type: validated.trigger_type,
        webhook_url: validated.webhook_url,
        is_active: validated.is_active,
      })
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/[locale]/app/automations', 'page')
    return { success: true }
  } catch (err) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to save automation'
    return { success: false, error: message }
  }
}

export async function triggerAutomation(
  businessId: string, 
  triggerType: 'inventory_low' | 'eform_submission' | 'pos_sale' | 'crm_customer_new', 
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const { supabase } = await getSessionWithProfile()
    
    // 1. Fetch active automation configs for this trigger type
    const { data: configs, error } = await supabase
      .from('automation_configs')
      .select('*')
      .eq('business_id', businessId)
      .eq('trigger_type', triggerType)
      .eq('is_active', true)

    if (error || !configs || configs.length === 0) return

    // 2. Fire each webhook in parallel
    await Promise.allSettled(configs.map(async (config) => {
      try {
        const response = await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: triggerType,
            business_id: businessId,
            payload,
            timestamp: new Date().toISOString()
          }),
        })

        if (!response.ok) {
          console.error(`Automation ${config.id} failed with status: ${response.status}`)
        }

        // Log the trigger in activity_log
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('activity_log').insert({
          business_id: businessId,
          user_id: user?.id,
          action: 'automation_triggered',
          metadata: {
            config_id: config.id,
            trigger_type: triggerType,
            status: response.ok ? 'success' : 'failed'
          }
        })
      } catch (webhookErr) {
        Sentry.captureException(webhookErr)
        console.error(`Failed to trigger webhook ${config.webhook_url}:`, webhookErr)
      }
    }))
  } catch (err) {
    Sentry.captureException(err)
    console.error('Error in triggerAutomation:', err)
  }
}

export async function deleteAutomationConfig(id: string): Promise<ActionResult> {
  try {
    await requireModuleAccess('automations')
    const { supabase, profile } = await getSessionWithProfile()
    const { error } = await supabase
      .from('automation_configs')
      .delete()
      .eq('id', id)
      .eq('business_id', profile.business_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/app/automations', 'page')
    return { success: true }
  } catch (err) {
    Sentry.captureException(err);
    return { success: false, error: 'Failed to delete automation' }
  }
}
