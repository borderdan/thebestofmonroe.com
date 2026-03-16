'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BuilderField } from './types'
import { FileText, Users, MessageSquare, Landmark, ClipboardCheck } from 'lucide-react'

interface Template {
  id: string
  name: string
  icon: React.ElementType
  fields: BuilderField[]
}

const TEMPLATES: Template[] = [
  {
    id: 'contact',
    name: 'Contact Form',
    icon: Users,
    fields: [
      { id: 'name', type: 'string', title: 'Full Name', required: true, placeholder: 'John Doe' },
      { id: 'email', type: 'email', title: 'Email Address', required: true, placeholder: 'john@example.com' },
      { id: 'message', type: 'textarea', title: 'Your Message', required: true, placeholder: 'How can we help?' },
    ]
  },
  {
    id: 'feedback',
    name: 'Customer Feedback',
    icon: MessageSquare,
    fields: [
      { id: 'rating', type: 'rating', title: 'How satisfied are you?', required: true, min: 1, max: 5 },
      { id: 'comments', type: 'textarea', title: 'Additional Comments', required: false },
      { id: 'recommend', type: 'boolean', title: 'Would you recommend us?', required: false },
    ]
  },
  {
    id: 'sat_data',
    name: 'Mexican SAT Data',
    icon: Landmark,
    fields: [
      { id: 'rfc', type: 'string', title: 'RFC', required: true, placeholder: 'ABCD010101XYZ', pattern: '^[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$' },
      { id: 'razon_social', type: 'string', title: 'Razón Social', required: true },
      { id: 'cp', type: 'string', title: 'Código Postal', required: true, pattern: '^[0-9]{5}$' },
      { 
        id: 'regimen', 
        type: 'select', 
        title: 'Régimen Fiscal', 
        required: true,
        options: [
          { label: '601 - General de Ley Personas Morales', value: '601' },
          { label: '603 - Personas Morales con Fines no Lucrativos', value: '603' },
          { label: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios', value: '605' },
          { label: '606 - Arrendamiento', value: '606' },
          { label: '612 - Personas Físicas con Actividades Empresariales y Profesionales', value: '612' },
          { label: '626 - Régimen Simplificado de Confianza', value: '626' },
        ]
      },
    ]
  },
  {
    id: 'job_app',
    name: 'Job Application',
    icon: ClipboardCheck,
    fields: [
      { id: 'name', type: 'string', title: 'Name', required: true },
      { id: 'phone', type: 'phone', title: 'Phone', required: true },
      { id: 'role', type: 'select', title: 'Role Applying For', options: [{label: 'Sales', value: 'sales'}, {label: 'Manager', value: 'manager'}] },
      { id: 'experience', type: 'number', title: 'Years of Experience', min: 0 },
    ]
  }
]

interface TemplateSelectorProps {
  onSelect: (fields: BuilderField[]) => void
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
      {TEMPLATES.map((t) => (
        <Card 
          key={t.id} 
          className="cursor-pointer hover:border-primary/50 transition-colors bg-card hover:bg-primary/5 group"
          onClick={() => onSelect(t.fields)}
        >
          <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <t.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-tighter">{t.name}</h4>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
