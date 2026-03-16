import { describe, it, expect } from 'vitest'
import { evaluateConditions, type WorkflowCondition } from '../evaluate-conditions'

describe('evaluateConditions', () => {
  // ============================================================
  // Empty/null conditions
  // ============================================================
  it('returns true for empty conditions', () => {
    expect(evaluateConditions([], { total: 100 })).toBe(true)
  })

  it('returns true for null/undefined conditions', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(evaluateConditions(null as any, { total: 100 })).toBe(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(evaluateConditions(undefined as any, { total: 100 })).toBe(true)
  })

  // ============================================================
  // Equality operators
  // ============================================================
  it('evaluates == correctly', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'status', operator: '==', value: 'completed' },
    ]
    expect(evaluateConditions(conditions, { status: 'completed' })).toBe(true)
    expect(evaluateConditions(conditions, { status: 'pending' })).toBe(false)
  })

  it('evaluates != correctly', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'status', operator: '!=', value: 'canceled' },
    ]
    expect(evaluateConditions(conditions, { status: 'completed' })).toBe(true)
    expect(evaluateConditions(conditions, { status: 'canceled' })).toBe(false)
  })

  // ============================================================
  // Numeric operators
  // ============================================================
  it('evaluates > correctly', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'total', operator: '>', value: 1000 },
    ]
    expect(evaluateConditions(conditions, { total: 1500 })).toBe(true)
    expect(evaluateConditions(conditions, { total: 1000 })).toBe(false)
    expect(evaluateConditions(conditions, { total: 500 })).toBe(false)
  })

  it('evaluates >= correctly', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'total', operator: '>=', value: 1000 },
    ]
    expect(evaluateConditions(conditions, { total: 1000 })).toBe(true)
    expect(evaluateConditions(conditions, { total: 999 })).toBe(false)
  })

  it('evaluates < correctly', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'stock', operator: '<', value: 5 },
    ]
    expect(evaluateConditions(conditions, { stock: 3 })).toBe(true)
    expect(evaluateConditions(conditions, { stock: 10 })).toBe(false)
  })

  it('evaluates <= correctly', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'stock', operator: '<=', value: 5 },
    ]
    expect(evaluateConditions(conditions, { stock: 5 })).toBe(true)
    expect(evaluateConditions(conditions, { stock: 6 })).toBe(false)
  })

  it('handles string-to-number coercion', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'total', operator: '>', value: 100 },
    ]
    expect(evaluateConditions(conditions, { total: '150' })).toBe(true)
    expect(evaluateConditions(conditions, { total: '50' })).toBe(false)
  })

  // ============================================================
  // String operators
  // ============================================================
  it('evaluates contains (case-insensitive)', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'name', operator: 'contains', value: 'john' },
    ]
    expect(evaluateConditions(conditions, { name: 'John Smith' })).toBe(true)
    expect(evaluateConditions(conditions, { name: 'Jane Doe' })).toBe(false)
  })

  it('evaluates not_contains', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'email', operator: 'not_contains', value: 'spam' },
    ]
    expect(evaluateConditions(conditions, { email: 'user@example.com' })).toBe(true)
    expect(evaluateConditions(conditions, { email: 'spammer@bad.com' })).toBe(false)
  })

  it('evaluates not_empty', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'email', operator: 'not_empty' },
    ]
    expect(evaluateConditions(conditions, { email: 'test@test.com' })).toBe(true)
    expect(evaluateConditions(conditions, { email: '' })).toBe(false)
    expect(evaluateConditions(conditions, { email: null })).toBe(false)
    expect(evaluateConditions(conditions, {})).toBe(false)
  })

  it('evaluates is_empty', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'notes', operator: 'is_empty' },
    ]
    expect(evaluateConditions(conditions, { notes: '' })).toBe(true)
    expect(evaluateConditions(conditions, { notes: null })).toBe(true)
    expect(evaluateConditions(conditions, {})).toBe(true)
    expect(evaluateConditions(conditions, { notes: 'some text' })).toBe(false)
  })

  // ============================================================
  // Dot-notation nested fields
  // ============================================================
  it('resolves dot-notation paths', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'metadata.source', operator: '==', value: 'pos' },
    ]
    expect(evaluateConditions(conditions, { metadata: { source: 'pos' } })).toBe(true)
    expect(evaluateConditions(conditions, { metadata: { source: 'web' } })).toBe(false)
  })

  it('handles deeply nested paths', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'a.b.c.d', operator: '==', value: 'deep' },
    ]
    expect(evaluateConditions(conditions, { a: { b: { c: { d: 'deep' } } } })).toBe(true)
  })

  it('returns false for missing nested paths', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'metadata.nonexistent', operator: '==', value: 'test' },
    ]
    expect(evaluateConditions(conditions, { metadata: {} })).toBe(false)
  })

  // ============================================================
  // Multiple conditions (AND logic)
  // ============================================================
  it('requires all conditions to pass (AND)', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'total', operator: '>', value: 1000 },
      { field: 'status', operator: '==', value: 'completed' },
    ]
    expect(evaluateConditions(conditions, { total: 1500, status: 'completed' })).toBe(true)
    expect(evaluateConditions(conditions, { total: 1500, status: 'pending' })).toBe(false)
    expect(evaluateConditions(conditions, { total: 500, status: 'completed' })).toBe(false)
  })

  // ============================================================
  // in / not_in operators
  // ============================================================
  it('evaluates in correctly', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'payment_method', operator: 'in', value: ['cash', 'card'] },
    ]
    expect(evaluateConditions(conditions, { payment_method: 'cash' })).toBe(true)
    expect(evaluateConditions(conditions, { payment_method: 'crypto' })).toBe(false)
  })

  it('evaluates not_in correctly', () => {
    const conditions: WorkflowCondition[] = [
      { field: 'status', operator: 'not_in', value: ['canceled', 'refunded'] },
    ]
    expect(evaluateConditions(conditions, { status: 'completed' })).toBe(true)
    expect(evaluateConditions(conditions, { status: 'canceled' })).toBe(false)
  })
})
