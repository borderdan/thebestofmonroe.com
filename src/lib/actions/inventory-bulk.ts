'use server'

import * as Sentry from '@sentry/nextjs';

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const productImportSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  stock_quantity: z.number().int().default(0),
  category: z.string().optional(),
  description: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  is_active: z.boolean().default(true)
})

export async function bulkImportProducts(data: Record<string, string | boolean | number>[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (!profile?.business_id) throw new Error('Business not found')

    const validatedProducts = data.map(item => {
      // Basic type coercion for CSV data which often comes as strings
      const payload = {
        ...item,
        price: parseFloat(String(item.price)),
        stock_quantity: parseInt(String(item.stock_quantity)) || 0,
        is_active: item.is_active === 'false' ? false : true
      }
      return {
        ...productImportSchema.parse(payload),
        business_id: profile.business_id
      }
    })

    const { error } = await supabase
      .from('products')
      .upsert(validatedProducts, { onConflict: 'business_id, barcode' })

    if (error) throw error

    revalidatePath('/[locale]/app/inventory', 'page')
    return { success: true, count: validatedProducts.length }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Import failed'
    return { success: false, error: message }
  }
}
