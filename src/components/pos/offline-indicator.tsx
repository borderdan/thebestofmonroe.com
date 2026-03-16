'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { getOfflineQueue } from '@/lib/sync/offline-queue'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueLength, setQueueLength] = useState(0)

  useEffect(() => {
    queueMicrotask(() => setIsOnline(navigator.onLine))

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check queue length periodically
    const checkQueue = async () => {
      const queue = await getOfflineQueue()
      setQueueLength(queue.length)
    }
    checkQueue()
    const interval = setInterval(checkQueue, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (isOnline && queueLength === 0) return null

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        isOnline
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
          : 'bg-destructive/10 text-destructive'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>{queueLength} pending sync</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline{queueLength > 0 ? ` • ${queueLength} queued` : ''}</span>
        </>
      )}
    </div>
  )
}
