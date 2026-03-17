"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { verifyPosPin } from "@/lib/actions/pin-auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export default function PosUnlockScreen({ params }: { params: Promise<{ locale: string }> }) {
  const [processing, setProcessing] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleKeypad = (digit: string) => {
    if (processing || pin.length >= 4) return;
    
    // Add subtle haptic feedback for mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }

    setPin(prev => {
      const newPin = prev + digit;
      
      if (newPin.length === 4) {
        // Use a small delay so the user sees the 4th dot before it clears/processes
        setTimeout(() => verifyPin(newPin), 100);
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
    setError(null) 
    
    try {
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
    } catch (err) {
      console.error("PIN Verification Error:", err)
      setError("System Error")
      setPin("")
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-background">
      <div className="w-full max-w-sm p-8 space-y-8 bg-card rounded-2xl border shadow-xl transition-all">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">POS Unlock</h2>
          <p className="text-sm text-muted-foreground font-medium">Enter your staff PIN</p>
        </div>

        <div className="flex justify-center space-x-5 h-10 items-center">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-all duration-200 transform",
                i < pin.length 
                  ? 'bg-primary border-primary scale-110 shadow-[0_0_8px_rgba(var(--primary),0.5)]' 
                  : 'border-muted-foreground/30 scale-100'
              )} 
            />
          ))}
        </div>

        {error && (
          <div className="bg-destructive/10 py-2 rounded-lg border border-destructive/20 animate-in fade-in zoom-in duration-300">
            <p className="text-destructive text-center text-xs font-bold uppercase tracking-wider">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0].map((key) => {
            const isDigit = typeof key === 'number';
            const isClear = key === "C";
            
            return (
              <Button
                key={key}
                variant={isClear ? "ghost" : "secondary"}
                className={cn(
                  "h-16 text-2xl rounded-2xl transition-all duration-75 active:scale-95 active:bg-primary active:text-primary-foreground",
                  isClear ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "font-semibold shadow-sm",
                  processing && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => isClear ? clearPin() : handleKeypad(key.toString())}
                disabled={processing || (isDigit && pin.length >= 4)}
                style={{ gridColumn: key === 0 ? "2" : undefined }}
              >
                {key}
              </Button>
            );
          })}
        </div>
        
        {processing && (
          <div className="flex items-center justify-center pt-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  )
}
