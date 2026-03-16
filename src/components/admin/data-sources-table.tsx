'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MoreHorizontal, 
  Activity, 
  Database, 
  RefreshCw, 
  Settings, 
  Play, 
  Pause,
  AlertCircle,
  Search,
  Filter,
  Edit,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type DataSourceType = 'API' | 'Scraper' | 'Webhook' | 'Database'
type DataSourceStatus = 'active' | 'paused' | 'failing'

interface DataSource {
  id: string
  name: string
  type: DataSourceType
  status: DataSourceStatus
  lastRun: string
  recordsSynced: number
  target: string
  description: string
}

const MOCK_DATA_SOURCES: DataSource[] = [
  {
    id: 'ds_1',
    name: 'Salesforce CRM',
    type: 'API',
    status: 'active',
    lastRun: '10 mins ago',
    recordsSynced: 12450,
    target: 'crm_customers',
    description: 'Syncs customer records and opportunities'
  },
  {
    id: 'ds_2',
    name: 'Competitor Pricing Scraper',
    type: 'Scraper',
    status: 'active',
    lastRun: '2 hours ago',
    recordsSynced: 850,
    target: 'market_intel',
    description: 'Daily scrape of top 5 competitors'
  },
  {
    id: 'ds_3',
    name: 'Stripe Webhooks',
    type: 'Webhook',
    status: 'active',
    lastRun: 'Just now',
    recordsSynced: 43210,
    target: 'billing_events',
    description: 'Real-time payment and subscription events'
  },
  {
    id: 'ds_4',
    name: 'Legacy ERP Sync',
    type: 'Database',
    status: 'failing',
    lastRun: '1 day ago',
    recordsSynced: 0,
    target: 'inventory_master',
    description: 'Nightly sync from on-prem SQL server'
  },
  {
    id: 'ds_5',
    name: 'Zendesk Tickets',
    type: 'API',
    status: 'paused',
    lastRun: '5 days ago',
    recordsSynced: 5600,
    target: 'support_tickets',
    description: 'Hourly sync of support tickets'
  },
  {
    id: 'ds_6',
    name: 'Weather API',
    type: 'API',
    status: 'active',
    lastRun: '30 mins ago',
    recordsSynced: 120,
    target: 'regional_forecasts',
    description: 'Forecasts for logistics planning'
  },
  {
    id: 'ds_7',
    name: 'LinkedIn Jobs Scraper',
    type: 'Scraper',
    status: 'paused',
    lastRun: '2 weeks ago',
    recordsSynced: 340,
    target: 'hr_recruiting',
    description: 'Weekly candidate sourcing'
  }
]

export function DataSourcesTable() {
  const [sources, setSources] = useState<DataSource[]>(MOCK_DATA_SOURCES)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleStatus = (id: string) => {
    setSources(sources.map(s => {
      if (s.id === id) {
        const newStatus = s.status === 'active' ? 'paused' : 'active'
        return { ...s, status: newStatus }
      }
      return s
    }))
  }

  const deleteSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id))
  }

  const filteredSources = sources.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: DataSourceStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Active</Badge>
      case 'paused':
        return <Badge variant="outline" className="text-zinc-500 border-zinc-700">Paused</Badge>
      case 'failing':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">Failing</Badge>
    }
  }

  const getTypeIcon = (type: DataSourceType) => {
    switch (type) {
      case 'API': return <Activity className="w-4 h-4 text-blue-400" />
      case 'Scraper': return <Database className="w-4 h-4 text-purple-400" />
      case 'Webhook': return <RefreshCw className="w-4 h-4 text-orange-400" />
      case 'Database': return <Database className="w-4 h-4 text-zinc-400" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search sources..." 
              className="pl-9 bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
          Add Source
        </Button>
      </div>

      <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
        <Table>
          <TableHeader className="bg-zinc-900">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[300px] text-zinc-400">Integration</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Type</TableHead>
              <TableHead className="text-zinc-400">Target Table</TableHead>
              <TableHead className="text-zinc-400">Last Sync</TableHead>
              <TableHead className="text-right text-zinc-400">Records</TableHead>
              <TableHead className="text-center text-zinc-400 w-[100px]">Active</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSources.map((source) => (
              <TableRow key={source.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-zinc-100 font-semibold">{source.name}</span>
                    <span className="text-zinc-500 text-xs truncate max-w-[250px]">{source.description}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(source.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-zinc-300 text-sm">
                    {getTypeIcon(source.type)}
                    {source.type}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-emerald-400 font-mono">
                    {source.target}
                  </code>
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  {source.status === 'failing' ? (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      Failed
                    </span>
                  ) : (
                    source.lastRun
                  )}
                </TableCell>
                <TableCell className="text-right text-zinc-300 tabular-nums">
                  {source.recordsSynced.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Switch 
                    checked={source.status === 'active'}
                    onCheckedChange={() => toggleStatus(source.id)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 outline-none">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                      <DropdownMenuLabel className="text-zinc-500">Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                        <RefreshCw className="mr-2 h-4 w-4" /> Sync Now
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" /> Configure
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      {source.status === 'active' ? (
                        <DropdownMenuItem 
                          className="focus:bg-zinc-800 focus:text-amber-500 text-amber-500 cursor-pointer"
                          onClick={() => toggleStatus(source.id)}
                        >
                          <Pause className="mr-2 h-4 w-4" /> Pause Sync
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          className="focus:bg-zinc-800 focus:text-emerald-500 text-emerald-500 cursor-pointer"
                          onClick={() => toggleStatus(source.id)}
                        >
                          <Play className="mr-2 h-4 w-4" /> Resume Sync
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <DropdownMenuItem 
                        className="focus:bg-zinc-800 focus:text-red-500 text-red-500 cursor-pointer"
                        onClick={() => deleteSource(source.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredSources.length === 0 && (
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableCell colSpan={8} className="h-24 text-center text-zinc-500">
                  No data sources found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
