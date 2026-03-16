'use server'

import * as Sentry from '@sentry/nextjs';

import { revalidatePath } from 'next/cache'
import { getSessionWithProfile, type ActionResult } from '@/lib/supabase/helpers'
import { menuItemSchema } from '@/lib/schemas/inventory'
import type { MenuItemData } from '@/lib/types/entity-data'
import { requirePermission } from '@/lib/security/permissions'
import { logActivity } from '@/lib/activity'
import { checkStockAndTriggerAutomation } from '@/lib/actions/inventory-intelligence'

export async function createMenuItem(values: unknown): Promise<ActionResult> {
  try {
    await requirePermission('can_manage_inventory')
    const { supabase, profile } = await getSessionWithProfile()
    const validated = menuItemSchema.parse(values) as { name: string, description: string, price: number, stock_level: number, category: string, barcode: string, sku: string, image_url: string, clave_prod_serv: string, clave_unidad: string }

    const { data: newItem, error } = await supabase.from('products').insert({
      business_id: profile.business_id,
      name: validated.name,
      description: validated.description,
      price: validated.price,
      stock_quantity: validated.stock_level,
      category: validated.category,
      barcode: validated.barcode,
      sku: validated.sku,
      image_url: validated.image_url,
      clave_prod_serv: validated.clave_prod_serv,
      clave_unidad: validated.clave_unidad,
    }).select().single()

    if (error) return { success: false, error: error.message }

    // Trigger stock check automation
    if (newItem) {
      await checkStockAndTriggerAutomation(newItem.id)
    }

    await logActivity('inventory_create', { name: validated.name })
    revalidatePath('/[locale]/app/inventory', 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to create item'
    return { success: false, error: message }
  }
}

export async function updateMenuItem(id: string, values: unknown): Promise<ActionResult> {
  try {
    await requirePermission('can_manage_inventory')
    const { supabase } = await getSessionWithProfile()
    const validated = menuItemSchema.parse(values) as { name: string, description: string, price: number, stock_level: number, category: string, barcode: string, sku: string, image_url: string, clave_prod_serv: string, clave_unidad: string }

    const { error } = await supabase
      .from('products')
      .update({
        name: validated.name,
        description: validated.description,
        price: validated.price,
        stock_quantity: validated.stock_level,
        category: validated.category,
        barcode: validated.barcode,
        sku: validated.sku,
        image_url: validated.image_url,
        clave_prod_serv: validated.clave_prod_serv,
        clave_unidad: validated.clave_unidad,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    // Trigger stock check automation
    await checkStockAndTriggerAutomation(id)

    await logActivity('inventory_update', { id, name: validated.name })
    revalidatePath('/[locale]/app/inventory', 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to update item'
    return { success: false, error: message }
  }
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  try {
    await requirePermission('can_manage_inventory')
    const { supabase } = await getSessionWithProfile()

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await logActivity('inventory_delete', { id })
    revalidatePath('/[locale]/app/inventory', 'page')
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to delete item'
    return { success: false, error: message }
  }
}

export async function getMenuItems(): Promise<ActionResult<Array<{ id: string; data: MenuItemData; is_active: boolean | null; sort_order: number | null; created_at: string | null }>>> {
  try {
    const { supabase, profile } = await getSessionWithProfile()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', profile.business_id)
      .order('name', { ascending: true })

    if (error) return { success: false, error: error.message }

    return {
      success: true,
      data: (data || []).map(p => ({
        id: p.id,
        data: {
          name: p.name,
          price: Number(p.price),
          stock_level: p.stock_quantity,
          barcode: p.barcode,
          sku: p.sku,
          description: p.description,
          category: p.category,
          image_url: p.image_url,
          clave_prod_serv: p.clave_prod_serv,
          clave_unidad: p.clave_unidad
        } as MenuItemData,
        is_active: true,
        sort_order: 0,
        created_at: p.created_at,
      })),
    }
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : 'Failed to fetch items'
    return { success: false, error: message }
  }
}
