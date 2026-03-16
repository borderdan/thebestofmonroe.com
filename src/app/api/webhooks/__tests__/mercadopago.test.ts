import { describe, it, expect, vi } from 'vitest'
import { POST } from '../mercadopago/route'
import crypto from 'crypto'

describe('MercadoPago Webhook', () => {
  it('should reject missing signatures', async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = 'secret'
    
    const request = new Request('http://localhost/api/webhooks/mercadopago?data.id=123&type=payment', {
      method: 'POST',
      body: JSON.stringify({ type: 'payment', data: { id: '123' } })
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
    
    const body = await response.json()
    expect(body.error).toBe('Missing signature')
  })

  it('should reject invalid signatures', async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = 'secret'
    
    const request = new Request('http://localhost/api/webhooks/mercadopago?data.id=123&type=payment', {
      method: 'POST',
      headers: {
        'x-signature': 'ts=123,v1=wronghmac',
        'x-request-id': 'req123'
      },
      body: JSON.stringify({ type: 'payment', data: { id: '123' } })
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
    
    const body = await response.json()
    expect(body.error).toBe('Invalid signature')
  })

  it('should accept valid signatures', async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = 'secret'
    // To accept, we must generate a valid HMAC
    const ts = '123'
    const reqId = 'req123'
    const dataId = '123'
    const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', 'secret').update(manifest).digest('hex');

    // We also need to mock global fetch because it tries to call MercadoPago API if valid
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ status: 'approved', id: 123 })
    })

    const request = new Request('http://localhost/api/webhooks/mercadopago?data.id=123&type=payment', {
      method: 'POST',
      headers: {
        'x-signature': `ts=${ts},v1=${hmac}`,
        'x-request-id': reqId
      },
      body: JSON.stringify({ type: 'payment', data: { id: dataId } })
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    
    const body = await response.json()
    expect(body.success).toBe(true)
  })
})
