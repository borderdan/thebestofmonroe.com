import { createClient } from '@/lib/supabase/server'

type AppRole = 'owner' | 'manager' | 'staff'

/**
 * RBAC guard: verifies the current user has one of the allowed roles.
 * Throws an error if the user is unauthenticated or lacks the required role.
 *
 * @param allowedRoles - Array of roles that are permitted to execute the action
 * @returns The supabase client, user, and profile (same shape as getSessionWithProfile)
 */
export async function requireRole(...allowedRoles: AppRole[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('business_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) throw new Error('No business associated')

  if (!allowedRoles.includes(profile.role as AppRole)) {
    throw new Error(`Forbidden: requires one of [${allowedRoles.join(', ')}], you have "${profile.role}"`)
  }

  return { supabase, user, profile }
}
