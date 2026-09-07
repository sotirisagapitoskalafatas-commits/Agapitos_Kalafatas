// Social connection orchestration (server-side, service-role Supabase).
// Safe READ-ONLY probes only; never a write. Publish capability enforcement
// lives in `capabilities.ts` (canPublishNow is always false for now).

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SOCIAL_PLATFORMS,
  platformCapabilities,
  summarizeConnection,
} from "./capabilities";

const PLAINTEXT_OPT_IN =
  process.env.INTEGRATION_TOKEN_IS_PLAINTEXT === "1" ||
  process.env.INTEGRATION_TOKEN_IS_PLAINTEXT === "true";

export type ProbeResult = {
  ok: boolean | null;
  message: string;
  verified: string[];
  info?: Record<string, any>;
};

export function credentialServiceName(platform: string, accountName: string): string {
  const slug = accountName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `social:${platform}:${slug}`;
}

export async function listConnections(client: SupabaseClient): Promise<any[]> {
  const { data, error } = await client
    .from("social_connections")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`social_connections list failed: ${error.message}`);
  return (data || []).map((row: any) => decorate(row));
}

function decorate(row: any): any {
  return {
    ...row,
    effective: summarizeConnection(
      row.platform,
      row.capabilities_declared || [],
      row.capabilities_verified || []
    ),
  };
}

export async function saveConnection(
  client: SupabaseClient,
  input: {
    id?: string;
    platform: string;
    accountName: string;
    accountId?: string;
    provider?: string;
    scopes?: string[];
    capabilitiesDeclared?: string[];
    token?: string;
    createdBy?: string;
  }
): Promise<any> {
  if (!SOCIAL_PLATFORMS.includes(input.platform as any)) {
    throw new Error(`Unsupported platform: ${input.platform}`);
  }
  if (!input.accountName?.trim()) throw new Error("Account name is required");
  const platform = input.platform;

  const knownCapabilities = new Set(platformCapabilities(platform).map((c) => c.id));
  const declared = (input.capabilitiesDeclared || []).filter((id) =>
    knownCapabilities.has(id)
  );
  const scopes = (input.scopes || []).filter(Boolean);

  let credentialService: string | null = null;

  // Token write goes ONLY to integration_credentials under the same plaintext
  // opt-in the Stripe connector uses. Without the opt-in we store metadata but
  // no token — the connection stays in 'draft' and read probes are skipped.
  if (input.token && PLAINTEXT_OPT_IN) {
    const serviceName = credentialServiceName(platform, input.accountName.trim());
    const { error: upsertError } = await client.from("integration_credentials").upsert(
      {
        service_name: serviceName,
        label: `Social · ${platform} · ${input.accountName.trim()}`,
        encrypted_token: input.token.trim(),
        metadata: { kind: "social", platform, account: input.accountName.trim() },
        is_enabled: true,
      },
      { onConflict: "service_name" }
    );
    if (upsertError) throw new Error(`credential upsert failed: ${upsertError.message}`);
    credentialService = serviceName;
  }

  const { data: existing } = await client
    .from("social_connections")
    .select("credential_service, status")
    .eq("platform", platform)
    .eq("account_name", input.accountName.trim())
    .maybeSingle();

  if (!credentialService && existing?.credential_service) {
    credentialService = existing.credential_service;
  }

  const status = credentialService ? "connected" : "draft";

  const insert = {
    platform,
    account_name: input.accountName.trim(),
    account_id: input.accountId?.trim() || null,
    provider: input.provider || "manual",
    credential_service: credentialService,
    status,
    scopes,
    capabilities_declared: declared,
    created_by: input.createdBy || null,
  };

  if (input.id) {
    const { data, error } = await client
      .from("social_connections")
      .update({ ...insert, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw new Error(`social_connections update failed: ${error.message}`);
    return decorate(data);
  }

  const { data, error } = await client
    .from("social_connections")
    .upsert(insert, { onConflict: "platform,account_name" })
    .select()
    .single();
  if (error) throw new Error(`social_connections upsert failed: ${error.message}`);
  return decorate(data);
}

async function loadStoredToken(
  client: SupabaseClient,
  credentialService: string
): Promise<string | null> {
  const { data, error } = await client
    .from("integration_credentials")
    .select("encrypted_token, is_enabled")
    .eq("service_name", credentialService)
    .maybeSingle();
  if (error || !data?.is_enabled) return null;
  return typeof data.encrypted_token === "string" && data.encrypted_token ? data.encrypted_token : null;
}

async function probeFacebook(token: string, accountId: string | null): Promise<ProbeResult> {
  const target = accountId || "me";
  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(target)}?fields=name,link,fan_count&access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const body = (await res.json().catch(() => ({}))) as Record<string, any>;
    if (!res.ok || body.error) {
      return {
        ok: false,
        message: `Meta probe failed: ${body.error?.message || `HTTP ${res.status}`}`,
        verified: [],
      };
    }
    return {
      ok: true,
      message: `Read probe OK — page "${body.name}" is readable.`,
      verified: ["pages_read"],
      info: { name: body.name, link: body.link, fan_count: body.fan_count },
    };
  } catch (e) {
    return { ok: false, message: `Meta probe errored: ${e instanceof Error ? e.message : "network" }`, verified: [] };
  }
}

