import { describe, it, expect, vi } from 'vitest'
import './setup'
import { processTransaction } from '../pos'

describe('POS Actions', () => {
  it('should recalculate totals server-side and ignore client input', async () => {
    // Mock getSessionWithProfile
    const { getSessionWithProfile } = await import('@/lib/supabase/helpers')
    const { requireRole } = await import('@/lib/auth/rbac')
    
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
    
    const mockAuthContext = {
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
    }

    vi.mocked(getSessionWithProfile).mockResolvedValue(mockAuthContext)
    vi.mocked(requireRole).mockResolvedValue(mockAuthContext)

    const result = await processTransaction({ 
      items: [{ id: 'item-1', name: 'Test Item', price: 100, quantity: 2 }], 
    });
    
    if (!result.success) console.error('POS TEST ERROR:', result.error);
    expect(result.success).toBe(true);
    
    // Verify that the total calculated and passed to supabase.insert was correct
    // 2 * 100 = 200 subtotal. Tax is 16%. Total = 232.
    const insertCall = mockSupabase.insert.mock.calls.find(call => call[0].total !== undefined);
    expect(insertCall).toBeDefined();
    expect(insertCall![0].total).toBe(232);
  })
})
