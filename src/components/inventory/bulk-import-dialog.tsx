'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import { bulkImportProducts } from '@/lib/actions/inventory-bulk'
import { toast } from 'sonner'

export function BulkImportDialog() {
  const [open, setOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<Record<string, unknown>[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data as Record<string, unknown>[])
      },
      error: (err) => {
        toast.error(`CSV Parsing Error: ${err.message}`)
      }
    })
  }

  const handleImport = async () => {
    if (preview.length === 0) return
    
    setIsUploading(true)
    const res = await bulkImportProducts(preview as Record<string, string | boolean | number>[])
    setIsUploading(false)

    if (res.success) {
      toast.success(`Successfully imported ${res.count} products`)
      setOpen(false)
      setPreview([])
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with headers: name, price, stock_quantity, category, barcode, sku.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 bg-muted/5">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <Input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="max-w-[250px] cursor-pointer"
            />
          </div>

          {preview.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-900">File Parsed Successfully</p>
                <p className="text-xs text-emerald-700">Found {preview.length} products ready for import.</p>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Note: If a product with the same <strong>barcode</strong> already exists, it will be updated with the new CSV data.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            disabled={preview.length === 0 || isUploading}
            onClick={handleImport}
          >
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Import {preview.length} Items
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
