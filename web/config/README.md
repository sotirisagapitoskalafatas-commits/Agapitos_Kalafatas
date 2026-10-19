# Supabase schema and seed data — Atlas CRM

The active Supabase project for this repository is **`jqaxebkyroxqhcisvrvs`**:
`https://jqaxebkyroxqhcisvrvs.supabase.co`.

## Fresh-project setup

The CRM uses a server-side service-role client for private data. Do not expose the
service-role/secret key in browser code, `NEXT_PUBLIC_*` variables, or Git.

Apply the following SQL files in order in Supabase SQL Editor. Run each file as
a separate transaction/submission and verify it finishes successfully before
continuing:

1. `web/config/schema.sql` — canonical CRM tables, RLS, private client uploads bucket and knowledge base.
2. `config/supabase-schema.sql` — chat sessions/messages, service-role-only.
3. `config/settings-table.sql` — system settings. Settings contain private financial and webhook values; the whole row must not be public.
4. `config/notifications-table.sql` — CRM notification history.
5. `config/agent-commands.sql` — external integration credential store.
6. `config/agent-audit.sql` — agent audit log.
7. `config/agent-approvals.sql` — human approval queue for agent actions.
8. `web/config/2026-09-07-lead-folder.sql` — energy/provider fields and private client documents bucket.
9. `web/config/2026-10-19-crm-compatibility.sql` — customer display-name compatibility fields, updated-at triggers and the missing `service_requests` table; also hardens private CRM RLS policies.
10. `web/config/2026-09-08-foundation-spine.sql` — consent, source attribution and idempotent renewal reminders.
11. `web/config/2026-09-08-fix-tasks-view.sql` — exposes the expected `start_time` field on the task view.
12. `web/config/2026-09-08-renewal-materialize.sql` — enables `pg_cron`, creates renewal tasks/notifications and schedules the daily job.
13. `web/config/2026-09-08-social-connections.sql` — social account connection metadata.
14. `web/config/2026-09-08-creative-studio.sql` — campaigns, assets, variants, rules, audit and the creative media bucket.
15. `web/config/seed_knowledge.sql` — initial knowledge-base content for the agent.
16. `web/config/2026-10-19-security-hardening.sql` — explicit service-role RLS policies, browser-role revocation, pinned function search paths and function execution grants.
17. `web/config/2026-10-19-performance-indexes.sql` — indexes frequently joined CRM foreign keys.

**Do not run `config/apply-security-migration.sql` on this fresh project.** It is a
historical upgrade script for older schemas and overlaps the canonical schema.

## Environment variables

Set these for local development and for every deployed runtime (Vercel/Railway/
Render as applicable):

- `NEXT_PUBLIC_SUPABASE_URL=https://jqaxebkyroxqhcisvrvs.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the project's legacy anon key or publishable key; this is public and must be paired with correct RLS.
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only; retrieve it from the new project's API key settings. Never commit it.
- `GEMINI_API_KEY` — required for agent/orchestrator features.
- `OPENAI_API_KEY` — needed for semantic knowledge-base embeddings/RAG features.
- `ADMIN_USER` and a strong `ADMIN_PASS` — required for CRM login in production. These are application login credentials, not your Supabase account login.
- `AUTH_SECRET` — required to sign admin session tokens; set a new random value in the deployment environment. Do not store real values in Git.
- `RESEND_API_KEY` and `NOTIFY_EMAIL_TO` — required for email notifications.
- `SLACK_WEBHOOK_URL`, `SUPABASE_WEBHOOK_SECRET`, and/or Slack bot values only when those integrations are enabled.

`SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN` are only for the optional SQL helper.
The Management API SQL endpoint is experimental and requires a scoped Management API
token with database-write permission. Never use the service-role key as that token.

## Recovering a forgotten CRM login

The application does not store or recover the administrator password in Supabase. Reset it at the hosting provider by replacing `ADMIN_USER`, `ADMIN_PASS`, and `AUTH_SECRET` together. Use a unique, random password and a separately generated random `AUTH_SECRET`; redeploy and test the login page. Changing `AUTH_SECRET` invalidates existing CRM session tokens. Do not add credentials to this repository, a SQL table, or a public issue. The app login form is protected by API-level bearer-token checks; there is no separate HTTP Basic password gate.

## Verification checklist

After applying the files, verify that:

- all expected tables exist and RLS is enabled for private CRM tables;
- anon/authenticated cannot read or modify leads, service requests, settings, invoices, notifications, integration credentials, approvals or agent audit rows directly;
- `client_uploads` and `client_documents` are private buckets;
- `creative-assets` is public-read only by design for media previews, with writes via server-side service-role routes;
- the Supabase project reference in the environment variables matches the dashboard project;
- the CRM login works, then create and edit a test lead, service request, task, invoice and creative asset;
- Supabase Security and Performance Advisors are reviewed after setup.

Seeded knowledge text does not include embeddings. To enable semantic retrieval, configure
`OPENAI_API_KEY` and run the application's knowledge embedding/seed flow. Text lookup
works without embeddings, but semantic retrieval does not.
