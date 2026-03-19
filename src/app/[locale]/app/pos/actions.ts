'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requirePermission } from '@/lib/security/permissions'
import { logActivity } from '@/lib/activity'
import { triggerAutomation } from '@/lib/actions/automations'
import { checkStockAndTriggerAutomation } from '@/lib/actions/inventory-intelligence'

const cartItemSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  name: z.string(),
})

const checkoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional().default('MXN'),
  exchangeRate: z.number().optional().default(1.0),
  customerId: z.string().uuid().optional(),
  pointsToRedeem: z.number().int().nonnegative().optional().default(0),
  giftCardCode: z.string().optional(),
  cart: z.array(cartItemSchema),
  paymentMethod: z.string().optional().default('cash'),
})

type CheckoutPayload = z.infer<typeof checkoutSchema>

/**
 * Unified Transaction Logic
 * Handles: Ledger insertion, Stock deduction via RPC, Loyalty earn/redeem, Gift Card usage, Multi-currency
 */
async function processUnifiedTransaction(payload: CheckoutPayload, method: string, status: string = 'completed', externalRef?: string) {
  const supabase = await createClient()
  
  // 0. Verify Prices (Security: Prevent client-side price manipulation)
  const productIds = payload.cart.map(item => item.id)
  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, price')
    .in('id', productIds)

  for (const item of payload.cart) {
    const dbProduct = dbProducts?.find(p => p.id === item.id)
    // Compare in base currency (MXN)
    if (dbProduct && Math.abs(Number(dbProduct.price) - item.price) > 0.01) {
      await requirePermission('can_edit_prices')
    }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) throw new Error('Business not found')
  const businessId = profile.business_id

  let total = payload.amount
  let redemptionDiscount = 0
  let pointsEarned = 0
  let giftCardId: string | null = null

  // Total in base currency for loyalty and internal ledger
  const totalInBase = total * payload.exchangeRate

  // 1. Process Loyalty Logic
  if (payload.customerId) {
    const { data: loyaltyConfig } = await supabase
      .from('loyalty_configs')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()

    if (loyaltyConfig) {
      if (payload.pointsToRedeem > 0) {
        const { data: customer } = await supabase
          .from('crm_customers')
          .select('loyalty_points')
          .eq('id', payload.customerId)
          .single()

        if (customer && customer.loyalty_points >= payload.pointsToRedeem && payload.pointsToRedeem >= (loyaltyConfig.min_points_to_redeem || 0)) {
          // Discount is applied in base currency
          redemptionDiscount = Math.round((payload.pointsToRedeem * Number(loyaltyConfig.redemption_ratio)) * 100) / 100
          total = Math.max(0, total - (redemptionDiscount / payload.exchangeRate))
        }
      }
      // Points earned on the final total paid (converted to base)
      pointsEarned = Math.floor((total * payload.exchangeRate) * Number(loyaltyConfig.points_per_currency))
    }
  }

  // 2. Process Gift Card Payment
  if (method === 'gift_card' && payload.giftCardCode) {
    const { data: gc } = await supabase
      .from('gift_cards')
      .select('id, current_balance, status')
      .eq('business_id', businessId)
      .eq('code', payload.giftCardCode)
      .single()

    if (!gc) throw new Error('Invalid Gift Card code')
    if (gc.status !== 'active') throw new Error('Gift Card is inactive or used')
    // GC balances are in base currency
    if (Number(gc.current_balance) < (total * payload.exchangeRate)) throw new Error(`Insufficient Gift Card balance ($${gc.current_balance})`)
    
    giftCardId = gc.id
  }

  // 3. Insert Transaction Ledger
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      business_id: businessId,
      user_id: user.id,
      customer_id: payload.customerId || null,
      total: total,
      currency: payload.currency,
      exchange_rate_at_time: payload.exchangeRate,
      status: status,
      payment_method: method,
      external_payment_id: externalRef,
      metadata: { 
        loyalty: payload.customerId ? {
          points_earned: pointsEarned,
          points_redeemed: payload.pointsToRedeem,
          discount: redemptionDiscount
        } : undefined,
        gift_card_code: payload.giftCardCode
      }
    })
    .select('id, receipt_token')
    .single()

  if (txError) throw txError


  // 4. Insert Transaction Items
  const lineItems = payload.cart.map(item => ({
    transaction_id: tx.id,
    entity_id: item.id,
    item_name: item.name,
    quantity: item.quantity,
    price_at_time: item.price,
  }))

  const { error: itemsError } = await supabase.from('transaction_items').insert(lineItems)
  if (itemsError) {
    console.error('[POS-ACTION] Transaction items insert error:', itemsError)
    throw itemsError
  }


  // 5. Atomic Stock Deduction
  for (const item of payload.cart) {

    const { error: stockError } = await supabase.rpc('deduct_product_stock', {
      row_id: item.id,
      quantity_to_deduct: item.quantity
    })
    if (stockError && stockError.message.includes('check_stock_not_negative')) {
        console.error(`[POS-ACTION] Insufficient stock: ${item.name}`)
        throw new Error(`Insufficient stock for ${item.name}`)
    }
    if (stockError) {
      console.error(`[POS-ACTION] Stock deduction error for ${item.name}:`, stockError)
      throw stockError
    }
    
    // Check for low stock automation
    await checkStockAndTriggerAutomation(item.id)
  }

  // 6. Loyalty Ledger Entries
  if (payload.customerId && (pointsEarned > 0 || payload.pointsToRedeem > 0)) {
    const entries = []
    if (payload.pointsToRedeem > 0) {
      entries.push({ business_id: businessId, customer_id: payload.customerId, transaction_id: tx.id, points_change: -payload.pointsToRedeem, type: 'redeem', description: `Redeemed for ${redemptionDiscount} discount` })
    }
    if (pointsEarned > 0 && status === 'completed') {
      entries.push({ business_id: businessId, customer_id: payload.customerId, transaction_id: tx.id, points_change: pointsEarned, type: 'earn', description: `Earned from sale ${tx.id}` })
    }
    if (entries.length > 0) await supabase.from('loyalty_transactions').insert(entries)
  }

  // 7. Gift Card Ledger Entry (Atomic)
  if (giftCardId && method === 'gift_card' && payload.giftCardCode) {
    const amountToRedeem = total * payload.exchangeRate;
    const { error: rpcError } = await supabase.rpc('redeem_gift_card', {
      card_code: payload.giftCardCode,
      amount: amountToRedeem,
      tx_id: tx.id
    });
    
    if (rpcError) {
      console.error('[POS-ACTION] Gift card redeem error:', rpcError);
      throw new Error(`Failed to redeem gift card: ${rpcError.message}`);
    }
  }

  await logActivity('pos_transaction', { tx_id: tx.id, total, method })

  // 8. Trigger Automations
  if (status === 'completed') {
    await triggerAutomation(businessId, 'pos_sale', {
      transaction_id: tx.id,
      total,
      currency: payload.currency,
      payment_method: method,
      items: payload.cart,
      customer_id: payload.customerId || null
    })
  }

  return { transactionId: tx.id, receiptToken: tx.receipt_token }
}

