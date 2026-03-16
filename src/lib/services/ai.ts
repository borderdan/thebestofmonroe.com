import { createClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'

// Simple AI integration placeholder. 
// In a real app, this would call OpenAI, Perplexity, or another LLM.

export async function generateCustomerInsights(customerId: string) {
  try {
    const supabase = await createClient()

    // 1. Fetch relevant customer data
    const { data: customer } = await supabase
      .from('crm_customers')
      .select('*, crm_notes(*), loyalty_transactions(*)')
      .eq('id', customerId)
      .single()

    if (!customer) throw new Error('Customer not found')

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    // 2. Prepare context for AI (Simplified version)
    // In a real implementation, you'd send this to an LLM.
    // For now, we'll implement the "logic" as a mock AI response 
    // that uses the customer's actual velocity and loyalty data.

    const totalSpent = transactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0
    const transactionCount = transactions?.length || 0
    const avgTicket = transactionCount > 0 ? totalSpent / transactionCount : 0
    
    // Loyalty velocity calculation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pointsEarned = customer.loyalty_transactions?.filter((t: any) => t.type === 'earn').length || 0
    const loyaltyVelocity = transactionCount > 0 ? pointsEarned / transactionCount : 0

    const prompt = `Analyze this customer for a business:
    Name: ${customer.first_name} ${customer.last_name}
    Total Transactions: ${transactionCount}
    Total Spent: $${totalSpent.toFixed(2)}
    Avg Ticket: $${avgTicket.toFixed(2)}
    Loyalty Points: ${customer.loyalty_points}
    Notes: ${customer.crm_notes?.map((n: { content: string }) => n.content).join('; ')}`

    // Mock AI Analysis (since we don't have a direct OpenAI key in this environment yet)
    // In production, use: const response = await openai.chat.completions.create(...)
    
    const summary = transactionCount > 2 
      ? `High-velocity customer with an average ticket of $${avgTicket.toFixed(2)}. Frequently engages with loyalty program (Velocity: ${loyaltyVelocity.toFixed(1)}). Recommendations: Target with premium upsells or loyalty milestones.`
      : `New or low-frequency customer. Total lifetime value: $${totalSpent.toFixed(2)}. Recommendations: Initial retention campaign needed.`

    const insights = {
      summary,
      buying_patterns: transactionCount > 0 ? 'Regular frequency' : 'No data yet',
      loyalty_velocity: loyaltyVelocity > 0.8 ? 'High' : 'Moderate',
      risk_of_churn: transactionCount > 5 ? 'Low' : 'Medium'
    }

    return insights

  } catch (err) {
    Sentry.captureException(err)
    console.error('Failed to generate AI insights:', err)
    return null
  }
}
