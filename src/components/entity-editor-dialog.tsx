'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { Loader2 } from 'lucide-react'

export interface EntityData {
  id: string
  name?: string
  description?: string
  image_url?: string
  [key: string]: unknown
}

export interface EntityRecord {
  id: string
  data: EntityData
  [key: string]: unknown
}

interface EntityEditorDialogProps {
  item: EntityRecord | null
  onClose: () => void
  onSave: (id: string, updatedData: EntityData) => Promise<void>
}

export function EntityEditorDialog({ item, onClose, onSave }: EntityEditorDialogProps) {
  const [isPending, startTransition] = useTransition()
  
  // Local state for the form
  const [formData, setFormData] = useState<EntityData>({ id: '' })

  // Safely sync incoming prop to local state
  useEffect(() => {
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        id: item.id,
        name: item.data?.name || '',
        description: item.data?.description || '',
        image_url: item.data?.image_url || '',
      })
    } else {
      setFormData({ id: '' })
    }
  }, [item])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    
    startTransition(async () => {
      await onSave(item.id, formData)
    })
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Entity Profile</DialogTitle>
          <DialogDescription>
            Update directory card specifics, including the core display image automatically uploaded to secure tenant storage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entity-name">Profile Name</Label>
              <Input
                id="entity-name"
                value={formData.name || ''}
                onChange={(e) => setFormData(s => ({ ...s, name: e.target.value }))}
                disabled={isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entity-desc">Description</Label>
              <Input
                id="entity-desc"
                value={formData.description || ''}
                onChange={(e) => setFormData(s => ({ ...s, description: e.target.value }))}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Featured Image</Label>
              <ImageUpload
                folder="entities"
                value={formData.image_url || undefined}
                onChange={(url) => setFormData(s => ({ ...s, image_url: url }))}
                onRemove={() => setFormData(s => ({ ...s, image_url: undefined }))}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