export async function createGiftCard(amount: number, customerId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) throw new Error('Business not found')

  const code = Math.random().toString(36).substring(2, 10).toUpperCase()
  
  const { data: gc, error } = await supabase
    .from('gift_cards')
    .insert({
      business_id: profile.business_id,
      customer_id: customerId || null,
      code,
      initial_balance: amount,
      current_balance: 0, // Trigger will add initial amount via ledger
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error

  await supabase.from('gift_card_ledger').insert({
    gift_card_id: gc.id,
    amount: amount,
    type: 'load'
  })

  revalidatePath('/app/pos')
  return { success: true, code }
}

export async function processGiftCardCheckout(data: CheckoutPayload) {
  try {
    const parsed = checkoutSchema.parse(data)
    const result = await processUnifiedTransaction(parsed, 'gift_card', 'completed')
    revalidatePath('/[locale]/app/pos', 'page')
    return { success: true, ...result }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function processCashCheckout(data: CheckoutPayload) {
  try {
    const parsed = checkoutSchema.parse(data)
    const result = await processUnifiedTransaction(parsed, 'cash', 'completed')
    revalidatePath('/[locale]/app/pos', 'page')
    return { success: true, ...result }
  } catch (error: unknown) {
    console.error('Cash checkout error:', error)
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

