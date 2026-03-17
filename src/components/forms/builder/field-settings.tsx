'use client'

import React from 'react'
import { BuilderField } from './types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface FieldSettingsProps {
  field: BuilderField | null
  onUpdate: (id: string, updates: Partial<BuilderField>) => void
}

export function FieldSettings({ field, onUpdate }: FieldSettingsProps) {
  const t = useTranslations('eforms.builder')

  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center space-y-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 mb-2 border border-dashed border-slate-200 dark:border-slate-800">
          <Plus className="w-6 h-6 rotate-45 opacity-20" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('selectField')}</p>
          <p className="text-[10px] text-slate-400/50 italic">Click a field on the canvas to configure its properties</p>
        </div>
      </div>
    )
  }

  const addOption = () => {
    const options = [...(field.options || []), { label: '', value: '' }]
    onUpdate(field.id, { options })
  }

  const updateOption = (index: number, label: string) => {
    const options = [...(field.options || [])]
    options[index] = { label, value: label.toLowerCase().replace(/\s+/g, '_') }
    onUpdate(field.id, { options })
  }

  const removeOption = (index: number) => {
    const options = (field.options || []).filter((_, i) => i !== index)
    onUpdate(field.id, { options })
  }

  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-200px)] animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-1">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">{t('fieldSettings')}</h3>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Type: {field.type}</p>
      </div>

      <Separator className="bg-slate-100 dark:bg-slate-800" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t('label')}</Label>
          <Input
            value={field.title}
            onChange={(e) => onUpdate(field.id, { title: e.target.value })}
            placeholder="e.g. Full Name"
          />
        </div>

        <div className="space-y-2">
          <Label>{t('descOptional')}</Label>
          <Input
            value={field.description || ''}
            onChange={(e) => onUpdate(field.id, { description: e.target.value })}
            placeholder="Helper text for the user"
          />
        </div>

        <div className="space-y-2">
          <Label>{t('placeholder')}</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
            placeholder="Grey text shown in the input"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <Label htmlFor="required-toggle">{t('requiredField')}</Label>
          <Switch
            id="required-toggle"
            checked={!!field.required}
            onCheckedChange={(checked: boolean) => onUpdate(field.id, { required: checked })}
          />
        </div>

        <div className="space-y-2 pt-2">
          <Label>Display Width</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={field.colSpan === 1 ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-[10px] font-bold"
              onClick={() => onUpdate(field.id, { colSpan: 1 })}
            >
              HALF WIDTH
            </Button>
            <Button
              variant={!field.colSpan || field.colSpan === 2 ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-[10px] font-bold"
              onClick={() => onUpdate(field.id, { colSpan: 2 })}
            >
              FULL WIDTH
            </Button>
          </div>
        </div>

        {(field.type === 'string' || field.type === 'email' || field.type === 'phone') && (
          <div className="space-y-2">
            <Label>{t('validationPattern')}</Label>
            <Input
              value={field.pattern || ''}
              onChange={(e) => onUpdate(field.id, { pattern: e.target.value })}
              placeholder={field.type === 'phone' ? 'e.g. ^\\+?[0-9]{10,15}$' : 'e.g. ^[0-9]{5}$'}
            />
          </div>
        )}

        {(field.type === 'number' || field.type === 'rating') && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>{t('min')}</Label>
              <Input
                type="number"
                value={field.min ?? ''}
                onChange={(e) => onUpdate(field.id, { min: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('max')}</Label>
              <Input
                type="number"
                value={field.max ?? ''}
                onChange={(e) => onUpdate(field.id, { max: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder={field.type === 'rating' ? '5' : '100'}
              />
            </div>
          </div>
        )}

        {['select', 'multiselect', 'radio'].includes(field.type) && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label>{t('choiceOptions')}</Label>
              <Button variant="outline" size="sm" onClick={addOption} className="h-7 text-[10px]">
                <Plus className="w-3 h-3 mr-1" /> {t('addChoice')}
              </Button>
            </div>
            <div className="space-y-2">
              {(field.options || []).map((option, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="h-8 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(idx)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    disabled={(field.options || []).length <= 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {(field.options || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2 bg-slate-50 border border-dashed rounded italic">
                  {t('noOptions')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
