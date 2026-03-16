This hybrid architecture—separating internal orchestration from user-facing automation—is the standard pattern for multi-tenant SaaS platforms. Exposing a raw n8n canvas to non-technical SME owners introduces unacceptable UX complexity and tenant isolation risks.

Hybrid Automation Architecture
Scope	Execution Engine	UI / Interface	Authentication & Data Access	Typical Use Cases
Site Admin	n8n (Self-hosted Docker)	n8n Native Visual Canvas	Full system access. Bypasses Supabase RLS. Utilizes global API keys.	Syncing Stripe data to internal CRM, database backups, global error monitoring.
Customers (SMEs)	Custom backend or compiled n8n webhooks	Custom React builder (React Flow or IFTTT-style forms)	Strictly scoped to tenant_id via Supabase RLS. Uses tenant-specific integrations.	"When a POS sale > $1000 MXN, send WhatsApp alert." / "Auto-generate CFDI on payment."
Customer Workflow Builder Implementation Strategies
To provide "simpler workflows" for your customers, you must build a custom frontend abstraction layer that shields them from backend complexity.

Architecture Pattern	Frontend	Backend Execution	Technical Debt & Viability
The Façade	Custom React UI.	Next.js compiles the UI state into valid n8n JSON and pushes it to your admin n8n instance via the REST API.	Medium. Fast to deploy utilizing existing n8n infrastructure. Requires rigorous payload mapping and injecting tenant_id into every n8n node to ensure data isolation.
Native Event Engine	Custom React UI.	Next.js API Routes integrated with a code-first runner (Trigger.dev or Inngest).	High. Maximum security and seamless Supabase RLS integration. Requires writing every integration (Facturama, MercadoPago, WhatsApp) natively in TypeScript.
Rule-Based (IFTTT)	Simple dropdowns (Trigger → Condition → Action).	Evaluated via a custom Node.js script or Postgres Database Triggers.	Low. The simplest UX for non-technical users. Highly restrictive capabilities compared to visual node builders.
Supabase Schema for Customer Workflows
Regardless of the execution engine, user-built workflows require a structured database representation to persist state and enforce multi-tenant security.

Column	Data Type	Constraint / Purpose
id	UUID	Primary Key.
tenant_id	UUID	Foreign Key. Mandatory for Row Level Security (RLS) policies.
name	String	User-defined identifier.
trigger_event	String	Defined system hooks (e.g., pos_sale_completed, new_lead_added).
conditions	JSONB	Logic gates (e.g., {"field": "amount", "operator": ">=", "value": 500}).
actions	JSONB	Execution payload (e.g., {"type": "webhook", "url": "https://...", "body": "{}"}).
is_active	Boolean	Execution toggle switch.
Would you like the React Flow component architecture required to build a basic drag-and-drop visual UI for the customer-facing builder?