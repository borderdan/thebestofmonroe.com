import { get, set, del } from 'idb-keyval'

const QUEUE_KEY = 'The Best of Monroe-offline-tx-queue'

export interface OfflineTransaction {
  id: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  paymentMethod: string
  createdAt: string
}

/**
 * Add a transaction to the offline queue (IndexedDB).
 */
export async function addToOfflineQueue(tx: Omit<OfflineTransaction, 'id' | 'createdAt'>): Promise<void> {
  const queue = await getOfflineQueue()
  queue.push({
    ...tx,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
  await set(QUEUE_KEY, JSON.stringify(queue))
}

/**
 * Get all pending offline transactions.
 */
export async function getOfflineQueue(): Promise<OfflineTransaction[]> {
  const raw = await get(QUEUE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw as string)
  } catch {
    return []
  }
}

/**
 * Remove a specific transaction from the queue after syncing.
 */
export async function removeFromQueue(txId: string): Promise<void> {
  const queue = await getOfflineQueue()
  const updated = queue.filter(tx => tx.id !== txId)
  if (updated.length === 0) {
    await del(QUEUE_KEY)
  } else {
    await set(QUEUE_KEY, JSON.stringify(updated))
  }
}

/**
 * Clear the entire offline queue.
 */
export async function clearOfflineQueue(): Promise<void> {
  await del(QUEUE_KEY)
}

/**
 * Flush all queued transactions to the server.
 * Call this when connectivity is restored.
 * 
 * @param processFn - The server action to call for each transaction
 * @returns Number of successfully synced transactions
 */
export async function flushOfflineQueue(
  processFn: (input: { items: OfflineTransaction['items']; paymentMethod: string }) => Promise<{ success: boolean; error?: string }>
): Promise<{ synced: number; failed: number }> {
  const queue = await getOfflineQueue()
  let synced = 0
  let failed = 0

  for (const tx of queue) {
    try {
      const result = await processFn({
        items: tx.items,
        paymentMethod: tx.paymentMethod,
      })

      if (result.success) {
        await removeFromQueue(tx.id)
        synced++
      } else {
        console.error(`Failed to sync tx ${tx.id}:`, result.error)
        failed++
      }
    } catch (err) {
      console.error(`Error syncing tx ${tx.id}:`, err)
      failed++
    }
  }

  return { synced, failed }
}
