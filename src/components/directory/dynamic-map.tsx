'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

import { MapViewProps } from './map-view'

export const DirectoryMap = dynamic<MapViewProps>(
  () => import('./map-view').then((mod) => mod.MapView),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[500px] w-full rounded-xl" />
  }
)
