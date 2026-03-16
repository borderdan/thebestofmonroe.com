import { describe, it, expect, vi } from 'vitest'
import { POST } from '../stripe/route'
import Stripe from 'stripe'
import { headers } from 'next/headers'

vi.mock('next/headers', () => ({
  headers: vi.fn()
}))

const { mockConstructEvent } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
}))

// Mock Stripe so we don't need real keys
vi.mock('stripe', () => {
  return {
    default: class StripeMock {
      webhooks = {
        constructEvent: mockConstructEvent
      }
    }
  }
})

describe('Stripe Webhook', () => {
  it('should reject invalid signatures', async () => {
    // Setup mock to throw when constructEvent is called (invalid signature)
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' })
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(headers).mockResolvedValue(new Map([['stripe-signature', 'invalid-signature']]) as any)

    const response = await POST(request)
    expect(response.status).toBe(400)
    
    const body = await response.json()
    expect(body.error).toBe('Invalid signature')
  })

  it('should process valid signatures', async () => {
    // Setup mock to return a valid event
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.succeeded', // generic type that doesn't trigger complex db
      data: { object: {} }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'payment_intent.succeeded' })
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(headers).mockResolvedValue(new Map([['stripe-signature', 'valid-signature']]) as any)

    const response = await POST(request)
    expect(response.status).toBe(200)
    
    const body = await response.json()
    expect(body.received).toBe(true)
  })
})
