'use client'

import React from 'react'
import Form from '@rjsf/core'
import { RJSFSchema, UiSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { shadcnWidgets } from './shadcn-widgets'
import { Button } from '@/components/ui/button'

interface FormRendererProps {
  schema: RJSFSchema
  uiSchema?: UiSchema
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
  uiSchema,
  formData,
  onSubmit,
  brandColor = '#3b82f6',
  submitLabel = 'Submit',
  isLoading = false,
}: FormRendererProps) {
  return (
    <div className="rjsf-shadcn">
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        validator={validator}
        widgets={shadcnWidgets}
        onSubmit={({ formData }) => onSubmit(formData)}
        showErrorList={false}
        className="space-y-6"
      >
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
      </Form>
    </div>
  )
}
