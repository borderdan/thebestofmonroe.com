/**
 * evaluate-conditions.ts
 * 
 * Pure function that evaluates JSONB condition arrays against a record.
 * Supports nested dot-notation field access and multiple operators.
 * 
 * Used by the Evaluator API route to determine whether a workflow
 * should be executed based on the incoming event payload.
 */

export interface WorkflowCondition {
  field: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains' | 'not_empty' | 'is_empty' | 'in' | 'not_in'
  value?: string | number | boolean | string[]
}

/**
 * Resolves a dot-notation field path against a nested object.
 * e.g. getNestedValue({ metadata: { source: 'pos' } }, 'metadata.source') → 'pos'
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }

  return current
}

/**
 * Coerces a value to a number for comparison operators.
 * Returns NaN if the value cannot be coerced.
 */
function toNumber(val: unknown): number {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const parsed = parseFloat(val)
    return isNaN(parsed) ? NaN : parsed
  }
  return NaN
}

/**
 * Evaluates a single condition against a record.
 */
function evaluateSingle(condition: WorkflowCondition, record: Record<string, unknown>): boolean {
  const fieldValue = getNestedValue(record, condition.field)
  const compareValue = condition.value

  switch (condition.operator) {
    case '==':
       
      return fieldValue == compareValue

    case '!=':
       
      return fieldValue != compareValue

    case '>': {
      const a = toNumber(fieldValue)
      const b = toNumber(compareValue)
      return !isNaN(a) && !isNaN(b) && a > b
    }

    case '<': {
      const a = toNumber(fieldValue)
      const b = toNumber(compareValue)
      return !isNaN(a) && !isNaN(b) && a < b
    }

    case '>=': {
      const a = toNumber(fieldValue)
      const b = toNumber(compareValue)
      return !isNaN(a) && !isNaN(b) && a >= b
    }

    case '<=': {
      const a = toNumber(fieldValue)
      const b = toNumber(compareValue)
      return !isNaN(a) && !isNaN(b) && a <= b
    }

    case 'contains':
      if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
        return fieldValue.toLowerCase().includes(compareValue.toLowerCase())
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(compareValue)
      }
      return false

    case 'not_contains':
      if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
        return !fieldValue.toLowerCase().includes(compareValue.toLowerCase())
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(compareValue)
      }
      return true

    case 'not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''

    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === ''

    case 'in':
      if (Array.isArray(compareValue)) {
        return compareValue.includes(fieldValue as string)
      }
      return false

    case 'not_in':
      if (Array.isArray(compareValue)) {
        return !compareValue.includes(fieldValue as string)
      }
      return true

    default:
      return false
  }
}

/**
 * Evaluates all conditions against a record.
 * Returns true if ALL conditions pass (logical AND).
 * Returns true if the conditions array is empty (no conditions = always match).
 */
export function evaluateConditions(
  conditions: WorkflowCondition[],
  record: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) return true
  return conditions.every((condition) => evaluateSingle(condition, record))
}
