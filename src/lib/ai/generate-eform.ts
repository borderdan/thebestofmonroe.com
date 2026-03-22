/**
 * AI E-Form Generator
 * 
 * Uses Gemini to generate RJSF-compatible JSON Schema from natural language.
 * Output is directly consumable by the existing FormRenderer component.
 */
'use server'

import { generateStructuredJSON } from './gemini-client'

interface GeneratedEForm {
  title: string
  description: string
  json_schema: Record<string, unknown>
  ui_schema: Record<string, unknown>
}

const EFORM_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Technical name of the field (snake_case)' },
          type: { type: 'string', enum: ['string', 'number', 'integer', 'boolean', 'array'] },
          title: { type: 'string', description: 'Display label in Spanish' },
          description: { type: 'string' },
          enum: { type: 'array', items: { type: 'string' } },
          format: { type: 'string', enum: ['email', 'date', 'uri', 'data-url'] },
          pattern: { type: 'string' },
          minLength: { type: 'integer' },
          maxLength: { type: 'integer' },
          minimum: { type: 'number' },
          maximum: { type: 'number' },
          required: { type: 'boolean' },
          ui_widget: { type: 'string', enum: ['textarea', 'password', 'color', 'radio', 'checkboxes'] },
        },
        required: ['name', 'type', 'title'],
      },
      description: 'A list of fields to include in the form',
      minItems: 3,
    },
  },
  required: ['title', 'description', 'fields'],
}

export async function generateEForm(description: string): Promise<{
  success: boolean
  data?: GeneratedEForm
  error?: string
}> {
  const prompt = `You are an expert form designer for a Mexican small business SaaS platform called The Best of Monroe.

Generate a complete, high-quality form configuration based on this description:
"${description}"

Requirements:
1. Generate at least 4-6 relevant fields in the "fields" array.
2. Labels (title) and descriptions MUST be in Spanish.
3. Use appropriate field types and formats (e.g., use format: "email" for emails).
4. For Mexican phone numbers, use an appropriate pattern.
5. If a field should be a long text area, set "ui_widget" to "textarea".

Return a result with title, description, and the array of fields.`

  interface RawGeneratedForm {
    title: string
    description: string
    fields: Array<{
      name: string
      type: string
      title: string
      description?: string
      enum?: string[]
      format?: string
      pattern?: string
      minLength?: number
      maxLength?: number
      minimum?: number
      maximum?: number
      required?: boolean
      ui_widget?: string
    }>
  }

  const result = await generateStructuredJSON<RawGeneratedForm>(prompt, EFORM_RESPONSE_SCHEMA, {
    temperature: 0.2,
    maxOutputTokens: 8192,
  })

  if (!result.success || !result.data) return { success: false, error: result.error }

  // Transform array of fields into RJSF json_schema and ui_schema
  const properties: Record<string, unknown> = {}
  const required: string[] = []
  const ui_schema: Record<string, unknown> = {}

  result.data.fields.forEach((f) => {
    properties[f.name] = {
      type: f.type,
      title: f.title,
      description: f.description,
      enum: f.enum,
      format: f.format,
      pattern: f.pattern,
      minLength: f.minLength,
      maxLength: f.maxLength,
      minimum: f.minimum,
      maximum: f.maximum,
    }

    if (f.required) required.push(f.name)
    if (f.ui_widget) ui_schema[f.name] = { 'ui:widget': f.ui_widget }
  })

  return {
    success: true,
    data: {
      title: result.data.title,
      description: result.data.description,
      json_schema: {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      },
      ui_schema,
    },
  }
}
