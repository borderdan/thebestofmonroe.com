import { createClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'
import { TDocumentDefinitions } from 'pdfmake/interfaces'

// Define fonts for pdfmake
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake')
const printer = new PdfPrinter(fonts)

export async function generateInventoryReport(businessId: string) {
  try {
    const supabase = await createClient()

    // 1. Aggregate Data from inventory_health_summary and products
    const { data: summary } = await supabase
      .from('inventory_health_summary')
      .select('*')
      .eq('business_id', businessId)
      .single()

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('name, sku, stock_quantity, low_stock_threshold, price')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true })

    if (productsError) throw productsError

    // 2. Define PDF Content
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'Inventory Health Report', style: 'header' },
        { text: `Date: ${new Date().toLocaleDateString()}`, style: 'subheader' },
        { text: '\n' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              ['Product Name', 'SKU', 'Stock', 'Threshold', 'Price'],
              ...(products || []).map(p => [
                p.name,
                p.sku || '-',
                p.stock_quantity.toString(),
                (p.low_stock_threshold || 5).toString(),
                `$${p.price.toFixed(2)}`
              ])
            ]
          }
        },
        { text: '\nSummary', style: 'subheader' },
        {
          ul: [
            `Low Stock Items: ${summary?.low_stock_count || 0}`,
            `Critical Restock Items: ${summary?.critical_restock_count || 0}`,
            `Avg Sales Velocity: ${summary?.avg_sales_velocity || 0}`
          ]
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
      }
    }

    // 3. Generate PDF Buffer
    const pdfDoc = printer.createPdfKitDocument(docDefinition)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chunks: any[] = []
    
    return new Promise<string>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfDoc.on('data', (chunk: any) => chunks.push(chunk))
      pdfDoc.on('end', async () => {
        const buffer = Buffer.concat(chunks)
        const fileName = `inventory-report-${businessId}-${Date.now()}.pdf`
        const filePath = `reports/${businessId}/${fileName}`

        // 4. Store in Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('tenant-assets')
          .upload(filePath, buffer, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          reject(uploadError)
          return
        }

        // 5. Log in generated_reports
        const { error: logError } = await supabase
          .from('generated_reports')
          .insert({
            business_id: businessId,
            report_type: 'inventory',
            file_path: filePath,
            status: 'completed'
          })
          .select()
          .single()

        if (logError) {
          reject(logError)
          return
        }

        resolve(filePath)
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfDoc.on('error', (err: any) => reject(err))
      pdfDoc.end()
    })

  } catch (err) {
    Sentry.captureException(err)
    console.error('Failed to generate inventory report:', err)
    throw err
  }
}
