'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addCustomerNote, deleteCustomerNote } from '@/lib/actions/crm'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Note = Database['public']['Tables']['crm_notes']['Row'] & {
  users?: { full_name: string | null } | null
}

export function CustomerNotes({ customerId, notes }: { customerId: string, notes: Note[] }) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    const res = await addCustomerNote(customerId, { content })
    if (res.success) {
      toast.success('Note added')
      setContent('')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to add note')
    }
    setIsSubmitting(false)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return
    
    const res = await deleteCustomerNote(noteId, customerId)
    if (res.success) {
      toast.success('Note deleted')
      router.refresh()
    } else {
      toast.error('Failed to delete note')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Note</CardTitle>
          <CardDescription>Record interactions or important details about this customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNote} className="space-y-4">
            <Textarea
              placeholder="Type your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Recent Notes</h3>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-6 flex justify-between gap-4">
                <div className="space-y-2">
                  <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                  <p className="text-xs text-muted-foreground">
                    Added by {note.users?.full_name || 'User'} on {new Date(note.created_at || '').toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
