'use server'

import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import * as Sentry from '@sentry/nextjs'

export async function checkStockAndTriggerAutomation(productId: string) {
  try {
    const supabase = await createClient()
    
    // Fetch product with automation configs
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, automation_configs(*)')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      console.error('Product not found for stock check:', productId)
      return
    }

    // Check if stock is low
    if (product.stock_quantity <= (product.low_stock_threshold ?? 5)) {
      // Log low stock alert in activity_log
      await logActivity('low_stock_alert', {
        product_id: product.id,
        product_name: product.name,
        stock_quantity: product.stock_quantity,
        threshold: product.low_stock_threshold
      })

      // Trigger n8n webhooks if configured
      const configs = product.automation_configs || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lowStockConfigs = configs.filter((c: any) => c.trigger_type === 'inventory_low' && c.is_active)

      for (const config of lowStockConfigs) {
        try {
          await fetch(config.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event: 'inventory_low',
              business_id: product.business_id,
              product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
                stock_quantity: product.stock_quantity,
                low_stock_threshold: product.low_stock_threshold
              },
              timestamp: new Date().toISOString()
            }),
          })
          
          await logActivity('automation_triggered', {
            config_id: config.id,
            trigger_type: 'inventory_low',
            product_id: product.id
          })
        } catch (webhookErr) {
          Sentry.captureException(webhookErr)
          console.error('Failed to trigger n8n webhook:', webhookErr)
        }
      }
    }
  } catch (err) {
    Sentry.captureException(err)
    console.error('Error in checkStockAndTriggerAutomation:', err)
  }
}

/**
 * Scans all products for a business that are below threshold and triggers automations.
 * Useful for bulk checks or periodic cron jobs.
 */
export async function scanBusinessInventory(businessId: string) {
  try {
    const supabase = await createClient()
    
    // Find products below threshold for this business
    const { data: lowStockProducts, error } = await supabase
      .from('products')
      .select('id')
      .eq('business_id', businessId)
      .lt('stock_quantity', 'low_stock_threshold') // PostgREST might not support column-to-column comparison directly without raw filter or RPC
      .eq('is_active', true)

    // Fallback: use a raw filter if .lt(col, col) isn't supported
    const { data: products, error: rawError } = await supabase
      .from('products')
      .select('id')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .filter('stock_quantity', 'lte', 'low_stock_threshold')

    if (rawError || !products) return

    for (const p of products) {
      await checkStockAndTriggerAutomation(p.id)
    }
  } catch (err) {
    Sentry.captureException(err)
  }
}
