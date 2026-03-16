import { describe, it, expect } from 'vitest'
import { compileWorkflowState } from '../compile-workflow'
import type { Node, Edge } from '@xyflow/react'

describe('compileWorkflowState', () => {
  // ============================================================
  // Error cases
  // ============================================================
  it('throws if no trigger node exists', () => {
    const nodes: Node[] = [
      { id: '1', type: 'action', position: { x: 0, y: 0 }, data: { actionType: 'send_email' } },
    ]
    expect(() => compileWorkflowState(nodes, [])).toThrow('A trigger node is required')
  })

  // ============================================================
  // Basic trigger-only workflow
  // ============================================================
  it('compiles a trigger-only workflow', () => {
    const nodes: Node[] = [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: { triggerType: 'pos_sale_completed' },
      },
    ]
    const result = compileWorkflowState(nodes, [])
    expect(result.trigger_event).toBe('pos_sale_completed')
    expect(result.conditions).toEqual([])
    expect(result.actions).toEqual([])
  })

  // ============================================================
  // Trigger → Action
  // ============================================================
  it('compiles trigger → action', () => {
    const nodes: Node[] = [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: { triggerType: 'eform_submission' },
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 200, y: 0 },
        data: { actionType: 'send_email', config: { to: 'admin@test.com' } },
      },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'trigger-1', target: 'action-1' },
    ]

    const result = compileWorkflowState(nodes, edges)
    expect(result.trigger_event).toBe('eform_submission')
    expect(result.actions).toHaveLength(1)
    expect(result.actions[0].type).toBe('send_email')
    expect(result.actions[0].step_id).toBe('action-1')
    expect(result.conditions).toHaveLength(0)
  })

  // ============================================================
  // Trigger → Condition → Action
  // ============================================================
  it('compiles trigger → condition → action', () => {
    const nodes: Node[] = [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: { triggerType: 'pos_sale_completed' },
      },
      {
        id: 'condition-1',
        type: 'condition',
        position: { x: 200, y: 0 },
        data: { field: 'total', operator: '>', value: 1000 },
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 400, y: 0 },
        data: { actionType: 'send_whatsapp', config: { phone: '+52...' } },
      },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'trigger-1', target: 'condition-1' },
      { id: 'e2', source: 'condition-1', target: 'action-1' },
    ]

    const result = compileWorkflowState(nodes, edges)
    expect(result.trigger_event).toBe('pos_sale_completed')
    expect(result.conditions).toHaveLength(1)
    expect(result.conditions[0].field).toBe('total')
    expect(result.conditions[0].operator).toBe('>')
    expect(result.actions).toHaveLength(1)
    expect(result.actions[0].type).toBe('send_whatsapp')
  })

  // ============================================================
  // Branching workflow (1 trigger → 2 actions)
  // ============================================================
  it('compiles branching workflows', () => {
    const nodes: Node[] = [
      {
        id: 't1',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: { triggerType: 'crm_customer_new' },
      },
      {
        id: 'a1',
        type: 'action',
        position: { x: 200, y: -100 },
        data: { actionType: 'send_email', config: {} },
      },
      {
        id: 'a2',
        type: 'action',
        position: { x: 200, y: 100 },
        data: { actionType: 'send_whatsapp', config: {} },
      },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 't1', target: 'a1' },
      { id: 'e2', source: 't1', target: 'a2' },
    ]

    const result = compileWorkflowState(nodes, edges)
    expect(result.actions).toHaveLength(2)
  })

  // ============================================================
  // Ignores disconnected nodes
  // ============================================================
  it('ignores disconnected nodes', () => {
    const nodes: Node[] = [
      {
        id: 't1',
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: { triggerType: 'pos_sale_completed' },
      },
      {
        id: 'a1',
        type: 'action',
        position: { x: 200, y: 0 },
        data: { actionType: 'send_email', config: {} },
      },
      {
        id: 'a2',
        type: 'action',
        position: { x: 400, y: 200 },
        data: { actionType: 'send_whatsapp', config: {} },
      },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 't1', target: 'a1' },
      // a2 is not connected
    ]

    const result = compileWorkflowState(nodes, edges)
    expect(result.actions).toHaveLength(1)
    expect(result.actions[0].step_id).toBe('a1')
  })

  // ============================================================
  // Handles cycles gracefully (BFS visited check)
  // ============================================================
  it('handles cycles without infinite loop', () => {
    const nodes: Node[] = [
      { id: 't1', type: 'trigger', position: { x: 0, y: 0 }, data: { triggerType: 'pos_sale_completed' } },
      { id: 'a1', type: 'action', position: { x: 200, y: 0 }, data: { actionType: 'send_email', config: {} } },
      { id: 'a2', type: 'action', position: { x: 400, y: 0 }, data: { actionType: 'send_whatsapp', config: {} } },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 't1', target: 'a1' },
      { id: 'e2', source: 'a1', target: 'a2' },
      { id: 'e3', source: 'a2', target: 'a1' }, // cycle!
    ]

    const result = compileWorkflowState(nodes, edges)
    expect(result.actions).toHaveLength(2)
  })
})
