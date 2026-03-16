import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Star, Receipt, FileText, CheckCircle2 } from 'lucide-react'
import { InvoiceForm } from '../../invoice/[tx_id]/invoice-form'
import { format } from 'date-fns'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function PublicReceiptPage({
  params
}: {
  params: Promise<{ token: string; locale: string }>
}) {
  const { token, locale } = await params
  const supabase = getAdminClient()

  // 1. Fetch Transaction by Token
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select(`
      *,
      business:businesses(*),
      customer:crm_customers(*),
      items:transaction_items(*)
    `)
    .eq('receipt_token', token)
    .single()

  if (txError || !transaction) {
    notFound()
  }

  const business = transaction.business
  const customer = transaction.customer
  const items = transaction.items || []
  const loyalty = (transaction.metadata as { loyalty?: { discount?: number; points_earned?: number } })?.loyalty || {}

  // 2. Check for existing invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('transaction_id', transaction.id)
    .single()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Business Branding */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          {business.logo_url && (
            <img src={business.logo_url} alt={business.name} className="w-20 h-20 rounded-2xl shadow-sm object-cover" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <p className="text-muted-foreground text-sm">{business.city}</p>
          </div>
        </div>

        {/* The Receipt Card */}
        <Card className="border-none shadow-xl overflow-hidden bg-card dark:bg-zinc-900">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <CardTitle>Receipt</CardTitle>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Order Date</p>
              <p className="text-xs font-semibold">{format(new Date(transaction.created_at!), 'MMM d, yyyy HH:mm')}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {/* Items */}
            <div className="space-y-4">
              {items.map((item: { id: string, item_name: string, quantity: number, price_at_time: number }) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{item.item_name}</span>
                    <span className="text-xs text-muted-foreground">Qty: {item.quantity} × ${Number(item.price_at_time).toFixed(2)}</span>
                  </div>
                  <span className="font-bold text-sm">${(item.quantity * item.price_at_time).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${((transaction.metadata as { subtotal?: number })?.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (IVA 16%)</span>
                <span>${((transaction.metadata as { tax?: number })?.tax || 0).toFixed(2)}</span>
              </div>
              {(loyalty.discount ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Loyalty Discount</span>
                  <span>-${(loyalty.discount ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-black pt-2">
                <span>Total</span>
                <span>${Number(transaction.total).toFixed(2)} {transaction.currency}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg justify-center border border-dashed">
              <Badge variant="outline" className="capitalize">{transaction.payment_method.replace('_', ' ')}</Badge>
              <span className="text-[10px] text-muted-foreground font-mono">{transaction.id.split('-')[0]}</span>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Section */}
        {customer && (
          <Card className="border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Star className="fill-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900">BOM Points</h3>
                    <p className="text-xs text-emerald-700">Thank you for being a loyal customer!</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-600">+{loyalty.points_earned || 0}</p>
                  <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-tighter">Points Earned</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-emerald-500/10 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Your Total Balance</p>
                  <p className="text-xl font-bold text-emerald-900">{customer.loyalty_points} pts</p>
                </div>
                <Badge className="bg-emerald-500 text-white border-none">Member</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoicing Section */}
        {transaction.status === 'completed' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Facturación SAT (CFDI 4.0)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {invoice && invoice.cfdi_status === 'issued' ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="w-12 h-12 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900 text-lg">Factura Disponible</p>
                    <p className="text-sm text-blue-700">Esta transacción ya ha sido facturada.</p>
                  </div>
                  <div className="flex gap-3 justify-center pt-2">
                    <a href={invoice.pdf_url!} target="_blank" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-blue-200 bg-card hover:bg-blue-50 h-10 px-4 py-2 text-blue-700">
                      Download PDF
                    </a>
                    <a href={invoice.xml_url!} target="_blank" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-blue-200 bg-card hover:bg-blue-50 h-10 px-4 py-2 text-blue-700">
                      Download XML
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    ¿Necesitas factura fiscal para esta compra? Completa el siguiente formulario con tus datos del SAT.
                  </p>
                  <InvoiceForm 
                    transactionId={transaction.id} 
                    total={transaction.total} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-center pt-8 opacity-50">
          <p className="text-xs font-medium">Powered by The Best of Monroe SME OS</p>
          <p className="text-[10px] mt-1 italic">Security Verified & Tamper Proof</p>
        </div>
      </div>
    </main>
  )
}
