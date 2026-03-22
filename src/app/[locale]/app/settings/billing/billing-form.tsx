// @ts-nocheck
'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { satConfigSchema, type SatConfigValues } from '@/lib/schemas/sat-config'
import { updateSatConfig } from '@/lib/actions/sat-config'

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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BillingFormProps {
  initialData: {
    rfc?: string
    regimen_fiscal?: string
    has_csd?: boolean
    has_api?: boolean
  }
}

export function BillingForm({ initialData }: BillingFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<SatConfigValues>({
    resolver: zodResolver(satConfigSchema),
    defaultValues: {
      rfc: initialData.rfc || '',
      regimen_fiscal: initialData.regimen_fiscal || '',
      csd_password: '', // Never populate passwords
      facturama_api_user: '',
      facturama_api_password: '',
    },
  })

  function onSubmit(values: SatConfigValues) {
    startTransition(async () => {
      // Use FormData to match action signature
      const formData = new FormData()
      formData.append('rfc', values.rfc)
      formData.append('regimen_fiscal', values.regimen_fiscal)
      formData.append('csd_password', values.csd_password)
      formData.append('facturama_api_user', values.facturama_api_user)
      formData.append('facturama_api_password', values.facturama_api_password)

      const result = await updateSatConfig(formData)
      if (result.success) {
        toast.success('Configuración SAT actualizada exitosamente')
        // Optional: clear password fields
        form.setValue('csd_password', '')
        form.setValue('facturama_api_password', '')
      } else {
        toast.error(result.error || 'Error al actualizar configuración')
      }
    })
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Configuración SAT (CFDI 4.0)</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para habilitar la facturación electrónica vía Facturama.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rfc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFC del Emisor</FormLabel>
                    <FormControl>
                      <Input placeholder="AAA010101AAA" {...field} disabled={isPending} />
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
                    <FormDescription>Ej. 601 (General de Ley Personas Morales)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="csd_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña del CSD</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={initialData.has_csd ? "••••••••" : "Contraseña de tu certificado"}
                      {...field} 
                      disabled={isPending} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="facturama_api_user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario API Facturama</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={initialData.has_api ? "••••••••" : "Tu usuario de Facturama"} 
                        {...field} 
                        disabled={isPending} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facturama_api_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña API Facturama</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={initialData.has_api ? "••••••••" : "Tu contraseña de Facturama"} 
                        {...field} 
                        disabled={isPending} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Configuración
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
