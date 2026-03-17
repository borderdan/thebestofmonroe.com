'use server'

import { type ActionResult, getSessionWithProfile, requireModuleAccess } from '@/lib/supabase/helpers';

import * as Sentry from '@sentry/nextjs';

import { waitUntil } from '@vercel/functions'
import { createClient } from '@supabase/supabase-js'
import { cfdiRequestSchema, CfdiRequestValues } from '@/lib/schemas/cfdi'
import { stampCfdi, cancelCfdi } from '@/lib/services/facturama'

const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function submitInvoiceRequest(formData: CfdiRequestValues) {
  try {
    const validatedData = cfdiRequestSchema.parse(formData)
    const supabase = getAdminClient()

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select(`
        business_id, 
        total, 
        metadata,
        transaction_items (
          quantity,
          price_at_time,
          item_name,
          products (
            clave_prod_serv,
            clave_unidad
          )
        )
      `)
      .eq('id', validatedData.transaction_id)
      .single()

    if (txError || !transaction) {
      throw new Error('Transacción no encontrada o no válida')
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        transaction_id: validatedData.transaction_id,
        business_id: transaction.business_id,
        cfdi_status: 'processing'
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      throw new Error('No se pudo registrar la solicitud de factura')
    }

    waitUntil(processInvoiceBackground(invoice.id, transaction.business_id, validatedData, transaction))

    return { success: true, invoice_id: invoice.id }
  } catch (error: unknown) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Error de validación';
    return { success: false, error: message };
  }
}

async function processInvoiceBackground(
  invoiceId: string, 
  businessId: string, 
  requestData: CfdiRequestValues,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactionData: { total: number; transaction_items?: any[] }
) {
  const supabase = getAdminClient()

  try {
    const { data: business, error: busError } = await supabase
      .from('businesses')
      .select('rfc, regimen_fiscal, facturama_api_user, facturama_api_password')
      .eq('id', businessId)
      .single()

    if (busError || !business || !business.facturama_api_user) {
      throw new Error('El negocio no tiene configurada su facturación.')
    }

    const subtotal = transactionData.total / 1.16;
    const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production';
    
    const cfdiPayload = {
      Receiver: {
        Rfc: requestData.rfc_receptor,
        Name: requestData.nombre_receptor,
        CfdiUse: requestData.uso_cfdi,
        FiscalRegime: requestData.regimen_fiscal,
        TaxZipCode: requestData.cp_receptor
      },
      CfdiType: "I",
      PaymentForm: "01",
      PaymentMethod: "PUE",
      Currency: "MXN",
      Date: new Date().toISOString(),
      ExpeditionPlace: "01000",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Items: (transactionData.transaction_items || []).map((item: any) => {
        const itemSubtotal = (item.price_at_time * item.quantity) / 1.16;
        const itemTax = (item.price_at_time * item.quantity) - itemSubtotal;
        return {
          Quantity: item.quantity,
          ProductCode: item.products?.clave_prod_serv || "01010101", 
          UnitCode: item.products?.clave_unidad || "E48",
          Description: item.item_name,
          UnitValue: (item.price_at_time / 1.16).toFixed(2),
          Subtotal: itemSubtotal.toFixed(2),
          Taxes: [
            {
              Name: "IVA",
              Rate: 0.16,
              IsRetention: false,
              Total: itemTax.toFixed(2),
              Base: itemSubtotal.toFixed(2),
              IsFederalTax: true
            }
          ]
        };
      })
    }

    const config = {
      facturama_api_user: business.facturama_api_user,
      facturama_api_password: business.facturama_api_password,
    }
    const response = await stampCfdi(config, cfdiPayload)

    await supabase.from('invoices').update({
      cfdi_status: 'issued',
      uuid_sat: response.Id || null,
      xml_url: isProd ? `https://api.facturama.mx/cfdi/xml/issued/${response.Id}` : `https://apisandbox.facturama.mx/cfdi/xml/issued/${response.Id}`,
      pdf_url: isProd ? `https://api.facturama.mx/cfdi/pdf/issued/${response.Id}` : `https://apisandbox.facturama.mx/cfdi/pdf/issued/${response.Id}`,
    }).eq('id', invoiceId)

  } catch (error: unknown) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    await supabase.from('invoices').update({
      cfdi_status: 'failed',
      error_message: message
    }).eq('id', invoiceId);
  }
}

export async function cancelInvoice(invoiceId: string, motive: string = '02', uuidReplacement?: string) {
  try {
    const { supabase: userClient, profile } = await getSessionWithProfile()
    await requireModuleAccess('pos')
    const supabase = getAdminClient()
    
    // Get the invoice to find its business and uuid_sat
    const { data: invoice, error: invoiceErr } = await userClient
      .from('invoices')
      .select('uuid_sat, business_id, cfdi_status')
      .eq('id', invoiceId)
      .eq('business_id', profile.business_id)
      .single()
      
    if (invoiceErr || !invoice) throw new Error('Factura no encontrada')
    if (!invoice.uuid_sat) throw new Error('La factura no tiene un UUID del SAT')
    if (invoice.cfdi_status === 'cancelled') throw new Error('La factura ya está cancelada')
      
    // Get business credentials
    const { data: business, error: busError } = await supabase
      .from('businesses')
      .select('facturama_api_user, facturama_api_password')
      .eq('id', invoice.business_id)
      .single()

    if (busError || !business || !business.facturama_api_user) {
      throw new Error('Configuración de facturación del negocio incompleta')
    }

    const config = {
      facturama_api_user: business.facturama_api_user,
      facturama_api_password: business.facturama_api_password,
    }

    // Call Facturama cancellation
    await cancelCfdi(config, invoice.uuid_sat, motive, uuidReplacement)
    
    // Update invoice status
    await supabase.from('invoices').update({ cfdi_status: 'cancelled' }).eq('id', invoiceId)
    
    return { success: true }
  } catch (error: unknown) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'Error cancelando la factura';
    return { success: false, error: message };
  }
}
