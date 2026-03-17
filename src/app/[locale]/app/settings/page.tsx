'use client'

import { useEffect, useState, useTransition } from 'react'
import { getBusinessProfile, getLoyaltyConfig, getReportConfig, updateBusinessProfile, updateLoyaltyConfig, updateReportConfig } from './actions'
import { getCurrencySettings, updateBusinessCurrencies } from '@/lib/actions/currency'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Loader2, Coins, Banknote, FileSpreadsheet } from 'lucide-react'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    logo_url: null as string | null,
    cover_url: null as string | null,
    contact: { email: '', phone: '', website: '' },
    location: { address: '' }
  })

  const [loyaltyData, setLoyaltyData] = useState({
    is_active: false,
    points_per_currency: 1.0,
    redemption_ratio: 0.05,
    min_points_to_redeem: 100
  })

  const [currencyData, setCurrencyData] = useState({
    accepted: ['MXN'],
    default: 'MXN'
  })

  const [reportData, setReportData] = useState({
    is_active: true,
    recipient_email: '',
    report_frequency: 'weekly'
  })

  useEffect(() => {
    Promise.all([getBusinessProfile(), getLoyaltyConfig(), getCurrencySettings(), getReportConfig()])
      .then(([business, loyalty, currency, report]) => {
        if (business) {
          setFormData({
            name: business.name,
            city: business.city,
            logo_url: business.logo_url,
            cover_url: business.cover_url,
            contact: business.contact || { email: '', phone: '', website: '' },
            location: business.location || { address: '' }
          })
        }
        if (loyalty) {
          setLoyaltyData({
            is_active: loyalty.is_active || false,
            points_per_currency: Number(loyalty.points_per_currency) || 1.0,
            redemption_ratio: Number(loyalty.redemption_ratio) || 0.05,
            min_points_to_redeem: loyalty.min_points_to_redeem || 100
          })
        }
        if (currency && currency.currencies) {
          setCurrencyData({
            accepted: currency.currencies.map(c => c.currency_code),
            default: currency.currencies.find(c => c.is_default)?.currency_code || 'MXN'
          })
        }
        if (report) {
          setReportData({
            is_active: report.is_active,
            recipient_email: report.recipient_email || '',
            report_frequency: report.report_frequency || 'weekly'
          })
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await Promise.all([
          updateBusinessProfile(formData),
          updateLoyaltyConfig(loyaltyData),
          updateBusinessCurrencies(currencyData.accepted, currencyData.default),
          updateReportConfig(reportData)
        ])
        toast.success('Settings updated successfully.')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error updating profile')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('branding')}</CardTitle>
            <CardDescription>{t('brandingDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label>{t('logo')}</Label>
              <ImageUpload
                folder="branding"
                value={formData.logo_url || undefined}
                onChange={(url) => setFormData(s => ({ ...s, logo_url: url }))}
                onRemove={() => setFormData(s => ({ ...s, logo_url: null }))}
                disabled={isPending}
              />
            </div>
            
            <div className="space-y-3">
              <Label>{t('cover')}</Label>
              <ImageUpload
                folder="branding"
                value={formData.cover_url || undefined}
                onChange={(url) => setFormData(s => ({ ...s, cover_url: url }))}
                onRemove={() => setFormData(s => ({ ...s, cover_url: null }))}
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('basicInfo')}</CardTitle>
            <CardDescription>{t('basicInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('bizName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(s => ({ ...s, name: e.target.value }))}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t('city')}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={e => setFormData(s => ({ ...s, city: e.target.value }))}
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('contactInfo')}</CardTitle>
            <CardDescription>{t('contactDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.contact.email}
                onChange={e => setFormData(s => ({ ...s, contact: { ...s.contact, email: e.target.value } }))}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                value={formData.contact.phone}
                onChange={e => setFormData(s => ({ ...s, contact: { ...s.contact, phone: e.target.value } }))}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">{t('website')}</Label>
              <Input
                id="website"
                type="url"
                value={formData.contact.website}
                onChange={e => setFormData(s => ({ ...s, contact: { ...s.contact, website: e.target.value } }))}
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('location')}</CardTitle>
            <CardDescription>{t('locationDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">{t('address')}</Label>
              <Input
                id="address"
                value={formData.location.address}
                onChange={e => setFormData(s => ({ ...s, location: { ...s.location, address: e.target.value } }))}
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Program Section */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <CardTitle>{t('loyalty')}</CardTitle>
              </div>
              <CardDescription className="mt-1">
                {t('loyaltyDesc')}
              </CardDescription>
            </div>
            <Switch
              checked={loyaltyData.is_active}
              onCheckedChange={checked => setLoyaltyData(s => ({ ...s, is_active: checked }))}
              disabled={isPending}
            />
          </CardHeader>
          <CardContent className={`space-y-6 transition-opacity ${loyaltyData.is_active ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="points_rate">{t('pointsRate')}</Label>
                <Input
                  id="points_rate"
                  type="number"
                  step="0.1"
                  value={loyaltyData.points_per_currency}
                  onChange={e => setLoyaltyData(s => ({ ...s, points_per_currency: parseFloat(e.target.value) }))}
                  disabled={isPending}
                />
                <p className="text-[10px] text-muted-foreground">{t('pointsRateHelp')}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="redemption_ratio">{t('redemptionValue')}</Label>
                <Input
                  id="redemption_ratio"
                  type="number"
                  step="0.01"
                  value={loyaltyData.redemption_ratio}
                  onChange={e => setLoyaltyData(s => ({ ...s, redemption_ratio: parseFloat(e.target.value) }))}
                  disabled={isPending}
                />
                <p className="text-[10px] text-muted-foreground">{t('redemptionHelp')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_points">{t('minPoints')}</Label>
                <Input
                  id="min_points"
                  type="number"
                  value={loyaltyData.min_points_to_redeem}
                  onChange={e => setLoyaltyData(s => ({ ...s, min_points_to_redeem: parseInt(e.target.value) }))}
                  disabled={isPending}
                />
                <p className="text-[10px] text-muted-foreground">{t('minPointsHelp')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency & Payments Section */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-blue-600" />
              <CardTitle>{t('currencyTitle')}</CardTitle>
            </div>
            <CardDescription>
              {t('currencyDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>{t('acceptedCurrencies')}</Label>
              <div className="flex gap-6">
                {['MXN', 'USD', 'EUR'].map(code => (
                  <div key={code} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`curr-${code}`}
                      checked={currencyData.accepted.includes(code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCurrencyData(s => ({ ...s, accepted: [...s.accepted, code] }))
                        } else if (currencyData.accepted.length > 1 && code !== currencyData.default) {
                          setCurrencyData(s => ({ ...s, accepted: s.accepted.filter(c => c !== code) }))
                        }
                      }}
                      disabled={isPending}
                    />
                    <Label htmlFor={`curr-${code}`} className="font-mono">{code}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-w-[200px]">
              <Label htmlFor="default_currency">{t('defaultCurrency')}</Label>
              <Select 
                value={currencyData.default} 
                onValueChange={(val) => setCurrencyData(s => ({ ...s, default: val || 'MXN' }))}
                disabled={isPending}
              >
                <SelectTrigger id="default_currency" className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyData.accepted.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic">
                {t('currencyHelp')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Automated Reports Section */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                <CardTitle>{t('reportsTitle')}</CardTitle>
              </div>
              <CardDescription className="mt-1">
                {t('reportsDesc')}
              </CardDescription>
            </div>
            <Switch
              checked={reportData.is_active}
              onCheckedChange={checked => setReportData(s => ({ ...s, is_active: checked }))}
              disabled={isPending}
            />
          </CardHeader>
          <CardContent className={`space-y-4 transition-opacity ${reportData.is_active ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="report_email">{t('recipientEmail')}</Label>
                <Input
                  id="report_email"
                  type="email"
                  placeholder="manager@business.com"
                  value={reportData.recipient_email}
                  onChange={e => setReportData(s => ({ ...s, recipient_email: e.target.value }))}
                  disabled={isPending}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  {t('recipientHelp')}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t('frequency')}</Label>
                <Badge variant="outline" className="h-9 px-4 bg-card">{t('weekly')}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} size="lg">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('saveChanges')}
          </Button>
        </div>
      </form>
    </div>
  )
}
