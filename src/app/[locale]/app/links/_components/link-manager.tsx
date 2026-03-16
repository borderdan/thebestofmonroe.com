'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Pencil, 
  Trash2, 
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { LinkIcon } from '@/components/directory/link-icon';
import { createLink, updateLink, deleteLink, reorderLinks } from '@/lib/actions/links';
import { ProfileLinkData } from '@/lib/schemas/links';
import { toast } from 'sonner';

interface SortableItemProps {
  id: string;
  link: { id: string; data: ProfileLinkData };
  onEdit: (link: { id: string; data: ProfileLinkData }) => void;
  onDelete: (id: string) => void;
}

function SortableLinkItem({ id, link, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className="p-4 flex items-center gap-4 group hover:border-indigo-200 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="w-5 h-5" />
      </div>

      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
        style={{ backgroundColor: link.data.meta.bg_color || '#4f46e5' }}
      >
        <LinkIcon 
          type={link.data.link_type} 
          metaIcon={link.data.meta.icon} 
          className="w-5 h-5" 
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">
          {link.data.label}
        </h4>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {link.data.link_type === 'vcard' ? 'Business Contact' : link.data.url || link.data.meta.username}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={() => onEdit(link)}>
          <Pencil className="w-4 h-4 text-indigo-500" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(link.id)}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </Card>
  );
}

export default function LinkManager({ 
  initialLinks 
}: { 
  initialLinks: { id: string; data: ProfileLinkData; [key: string]: unknown }[] 
}) {
  const t = useTranslations('links');
  const [links, setLinks] = useState(initialLinks);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<{ id: string; data: ProfileLinkData } | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLinks((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Prepare batch update
        const updates = newItems.map((item, index) => ({
          id: item.id,
          order_index: index
        }));

        startTransition(async () => {
          const result = await reorderLinks(updates);
          if (!result.success) toast.error('Failed to save order');
        });

        return newItems;
      });
    }
  };

  const handleSave = async (formData: FormData) => {
    const data: Partial<ProfileLinkData> & { is_active?: boolean; order_index?: number } = {
      link_type: formData.get('type') as ProfileLinkData['link_type'],
      label: formData.get('label') as string,
      url: formData.get('url') as string,
      is_active: true,
      meta: {
        icon: formData.get('icon') as string,
        bg_color: formData.get('bg_color') as string,
        text_color: formData.get('text_color') as string,
        username: formData.get('username') as string
      }
    };

    startTransition(async () => {
      let result;
      if (editingLink) {
        result = await updateLink(editingLink.id, data);
      } else {
        data.order_index = links.length;
        result = await createLink(data as ProfileLinkData);
      }

      if (result.success) {
        toast.success(editingLink ? 'Link updated' : 'Link created');
        setIsEditorOpen(false);
        setEditingLink(null);
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('drag_to_reorder')}</p>
        </div>

        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogTrigger render={
            <Button
              onClick={() => setEditingLink(null)}
              className="rounded-xl px-6 py-5 h-auto font-bold bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-lg transition-all active:scale-95 flex gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              {t('add_new')}
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px] rounded-3xl">            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingLink ? 'Edit Link' : t('add_new')}
              </DialogTitle>
            </DialogHeader>

            <form action={handleSave} className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('type')}</Label>
                    <Select name="type" defaultValue={editingLink?.data?.link_type || 'custom'}>
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="map">Map Location</SelectItem>
                        <SelectItem value="contact">Contact Info</SelectItem>
                        <SelectItem value="wifi">WiFi Access</SelectItem>
                        <SelectItem value="vcard">Save Contact</SelectItem>
                        <SelectItem value="custom">Custom Web Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Icon Platform</Label>
                    <Select name="icon" defaultValue={editingLink?.data?.meta?.icon || 'link'}>
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="link">Default</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">X (Twitter)</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('label')}</Label>
                  <Input 
                    name="label" 
                    defaultValue={editingLink?.data?.label} 
                    placeholder="e.g. Visit our Menu" 
                    className="rounded-xl h-12"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('url')} / Username</Label>
                  <Input 
                    name="url" 
                    defaultValue={editingLink?.data?.url} 
                    placeholder="https://..." 
                    className="rounded-xl h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('bg')}</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color" 
                        name="bg_color" 
                        defaultValue={editingLink?.data?.meta?.bg_color || '#4f46e5'} 
                        className="h-12 w-16 p-1 rounded-xl cursor-pointer" 
                      />
                      <span className="text-xs text-gray-400">Picker</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('text')}</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color" 
                        name="text_color" 
                        defaultValue={editingLink?.data?.meta?.text_color || '#ffffff'} 
                        className="h-12 w-16 p-1 rounded-xl cursor-pointer" 
                      />
                      <span className="text-xs text-gray-400">Picker</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold">
                  {editingLink ? 'Update Link' : 'Create Link'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <LinkIcon type="custom" className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">{t('no_links')}</p>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={links.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {links.map((link) => (
                <SortableLinkItem 
                  key={link.id} 
                  id={link.id} 
                  link={link} 
                  onEdit={setEditingLink}
                  onDelete={async (id) => {
                    if (confirm('Are you sure?')) {
                      startTransition(async () => {
                        const res = await deleteLink(id);
                        if (res.success) toast.success('Link deleted');
                      });
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
