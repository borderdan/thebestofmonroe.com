'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Printer, Check, Copy } from 'lucide-react'
import JsBarcode from 'jsbarcode'
import { InventoryRow } from './inventory-client'

interface BarcodePrintDialogProps {
  items: InventoryRow[]
}

export function BarcodePrintDialog({ items }: BarcodePrintDialogProps) {
  const [open, setOpen] = useState(false)

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Barcode Print Sheet</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .grid { 
              display: grid; 
              grid-template-cols: repeat(4, 1fr); 
              gap: 20px; 
            }
            .label { 
              border: 1px solid #eee; 
              padding: 10px; 
              text-align: center; 
              page-break-inside: avoid;
            }
            .name { font-size: 10px; font-weight: bold; margin-bottom: 5px; height: 24px; overflow: hidden; }
            .price { font-size: 12px; margin-top: 5px; font-weight: bold; }
            svg { max-width: 100%; height: auto; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${items.filter(i => i.data.barcode).map(item => `
              <div class="label">
                <div class="name">${item.data.name}</div>
                <svg id="barcode-${item.id}"></svg>
                <div class="price">$${item.data.price.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = function() {
              ${items.filter(i => i.data.barcode).map(item => `
                JsBarcode("#barcode-${item.id}", "${item.data.barcode}", {
                  format: "CODE128",
                  width: 1.5,
                  height: 40,
                  displayValue: true,
                  fontSize: 10
                });
              `).join('')}
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Print Barcodes
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Barcode Sheet</DialogTitle>
          <DialogDescription>
            This will generate a printable grid of barcodes for all items in your current view that have a barcode assigned.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Printer className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{items.filter(i => i.data.barcode).length} Items Ready</p>
            <p className="text-xs text-muted-foreground mt-1">Items without barcodes will be skipped.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handlePrint}>
            Generate & Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
