import { describe, it, expect, beforeEach, vi } from 'vitest'
import { addToOfflineQueue, getOfflineQueue, clearOfflineQueue, flushOfflineQueue } from '../offline-queue'

// fake-indexeddb is loaded via vitest.setup.ts

describe('Offline Queue', () => {
  beforeEach(async () => {
    await clearOfflineQueue()
  })

  it('should preserve transactions in queue if sync fails (simulated crash resilience)', async () => {
    await addToOfflineQueue({
      items: [{ id: 'item-1', name: 'Test Item', price: 100, quantity: 1 }],
      paymentMethod: 'cash'
    })

    const initialQueue = await getOfflineQueue()
    expect(initialQueue.length).toBe(1)

    // Simulate failed sync
    const mockProcessFn = vi.fn().mockResolvedValue({ success: false, error: 'Network error' })
    const result = await flushOfflineQueue(mockProcessFn)
    
    expect(result.failed).toBe(1)
    expect(result.synced).toBe(0)

    // Queue should still have the transaction
    const queueAfterFail = await getOfflineQueue()
    expect(queueAfterFail.length).toBe(1)
    expect(queueAfterFail[0].id).toBe(initialQueue[0].id)
  })

  it('should clear transaction from queue only after successful sync', async () => {
    await addToOfflineQueue({
      items: [{ id: 'item-2', name: 'Test Item 2', price: 200, quantity: 1 }],
      paymentMethod: 'card'
    })

    const queueBeforeSync = await getOfflineQueue()
    expect(queueBeforeSync.length).toBe(1)

    // Simulate successful sync
    const mockProcessFn = vi.fn().mockResolvedValue({ success: true })
    const result = await flushOfflineQueue(mockProcessFn)

    expect(result.synced).toBe(1)
    expect(result.failed).toBe(0)

    // Queue should be empty now
    const queueAfterSuccess = await getOfflineQueue()
    expect(queueAfterSuccess.length).toBe(0)
  })
})
