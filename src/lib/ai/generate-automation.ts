'use server'

import { generateStructuredJSON } from './gemini-client'
import { pushToN8n } from './generate-workflow'

const AUTOMATION_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    trigger_type: {
      type: 'string',
      enum: ['inventory_low', 'eform_submission', 'pos_sale', 'crm_customer_new'],
      description: 'The internal The Best of Monroe event that should trigger this automation'
    },
    n8n_workflow: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              typeVersion: { type: 'number' },
              position: { type: 'array', items: { type: 'number' } },
              parameters: { type: 'object' },
            },
            required: ['id', 'name', 'type', 'typeVersion', 'position', 'parameters'],
          },
          minItems: 1,
        },
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' }
            },
            required: ['from', 'to']
          },
          minItems: 1,
        },
      },
      required: ['name', 'nodes', 'connections'],
    }
  },
  required: ['trigger_type', 'n8n_workflow']
}

interface AutomationResult {
  trigger_type: string
  n8n_workflow: {
    name: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodes: any[]
    connections: Array<{ from: string; to: string }>
  }
}

export async function generateAndDeployAutomation(description: string): Promise<{
  success: boolean
  trigger_type?: string
  webhook_url?: string
  error?: string
}> {
  const prompt = `You are an expert in business process automation for a Mexican SME SaaS.

Based on this user description:
"${description}"

Perform two tasks:
1. Classify the best internal trigger ('inventory_low', 'eform_submission', 'pos_sale', or 'crm_customer_new').
2. Generate a complete n8n workflow JSON to handle the action.

Workflow Requirements:
1. The first node MUST be "n8n-nodes-base.webhook" as the entry point.
2. Provide at least 2 logical nodes (e.g., Webhook -> Slack/Email/Condition).
3. The Connections array must map "from" node names to "to" node names.`

  try {
    const result = await generateStructuredJSON<AutomationResult>(prompt, AUTOMATION_RESPONSE_SCHEMA, {
      temperature: 0.2,
      maxOutputTokens: 8192,
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to generate automation logic' }
    }

    // Prepare connections for n8n format
    const n8nConnections: Record<string, Record<string, Array<Array<{ node: string; type: string; index: number }>>>> = {}
    
    result.data.n8n_workflow.connections.forEach((c: { from: string; to: string }) => {
      if (!n8nConnections[c.from]) {
        n8nConnections[c.from] = { main: [[]] }
      }
      n8nConnections[c.from].main[0].push({
        node: c.to,
        type: 'main',
        index: 0,
      })
    })

    const workflowPayload = {
      name: result.data.n8n_workflow.name,
      nodes: result.data.n8n_workflow.nodes,
      connections: n8nConnections
    }

    // Deploy to n8n
    const pushResult = await pushToN8n(workflowPayload)

    if (!pushResult.success || !pushResult.webhookUrl) {
      return { 
        success: false, 
        error: `Generated successfully, but n8n deployment failed: ${pushResult.error || 'No webhook URL returned'}` 
      }
    }

    return {
      success: true,
      trigger_type: result.data.trigger_type,
      webhook_url: pushResult.webhookUrl
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error during automation generation'
    }
  }
}
