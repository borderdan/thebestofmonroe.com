# Implementation Plan: Phase 13 - Data Vault & Hybrid E-Forms

This document outlines the execution strategy for migrating the legacy custom E-Forms builder to a robust, hybrid architecture powered by Formbricks and Supabase.

## Phase 13 Objectives
Replace the legacy E-Forms system by offloading rendering and submission handling to Formbricks. Implement an ingestion webhook to securely pipe Formbricks payloads into a dynamic `JSONB` native Supabase table (`vault_submissions`), and construct a "Data Vault" UI for tenants to manage these leads.

---

## Execution Plan

### Step 1: Database Schema Migration
Create the `vault_submissions` table to securely store dynamic form payloads.

1. **Create SQL Migration File:**
   Path: `supabase/migrations/20260311150000_phase13_data_vault.sql`
   ```sql
   CREATE TABLE IF NOT EXISTS public.vault_submissions (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
       form_id text NOT NULL,
       payload jsonb NOT NULL DEFAULT '{}'::jsonb,
       status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
       created_at timestamptz DEFAULT now()
   );

   CREATE INDEX IF NOT EXISTS idx_vault_submissions_payload ON public.vault_submissions USING gin (payload);

   ALTER TABLE public.vault_submissions ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Tenant View Own Vault" ON public.vault_submissions 
       FOR SELECT USING (business_id = public.get_auth_business_id() OR auth.is_superadmin());

   CREATE POLICY "Tenant Update Own Vault" ON public.vault_submissions 
       FOR UPDATE USING (business_id = public.get_auth_business_id() OR auth.is_superadmin());
   ```
2. **Generate TypeScript Types:**
   Run `npm run types:generate` to update `src/lib/database.types.ts`.

### Step 2: Environment & Configuration
1. **Generate Cryptographic Secret:**
   Generate a 32-byte hex string to secure the Formbricks webhook.
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **Update `.env.local`:**
   Append the generated string:
   ```env
   FORMBRICKS_WEBHOOK_SECRET="<YOUR_GENERATED_HEX_STRING>"
   ```

### Step 3: Ingestion Webhook (Formbricks ➡️ Supabase)
Build the bridge endpoint to receive Formbricks HTTP POST events.

1. **Create Route Handler:**
   Path: `src/app/api/webhooks/formbricks/route.ts`
   Implement the logic to validate the HMAC signature (`x-signature`), ensure the event is `submission.created`, extract `business_id` from `meta.hiddenFields.business_id`, and write to `vault_submissions` using `supabaseAdmin`.

### Step 4: Server Actions (Status Mutation)
Create the backend mutation logic for managing the vault inbox.

1. **Create Action File:**
   Path: `src/lib/actions/vault.ts`
   Implement `updateSubmissionStatus(id, newStatus)`. It relies on RLS to ensure tenants can only modify their own submissions and triggers `revalidatePath('/[locale]/app/vault', 'page')` to refresh the UI.

### Step 5: Data Vault UI (Tenant Dashboard)

1. **Update i18n Dictionaries:**
   Inject the `Vault` namespace into both `messages/en.json` and `messages/es.json`:
   * **EN:** title: "Data Vault", recentSubmissions: "Recent Submissions", date: "Date", formId: "Form ID", status: "Status", data: "Payload Data", actions: "Actions", status_new: "New", status_read: "Read", noSubmissions: "No form submissions found."
   * **ES:** title: "Bóveda de Datos", recentSubmissions: "Envíos Recientes", date: "Fecha", formId: "ID del Formulario", status: "Estado", data: "Datos del Envío", actions: "Acciones", status_new: "Nuevo", status_read: "Leído", noSubmissions: "No se encontraron envíos."

2. **Create the Server Page:**
   Path: `src/app/[locale]/app/vault/page.tsx`
   Implement the server component that fetches the user's business ID, retrieves un-archived submissions, and renders them in a `shadcn/ui` table with `JSON.stringify(sub.payload)`.

3. **Create the Client Component:**
   Path: `src/app/[locale]/app/vault/_components/update-status-button.tsx`
   Implement the `UpdateStatusButton` component using `useTransition` to handle loading states while invoking the `updateSubmissionStatus` Server Action. It should render "Mark Read" and "Archive" buttons based on the `currentStatus`.

### Step 6: Local Testing

To test the ingestion endpoint locally without Formbricks, use a custom Node.js script to spoof the payload and generate a valid HMAC signature.

1. **Create Test Script:**
   Create `test-formbricks.js` in the project root.
   Configure it with the `FORMBRICKS_SECRET` from `.env.local` and a valid `<YOUR_LOCAL_BUSINESS_ID>`.
2. **Execute Test:**
   * Start the Next.js dev server: `npm run dev`
   * Run the script: `node test-formbricks.js`
   * Expect a `200 OK` response.
3. **Verify UI:**
   Navigate to `http://localhost:3000/en/app/vault` to see the new submission.

### Step 7: Production Formbricks Configuration (Post-Deployment)

Once deployed, configure the live Formbricks instance:
1. **Webhook Setup:** In Formbricks Settings > Webhooks, set the URL to `https://your-production-domain.com/api/webhooks/formbricks`, trigger on `submission.created`, and input the `FORMBRICKS_WEBHOOK_SECRET`.
2. **Survey Configuration:** On every survey, go to Settings > Hidden Fields and add `business_id`.
3. **Widget Embed:** Ensure the React embed passes the tenant ID dynamically: `<FormbricksEmbed surveyId="..." hiddenFields={{ business_id: tenantUuid }} />`
