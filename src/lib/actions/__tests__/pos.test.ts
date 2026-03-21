import { describe, it, expect, vi } from 'vitest'
import './setup'
import { processTransaction } from '../pos'

// We need to alter the global mock from setup.ts instead of redefining it
import * as helpers from '@/lib/supabase/helpers'

describe('POS Actions', () => {
  it('should recalculate totals server-side and ignore client input', async () => {
    // We mock the supabase insert to return a successful transaction
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'test-txn-id' }, error: null }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        then: function(resolve: any) {
          resolve({ data: null, error: null });
        }
      })),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'test-txn-id' }, error: null }),
      rpc: vi.fn().mockResolvedValue({ error: null })
    }
    
    // Use the imported mock from setup.ts
    // @ts-ignore
    helpers.getSessionWithProfile.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: mockSupabase as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'test-user-id', email: 'test@example.com' } as any,
      profile: {
        id: 'test-user-id',
        business_id: 'test-business-id',
        role: 'owner',
        is_superadmin: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    })

    const result = await processTransaction({ 
      items: [{ id: 'item-1', name: 'Test Item', price: 100, quantity: 2 }], 
    });
    
    if (!result.success) console.error('POS TEST ERROR:', result.error);
    expect(result.success).toBe(true);
    
    // Verify that the total calculated and passed to supabase.insert was correct
    // 2 * 100 = 200 subtotal. Tax is 16%. Total = 232.
    const insertCall = mockSupabase.insert.mock.calls.find((call: any) => call[0].total !== undefined);
    expect(insertCall).toBeDefined();
    expect(insertCall![0].total).toBe(232);
  })
})
