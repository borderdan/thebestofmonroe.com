
import { vi } from 'vitest'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'

vi.mock('@/lib/supabase/helpers', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue(true),
  getSessionWithProfile: vi.fn().mockResolvedValue({
    supabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null })
    },
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: {
      id: 'test-user-id',
      business_id: 'test-business-id',
      role: 'owner',
      is_superadmin: false,
    }
  }),
}))

vi.mock('@/lib/auth/rbac', () => ({
  requireRole: vi.fn().mockResolvedValue({
    supabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null })
    },
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: {
      id: 'test-user-id',
      business_id: 'test-business-id',
      role: 'owner',
      is_superadmin: false,
    }
  }),
}))
