'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Instagram, Facebook, Globe, MessageSquare, Twitter, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface ProfileLinkData {
  title: string
  url: string
  icon?: string
  is_active?: boolean
}

interface ProfileLink {
  id: string
  business_id: string
  type: string
  data: ProfileLinkData
  sort_order: number
}

interface Business {
  id: string
  name: string
  city: string
  brand_color?: string
  landing_page_theme?: string
  data: {
    [key: string]: unknown
  }
}

// --- SORTABLE ITEM COMPONENT ---
function SortableLink({ 
  link, 
  onUpdate, 
  onDelete 
}: { 
  link: ProfileLink; 
  onUpdate: (id: string, data: ProfileLinkData) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'instagram': return <Instagram className="w-4 h-4" />
      case 'facebook': return <Facebook className="w-4 h-4" />
      case 'twitter': return <Twitter className="w-4 h-4" />
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-2 bg-card p-4 border rounded-lg shadow-sm mb-3">
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab touch-none p-1 hover:bg-muted rounded">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 flex gap-2">
          <div className="p-2 bg-muted rounded">
            {getIcon(link.data.icon || 'globe')}
          </div>
          <Input 
            value={link.data.title} 
            onChange={(e) => onUpdate(link.id, { ...link.data, title: e.target.value })}
            placeholder="Link Title"
            className="font-medium h-9"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(link.id)} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="pl-12 flex gap-2">
        <Input 
          value={link.data.url} 
          onChange={(e) => onUpdate(link.id, { ...link.data, url: e.target.value })}
          placeholder="https://..."
          className="text-xs h-8"
        />
      </div>
    </div>
  )
}

// --- MAIN PAGE ---
export default function ThemeEditorPage() {
  const [links, setLinks] = useState<ProfileLink[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (profile?.business_id) {
      // Load Business (for theme)
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .single()
      setBusiness(biz as Business)

      // Load Links (entities)
      const { data: entities } = await supabase
        .from('entities')
        .select('*')
        .eq('business_id', profile.business_id)
        .eq('type', 'profile_link')
        .order('sort_order', { ascending: true })
      setLinks((entities as unknown as ProfileLink[]) || [])
    }
    setLoading(false)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setLinks((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update sort_order locally
        return newItems.map((item, index) => ({
          ...item,
          sort_order: index
        }))
      })
    }
  }

  const addLink = () => {
    if (!business) return
    const newLink: ProfileLink = {
      id: `temp-${Date.now()}`,
      business_id: business.id,
      type: 'profile_link',
      data: { title: 'New Link', url: 'https://', icon: 'globe', is_active: true },
      sort_order: links.length
    }
    setLinks([...links, newLink])
  }

  const updateLink = (id: string, data: ProfileLinkData) => {
    setLinks(links.map(l => l.id === id ? { ...l, data } : l))
  }

  const deleteLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id))
  }

  const saveAll = async () => {
    if (!business) return
    setSaving(true)
    try {
      // 1. Save business theme (JSONB + top-level fields)
      await supabase
        .from('businesses')
        .update({ 
          data: business.data,
          brand_color: business.brand_color,
          landing_page_theme: business.landing_page_theme
        })
        .eq('id', business.id)

      // 2. Save links (Clean and upsert)
      // Delete existing
      await supabase
        .from('entities')
        .delete()
        .eq('business_id', business.id)
        .eq('type', 'profile_link')

      // Insert current
      const linksToSave = links.map((link, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = link
        return {
          ...rest,
          sort_order: index
        }
      })

      if (linksToSave.length > 0) {
        await supabase.from('entities').insert(linksToSave)
      }

      toast.success('Settings saved successfully')
    } catch {
      toast.error('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !business) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex gap-8 min-h-[calc(100vh-120px)]">
      {/* Editor Sidebar */}
      <div className="w-[450px] shrink-0 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Smart Profile & Theme</h2>
          <p className="text-muted-foreground">Customize your bio-link page and storefront appearance.</p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Links</h3>
            <Button size="sm" onClick={addLink}>
              <Plus className="w-4 h-4 mr-1" /> Add Link
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
              <div className="min-h-[100px]">
                {links.map((link) => (
                  <SortableLink 
                    key={link.id} 
                    link={link} 
                    onUpdate={updateLink}
                    onDelete={deleteLink}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Theme Colors</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={business.brand_color || '#3b82f6'} 
                  onChange={(e) => setBusiness({
                    ...business,
                    brand_color: e.target.value
                  })}
                  className="w-12 p-1 h-10"
                />
                <Input 
                  value={business.brand_color || '#3b82f6'} 
                  onChange={(e) => setBusiness({
                    ...business,
                    brand_color: e.target.value
                  })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Landing Page Theme</Label>
              <select 
                value={business.landing_page_theme || 'default'} 
                onChange={(e) => setBusiness({
                  ...business,
                  landing_page_theme: e.target.value
                })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="default">Default (None)</option>
                <option value="modern">Modern Light</option>
                <option value="dark">Sleek Dark</option>
                <option value="elegant">Elegant Serif</option>
              </select>
            </div>
          </div>
        </section>

        <Button onClick={saveAll} disabled={saving} size="lg" className="mt-auto">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save All Changes
        </Button>
      </div>

      {/* Live Preview Pane */}
      <div className="flex-1 bg-muted rounded-xl border flex flex-col items-center justify-center p-8 sticky top-20 h-fit">
        <div className="w-full max-w-[390px] h-[800px] bg-card border shadow-2xl rounded-[3rem] p-4 relative overflow-hidden ring-8 ring-black/5">
          {/* Mock Mobile View */}
          <div 
            className={`w-full h-full rounded-[2.5rem] flex flex-col items-center gap-4 overflow-y-auto pb-10 pt-12 px-6 ${business.landing_page_theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-[#f8fafc] text-slate-900'}`}
          >
            {/* Business Logo/Icon */}
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md"
              style={{ backgroundColor: business.brand_color || '#3b82f6' }}
            >
              {business.name.substring(0, 1)}
            </div>
            
            <div className="text-center mb-4">
              <h4 className="font-bold text-lg">{business.name}</h4>
              <p className="text-xs text-muted-foreground">{business.city}</p>
            </div>

            <div className="w-full flex flex-col gap-3">
              {links.map(link => (
                <div 
                  key={`preview-${link.id}`} 
                  className={`w-full py-4 px-6 border rounded-xl flex items-center justify-center font-medium shadow-sm transition-transform hover:scale-[1.02] ${business.landing_page_theme === 'dark' ? 'bg-slate-800' : 'bg-card'}`}
                  style={{ borderColor: (business.brand_color || '') + '40' }}
                >
                  {link.data.title}
                </div>
              ))}
            </div>

            {links.length === 0 && (
              <div className="text-muted-foreground text-xs text-center mt-10">
                Add some links to see them here!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
