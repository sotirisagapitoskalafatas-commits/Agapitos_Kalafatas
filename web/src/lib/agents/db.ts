import { createClient } from "@supabase/supabase-js";

let adminClient: any = null;

function getAdminClient(): any {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server access is not configured for this environment.");
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

// Do not initialize a service-role client while Next.js is collecting route data.
// The service key is read only at request time and never sent to the browser.
// This legacy codebase has no generated Database type, so retain its existing
// untyped server-query surface until database types are generated from Supabase.
export const supabase: any = new Proxy({}, {
  get(_target, property) {
    const client = getAdminClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { createClient };
