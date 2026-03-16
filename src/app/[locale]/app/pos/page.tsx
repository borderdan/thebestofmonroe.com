import { createClient } from '@/lib/supabase/server'
import { POSTerminal } from './pos-terminal'
import { getCurrencySettings } from '@/lib/actions/currency'

export default async function POSPage() {
  const supabase = await createClient()

  // Fetch the current user's profile to get business_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) return <div>No business associated with account</div>

  // Parallel fetch: products, customers, currencies
  const [productsRes, customersRes, currencyRes] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('business_id', profile.business_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('crm_customers')
      .select('id, first_name, last_name, email, loyalty_points')
      .eq('business_id', profile.business_id)
      .order('first_name', { ascending: true }),
    getCurrencySettings()
  ])

  return (
    <POSTerminal 
      initialProducts={productsRes.data || []} 
      initialCustomers={customersRes.data || []}
      currencySettings={{
        currencies: currencyRes.currencies || [],
        rates: currencyRes.rates || []
      }}
      businessId={profile.business_id} 
    />
  )
}
