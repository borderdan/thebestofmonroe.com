/**
 * Trigger.dev Workflow Runner
 * 
 * Background task with exponential backoff for executing workflow actions.
 * This will replace the inline processWorkflowActions when Trigger.dev is configured.
 * 
 * To enable:
 * 1. Set TRIGGER_SECRET_KEY in .env.local
 * 2. Run: npx trigger.dev@latest init
 * 3. Import and use: await executeWorkflowActions.trigger(payload)
 */

// import { task, logger } from '@trigger.dev/sdk/v3'

// Uncomment when Trigger.dev is configured:
/*
export const executeWorkflowActions = task({
  id: 'execute-workflow-actions',
  retry: {
    maxAttempts: 4,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
    factor: 2,
    randomize: true,
  },
  run: async (
    payload: {
      workflow_id: string
      business_id: string
      execution_log_id: string
      actions: Array<{ step_id: string; type: string; config: Record<string, unknown> }>
      record: Record<string, unknown>
    },
    { ctx }
  ) => {
    logger.info(`Executing workflow ${payload.workflow_id} for business ${payload.business_id}`, {
      actionCount: payload.actions.length,
      attemptNumber: ctx.attempt.number,
    })

    const results: Array<{ step_id: string; status: string; result?: unknown; error?: string }> = []

    for (const action of payload.actions) {
      try {
        logger.info(`Executing action: ${action.type}`, { step_id: action.step_id })

        // Action execution logic (same as evaluator route's executeAction)
        switch (action.type) {
          case 'send_webhook': {
            const url = action.config.url as string
            if (!url) throw new Error('Webhook URL is required')
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                metadata: { business_id: payload.business_id },
                record: payload.record,
              }),
            })
            results.push({ step_id: action.step_id, status: 'success', result: { httpStatus: response.status } })
            break
          }

          case 'send_email': {
            const to = action.config.to as string || (payload.record.email as string)
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || 'The Best of Monroe <noreply@The Best of Monroe.com>',
                to: [to],
                subject: action.config.subject as string || 'Notification',
                text: action.config.body as string || '',
              }),
            })
            if (!response.ok) throw new Error(`Email failed: ${response.status}`)
            results.push({ step_id: action.step_id, status: 'success', result: { sent_to: to } })
            break
          }

          default:
            logger.warn(`Unknown action type: ${action.type}`)
            results.push({ step_id: action.step_id, status: 'skipped' })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        logger.error(`Action ${action.step_id} failed: ${errorMessage}`)
        results.push({ step_id: action.step_id, status: 'failed', error: errorMessage })
      }
    }

    return { status: 'completed', results }
  },
})
*/

// Placeholder export so the file doesn't error when Trigger.dev isn't configured
export const TRIGGER_DEV_READY = false
