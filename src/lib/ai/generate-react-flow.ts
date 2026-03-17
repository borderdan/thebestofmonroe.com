'use server'

import { generateStructuredJSON } from './gemini-client'
import { v4 as uuidv4 } from 'uuid'
import type { Node, Edge } from '@xyflow/react'

interface GeneratedReactFlow {
  description: string
  nodes: Array<{
    id: string
    type: 'trigger' | 'condition' | 'action'
    label: string
    configType: string // e.g. 'pos_sale_completed' for triggers, 'send_webhook' for actions
    conditions?: Array<{ field: string; operator: string; value: string }> // for condition nodes
  }>
  edges: Array<{
    source: string
    target: string // for normal connections
    targetTrue?: string // for condition nodes
    targetFalse?: string // for condition nodes
  }>
}

const REACT_FLOW_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    description: { type: 'string', description: 'A short summary of what this workflow does in Spanish.' },
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'A short alphanumeric ID (e.g. n1, trigger, action1)' },
          type: { type: 'string', enum: ['trigger', 'condition', 'action'] },
          label: { type: 'string', description: 'A short, clear name for the node in Spanish' },
          configType: { 
            type: 'string', 
            description: 'The specific type of trigger or action',
            enum: [
              'pos_sale_completed', 'eform_submission', 'crm_customer_new', 'inventory_low', 'invoice_issued', // Triggers
              'send_webhook', 'send_email', 'send_whatsapp', 'generate_cfdi', 'update_record' // Actions
            ]
          },
          conditions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                operator: { type: 'string', enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'] },
                value: { type: 'string' }
              },
              required: ['field', 'operator', 'value']
            }
          }
        },
        required: ['id', 'type', 'label'] // configType is required for triggers/actions, conditions for condition nodes
      },
      minItems: 1
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'The ID of the source node' },
          target: { type: 'string', description: 'The ID of the target node (for standard connections)' },
          targetTrue: { type: 'string', description: 'The ID of the target node if the condition is True' },
          targetFalse: { type: 'string', description: 'The ID of the target node if the condition is False' }
        },
        required: ['source']
      },
      minItems: 1
    }
  },
  required: ['description', 'nodes', 'edges']
}

export async function generateReactFlowWorkflow(description: string): Promise<{
  success: boolean
  data?: {
    nodes: Node[]
    edges: Edge[]
  }
  error?: string
}> {
  const prompt = `You are an expert automation architect for a Mexican SME SaaS platform (The Best of Monroe).

Generate a visual workflow based on this description:
"${description}"

Requirements:
1. ALWAYS start with exactly ONE "trigger" node. Valid trigger configTypes: pos_sale_completed, eform_submission, crm_customer_new, inventory_low, invoice_issued.
2. Follow the trigger with "condition" or "action" nodes.
3. Valid action configTypes: send_webhook, send_email, send_whatsapp, generate_cfdi, update_record.
4. "condition" nodes MUST have a "conditions" array (e.g., field: "amount", operator: "greater_than", value: "1000").
5. Connect all nodes logically using the "edges" array.
   - For standard connections (trigger -> action), specify "source" and "target".
   - For conditions (condition -> ...), specify "source" and EITHER "targetTrue" OR "targetFalse" (or both).
6. Labels should be briefly descriptive and in Spanish.

Generate at least 2-4 nodes to make a functional pipeline. Keep IDs simple (e.g., "t1", "c1", "a1").`

  const result = await generateStructuredJSON<GeneratedReactFlow>(prompt, REACT_FLOW_RESPONSE_SCHEMA, {
    temperature: 0.2, // Low temperature for maximum adherence to graph structures
    maxOutputTokens: 8192,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error }
  }

  // Translate the AI's simplified conceptual graph into actual React Flow Nodes and Edges
  const rfNodes: Node[] = []
  const rfEdges: Edge[] = []

  // Auto-layout logic (horizontal pipeline)
  const currentX = 100
  const currentY = 200
  const xOffset = 350
  const yOffset = 150

  const processedNodeIds = new Set<string>()

  // Helper to place a node and process its children recursively to build a decent visual tree
  const placeNode = (nodeId: string, x: number, y: number) => {
    if (processedNodeIds.has(nodeId)) return
    processedNodeIds.add(nodeId)

    const aiNode = result.data!.nodes.find(n => n.id === nodeId)
    if (!aiNode) return

    // Create the React Flow Node
    const rfNode: Node = {
      id: uuidv4(), // Generate real UUIDs for the actual canvas
      type: aiNode.type,
      position: { x, y },
      data: {
        label: aiNode.label,
        ...(aiNode.type === 'trigger' && { triggerType: aiNode.configType || 'pos_sale_completed' }),
        ...(aiNode.type === 'action' && { actionType: aiNode.configType || 'send_webhook' }),
        ...(aiNode.type === 'condition' && { conditions: aiNode.conditions || [] })
      }
    }
    rfNodes.push(rfNode)

    // Find outgoing edges to place children
    const outgoingEdges = result.data!.edges.filter(e => e.source === nodeId)
    
    outgoingEdges.forEach((edge, index) => {
      // Standard connection
      if (edge.target) {
        const targetRfNodeId = uuidv4() // Predetermine child ID
        
        rfEdges.push({
          id: uuidv4(),
          source: rfNode.id,
          target: targetRfNodeId,
          type: 'smoothstep',
          animated: aiNode.type !== 'condition',
        })

        // Recursively place the child node further to the right
        // If there are multiple children, stagger them vertically
        placeNode(edge.target, x + xOffset, y + (index * yOffset))
        
        // Update the child's ID in the rfNodes array after it's been placed
        const justPlacedChild = rfNodes[rfNodes.length - 1]
        if (justPlacedChild) justPlacedChild.id = targetRfNodeId
      }

      // Condition TRUE branch
      if (edge.targetTrue) {
        const targetRfNodeId = uuidv4()
        rfEdges.push({
          id: uuidv4(),
          source: rfNode.id,
          target: targetRfNodeId,
          sourceHandle: 'true',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 2 }
        })
        placeNode(edge.targetTrue, x + xOffset, y - (yOffset / 2))
        const justPlacedChild = rfNodes[rfNodes.length - 1]
        if (justPlacedChild) justPlacedChild.id = targetRfNodeId
      }

      // Condition FALSE branch
      if (edge.targetFalse) {
        const targetRfNodeId = uuidv4()
        rfEdges.push({
          id: uuidv4(),
          source: rfNode.id,
          target: targetRfNodeId,
          sourceHandle: 'false',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#ef4444', strokeWidth: 2 }
        })
        placeNode(edge.targetFalse, x + xOffset, y + (yOffset / 2))
        const justPlacedChild = rfNodes[rfNodes.length - 1]
        if (justPlacedChild) justPlacedChild.id = targetRfNodeId
      }
    })
  }

  // Find the roots (nodes with no incoming edges, should be exactly 1 trigger)
  const rootNodes = result.data.nodes.filter(n => 
    !result.data!.edges.some(e => e.target === n.id || e.targetTrue === n.id || e.targetFalse === n.id)
  )

  // Start placement logic from the roots
  rootNodes.forEach((root, idx) => {
    placeNode(root.id, currentX, currentY + (idx * yOffset * 2))
  })

  // Failsafe: Place any disconnected nodes that were missed by the tree traversal
  result.data.nodes.forEach(n => {
    if (!processedNodeIds.has(n.id)) {
      placeNode(n.id, currentX + xOffset, currentY + yOffset * 2) // Just drop them somewhere visible
    }
  })

  return {
    success: true,
    data: {
      nodes: rfNodes,
      edges: rfEdges
    }
  }
}
