import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Download, FileText, AlertCircle, RefreshCw } from 'lucide-react'

export default async function InvoicesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user's business
  const { data: userData } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!userData?.business_id) {
    redirect('/app')
  }

  // Fetch invoices for business
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id,
      cfdi_status,
      error_message,
      pdf_url,
      xml_url,
      created_at,
      transactions (
        id,
        total
      )
    `)
    .eq('business_id', userData.business_id)
    .order('created_at', { ascending: false })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge className="bg-green-500">Emitida</Badge>
      case 'processing':
        return <Badge variant="secondary" className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin"/> Procesando</Badge>
      case 'failed':
        return <Badge variant="destructive">Error</Badge>
      case 'canceled':
        return <Badge variant="outline">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturas CFDI</h1>
        <p className="text-muted-foreground">
          Historial de facturas solicitadas y emitidas
        </p>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Transacción ID</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay facturas registradas
                </TableCell>
              </TableRow>
            ) : (
              invoices?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {(() => {
                      const tx = (Array.isArray(invoice.transactions) ? invoice.transactions[0] : invoice.transactions) as unknown as { id: string; total: number } | null;
                      return tx?.id?.split('-')[0];
                    })()}...
                  </TableCell>
                  <TableCell>
                    ${(() => {
                      const tx = (Array.isArray(invoice.transactions) ? invoice.transactions[0] : invoice.transactions) as unknown as { id: string; total: number } | null;
                      return tx?.total?.toFixed(2);
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      {getStatusBadge(invoice.cfdi_status)}
                      {invoice.cfdi_status === 'failed' && (
                        <span className="text-xs text-red-500 flex items-center gap-1" title={invoice.error_message}>
                          <AlertCircle className="h-3 w-3" /> Detalle error
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.pdf_url && (
                        <a 
                          href={invoice.pdf_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <FileText className="h-4 w-4 mr-1" /> PDF
                        </a>
                      )}
                      {invoice.xml_url && (
                        <a 
                          href={invoice.xml_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <Download className="h-4 w-4 mr-1" /> XML
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
