import { getAutomationConfigs } from '@/lib/actions/automations'
import { getSessionWithProfile } from '@/lib/supabase/helpers'
import { AutomationsClient } from '@/components/automations/automations-client'

export default async function AutomationsPage() {
  const { profile } = await getSessionWithProfile()
  const result = await getAutomationConfigs()
  const initialConfigs = result.success ? result.data || [] : []

  return (
    <AutomationsClient 
      initialConfigs={initialConfigs} 
      isSuperAdmin={profile.is_superadmin || false} 
    />
  )
}
