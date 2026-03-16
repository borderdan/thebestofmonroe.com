/* eslint-disable @next/next/no-img-element */
'use client'

import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { EntityEditorDialog, EntityRecord, EntityData } from '@/components/entity-editor-dialog'
import { updateEntity } from '@/lib/actions/crud'
import { toast } from 'sonner'
interface Props {
  initialData: EntityRecord[]
}

export function DirectoryClientWrapper({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const [editingItem, setEditingItem] = useState<EntityRecord | null>(null)

  const handleSave = async (id: string, updatedData: EntityData) => {
    try {
      await updateEntity(id, updatedData)
      
      // Update local state optimizing for optimistic UI
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, data: { ...item.data, ...updatedData } } : item
      ))
      
      toast.success('Successfully updated directory listing.')
      setEditingItem(null)
    } catch (error) {
      toast.error('Failed to update: ' + (error as Error).message)
    }
  }

  const flatData = data.map(item => ({
    ...item,
    name: item.data.name || 'Unnamed',
    description: item.data.description || '-',
    image_url: item.data.image_url,
    created_at_str: new Date(item.created_at as string).toLocaleDateString()
  }))

  type FlatDirectoryItem = EntityRecord & { 
    name: string; 
    description: string; 
    image_url: string | undefined;
    created_at_str: string;
  }

  return (
    <>
      <DataTable 
        data={flatData as FlatDirectoryItem[]}
        searchKey="name"
        columns={[
          { 
            header: 'Image', 
            accessorKey: 'image_url' as keyof FlatDirectoryItem,
            cell: (row) => (row as FlatDirectoryItem).image_url ? (
              <img src={(row as FlatDirectoryItem).image_url!} alt="Profile" className="w-10 h-10 rounded-full object-cover border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs">N/A</div>
            )
          },
          { 
            header: 'Name', 
            accessorKey: 'name' as keyof FlatDirectoryItem,
            cell: (row) => <span className="font-medium">{(row as FlatDirectoryItem).name}</span>
          },
          { 
            header: 'Description', 
            accessorKey: 'description' as keyof FlatDirectoryItem,
            cell: (row) => <span className="text-muted-foreground truncate max-w-xs">{(row as FlatDirectoryItem).description}</span>
          },
          { 
            header: 'Created', 
            accessorKey: 'created_at_str' as keyof FlatDirectoryItem, 
            cell: (row) => <span>{(row as FlatDirectoryItem).created_at_str}</span>
          },
        ]}
        onEdit={(item) => {
          // Find original item by id
          const typedItem = item as FlatDirectoryItem
          const original = data.find(i => i.id === typedItem.id)
          if (original) setEditingItem(original)
        }}
        onDelete={(item) => console.log('Delete feature coming soon', item)}
      />

      <EntityEditorDialog
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSave}
      />
    </>
  )
}