export async function testConnection(
  client: SupabaseClient,
  id: string
): Promise<{ connection: any; probe: ProbeResult }> {
  const { data: row, error: rowError } = await client
    .from("social_connections")
    .select("*")
    .eq("id", id)
    .single();
  if (rowError || !row) throw new Error("Connection not found");

  let probe: ProbeResult;
  if (!row.credential_service) {
    probe = {
      ok: null,
      message: "No token stored — capability probe skipped (declared capabilities only).",
      verified: [],
    };
  } else if (!PLAINTEXT_OPT_IN) {
    probe = {
      ok: null,
      message:
        "Token present but INTEGRATION_TOKEN_IS_PLAINTEXT is off — safe read-probe disabled. Capabilities stay declared-only.",
      verified: [],
    };
  } else {
    const token = await loadStoredToken(client, row.credential_service);
    if (!token) {
      probe = { ok: null, message: "Stored token missing or disabled.", verified: [] };
    } else if (row.platform === "facebook") {
      probe = await probeFacebook(token, row.account_id);
    } else if (row.platform === "instagram") {
      probe = {
        ok: null,
        message: "Instagram read-probe not implemented yet (needs Meta page token + App Review).",
        verified: [],
      };
    } else {
      probe = {
        ok: null,
        message: `Read-probe not implemented for ${row.platform} yet.`,
        verified: [],
      };
    }
  }

  const health = {
    last_check_at: new Date().toISOString(),
    ok: probe.ok,
    info: probe.info || null,
    message: probe.message,
  };

  // Verified capabilities are set from the probe ONLY. Declared stays as-is.
  const nextStatus =
    probe.ok === true ? "connected" : probe.ok === false ? "error" : row.status;

  const { error: updateError } = await client
    .from("social_connections")
    .update({
      capabilities_verified: probe.verified,
      health,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) throw new Error(`social_connections health update failed: ${updateError.message}`);

  return { connection: decorate({ ...row, capabilities_verified: probe.verified, health, status: nextStatus }), probe };
}

export async function setConnectionStatus(
  client: SupabaseClient,
  id: string,
  status: "draft" | "connected" | "disabled"
): Promise<any> {
  if (!["draft", "connected", "disabled"].includes(status)) {
    throw new Error("Invalid status");
  }
  const { data: row, error: rowError } = await client
    .from("social_connections")
    .select("credential_service")
    .eq("id", id)
    .single();
  if (rowError || !row) throw new Error("Connection not found");

  if (status === "connected" && !row.credential_service) {
    throw new Error("Cannot mark connected without a stored token (credential_service).");
  }

  const { data, error } = await client
    .from("social_connections")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`social_connections status update failed: ${error.message}`);
  return decorate(data);
}

export async function deleteConnection(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { data: row, error: rowError } = await client
    .from("social_connections")
    .select("credential_service")
    .eq("id", id)
    .single();
  if (rowError || !row) throw new Error("Connection not found");

  if (row.credential_service) {
    await client
      .from("integration_credentials")
      .delete()
      .eq("service_name", row.credential_service);
  }
  const { error } = await client.from("social_connections").delete().eq("id", id);
  if (error) throw new Error(`social_connections delete failed: ${error.message}`);
}