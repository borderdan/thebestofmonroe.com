import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { InvoiceForm } from './invoice-form'

// Public endpoints do not have authenticated session context 
// so we need a service role client to fetch the transaction
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function PublicInvoicePage({
  params
}: {
  params: Promise<{ tx_id: string; locale: string }>
}) {
  const { tx_id } = await params
  const supabase = getAdminClient()

  // Validate the transaction ID UUID
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tx_id)
  
  if (!isValidUuid) {
    notFound()
  }

  // Fetch transaction details
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('id, total, status, business_id')
    .eq('id', tx_id)
    .single()

  if (error || !transaction) {
    notFound()
  }

  // If the transaction is not completed, do not allow invoicing
  if (transaction.status !== 'completed') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Transacción no completada</h1>
          <p className="text-muted-foreground">
            Solo puedes generar facturas para pagos completados.
          </p>
        </div>
      </main>
    )
  }

  // Check if there is already a successful invoice for this transaction
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('cfdi_status, pdf_url, xml_url')
    .eq('transaction_id', tx_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingInvoice && existingInvoice.cfdi_status === 'issued') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-md text-center p-8 bg-card dark:bg-zinc-900 rounded-xl shadow-sm border">
          <h1 className="text-2xl font-bold mb-4">Factura Generada</h1>
          <p className="text-muted-foreground mb-6">
            Esta transacción ya ha sido facturada exitosamente.
          </p>
          <div className="flex justify-center gap-4">
            {existingInvoice.pdf_url && (
              <a href={existingInvoice.pdf_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                Descargar PDF
              </a>
            )}
            {existingInvoice.xml_url && (
              <a href={existingInvoice.xml_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                Descargar XML
              </a>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
      <div className="w-full">
        <InvoiceForm transactionId={transaction.id} total={transaction.total} />
      </div>
    </main>
  )
}
