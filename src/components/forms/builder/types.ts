export type FieldType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'select' 
  | 'multiselect'
  | 'radio'
  | 'textarea' 
  | 'email' 
  | 'phone'
  | 'date'
  | 'rating'

export interface BuilderField {
  id: string
  type: FieldType
  title: string
  description?: string
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[] // For select, multiselect, radio
  pattern?: string // Regex
  min?: number
  max?: number
}

export const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: 'string', label: 'Short Text', icon: 'Type' },
  { type: 'textarea', label: 'Long Text', icon: 'AlignLeft' },
  { type: 'email', label: 'Email Address', icon: 'Mail' },
  { type: 'phone', label: 'Phone Number', icon: 'Phone' },
  { type: 'number', label: 'Number', icon: 'Hash' },
  { type: 'select', label: 'Dropdown', icon: 'ChevronDown' },
  { type: 'multiselect', label: 'Multi-Select', icon: 'ListChecks' },
  { type: 'radio', label: 'Radio Group', icon: 'CircleDot' },
  { type: 'boolean', label: 'Checkbox', icon: 'CheckSquare' },
  { type: 'date', label: 'Date Picker', icon: 'Calendar' },
  { type: 'rating', label: 'Star Rating', icon: 'Star' },
]
