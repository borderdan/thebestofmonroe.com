'use server'



import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { MercadoPagoConfig, Preference } from 'mercadopago'

// Clients are initialized inside the function body to prevent startup crashes when env vars are missing

export interface GuestCartItem {
  entity_id: string
  item_name: string
  price_at_time: number
  quantity: number
}

export async function createGuestCheckoutPreference(
  businessId: string,
  items: GuestCartItem[],
  locale: string
) {
  try {
    if (!items.length) throw new Error('Cart is empty')

    const supabaseAdmin = getSupabaseAdmin()

    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! 
    })

    // 1. Fetch correct prices from the database to prevent client tampering
    const entityIds = items.map(item => item.entity_id)
    const { data: dbItems, error: dbError } = await supabaseAdmin
      .from('entities')
      .select('id, data')
      .eq('business_id', businessId)
      .in('id', entityIds)

    if (dbError) throw new Error(`Failed to fetch items: ${dbError.message}`)

    const validatedItems = items.map(clientItem => {
      const dbItem = dbItems?.find(db => db.id === clientItem.entity_id)
      if (!dbItem) throw new Error(`Item not found: ${clientItem.entity_id}`)
      
      const itemData = dbItem.data as Record<string, unknown> | null
      const price = Number(itemData?.price) || 0
      if (price <= 0) throw new Error(`Invalid price for item: ${clientItem.entity_id}`)
      
      return {
        ...clientItem,
        price_at_time: price,
        item_name: itemData?.name ? String(itemData.name) : clientItem.item_name
      }
    })

    const total = validatedItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)

    // 2. Create pending transaction (user_id is intentionally null for guests)
    const { data: tx, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        business_id: businessId,
        user_id: null, 
        total: total,
        payment_method: 'mercadopago',
        payment_status: 'pending',
        status: 'pending'
      })
      .select('id')
      .single()

    if (txError) throw new Error(`Transaction creation failed: ${txError.message}`)

    // 3. Insert line items
    const txItems = validatedItems.map(item => ({
      transaction_id: tx.id,
      entity_id: item.entity_id,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      item_name: item.item_name
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('transaction_items')
      .insert(txItems)

    if (itemsError) throw new Error(`Item insertion failed: ${itemsError.message}`)

    // 4. Generate MercadoPago Preference
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!
    const preference = new Preference(client)
    
    const response = await preference.create({
      body: {
        items: validatedItems.map(item => ({
          id: item.entity_id,
          title: item.item_name,
          quantity: item.quantity,
          unit_price: item.price_at_time,
          currency_id: 'MXN'
        })),
        external_reference: tx.id, // Maps to MercadoPago webhook
        metadata: { business_id: businessId },
        back_urls: {
          success: `${baseUrl}/${locale}/checkout/success`,
          failure: `${baseUrl}/${locale}/checkout/failure`,
          pending: `${baseUrl}/${locale}/checkout/pending`
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`
      }
    })

    return { init_point: response.init_point }
  } catch (error: unknown) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
