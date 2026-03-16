'use server'

import { createClient } from '@/lib/supabase/server'

export type Permission = 
  | 'can_refund' 
  | 'can_edit_prices' 
  | 'can_view_reports' 
  | 'can_manage_team' 
  | 'can_manage_inventory'

/**
 * Server-side permission check.
 * Throws an error if the user does not have the required permission.
 */
export async function requirePermission(permission: Permission) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('permissions, role')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  // Owners always have all permissions
  if (profile.role === 'owner') return true

  const perms = profile.permissions as Record<string, boolean>
  if (!perms || !perms[permission]) {
    throw new Error(`Forbidden: Missing permission ${permission}`)
  }

  return true
}

/**
 * Boolean permission check for UI logic.
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  try {
    await requirePermission(permission)
    return true
  } catch {
    return false
  }
}
