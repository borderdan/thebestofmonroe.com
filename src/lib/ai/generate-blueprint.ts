'use server'

import { generateStructuredJSON } from './gemini-client'
import { saveAutomationConfig } from '@/lib/actions/automations'
import { saveWorkflow } from '@/lib/actions/workflows'
import { getSessionWithProfile } from '@/lib/supabase/helpers'

const BLUEPRINT_SCHEMA = {
  type: 'object',
  properties: {
    project_name: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier for this step' },
          type: { type: 'string', enum: ['data_table', 'eform', 'workflow', 'automation'] },
          title: { type: 'string', description: 'Descriptive title' },
          description: { type: 'string' },
          config: { 
            type: 'object',
            properties: {
              // Union-like properties for all types
              columns: { type: 'array', items: { type: 'object' } },
              fields: { type: 'array', items: { type: 'object' } },
              nodes: { type: 'array', items: { type: 'object' } },
              edges: { type: 'array', items: { type: 'object' } },
              trigger_type: { type: 'string', enum: ['inventory_low', 'eform_submission', 'pos_sale', 'crm_customer_new'] },
              suggested_webhook_url: { type: 'string' }
            },
            description: 'Configuration specific to the step type. MUST include trigger_type for automations.'
          }
        },
        required: ['id', 'type', 'title', 'config']
      }
    }
  },
  required: ['project_name', 'steps']
}

export interface DeploymentLog {
  id: string
  type: 'eform' | 'workflow' | 'automation' | 'n8n' | 'info' | 'error' | 'success'
  message: string
  status: 'pending' | 'success' | 'error'
  metadata?: Record<string, unknown>
}

export type BlueprintStepType = 'data_table' | 'eform' | 'workflow' | 'automation'

export interface BlueprintStep {
  id: string
  type: BlueprintStepType
  title: string
  description?: string
  config: Record<string, unknown>
}

export interface BlueprintResult {
  project_name: string
  steps: BlueprintStep[]
}

export async function generateBlueprintSchema(
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ success: boolean; data?: BlueprintResult; error?: string }> {
  try {
    const systemPrompt = `You are a Principal AI Architect for a Mexican SME SaaS called The Best of Monroe.
The user wants to builder an entirely new automated business process.

Based on this chat history (the user is asking to build or iterate on an architecture pipeline):
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Design or update the architecture blueprint as a unified pipeline of steps in order of execution/dependency. The platform supports 4 core building blocks:
1. Data Tables (Database models/storage layers)
2. E-Forms (User-facing data collection)
3. Workflows (Visual React Flow pipelines for internal logic)
4. Automations (External system integrations connected to internal system events via Webhooks)

Output a single \`steps\` array containing the sequential resources to provision.

Configuration rules per step type:
- type 'data_table': config should include \`columns\` (array of objects with \`name\` and \`type\`).
- type 'eform': config should include \`fields\` array (types: 'text', 'email', 'number', 'textarea', 'date', or 'select').
- type 'workflow': config should include generic \`nodes\` and \`edges\` compatible with React Flow.
- type 'automation': config must include \`trigger_type\` (one of: 'inventory_low', 'eform_submission', 'pos_sale', 'crm_customer_new') and optionally \`suggested_webhook_url\`.`

    const result = await generateStructuredJSON<BlueprintResult>(systemPrompt, BLUEPRINT_SCHEMA, {
      temperature: 0.2, // Low temp for architectural stability
      maxOutputTokens: 8192,
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data }

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error during blueprint generation'
    return { success: false, error: msg }
  }
}

export async function deployBlueprintEForm(form: BlueprintStep): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { supabase, profile } = await getSessionWithProfile()
    
    const config = form.config || {}
    const fields = config.fields || []
    const title = form.title || config.title || 'New E-Form'
    
    // Transform simplified fields to BuilderField schema
    const builderFields = (fields as Record<string, unknown>[]).map((f) => ({
      id: (f.id as string) || `field-${Math.random().toString(36).slice(2, 9)}`,
      type: (f.type as string) || 'text',
      label: (f.label as string) || 'New Field',
      required: (f.required as boolean) || false,
      placeholder: (f.placeholder as string) || '',
      options: (f.options as string[]) || []
    }))

    const { data: dbForm, error } = await supabase
      .from('eforms')
      .insert({
        business_id: profile.business_id,
        title: title,
        description: form.description || form.config?.description || '',
        json_schema: builderFields,
        ui_schema: {},
        is_active: true
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, id: dbForm.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to deploy E-Form' }
  }
}

export async function deployBlueprintAutomation(auto: BlueprintStep): Promise<{ success: boolean; webhookUrl?: string; error?: string }> {
  try {
    const config = auto.config || {}
    const triggerType = config.trigger_type as string
    const webhookUrl = (config.suggested_webhook_url as string) || 'https://api.example.com/webhook/pending-configuration'
    
    if (!triggerType) {
      return { success: false, error: 'Missing trigger_type in automation configuration' }
    }

    // Wire Webhook to trigger
    const saveResult = await saveAutomationConfig({
      trigger_type: triggerType,
      webhook_url: webhookUrl,
      is_active: true
    })

    if (!saveResult.success) {
      return { success: false, error: `Wiring failed: ${saveResult.error}` }
    }

    return { success: true, webhookUrl: webhookUrl as string }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to deploy Automation' }
  }
}

export async function deployBlueprintWorkflow(flow: BlueprintStep, projectName: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const config = flow.config || {}
    const nodes = config.nodes || []
    const edges = config.edges || []
    const name = flow.title || (config.name as string) || 'Visual Workflow'

    // Use generic placeholders for auto-layout positions if not provided by AI
    const nodesWithPositions = (nodes as Record<string, unknown>[]).map((n, i: number) => ({
      ...n,
      position: n.position || { x: i * 250, y: 100 }
    }))

    const wfResult = await saveWorkflow({
      id: undefined, // Create new
      name: name,
      description: `Auto-generated by AI Architect for ${projectName}`,
      trigger_event: 'eform_submission', // Default to a valid constraint enum
      conditions: [],
      actions: [],
      canvas_state: {
        nodes: nodesWithPositions,
        edges: edges
      }
    })

    if (!wfResult.success) {
      return { success: false, error: wfResult.error }
    }
    if (!wfResult.data) {
      return { success: false, error: 'Failed to save visual workflow: no data returned' }
    }

    return { success: true, id: wfResult.data.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to deploy visual workflow' }
  }
}

