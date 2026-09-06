# web/config

Supabase schema and seed data.

## Files

| File | Purpose | Safe to run on empty project? |
|---|---|---|
| `schema.sql` | Complete hardened schema (RLS + service_role-only policies) | **Yes** — this is the canonical source |
| `vector_setup.sql` | Vector extension + `knowledge_base` — subset of `schema.sql`, kept for isolated re-runs | Yes |
| `seed_knowledge.sql` | Populates `knowledge_base` with the current RAG corpus | Yes (idempotent inserts) |
| `leads-schema.sql` | Legacy leads-only definition | Don't use — `schema.sql` supersedes it |

## Setup on a fresh Supabase project

1. Create the project. Note the `service_role` key (Settings → API).
2. SQL Editor → paste `schema.sql` → **Run**.
3. Confirm in Table Editor that RLS is `on` for every table.
4. SQL Editor → paste `seed_knowledge.sql` → **Run** to populate the RAG corpus.
5. Set env vars:
   - `NEXT_PUBLIC_SUPABASE_URL` — project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — service_role key (server-only, never expose to client)
   - Anon key **is not required** in this setup; every mutation goes through server-side routes.

## Why not `USING (true)`

Prior versions of `RUN_ALL_SETUP.sql` and `unified-crm-schema.sql` shipped with policies like:

```sql
CREATE POLICY "Allow read on leads" ON leads FOR SELECT USING (true);
```

Because the anon key is embedded in the client bundle, that gives **any website visitor**
full read/update/delete on every lead, deal, invoice, and uploaded file. Those two files
have been removed. Do not re-introduce policies of that shape.

## Applying a change to an already-live project

Never `DROP TABLE`. Add a new migration file next to `schema.sql`
(e.g. `2026-09-06-add-column.sql`) and apply through the SQL Editor.