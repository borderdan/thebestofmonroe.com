'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateNfcTag } from '@/lib/actions/keyrings'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, ExternalLink, Settings2, Smartphone, Terminal, FileText, Globe } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NfcTag {
  id: string
  guid: string
  status: 'active' | 'inactive' | 'pending' | 'unclaimed'
  target_type: 'smart_profile' | 'custom_url' | 'pos_menu' | 'eform' | null
  target_url?: string | null
  business_id: string
  created_at: string
}

interface EForm {
  id: string
  title: string
}

export default function KeyringsPage() {
  const [tags, setTags] = useState<NfcTag[]>([])
  const [eforms, setEForms] = useState<EForm[]>([])
  const [loading, setLoading] = useState(true)
  const [planLimit, setPlanLimit] = useState(1)
  const [currentPlan, setCurrentPlan] = useState('Free')
  const supabase = createClient()

  useEffect(() => {
    fetchTags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchTags() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (profile?.business_id) {
      const { data } = await supabase
        .from('nfc_tags')
        .select('*')
        .eq('business_id', profile.business_id)
      
      setTags(data as NfcTag[] || [])

      const { data: eformsData } = await supabase
        .from('eforms')
        .select('id, title')
        .eq('business_id', profile.business_id)
      
      setEForms(eformsData || [])

      const { data: sub } = await supabase
        .from('tenant_subscriptions')
        .select('*, plans(*)')
        .eq('user_id', user.id)
        .single()
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pName = (sub as any)?.plans?.name || 'Free'
      let limit = 1
      if (pName.toLowerCase().includes('enterprise')) limit = 20
      else if (pName.toLowerCase().includes('pro')) limit = 5
      
      setPlanLimit(limit)
      setCurrentPlan(pName)
    }
    setLoading(false)
  }

  const handleUpdate = async (id: string, updates: Partial<NfcTag>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await updateNfcTag(id, updates as any)
    if (result.success) {
      toast.success('Tag configuration updated')
      fetchTags()
    } else {
      toast.error(result.error || 'Failed to update tag')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl space-y-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">NFC Keyrings</h1>
          <p className="text-lg text-white/60">Manage your physical hardware and smart routing destinations.</p>
        </div>
        <Button 
          onClick={() => window.open('/claim', '_blank')} 
          disabled={tags.length >= planLimit}
          className="bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Claim New Tag
        </Button>
      </div>

      <Card className="border-white/10 bg-zinc-950/50 backdrop-blur-xl text-white">
        <CardHeader className="flex flex-row items-start sm:items-center justify-between border-b border-white/5 pb-6">
          <div className="space-y-1">
            <CardTitle className="text-xl">Active Keyrings</CardTitle>
            <CardDescription className="text-white/40">
              Keyrings represent physical devices that trigger actions when tapped.
            </CardDescription>
          </div>
          <div className="text-right flex flex-col items-end gap-1.5 shrink-0 bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Subscription Limit</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">{currentPlan}</Badge>
              <Badge className={cn(
                "font-bold",
                tags.length >= planLimit ? 'bg-destructive/20 text-destructive' : 'bg-emerald-500/20 text-emerald-400'
              )}>
                {tags.length} / {planLimit} Keys
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/60 font-medium">Hardware GUID</TableHead>
                <TableHead className="text-white/60 font-medium text-center">Status</TableHead>
                <TableHead className="text-white/60 font-medium">Target Type</TableHead>
                <TableHead className="text-white/60 font-medium">Destination</TableHead>
                <TableHead className="text-right text-white/60 font-medium pr-6">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.length === 0 ? (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <Smartphone className="h-12 w-12" />
                      <p className="text-lg">No hardware claimed yet.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tags.map((tag) => (
                  <TableRow key={tag.id} className="border-white/5 group transition-colors hover:bg-white/5">
                    <TableCell className="font-mono text-xs text-white/60 pl-6">{tag.guid}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "rounded-full transition-all px-3",
                        tag.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-white/5'
                      )}>
                        {tag.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={tag.target_type || undefined}
                        onValueChange={(val) => handleUpdate(tag.id, { target_type: val as NfcTag['target_type'] })}
                      >
                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-sm">
                          <SelectValue placeholder="Select Target" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                          <SelectItem value="smart_profile">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-3 w-3" />
                              <span>Smart Profile</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="pos_menu">
                            <div className="flex items-center gap-2">
                              <Terminal className="h-3 w-3" />
                              <span>POS Terminal</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="eform">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3" />
                              <span>Lead Capture</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="custom_url">
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              <span>Custom URL</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {tag.target_type === 'custom_url' ? (
                        <Input
                          defaultValue={tag.target_url || ''}
                          placeholder="https://..."
                          onBlur={(e) => handleUpdate(tag.id, { target_url: e.target.value })}
                          className="h-9 bg-white/5 border-white/10 text-sm max-w-[240px]"
                        />
                      ) : tag.target_type === 'eform' ? (
                        <Select
                          value={tag.target_url || ''}
                          onValueChange={(val) => handleUpdate(tag.id, { target_url: val })}
                        >
                          <SelectTrigger className="h-9 w-full max-w-[240px] bg-white/5 border-white/10 text-sm">
                            <SelectValue placeholder="Select a Form" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white">
                            {eforms.map((form) => (
                              <SelectItem key={form.id} value={form.id}>
                                {form.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 px-3 h-9 rounded-md bg-white/5 border border-dashed border-white/10 text-xs text-white/40 italic">
                          {tag.target_type === 'smart_profile' ? 'Routes to profile' : 
                           tag.target_type === 'pos_menu' ? 'Routes to menu' : 
                           'Destination hidden'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white"
                          onClick={() => window.open(`/r/${tag.guid}`, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-3 w-3" />
                          Test Tap
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-8 w-8 transition-all",
                            tag.status === 'active' ? 'text-destructive' : 'text-emerald-400'
                          )}
                          onClick={() => handleUpdate(tag.id, { status: tag.status === 'active' ? 'inactive' : 'active' })}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
