'use server'

export async function fireWebhook(
  event: string,
  payload: Record<string, unknown>
) {
  if (!process.env.N8N_WEBHOOK_URL) {
    console.warn('N8N_WEBHOOK_URL is not set. Skipping webhook dispatch.')
    return
  }

  try {
    await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tbm-signature': process.env.N8N_WEBHOOK_SECRET || '', // Shared secret for n8n to verify
      },
      body: JSON.stringify({ event, timestamp: Date.now(), ...payload }),
    })
  } catch (error) {
    // Webhook failures should not block the user's synchronous flow
    console.error(`Failed to fire n8n webhook for event: ${event}`, error)
  }
}
