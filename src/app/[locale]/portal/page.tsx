import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Star, Ticket, Clock, ArrowRight, UserCircle } from 'lucide-react'
import Link from 'next/link'

export default async function CustomerPortalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/portal/login`)

  const { data: profile } = await supabase
    .from('crm_customers')
    .select('*, business:businesses(name, logo_url, brand_color)')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) return <div className="p-8 text-center mt-20">No customer profile linked. Please contact the business.</div>

  const [receiptsRes, giftCardsRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, created_at, total, payment_method, status, receipt_token')
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('gift_cards')
      .select('*')
      .eq('customer_id', profile.id)
      .eq('status', 'active')
  ])

  const business = profile.business as { brand_color?: string, logo_url?: string, name?: string }
  const receipts = receiptsRes.data || []
  const giftCards = giftCardsRes.data || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      {/* Branded Header */}
      <div 
        className="h-48 w-full bg-primary relative"
        style={{ backgroundColor: business.brand_color || 'var(--primary)' }}
      >
        <div className="max-w-4xl mx-auto px-6 h-full flex items-end pb-6">
          <div className="flex items-center gap-4 text-white">
            <div className="w-20 h-20 bg-card rounded-2xl p-1 shadow-lg">
              {business.logo_url ? (
                <img src={business.logo_url} className="w-full h-full object-cover rounded-xl" alt={business.name} />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <UserCircle className="w-10 h-10" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black">{profile.first_name}&apos;s Hub</h1>
              <p className="opacity-80 text-sm font-medium">{business.name} Loyalty Member</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <Star className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">BOM Points</p>
                  <p className="text-2xl font-black text-emerald-900">{profile.loyalty_points || 0}</p>
                </div>
              </div>
              <Badge className="bg-emerald-500 text-white">Active</Badge>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-orange-500/5 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Gift Cards</p>
                  <p className="text-2xl font-black text-orange-900">{giftCards.length}</p>
                </div>
              </div>
              <Link href="#" className="text-xs font-bold text-orange-600 hover:underline">View Wallet</Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Purchases */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-lg">Recent Purchases</CardTitle>
            </div>
            <CardDescription>Click any order to view your digital receipt or request an invoice.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {receipts.map(tx => (
                <Link 
                  key={tx.id} 
                  href={`/${locale}/receipt/${tx.receipt_token}`}
                  className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">${Number(tx.total).toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{new Date(tx.created_at!).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{tx.payment_method}</p>
                      <Badge variant="outline" className="text-[9px] h-4 py-0 capitalize text-emerald-600 border-emerald-200">{tx.status}</Badge>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
              {!receipts.length && (
                <div className="p-10 text-center text-muted-foreground italic text-sm">
                  No purchases found yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
