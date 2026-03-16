'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRGeneratorProps {
  city: string
  slug: string
  locale: string
  tableId?: string
}

export function QRGenerator({ city, slug, locale, tableId }: QRGeneratorProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://The Best of Monroe.com'
  const path = `/${locale}/${city}/${slug}`
  const url = tableId ? `${baseUrl}${path}?table=${tableId}` : `${baseUrl}${path}`

  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-xl border bg-card shadow-sm">
      <QRCodeSVG
        value={url}
        size={180}
        level="H"
        includeMargin
        className="rounded-lg"
      />
      <p className="text-xs text-muted-foreground text-center max-w-[200px] truncate">
        {url}
      </p>
      {tableId && (
        <span className="text-sm font-medium text-primary">Mesa #{tableId}</span>
      )}
    </div>
  )
}
