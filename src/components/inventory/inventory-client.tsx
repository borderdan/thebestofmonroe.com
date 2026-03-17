'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown, Edit2, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { MenuItemData } from '@/lib/types/entity-data'
import { createMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/actions/inventory'
import { InventoryFormDialog } from './inventory-form-dialog'
import { DeleteConfirmDialog } from './delete-confirm-dialog'
import { BulkImportDialog } from './bulk-import-dialog'
import { BarcodePrintDialog } from './barcode-print-dialog'

export interface InventoryRow {
  id: string
  data: MenuItemData
  is_active: boolean | null
  sort_order: number | null
  created_at: string | null
  sales_velocity_7d?: number | null
  predicted_out_of_stock_date?: string | null
  restock_recommendation?: string | null
}

interface InventoryClientProps {
  items: InventoryRow[]
  userRole: string
}

const LOW_STOCK_THRESHOLD = 5

export function InventoryClient({ items, userRole }: InventoryClientProps) {
  const t = useTranslations('inventory')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InventoryRow | null>(null)

  const canMutate = userRole === 'owner' || userRole === 'manager'

  const columns: ColumnDef<InventoryRow>[] = [
    {
      id: 'name',
      accessorFn: (row) => row.data.name,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          {t('name')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.data.name}</div>
      ),
    },
    {
      id: 'category',
      accessorFn: (row) => row.data.category || '—',
      header: t('category'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.data.category || '—'}
        </span>
      ),
    },
    {
      id: 'price',
      accessorFn: (row) => row.data.price,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          {t('price')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const price = row.original.data.price
        return (
          <span className="font-mono">
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
            }).format(price)}
          </span>
        )
      },
    },
    {
      id: 'stock_level',
      accessorFn: (row) => row.data.stock_level,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          {t('stockLevel')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stock = row.original.data.stock_level
        const isLow = stock <= LOW_STOCK_THRESHOLD
        return (
          <div className="flex items-center gap-2">
            <span className={isLow ? 'text-destructive font-semibold' : ''}>
              {stock}
            </span>
            {isLow && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )
      },
    },
    {
      id: 'velocity',
      accessorFn: (row) => row.sales_velocity_7d || 0,
      header: '7d Velocity',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.sales_velocity_7d?.toFixed(1) || '0.0'} / day
        </span>
      ),
    },
    {
      id: 'prediction',
      accessorFn: (row) => row.predicted_out_of_stock_date || '',
      header: 'Days Left',
      cell: ({ row }) => {
        const dateStr = row.original.predicted_out_of_stock_date
        if (!dateStr) return <span className="text-muted-foreground italic text-xs">Awaiting data...</span>
        
        const date = new Date(dateStr)
        const diff = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
        if (diff <= 3) variant = "destructive"
        else if (diff <= 7) variant = "secondary"
        
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={variant} className="w-fit">
              {diff <= 0 ? 'Out of Stock' : `${diff} days`}
            </Badge>
            {row.original.restock_recommendation && (
              <span className="text-[10px] text-muted-foreground max-w-[120px] leading-tight">
                {row.original.restock_recommendation}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'status',
      accessorFn: (row) => row.is_active,
      header: t('status'),
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    ...(canMutate
      ? [
          {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }: { row: { original: InventoryRow } }) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditItem(row.original)
                    setFormOpen(true)
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          } as ColumnDef<InventoryRow>,
        ]
      : []),
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  const handleCreate = async (values: Record<string, unknown>) => {
    const result = await createMenuItem(values)
    if (result.success) {
      toast.success(t('createSuccess') || 'Item created successfully')
      setFormOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  const handleUpdate = async (values: Record<string, unknown>) => {
    if (!editItem) return
    const result = await updateMenuItem(editItem.id, values)
    if (result.success) {
      toast.success(t('updateSuccess') || 'Item updated successfully')
      setFormOpen(false)
      setEditItem(null)
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteMenuItem(deleteTarget.id)
    if (result.success) {
      toast.success(t('deleteSuccess') || 'Item deleted successfully')
      setDeleteTarget(null)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 w-full md:max-w-sm">
          <Input
            placeholder={t('filterPlaceholder') || 'Filter by name...'}
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <BarcodePrintDialog items={items} />
          <BulkImportDialog />
          {canMutate && (
            <Button
              onClick={() => {
                setEditItem(null)
                setFormOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('addItem') || 'Add Item'}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('noItems') || 'No menu items found. Add your first item to get started.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} item(s) total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Form Dialog (create/edit) */}
      <InventoryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditItem(null)
        }}
        defaultValues={editItem ? editItem.data : undefined}
        onSubmit={editItem ? handleUpdate : handleCreate}
        mode={editItem ? 'edit' : 'create'}
      />

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.data.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
