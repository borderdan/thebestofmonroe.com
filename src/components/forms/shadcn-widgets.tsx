'use client'

import React from 'react'
import { RegistryWidgetsType, WidgetProps } from '@rjsf/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Star } from 'lucide-react'

/**
 * Custom Base Input Widget (Text, Email, Number, etc.)
 */
const BaseInput = ({ id, value, required, readonly, disabled, onChange, onBlur, onFocus, placeholder, type, label }: WidgetProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Input
        id={id}
        name={id}
        type={type}
        value={value || ''}
        required={required}
        disabled={disabled || readonly}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
        onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
        className="bg-background"
      />
    </div>
  )
}

/**
 * Custom Textarea Widget
 */
const TextareaWidget = ({ id, value, required, readonly, disabled, onChange, placeholder, label }: WidgetProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Textarea
        id={id}
        name={id}
        value={value || ''}
        required={required}
        disabled={disabled || readonly}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background min-h-[100px]"
      />
    </div>
  )
}

/**
 * Custom Select Widget
 */
const SelectWidget = ({ id, options, value, required, disabled, readonly, onChange, label, placeholder }: WidgetProps) => {
  const { enumOptions } = options
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <ShadcnSelect
        value={value ? String(value) : undefined}
        onValueChange={(val) => onChange(val)}
        disabled={disabled || readonly}
      >
        <SelectTrigger id={id} className="bg-background w-full">
          <SelectValue placeholder={placeholder || 'Select an option'} />
        </SelectTrigger>
        <SelectContent>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {enumOptions?.map((option: any, index: number) => (
            <SelectItem key={index} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
    </div>
  )
}

/**
 * Custom Checkbox Widget
 */
const CheckboxWidget = ({ id, value, required, disabled, readonly, onChange, label }: WidgetProps) => {
  return (
    <div className="flex items-center space-x-2 py-2">
      <Checkbox
        id={id}
        checked={!!value}
        onCheckedChange={(checked: boolean) => onChange(checked)}
        disabled={disabled || readonly}
        required={required}
      />
      {label && (
        <Label htmlFor={id} className="text-sm font-medium leading-none cursor-pointer">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
    </div>
  )
}

/**
 * Custom Radio Widget
 */
const RadioWidget = ({ id, options, value, required, disabled, readonly, onChange, label }: WidgetProps) => {
  const { enumOptions } = options
  return (
    <div className="space-y-3">
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <RadioGroup
        id={id}
        value={value}
        onValueChange={(val) => onChange(val)}
        disabled={disabled || readonly}
        className="flex flex-col space-y-1"
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {enumOptions?.map((option: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem value={String(option.value)} id={`${id}-${index}`} />
            <Label htmlFor={`${id}-${index}`} className="text-sm font-normal cursor-pointer">{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

/**
 * Custom Multiple Checkboxes Widget
 */
const CheckboxesWidget = ({ id, options, value, required, disabled, readonly, onChange, label }: WidgetProps) => {
  const { enumOptions } = options
  const selectedValues = Array.isArray(value) ? value : []

  const handleToggle = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, optionValue])
    } else {
      onChange(selectedValues.filter((v: string) => v !== optionValue))
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {enumOptions?.map((option: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 py-1">
            <Checkbox
              id={`${id}-${index}`}
              checked={selectedValues.includes(String(option.value))}
              onCheckedChange={(checked: boolean) => handleToggle(String(option.value), checked)}
              disabled={disabled || readonly}
            />
            <Label htmlFor={`${id}-${index}`} className="text-sm font-normal cursor-pointer">{option.label}</Label>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Custom Rating Widget
 */
const RatingWidget = ({ id, value, required, disabled, readonly, onChange, label, schema }: WidgetProps) => {
  const max = (schema as { maximum?: number })?.maximum || 5
  const current = Number(value) || 0

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled || readonly}
            onClick={() => onChange(star)}
            className={`transition-colors ${star <= current ? 'text-yellow-400' : 'text-slate-200'} hover:scale-110 active:scale-95`}
          >
            <Star className={`w-6 h-6 ${star <= current ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

export const shadcnWidgets: RegistryWidgetsType = {
  BaseInput,
  TextareaWidget,
  SelectWidget,
  CheckboxWidget,
  RadioWidget,
  CheckboxesWidget,
  RatingWidget
}
