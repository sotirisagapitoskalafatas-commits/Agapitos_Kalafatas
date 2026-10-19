/**
 * Apply SQL files through the Supabase Management API.
 *
 * Requires:
 *   SUPABASE_PROJECT_REF=jqaxebkyroxqhcisvrvs
 *   SUPABASE_ACCESS_TOKEN=<scoped Supabase PAT with database write access>
 *
 * The Management API query endpoint is currently experimental. For a
 * repeatable production deployment, prefer versioned Supabase migrations.
 * Never use a service_role API key as a Management API token.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRef = process.env.SUPABASE_PROJECT_REF;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef || !/^[a-z0-9]{20}$/.test(projectRef)) {
  console.error("Set SUPABASE_PROJECT_REF to the target Supabase project reference.");
  process.exit(1);
}
if (!accessToken) {
  console.error("Set SUPABASE_ACCESS_TOKEN to a scoped Supabase Management API token. Do not use a service_role key.");
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node web/scripts/execute-sql.mjs <sql-file1> [sql-file2 ...]");
  process.exit(1);
}

for (const file of files) {
  const sqlPath = resolve(file);
  const sql = readFileSync(sqlPath, "utf8");
  if (!sql.trim()) {
    console.warn(`Skipping empty SQL file: ${sqlPath}`);
    continue;
  }

  console.log(`Applying ${sqlPath} to Supabase project ${projectRef}...`);
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  const body = await response.text();
  if (!response.ok) {
    console.error(`Supabase rejected ${sqlPath} (HTTP ${response.status}): ${body.slice(0, 1000)}`);
    process.exit(1);
  }

  console.log(`Applied ${sqlPath} successfully.`);
}
