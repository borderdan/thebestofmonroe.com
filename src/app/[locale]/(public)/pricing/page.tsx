import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Calendar } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="container mx-auto py-20 px-4 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-slate-900">
          TheBestOfMexico.org <span className="text-sm font-bold bg-[#fce7f3] text-[#db2777] px-2 py-1 rounded-full uppercase ml-2 align-middle">B2B</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Corporate Pilot Program: Eliminate the Risk. Start Today.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-brand-primary via-brand-primary/90 to-brand-accent text-white rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">We know that enterprise hardware is often expensive. We&apos;re changing the game by subsidizing the physical ecosystem.</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-emerald-400 shrink-0" />
              <span className="text-lg text-white/90">We&apos;ll give you your first 20 physical <strong>Smart Tags (NFC)</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-emerald-400 shrink-0" />
              <span className="text-lg text-white/90">We configure your first custom <strong>dynamic EForm</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 text-emerald-400 shrink-0" />
              <span className="text-lg text-white/90">Direct technical support from <em>Agile Teams of Mexico</em>.</span>
            </li>
          </ul>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md text-slate-900 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
          <CardHeader className="text-center pb-2">
            <CardDescription className="uppercase tracking-widest font-bold text-slate-500 mb-2">Enterprise Plan</CardDescription>
            <CardTitle className="text-5xl font-black mb-2">$500 <span className="text-xl text-muted-foreground font-normal">MXN/month</span></CardTitle>
            <CardDescription className="text-base px-4">Subscription to keep the DataVault and EForms active.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Link 
              href={`/${locale}/app/upgrade?source=pricing`}
              className={cn(buttonVariants({ size: 'lg' }), "w-full text-lg h-14 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-xl text-white shadow-md flex items-center justify-center")}
            >
              Request Pilot
            </Link>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">No binding contracts. Cancel anytime.</p>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-24 text-center">
        <h2 className="text-3xl font-bold mb-4 text-[#1e293b]">See the magic work in your hands</h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          Schedule a 10-minute demo (in person or via Zoom). We&apos;ll show you how a simple tap on a keychain can transform your lead generation.
        </p>
        <Link 
          href="https://wa.me/521234567890" 
          target="_blank" 
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: 'lg' }), "bg-[#25d366] hover:bg-[#20bd5a] text-white rounded-full px-8 h-14 text-lg shadow-lg flex items-center justify-center")}
        >
          <Calendar className="w-5 h-5 mr-2" /> Schedule via WhatsApp
        </Link>
      </div>
    </div>
  )
}
