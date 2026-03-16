import { RJSFSchema, UiSchema } from '@rjsf/utils'
import { BuilderField } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateSchemas(fields: BuilderField[]): { jsonSchema: any; uiSchema: any } {
  const jsonSchema: RJSFSchema = {
    type: 'object',
    properties: {},
    required: [],
  }

  const uiSchema: UiSchema = {
    'ui:order': fields.map((f) => f.id),
  }

  fields.forEach((field) => {
    const property: Record<string, unknown> = {
      title: field.title,
      description: field.description,
    }

    // JSON Schema types
    switch (field.type) {
      case 'number':
      case 'rating':
        property.type = 'number'
        if (field.min !== undefined) property.minimum = field.min
        if (field.max !== undefined) property.maximum = field.max
        break
      case 'boolean':
        property.type = 'boolean'
        break
      case 'select':
      case 'radio':
        property.type = 'string'
        property.enum = field.options?.map((o) => o.value)
        property.oneOf = field.options?.map((o) => ({
          const: o.value,
          title: o.label,
        }))
        break
      case 'multiselect':
        property.type = 'array'
        property.items = {
          type: 'string',
          enum: field.options?.map((o) => o.value),
          oneOf: field.options?.map((o) => ({
            const: o.value,
            title: o.label,
          }))
        }
        property.uniqueItems = true
        break
      case 'date':
        property.type = 'string'
        property.format = 'date'
        break
      case 'email':
        property.type = 'string'
        property.format = 'email'
        break
      default:
        property.type = 'string'
    }

    // Attributes
    const currentUi: Record<string, unknown> = {}

    if (field.placeholder) currentUi['ui:placeholder'] = field.placeholder
    
    if (field.type === 'textarea') currentUi['ui:widget'] = 'textarea'
    if (field.type === 'radio') currentUi['ui:widget'] = 'radio'
    if (field.type === 'multiselect') currentUi['ui:widget'] = 'checkboxes'
    if (field.type === 'rating') currentUi['ui:widget'] = 'rating'
    if (field.type === 'phone') {
      property.pattern = '^[0-9\\-\\+\\s\\(\\)]*$'
      currentUi['ui:help'] = 'Enter a valid phone number'
    }

    if (Object.keys(currentUi).length > 0) {
      uiSchema[field.id] = currentUi
    }

    if (field.pattern) {
      property.pattern = field.pattern
    }

    jsonSchema.properties![field.id] = property

    if (field.required) {
      ;(jsonSchema.required as string[]).push(field.id)
    }
  })

  return { jsonSchema, uiSchema }
}
