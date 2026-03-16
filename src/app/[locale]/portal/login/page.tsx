"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CustomerPortalLogin() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/webhooks/auth` // We can reuse the existing auth callback if it handles standard sign-ins, otherwise create a new one. Wait, let's use the standard one that redirect to '/' then they navigate to /portal, or better, we can create a portal callback later.
      }
    })

    if (error) setStatus("error")
    else setStatus("success")
  }

  if (status === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md text-center p-6">
          <CardTitle className="text-2xl mb-2">Check your email</CardTitle>
          <CardDescription>We sent a magic link to {email}</CardDescription>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Customer Portal</CardTitle>
          <CardDescription>Access your receipts and profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "Sending..." : "Send Magic Link"}
            </Button>
            {status === "error" && <p className="text-sm text-destructive text-center mt-2">Failed to send link. Please try again.</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
