/**
 * Retroactive file-linking cleanup for the Atlas CRM.
 *
 * PROBLEM
 *   Before the `attached_files` fix, `/api/contact` uploaded files to the
 *   `client_uploads` bucket under `leads/{epoch-ms}-{random}.{ext}` but never
 *   stored their metadata on the lead row. Those files are orphaned — they are
 *   in storage but the CRM lead drawer can't show them.
 *
 * SOLUTION
 *   List every file under `client_uploads/leads/`, parse the epoch-ms prefix out
 *   of the filename, and link each file to the lead whose `created_at` is closest
 *   (within a tolerance window). Append the file metadata to the lead's
 *   `attached_files` JSONB array.
 *
 *   Filenames carry no lead id, so matching is heuristic (nearest created lead
 *   within the window). Review the DRY RUN output before running for real.
 *
 * USAGE  (run from the web/ directory so @supabase/supabase-js resolves)
 *   node scripts/link-orphaned-files.mjs            # dry run (no writes)
 *   APPLY=1 node scripts/link-orphaned-files.mjs    # apply updates
 *
 * ENV
 *   Reads web/.env.local for NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "fs";
import { resolve, join, basename } from "path";
import { createClient } from "@supabase/supabase-js";

// ---- Load web/.env.local (no dotenv dependency) ---------------------------
function loadEnv(filePath) {
  try {
    const text = readFileSync(filePath, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* env file optional */
  }
}
loadEnv(resolve(process.cwd(), ".env.local"));

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
for (const k of required) {
  if (!process.env[k]) {
    console.error(`Missing required env var: ${k} (set it in web/.env.local)`);
    process.exit(1);
  }
}

const BUCKET = "client_uploads";
const ROOT = "leads";
const MATCH_WINDOW_MS = 60 * 60 * 1000; // ±1h tolerance
const APPLY = process.env.APPLY === "1";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Filenames are `${Date.now()}-${random}.${ext}` — parse the epoch-ms prefix.
function parseEpochFromName(name) {
  const base = basename(name).split(".")[0];
  const dash = base.indexOf("-");
  if (dash > 0) {
    const num = Number(base.slice(0, dash));
    if (Number.isFinite(num) && num > 1e12) return num; // ms-scale
  }
  return null;
}

async function listAllFiles() {
  const out = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(ROOT, { limit, offset });
    if (error) throw new Error(`list error: ${error.message}`);
    if (!data || !data.length) break;
    out.push(...data);
    offset += data.length;
    if (data.length < limit) break;
  }
  return out;
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writes to DB)" : "DRY RUN (no writes)"}\n`);

  const [files, leadsRes] = await Promise.all([
    listAllFiles(),
    supabase.from("leads").select("id, created_at, attached_files"),
  ]);
  if (leadsRes.error) throw new Error(`leads select error: ${leadsRes.error.message}`);

  const leads = leadsRes.data || [];
  const createdByLead = new Map(
    leads.map((l) => [l.id, new Date(l.created_at).getTime()])
  );
  const attachmentsByLead = new Map(leads.map((l) => [l.id, l]));

  console.log(`Found ${files.length} files, ${leads.length} leads.\n`);

  let matched = 0;
  let unmatched = 0;
  let newLinks = 0;

  for (const file of files) {
    const epoch = parseEpochFromName(file.name);
    if (!epoch) {
      console.log(`  - Skipping (no epoch in name): ${file.name}`);
      unmatched++;
      continue;
    }

    let best = null;
    let bestDelta = Infinity;
    for (const lead of leads) {
      const delta = Math.abs((createdByLead.get(lead.id) || 0) - epoch);
      if (delta <= MATCH_WINDOW_MS && delta < bestDelta) {
        best = lead;
        bestDelta = delta;
      }
    }

    const filePath = `${ROOT}/${file.name}`;
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
    const meta = { name: file.name, url, path: filePath };

    if (!best) {
      console.log(`  ✗ No lead within window: ${file.name}`);
      unmatched++;
      continue;
    }

    matched++;
    const rec = attachmentsByLead.get(best.id);
    const arr = rec.attached_files || [];
    if (arr.some((a) => a && a.path === filePath)) {
      console.log(`  = Already linked: ${file.name} -> lead ${best.id.slice(0, 8)}`);
      continue;
    }
    arr.push(meta);
    attachmentsByLead.set(best.id, { ...rec, attached_files: arr });
    newLinks++;
    console.log(
      `  ✓ ${file.name} -> lead ${best.id.slice(0, 8)} (Δ ${Math.round(bestDelta / 1000)}s)`
    );
  }

  console.log(`\nMatched: ${matched} · Unmatched: ${unmatched} · New links to write: ${newLinks}`);

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with APPLY=1 to persist changes.");
    return;
  }

  let written = 0;
  let errors = 0;
  for (const [leadId, rec] of attachmentsByLead.entries()) {
    const { data: original } = await supabase
      .from("leads")
      .select("attached_files")
      .eq("id", leadId)
      .single();
    const originalArr = (original && original.attached_files) || [];
    const merged = [...originalArr];
    for (const a of rec.attached_files || []) {
      if (!merged.some((m) => m && m.path === a.path)) merged.push(a);
    }
    if (merged.length === originalArr.length) continue;
    const { error } = await supabase
      .from("leads")
      .update({ attached_files: merged })
      .eq("id", leadId);
    if (error) {
      console.error(`  ✗ Update failed for lead ${leadId.slice(0, 8)}: ${error.message}`);
      errors++;
    } else {
      written++;
    }
  }
  console.log(`\nApplied. Updated ${written} lead(s), ${errors} error(s).`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
