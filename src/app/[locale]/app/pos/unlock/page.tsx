"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { verifyPosPin } from "@/lib/actions/pin-auth"
import { Button } from "@/components/ui/button"

export default function PosUnlockScreen({ params }: { params: Promise<{ locale: string }> }) {
  const [processing, setProcessing] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleKeypad = (digit: string) => {
    if (processing) return;
    
    setPin(prev => {
      if (prev.length >= 4) return prev;
      const newPin = prev + digit;
      
      if (newPin.length === 4) {
        // Use a small delay so the user sees the 4th dot before it clears/processes
        setTimeout(() => verifyPin(newPin), 50);
      }
      
      return newPin;
    });
  };

  const clearPin = () => {
    if (processing) return;
    setPin('');
    setError(null)
  };

  async function verifyPin(pinToVerify: string) {
    if (processing) return;
    setProcessing(true);
    setError(null) // Clear error when starting verification
    const resolvedParams = await params
    const res = await verifyPosPin(pinToVerify)
    if (res.success) {
      router.push(`/${resolvedParams.locale}/app/pos`)
      router.refresh()
    } else {
      setError("Invalid PIN")
      setPin("")
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-background">
      <div className="w-full max-w-sm p-8 space-y-8 bg-card rounded-xl border shadow-sm">
        <div className="text-center">
          <h2 className="text-2xl font-bold">POS Unlock</h2>
          <p className="text-muted-foreground mt-2">Enter your staff PIN</p>
        </div>

        <div className="flex justify-center space-x-4 h-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
          ))}
        </div>

        {error && <p className="text-destructive text-center font-medium">{error}</p>}

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0].map((key) => (
            <Button
              key={key}
              variant={key === "C" ? "destructive" : "secondary"}
              className={`h-16 text-2xl ${key === "C" ? "" : "font-semibold"}`}
              onClick={() => key === "C" ? clearPin() : handleKeypad(key.toString())}
              disabled={processing}
              style={{ gridColumn: key === 0 ? "2" : undefined }}
            >
              {key}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
