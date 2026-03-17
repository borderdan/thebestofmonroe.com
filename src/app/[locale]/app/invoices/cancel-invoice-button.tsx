'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cancelInvoice } from '@/lib/actions/invoices'

export function CancelInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta factura? Esta acción no se puede deshacer.')) return

    setIsLoading(true)
    try {
      const res = await cancelInvoice(invoiceId)
      if (res.success) {
        toast.success('Factura cancelada exitosamente')
        window.location.reload()
      } else {
        toast.error(res.error || 'Error al cancelar la factura')
      }
    } catch (e: any) {
      toast.error('Error al cancelar la factura')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="destructive" 
      size="sm" 
      onClick={handleCancel}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
      Cancelar
    </Button>
  )
}
