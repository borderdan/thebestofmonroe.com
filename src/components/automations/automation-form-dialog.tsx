'use client'

import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { saveAutomationConfig, type AutomationConfig } from '@/lib/actions/automations'
import { toast } from 'sonner'
import { useTransition, useEffect } from 'react'
import { Zap, Mail, MessageSquare, Bell, Shield } from 'lucide-react'

const formSchema = z.object({
  id: z.string().optional(),
  trigger_type: z.string().min(1, 'Trigger is required'),
  webhook_url: z.string().url('Invalid URL'),
  is_active: z.boolean(),
})

type AutomationFormValues = z.infer<typeof formSchema>

const TEMPLATES = [
  { 
    id: 'slack_alert', 
    trigger: 'inventory_low', 
    icon: MessageSquare, 
    color: 'text-purple-400',
    title: 'Slack Stock Alert',
    desc: 'Notify team in Slack when stock is low'
  },
  { 
    id: 'email_receipt', 
    trigger: 'pos_sale', 
    icon: Mail, 
    color: 'text-blue-400',
    title: 'Post-Sale Email',
    desc: 'Send a personalized email after every sale'
  },
  { 
    id: 'crm_welcome', 
    trigger: 'crm_customer_new', 
    icon: Bell, 
    color: 'text-green-400',
    title: 'Customer Welcome',
    desc: 'Trigger welcome sequence for new leads'
  },
  { 
    id: 'admin_audit', 
    trigger: 'eform_submission', 
    icon: Shield, 
    color: 'text-orange-400',
    title: 'Security Audit',
    desc: 'Log all form entries to an external audit tool'
  }
]

interface AutomationFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialData?: AutomationConfig
}

export function AutomationFormDialog({ isOpen, onOpenChange, initialData }: AutomationFormDialogProps) {
  const t = useTranslations('automations')
  const [isPending, startTransition] = useTransition()

  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      trigger_type: '',
      webhook_url: '',
      is_active: true,
    },
  })

  // Update form when initialData changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        id: initialData?.id,
        trigger_type: initialData?.trigger_type || '',
        webhook_url: initialData?.webhook_url || '',
        is_active: initialData?.is_active ?? true,
      })
    }
  }, [isOpen, initialData, form])

  const applyTemplate = (trigger: string) => {
    form.setValue('trigger_type', trigger)
    form.setValue('webhook_url', 'https://n8n.example.com/webhook/...')
    toast.info('Template applied! Just update your webhook URL.')
  }

  const onSubmit: SubmitHandler<AutomationFormValues> = async (data) => {
    startTransition(async () => {
      const result = await saveAutomationConfig(data)
      if (result.success) {
        toast.success(t('save_success'))
        onOpenChange(false)
        form.reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-white/10 bg-zinc-950/90 backdrop-blur-xl text-white">
        <DialogHeader>
          <DialogTitle>{initialData ? t('edit_automation') : t('new_automation')}</DialogTitle>
          <DialogDescription className="text-white/60">
            {t('form_description')}
          </DialogDescription>
        </DialogHeader>

        {!initialData && (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => applyTemplate(tmpl.trigger)}
                className="flex flex-col items-start gap-2 rounded-lg border border-white/5 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-2">
                  <tmpl.icon className={`h-4 w-4 ${tmpl.color}`} />
                  <span className="text-xs font-semibold">{tmpl.title}</span>
                </div>
                <span className="text-[10px] text-white/40">{tmpl.desc}</span>
              </button>
            ))}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="trigger_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('trigger_label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue placeholder={t('select_trigger')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="inventory_low">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-400" />
                            {t('triggers.inventory_low.title')}
                          </div>
                        </SelectItem>
                        <SelectItem value="eform_submission">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-orange-400" />
                            {t('triggers.eform_submission.title')}
                          </div>
                        </SelectItem>
                        <SelectItem value="pos_sale">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-400" />
                            {t('triggers.pos_sale.title')}
                          </div>
                        </SelectItem>
                        <SelectItem value="crm_customer_new">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-green-400" />
                            {t('triggers.crm_customer_new.title')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>{t('active_label')}</FormLabel>
                    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
                      <span className="text-[10px] text-white/40">{t('active_hint')}</span>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="webhook_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('webhook_url_label')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://n8n.example.com/webhook/..." 
                      className="bg-white/5 border-white/10" 
                      {...field} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-primary text-white" 
                disabled={isPending}
              >
                {isPending ? t('saving') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
