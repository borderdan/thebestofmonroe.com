# Implementation Plan: Phase 11 - Transactional Emails & Notifications

This document outlines the step-by-step execution plan for implementing Phase 11 (Transactional Emails via Resend and React Email) in the The Best of Monroe Next.js 16 application.

## Phase 11 Objectives
Integrate a robust transactional email system using Resend and React Email. This includes building reusable templates, a centralized dispatch service with Supabase logging, and triggering emails from existing webhooks.

---

## Step 1: Pre-Execution Setup (Dependencies & Environment)
Before writing code, the necessary packages and environment variables must be configured.

1. **Install Dependencies:**
   Navigate to the `The Best of Monroe` directory and install Resend and React Email components:
   ```bash
   npm install resend @react-email/components
   ```
2. **Environment Variables:**
   Add the Resend API key to `C:\antigravity\The Best of Monroe\.env.local`:
   ```env
   RESEND_API_KEY="re_your_api_key_here"
   ```

## Step 2: Database Schema Migration (Audit Ledger)
Create the `email_logs` table to track all outgoing communications and enforce Row Level Security (RLS).

1. **Execute SQL in Supabase:**
   ```sql
   -- Create the email_logs table
   CREATE TABLE IF NOT EXISTS public.email_logs (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
       recipient_email text NOT NULL,
       subject text NOT NULL,
       template_name text NOT NULL,
       delivery_status text NOT NULL CHECK (delivery_status IN ('sent', 'failed', 'bounced')),
       error_message text,
       created_at timestamptz DEFAULT now()
   );

   -- Enable RLS
   ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

   -- Policy: Super Admins view all, Tenants view their own
   CREATE POLICY "Tenant View Own Emails" ON public.email_logs 
       FOR SELECT USING (business_id = public.get_auth_business_id() OR auth.is_superadmin());
   ```
2. **Update TypeScript Types:**
   Run the Supabase CLI to regenerate `database.types.ts` to include the new `email_logs` table:
   ```bash
   npm run types:generate
   ```

## Step 3: Implement React Email Templates
Construct the visual email templates using `@react-email/components` for cross-client compatibility.

1. **Create Template Directory:**
   Ensure the folder `src/emails/` exists.
2. **Build Receipt Template:**
   Create `src/emails/ReceiptTemplate.tsx` based on the provided Master Prompt. This template will receive `businessName`, `planName`, `amount`, and `invoiceUrl` as props.

## Step 4: Construct the Email Dispatch Service
Centralize the Resend API logic and ensure all dispatches are logged to the database.

1. **Create Service File:**
   Create `src/lib/services/email.ts`.
2. **Implement `sendTransactionalEmail`:**
   * Instantiate the Resend client using `RESEND_API_KEY`.
   * Instantiate a Supabase Admin client (bypassing RLS) using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to guarantee logs are written even from unauthenticated webhooks.
   * Send the email via Resend.
   * Log the result (success or failure/error message) to the `email_logs` table.

## Step 5: Integrate with Stripe Webhook
Hook the email service into the existing payment infrastructure.

1. **Modify Webhook Route:**
   Open `src/app/api/webhooks/stripe/route.ts`.
2. **Trigger Receipt on Success:**
   Locate the `invoice.payment_succeeded` event block.
3. **Dispatch Email:**
   * Extract the necessary details (customer email, amount, plan name, invoice URL).
   * Call `sendTransactionalEmail` with the `ReceiptTemplate`.
   * **Crucial Rule:** Wrap the `sendTransactionalEmail` call in an independent `try/catch` block within the webhook handler. This ensures that if the email fails to send, the webhook does NOT return a 500 error to Stripe (which would trigger unnecessary and potentially duplicate retries of the successful payment logic).

---

## Next Steps / Optional Additions
* **Welcome Email:** Following this plan, we can draft a `WelcomeTemplate.tsx` and tie it into the `public.handle_new_user()` Supabase trigger or a dedicated Auth webhook to greet new tenants upon registration.
* **Testing:** Use a test email address and the Resend test API keys to verify delivery and database logging before pushing to production.