import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Scan all products where stock_quantity <= low_stock_threshold
    // We'll fetch products that meet the criteria and then process them.
    // Note: In a real production app with many products, this should be paginated or use a more efficient approach.
    
    const { data: products, error } = await supabaseClient
      .from('products')
      .select('id, name, stock_quantity, low_stock_threshold, business_id')
      .eq('is_active', true)
      .filter('stock_quantity', 'lte', 'low_stock_threshold')

    if (error) throw error

    console.log(`Found ${products?.length || 0} products with low stock.`)

    const results = []
    for (const product of products || []) {
      // Trigger the activity log and webhooks
      // We'll call the automation configs directly here to avoid external round-trips if possible
      // but for simplicity and DRY, we can just fetch the configs and hit the webhooks.
      
      const { data: configs } = await supabaseClient
        .from('automation_configs')
        .select('*')
        .eq('business_id', product.business_id)
        .eq('trigger_type', 'inventory_low')
        .eq('is_active', true)

      if (configs && configs.length > 0) {
        for (const config of configs) {
          try {
            await fetch(config.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'inventory_low',
                product,
                timestamp: new Date().toISOString()
              })
            })
            results.push({ productId: product.id, status: 'triggered', configId: config.id })
          } catch (e) {
            results.push({ productId: product.id, status: 'error', error: e.message })
          }
        }
      }

      // Log to activity_log (as service role)
      await supabaseClient.from('activity_log').insert({
        business_id: product.business_id,
        action: 'low_stock_alert',
        metadata: {
          product_id: product.id,
          product_name: product.name,
          stock_quantity: product.stock_quantity,
          threshold: product.low_stock_threshold
        },
        user_agent: 'supabase-edge-function'
      })
    }

    return new Response(
      JSON.stringify({ success: true, processed: products?.length || 0, results }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
