'use server'

import { SatConfigValues } from '@/lib/schemas/sat-config'
import { ActionResult } from '@/lib/supabase/helpers'

export async function updateSatConfig(data: any): Promise<ActionResult<void>> {
  return { success: true }
}
