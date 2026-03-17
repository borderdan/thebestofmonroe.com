/**
 * AI Workflow Generator (n8n JSON)
 * 
 * Uses Gemini to generate valid n8n workflow JSON from natural language.
 * The output can be pushed to the n8n Admin REST API.
 */
'use server'

import { generateStructuredJSON } from './gemini-client'

interface N8nNode {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: Record<string, unknown>
}

interface N8nWorkflow {
  name: string
  nodes: N8nNode[]
  connections: Record<string, Record<string, Array<Array<{ node: string; type: string; index: number }>>>>
}

const N8N_RESPONSE_SCHEMA = {
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
          from: { type: 'string', description: 'Name of the source node' },
          to: { type: 'string', description: 'Name of the target node' }
        },
        required: ['from', 'to']
      },
      description: 'A list of connections between nodes. MUST NOT BE EMPTY.',
      minItems: 1,
    },
  },
  required: ['name', 'nodes', 'connections'],
}

export async function generateN8nWorkflow(description: string): Promise<{
  success: boolean
  data?: N8nWorkflow
  error?: string
}> {
  const prompt = `You are an expert in n8n workflow automation for a Mexican SME SaaS platform.

Generate a complete, high-quality n8n workflow JSON based on this description:
"${description}"

Requirements:
1. The first node MUST be "n8n-nodes-base.webhook" as the entry point.
2. Use valid n8n node types (e.g., n8n-nodes-base.httpRequest, n8n-nodes-base.if, n8n-nodes-base.set).
3. Position nodes in a readable left-to-right layout.
4. Define all connections in the "connections" array as from-to pairs.
5. Provide at least 2-3 logical nodes (e.g., Webhook -> Set/IF -> HTTP Request).

Return a result with name, nodes, and the connections list.`

  interface RawGeneratedWorkflow {
    name: string
    nodes: N8nNode[]
    connections: Array<{ from: string; to: string }>
  }

  const result = await generateStructuredJSON<RawGeneratedWorkflow>(prompt, N8N_RESPONSE_SCHEMA, {
    temperature: 0.2,
    maxOutputTokens: 8192,
  })

  if (!result.success || !result.data) return { success: false, error: result.error }

  // Transform flat connections array into n8n's nested port format
  // Format: { "SourceNode": { "main": [[ { "node": "TargetNode", "type": "main", "index": 0 } ]] } }
  const connections: Record<string, any> = {}

  result.data.connections.forEach((c) => {
    if (!connections[c.from]) {
      connections[c.from] = { main: [[]] }
    }
    connections[c.from].main[0].push({
      node: c.to,
      type: 'main',
      index: 0,
    })
  })

  return {
    success: true,
    data: {
      name: result.data.name,
      nodes: result.data.nodes,
      connections,
    },
  }
}

/**
 * Push a generated workflow to the n8n admin instance via REST API.
 * Requires N8N_API_URL and N8N_API_KEY environment variables.
 */
export async function pushToN8n(workflow: N8nWorkflow): Promise<{
  success: boolean
  workflowId?: string
  webhookUrl?: string
  error?: string
}> {
  const apiUrl = process.env.N8N_API_URL
  const apiKey = process.env.N8N_API_KEY

  if (!apiUrl || !apiKey) {
    return { success: false, error: 'N8N_API_URL or N8N_API_KEY not configured' }
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': apiKey,
      },
      body: JSON.stringify({
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        active: false, // Start inactive so admin can review
        settings: {
          executionOrder: 'v1',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `n8n API error (${response.status}): ${errorText}` }
    }

    const data = await response.json()

    // Extract webhook URL from the first webhook node
    const webhookNode = workflow.nodes.find((n) => n.type === 'n8n-nodes-base.webhook')
    const webhookPath = webhookNode?.parameters?.path as string
    const webhookUrl = webhookPath ? `${apiUrl}/webhook/${webhookPath}` : undefined

    return {
      success: true,
      workflowId: data.id,
      webhookUrl,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to push to n8n',
    }
  }
}
