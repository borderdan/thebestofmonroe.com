"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, ChevronUp, Search, Sparkles, MapPin, Store } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export type Business = {
  id: string
  name: string
  city: string
  category: string
  rating?: number
  review_count?: number
  total_score?: number
  slug: string
  health_score?: number | null
  health_grade?: string | null
}

interface DirectoryTableProps {
  data: Business[]
  locale: string
}

export function DirectoryTable({ data, locale }: DirectoryTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "total_score", desc: true } // Default sort
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const columns: ColumnDef<Business>[] = React.useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <div className="flex flex-col gap-2 py-2">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="px-0 font-bold hover:bg-transparent hover:text-primary justify-start"
            >
              Business Name
              {column.getIsSorted() === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === "desc" ? <ChevronDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />}
            </Button>
            <Input
              placeholder="Filter names..."
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className="max-w-xs h-8 text-xs bg-background"
            />
          </div>
        )
      },
      cell: ({ row }) => (
        <Link href={`/${locale}/directory/${row.original.slug}`} className="font-medium text-primary hover:underline flex items-center gap-2">
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => {
        return (
          <div className="flex flex-col gap-2 py-2">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="px-0 font-bold hover:bg-transparent hover:text-primary justify-start"
            >
              Category
              {column.getIsSorted() === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === "desc" ? <ChevronDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />}
            </Button>
            <Input
              placeholder="Filter categories..."
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className="max-w-[150px] h-8 text-xs bg-background"
            />
          </div>
        )
      },
      cell: ({ row }) => {
        const cat = row.getValue("category") as string
        return (
          <Badge variant="secondary" className="font-normal truncate max-w-[150px]">
            {cat || 'Uncategorized'}
          </Badge>
        )
      },
    },
    {
      accessorKey: "city",
      header: ({ column }) => {
        return (
          <div className="flex flex-col gap-2 py-2">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="px-0 font-bold hover:bg-transparent hover:text-primary justify-start"
            >
              City
              {column.getIsSorted() === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === "desc" ? <ChevronDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />}
            </Button>
            <Input
              placeholder="Filter cities..."
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className="max-w-[120px] h-8 text-xs bg-background"
            />
          </div>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center text-muted-foreground text-sm">
          <MapPin className="w-3 h-3 mr-1 opacity-70" />
          {row.getValue("city")}
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: ({ column }) => {
        return (
          <div className="flex flex-col gap-2 py-2 h-full justify-start">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="px-0 font-bold hover:bg-transparent hover:text-primary justify-start h-9"
            >
              Rating
              {column.getIsSorted() === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === "desc" ? <ChevronDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const rating = row.getValue("rating") as number
        const count = row.original.review_count as number
        if (!rating) return <span className="text-muted-foreground text-xs italic">N/A</span>
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-yellow-600 dark:text-yellow-500">{Number(rating).toFixed(1)}</span>
            <span className="text-muted-foreground text-xs">({count})</span>
          </div>
        )
      },
    },
    {
      accessorKey: "health_score",
      header: ({ column }) => {
        return (
          <div className="flex flex-col gap-2 py-2 h-full justify-start">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="px-0 font-bold hover:bg-transparent hover:text-primary justify-start h-9"
            >
              Health
              {column.getIsSorted() === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === "desc" ? <ChevronDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const score = row.getValue("health_score") as number
        const grade = row.original.health_grade as string
        if (!score) return <span className="text-muted-foreground text-xs italic">N/A</span>
        
        let colorClass = "text-green-600 dark:text-green-500"
        if (score < 90) colorClass = "text-red-600 dark:text-red-500"
        else if (score < 95) colorClass = "text-yellow-600 dark:text-yellow-500"

        return (
          <div className="flex items-center gap-1.5 font-medium">
            <span className={colorClass}>{score}</span>
            {grade && <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${colorClass}`}>{grade}</Badge>}
          </div>
        )
      },
    },
    {
      accessorKey: "total_score",
      header: ({ column }) => {
        return (
          <div className="flex flex-col gap-2 py-2 h-full justify-start">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="px-0 font-bold hover:bg-transparent hover:text-primary justify-start h-9 text-right w-full flex justify-end"
            >
              Score
              {column.getIsSorted() === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : column.getIsSorted() === "desc" ? <ChevronDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const score = row.getValue("total_score") as number
        return <div className="text-right font-medium">{score || 0}</div>
      },
    },
  ], [locale])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 5000,
      },
    }
  })

  return (
    <div className="w-full space-y-4">
      
      {/* Search and Quick Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              placeholder="Search all businesses, categories, cities..." 
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 pr-12 h-12 rounded-full border-border/50 shadow-sm bg-card/50 backdrop-blur-sm text-base focus-visible:ring-primary/50 transition-all"
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors"
              title="AI Semantic Search (Coming Soon)"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 text-sm rounded-full"
            onClick={() => {
              setColumnFilters([])
              setSorting([{ id: "rating", desc: true }])
            }}
          >
            ⭐ Top Rated
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 text-sm rounded-full"
            onClick={() => {
              setColumnFilters([{ id: "category", value: "Restaurant" }])
            }}
          >
            🍔 Restaurants
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 text-sm rounded-full"
            onClick={() => {
              setColumnFilters([{ id: "category", value: "Retail" }])
            }}
          >
            🛍️ Retail
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 text-sm rounded-full bg-muted/50"
            onClick={() => {
              setColumnFilters([])
              setGlobalFilter("")
              setSorting([{ id: "total_score", desc: true }])
            }}
          >
            Clear Filters
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="align-top whitespace-nowrap min-w-[120px] pt-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Store className="w-10 h-10 mb-3 opacity-50" />
                      <p>No businesses found matching your criteria.</p>
                      <Button 
                        variant="link" 
                        onClick={() => { setColumnFilters([]); setGlobalFilter("") }}
                        className="mt-2"
                      >
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to <span className="font-medium text-foreground">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</span> of <span className="font-medium text-foreground">{table.getFilteredRowModel().rows.length}</span> entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-full px-4"
          >
            Previous
          </Button>
          <div className="flex items-center justify-center text-sm font-medium mx-2 bg-muted/50 px-3 py-1 rounded-full">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-full px-4"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
