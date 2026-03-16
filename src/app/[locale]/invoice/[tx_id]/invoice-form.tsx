'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cfdiRequestSchema, type CfdiRequestValues } from '@/lib/schemas/cfdi'
import { submitInvoiceRequest } from '@/lib/actions/invoices'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface InvoiceFormProps {
  transactionId: string
  total: number
}

export function InvoiceForm({ transactionId, total }: InvoiceFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<CfdiRequestValues>({
    resolver: zodResolver(cfdiRequestSchema),
    defaultValues: {
      transaction_id: transactionId,
      rfc_receptor: '',
      nombre_receptor: '',
      uso_cfdi: 'G03',
      regimen_fiscal: '601',
      cp_receptor: '',
    },
  })

  function onSubmit(values: CfdiRequestValues) {
    startTransition(async () => {
      const result = await submitInvoiceRequest(values)
      if (result.success) {
        setIsSuccess(true)
      } else {
        // En un entorno de producción, mostraríamos un toast o alerta
        alert(result.error || 'Error al procesar la solicitud')
      }
    })
  }

  if (isSuccess) {
    return (
      <Card className="max-w-xl mx-auto text-center py-10">
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Solicitud Recibida</h2>
          <p className="text-muted-foreground">
            Estamos procesando tu factura. Podrás descargarla en unos momentos o llegará a tu correo.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Solicitar Factura Electrónica</CardTitle>
        <CardDescription>
          Por un total de <span className="font-bold">${total.toFixed(2)} MXN</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rfc_receptor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RFC</FormLabel>
                  <FormControl>
                    <Input placeholder="AAA010101AAA" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nombre_receptor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón Social / Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="EMPRESA SA DE CV" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cp_receptor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Postal</FormLabel>
                    <FormControl>
                      <Input placeholder="01000" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regimen_fiscal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Régimen Fiscal</FormLabel>
                    <FormControl>
                      <Input placeholder="601" {...field} disabled={isPending} />
                    </FormControl>
                    <FormDescription>Ej: 601</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="uso_cfdi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uso de CFDI</FormLabel>
                  <FormControl>
                    <Input placeholder="G03" {...field} disabled={isPending} />
                  </FormControl>
                  <FormDescription>Ej: G03 (Gastos en general)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar Factura
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
