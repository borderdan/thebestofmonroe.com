import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Enforces feature gating at the server level.
 * Redirects to the upgrade page if the business does not have the required feature enabled.
 */
export async function requireFeature(featureKey: string, locale: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const { data: profile } = await supabase
    .from('users')
    .select('business_id, is_superadmin')
    .eq('id', user.id)
    .single()

  // Super Admins bypass feature gating
  if (profile?.is_superadmin) {
    return { business_id: profile.business_id, isAuthorized: true }
  }

  // E2E Test users bypass feature gating
  const testEmails = process.env.E2E_TEST_EMAILS?.split(',') || [];
  if (user.email && testEmails.includes(user.email)) {
    return { business_id: profile?.business_id, isAuthorized: true }
  }

  // Fetch tenant's active module configuration
  const { data: moduleData } = await supabase
    .from('modules')
    .select('config')
    .eq('business_id', profile?.business_id)
    .single()

  const config = moduleData?.config as Record<string, boolean> | null;
  const hasFeature = config?.[featureKey] === true;

  if (!hasFeature) {
    redirect(`/${locale}/app/upgrade?feature=${featureKey}`)
  }

  return { business_id: profile?.business_id, isAuthorized: true }
}
