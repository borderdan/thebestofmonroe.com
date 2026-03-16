'use client'

import { useTranslations } from 'next-intl'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Zap, Settings2, Trash2 } from 'lucide-react'
import { deleteAutomationConfig, type AutomationConfig } from '@/lib/actions/automations'
import { toast } from 'sonner'
import { useState } from 'react'

interface AutomationCardProps {
  config: AutomationConfig
  onEdit: (config: AutomationConfig) => void
}

export function AutomationCard({ config, onEdit }: AutomationCardProps) {
  const t = useTranslations('automations')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(t('confirm_delete'))) return
    
    setIsDeleting(true)
    const result = await deleteAutomationConfig(config.id)
    setIsDeleting(false)

    if (result.success) {
      toast.success(t('delete_success'))
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/20 p-2.5 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{t(`triggers.${config.trigger_type}.title`)}</CardTitle>
              <CardDescription>{t(`triggers.${config.trigger_type}.desc`)}</CardDescription>
            </div>
          </div>
          <Switch checked={config.is_active} disabled />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg bg-black/20 p-3">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Webhook URL</p>
            <p className="font-mono text-sm truncate text-white/80">{config.webhook_url}</p>
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-white/60 hover:text-white"
              onClick={() => onEdit(config)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {t('edit')}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
