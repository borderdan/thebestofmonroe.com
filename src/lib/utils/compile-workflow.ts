/**
 * compile-workflow.ts
 * 
 * BFS DAG compiler that transforms React Flow nodes/edges
 * into a flat JSON structure for backend storage and evaluation.
 */

import type { Node, Edge } from '@xyflow/react'

export interface CompiledCondition {
  step_id: string
  field: string
  operator: string
  value: string | number | boolean | string[]
}

export interface CompiledAction {
  step_id: string
  type: string
  config: Record<string, unknown>
}

export interface CompiledWorkflow {
  trigger_event: string
  conditions: CompiledCondition[]
  actions: CompiledAction[]
}

/**
 * Compiles React Flow state (nodes + edges) into a flat DAG
 * using Breadth-First Search starting from the trigger node.
 * 
 * @throws Error if no trigger node is found
 */
export function compileWorkflowState(nodes: Node[], edges: Edge[]): CompiledWorkflow {
  // Find the trigger node (entry point)
  const triggerNode = nodes.find((n) => n.type === 'trigger')
  if (!triggerNode) {
    throw new Error('Invalid Workflow: A trigger node is required.')
  }

  const conditions: CompiledCondition[] = []
  const actions: CompiledAction[] = []

  // Build adjacency list from edges
  const adjacencyList = new Map<string, string[]>()
  for (const edge of edges) {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, [])
    }
    adjacencyList.get(edge.source)!.push(edge.target)
  }

  // Node lookup map
  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]))

  // BFS traversal from trigger node
  const queue: string[] = adjacencyList.get(triggerNode.id) || []
  const visited = new Set<string>([triggerNode.id])

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    const node = nodeMap.get(currentId)
    if (!node) continue

    if (node.type === 'condition') {
      conditions.push({
        step_id: node.id,
        field: (node.data?.field as string) || '',
        operator: (node.data?.operator as string) || '==',
        value: (node.data?.value as string | number | boolean) ?? '',
      })
    } else if (node.type === 'action') {
      actions.push({
        step_id: node.id,
        type: (node.data?.actionType as string) || 'webhook',
        config: (node.data?.config as Record<string, unknown>) || {},
      })
    }

    // Enqueue children
    const children = adjacencyList.get(currentId) || []
    queue.push(...children)
  }

  return {
    trigger_event: (triggerNode.data?.triggerType as string) || 'unknown_event',
    conditions,
    actions,
  }
}
