'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { menuItemSchema, type MenuItemFormValues } from '@/lib/schemas/inventory'
import type { MenuItemData } from '@/lib/types/entity-data'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const CATEGORIES = [
  'Food',
  'Beverages',
  'Desserts',
  'Alcohol',
  'Supplies',
  'Other',
]

interface InventoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: MenuItemData
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  mode: 'create' | 'edit'
}

export function InventoryFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  mode,
}: InventoryFormDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<MenuItemFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(menuItemSchema) as any,
    defaultValues: {
      name: defaultValues?.name || '',
      price: Number(defaultValues?.price) || 0,
      stock_level: defaultValues?.stock_level || 0,
      description: defaultValues?.description || '',
      category: defaultValues?.category || '',
      image_url: defaultValues?.image_url || '',
      clave_prod_serv: defaultValues?.clave_prod_serv || '01010101',
      clave_unidad: defaultValues?.clave_unidad || 'H87',
      barcode: defaultValues?.barcode || '',
      sku: defaultValues?.sku || '',
    },
  })

  // Reset form when defaultValues change (switching between create/edit)
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && defaultValues) {
      form.reset({
        name: defaultValues.name || '',
        price: Number(defaultValues.price) || 0,
        stock_level: defaultValues.stock_level || 0,
        description: defaultValues.description || '',
        category: defaultValues.category || '',
        image_url: defaultValues.image_url || '',
        clave_prod_serv: defaultValues.clave_prod_serv || '01010101',
        clave_unidad: defaultValues.clave_unidad || 'H87',
        barcode: defaultValues.barcode || '',
        sku: defaultValues.sku || '',
      })
    } else if (isOpen && !defaultValues) {
      form.reset({
        name: '',
        price: 0,
        stock_level: 0,
        description: '',
        category: '',
        image_url: '',
        clave_prod_serv: '01010101',
        clave_unidad: 'H87',
        barcode: '',
        sku: '',
      })
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      await onSubmit(values as unknown as Record<string, unknown>)
    })
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Menu Item' : 'Edit Menu Item'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new item to your inventory catalog.'
              : 'Update the details for this menu item.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Tacos al Pastor" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Level *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Scan or type..." {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Internal SKU..." {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
