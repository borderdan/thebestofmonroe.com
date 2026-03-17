'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'

interface FormRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uiSchema?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void
  brandColor?: string
  submitLabel?: string
  isLoading?: boolean
}

export function FormRenderer({
  schema,
  uiSchema = {},
  formData = {},
  onSubmit,
  brandColor = '#3b82f6',
  submitLabel = 'Submit',
  isLoading = false,
}: FormRendererProps) {
  const { control, handleSubmit } = useForm({
    defaultValues: formData,
  })

  const properties = schema?.properties || {}
  const requiredFields = schema?.required || []
  const order = uiSchema['ui:order'] || Object.keys(properties)

  return (
    <div className="rjsf-shadcn">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        {order.map((key: string) => {
          if (!properties[key]) return null
          const fieldSchema = properties[key]
          const fieldUiSchema = uiSchema[key] || {}
          const colSpan = fieldUiSchema['ui:colSpan'] || 2

          const isRequired = requiredFields.includes(key)
          const widget = fieldUiSchema['ui:widget']
          const placeholder = fieldUiSchema['ui:placeholder']
          const labelText = fieldSchema.title || key

          return (
            <div key={key} className={cn(
              "space-y-2",
              colSpan === 1 ? "col-span-1" : "col-span-1 md:col-span-2"
            )}>
              <Label htmlFor={key} className="text-sm font-medium">
                {labelText} {isRequired && <span className="text-destructive">*</span>}
              </Label>
              
              <Controller
                control={control}
                name={key}
                rules={{ required: isRequired }}
                render={({ field: { onChange, value, ref } }) => {
                  if (fieldSchema.type === 'boolean') {
                    return (
                      <div className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={key}
                          checked={!!value}
                          onCheckedChange={onChange}
                          ref={ref}
                        />
                      </div>
                    )
                  }

                  if (widget === 'textarea') {
                    return (
                      <Textarea
                        id={key}
                        value={value || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                        ref={ref}
                        className="bg-background min-h-[100px]"
                      />
                    )
                  }

                  if (widget === 'radio') {
                    return (
                      <RadioGroup
                        value={value || ''}
                        onValueChange={onChange}
                        className="flex flex-col space-y-1"
                        ref={ref}
                      >
                        {fieldSchema.enum?.map((enumVal: string, i: number) => {
                          const optionTitle = fieldSchema.oneOf?.[i]?.title || enumVal
                          return (
                            <div key={enumVal} className="flex items-center space-x-2">
                              <RadioGroupItem value={enumVal} id={`${key}-${i}`} />
                              <Label htmlFor={`${key}-${i}`} className="text-sm font-normal cursor-pointer">
                                {optionTitle}
                              </Label>
                            </div>
                          )
                        })}
                      </RadioGroup>
                    )
                  }

                  if (widget === 'checkboxes' && fieldSchema.type === 'array') {
                    const selectedValues = Array.isArray(value) ? value : []
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" ref={ref}>
                        {fieldSchema.items?.enum?.map((enumVal: string, i: number) => {
                          const optionTitle = fieldSchema.items?.oneOf?.[i]?.title || enumVal
                          return (
                            <div key={enumVal} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`${key}-${i}`}
                                checked={selectedValues.includes(enumVal)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    onChange([...selectedValues, enumVal])
                                  } else {
                                    onChange(selectedValues.filter((v: string) => v !== enumVal))
                                  }
                                }}
                              />
                              <Label htmlFor={`${key}-${i}`} className="text-sm font-normal cursor-pointer">
                                {optionTitle}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    )
                  }

                  if (widget === 'rating') {
                    const max = fieldSchema.maximum || 5
                    const current = Number(value) || 0
                    return (
                      <div className="flex gap-1" ref={ref}>
                        {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => onChange(star)}
                            className={`transition-colors ${star <= current ? 'text-yellow-400' : 'text-slate-200'} hover:scale-110 active:scale-95`}
                          >
                            <Star className={`w-6 h-6 ${star <= current ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    )
                  }

                  if (fieldSchema.enum && fieldSchema.type === 'string') {
                    return (
                      <ShadcnSelect value={value ? String(value) : undefined} onValueChange={onChange}>
                        <SelectTrigger id={key} className="bg-background w-full" ref={ref}>
                          <SelectValue placeholder={placeholder || 'Select an option'} />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldSchema.enum.map((enumVal: string, i: number) => {
                            const optionTitle = fieldSchema.oneOf?.[i]?.title || enumVal
                            return (
                              <SelectItem key={enumVal} value={enumVal}>
                                {optionTitle}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </ShadcnSelect>
                    )
                  }

                  let inputType = 'text'
                  if (fieldSchema.type === 'number') inputType = 'number'
                  if (fieldSchema.format === 'email') inputType = 'email'
                  if (fieldSchema.format === 'date') inputType = 'date'

                  return (
                    <Input
                      id={key}
                      type={inputType}
                      value={value || ''}
                      onChange={(e) => {
                        if (inputType === 'number') {
                          onChange(e.target.value ? Number(e.target.value) : undefined)
                        } else {
                          onChange(e.target.value)
                        }
                      }}
                      placeholder={placeholder}
                      className="bg-background"
                      ref={ref}
                    />
                  )
                }}
              />
            </div>
          )
        })}

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            style={{ backgroundColor: brandColor }}
            className="px-8 text-white shadow-md hover:opacity-90 transition-opacity"
          >
            {isLoading ? 'Submitting...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}
