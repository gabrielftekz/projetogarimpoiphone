# Backend & Database Connection SOP

## 1. Goal
Ensure reliable connection, schema management, and data retrieval between the frontend React application and the Supabase backend.

## 2. Dependencies
- **Supabase**: PostgreSQL database, Authentication, Storage, Edge Functions.
- **Supabase JS Client**: `@supabase/supabase-js`.

## 3. Core Principles
- **Authentication First**: Every private route in the React application strictly enforces checking the AuthContext (`src/contexts/AuthContext.tsx`). The context uses `supabase.auth.getSession()` and subscription listeners.
- **Row Level Security (RLS)**: The Supabase PostgreSQL database must employ RLS policies to restrict read, update, and delete access matching the authenticated user's ID or role (Admin vs Standard User).
- **Environment Variables**: The execution scripts and frontend must rely solely on `.env` (or `.env.local` for Vite) for API URL and Anon Key. *Never hardcode keys*.

## 4. Workflows

### Data Fetching
- Query tables via the Supabase client:
  ```typescript
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
  ```
- All state hooks and components should handle loading and error states for robust UX.

### Third-Party Webhooks (Assistante AI)
- AI Agent interaction uses Webhooks (e.g., `https://webhook.francoia.shop/...`).
- Webhook calls should be resilient, meaning requests must include proper timeouts and failure handling to not freeze the client UI.

## 5. Execution Hooks
- Deterministic Python scripts (Layer 3) should be placed in `execution/` for any data seeding, daily sync routines, backups, or batch updates into the Supabase database. These scripts should utilize a secure `SUPABASE_SERVICE_ROLE_KEY` defined in `.env` exclusively for server-to-server operations.
