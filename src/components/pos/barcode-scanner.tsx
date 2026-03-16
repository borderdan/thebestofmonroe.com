"use client"

import { useState } from "react"
import { useZxing } from "react-zxing"
import { Button } from "@/components/ui/button"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [active, setActive] = useState(false)
  
  const { ref } = useZxing({
    paused: !active,
    onResult(result) {
      setActive(false)
      onScan(result.getText())
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onError(error) {
      // Suppress constant frame-level decode failures
    }
  })

  if (!active) {
    return <Button onClick={() => setActive(true)} variant="outline" className="w-full">Open Scanner</Button>
  }

  return (
    <div className="relative rounded-xl overflow-hidden border-2 border-primary bg-black">
      <video ref={ref} className="w-full h-auto" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3/4 h-32 border-2 border-red-500/50 rounded-lg shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]"></div>
      </div>
      <Button 
        variant="destructive" 
        size="sm" 
        className="absolute top-2 right-2"
        onClick={() => setActive(false)}
      >
        Close
      </Button>
    </div>
  )
}
