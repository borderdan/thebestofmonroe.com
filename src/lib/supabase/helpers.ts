import { createClient } from '@/lib/supabase/server'

/**
 * DRY helper: authenticate the current user and fetch their profile in one call.
 * Use in every Server Action and Server Component that needs auth context.
 * 
 * @throws Error if user is not authenticated or has no business association
 * @returns The Supabase client, auth user, and profile with business_id/role
 */
export async function getSessionWithProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('business_id, role, full_name, is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) throw new Error('No business associated')
  return { supabase, user, profile }
}

/**
 * Ensures the business has the specified module enabled in the `modules` table config.
 * Throws an error if access is denied.
 */
export async function requireModuleAccess(featureKey: string) {
  const { supabase, profile } = await getSessionWithProfile()
  if (profile.is_superadmin) return

  const { data: moduleData } = await supabase
    .from('modules')
    .select('config')
    .eq('business_id', profile.business_id)
    .single()

  const config = moduleData?.config as Record<string, boolean> | null
  if (!config?.[featureKey]) {
    throw new Error(`Access denied. The ${featureKey} module is not enabled for your account.`)
  }
}

/**
 * ActionResult: standard return type for all Server Actions.
 * Avoids throwing across the server/client boundary.
 */
export type ActionResult<T = void> = 
  | { success: true; data?: T }
  | { success: false; error: string }
