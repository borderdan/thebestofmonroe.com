'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { claimNfcTag } from '@/lib/actions/keyrings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function ClaimTagPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [guid, setGuid] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const guidParam = searchParams.get('guid')
    if (guidParam) {
      setGuid(guidParam)
    }
  }, [searchParams])

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await claimNfcTag(guid, pin)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="container max-w-md mx-auto py-20">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 text-green-600">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <CardTitle className="text-2xl text-green-800">Tag Claimed Successfully!</CardTitle>
            <CardDescription className="text-green-700">
              Your hardware is now linked to your business account.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/app/keyrings')}>Go to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto py-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Claim Your Hardware</CardTitle>
          <CardDescription>
            Enter the GUID and the 6-digit factory PIN provided with your hardware.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleClaim}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guid">Hardware ID (GUID)</Label>
              <Input
                id="guid"
                placeholder="TBK-XXXX-XXXX"
                value={guid}
                onChange={(e) => setGuid(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">Claim PIN</Label>
              <Input
                id="pin"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Claiming...' : 'Claim Tag'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
