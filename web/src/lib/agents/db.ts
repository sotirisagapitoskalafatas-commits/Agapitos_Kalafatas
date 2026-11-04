import { createClient, type SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";

type AdminSupabaseClient = SupabaseClientType<any>;

let adminClient: AdminSupabaseClient | null = null;

function getAdminClient(): AdminSupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server access is not configured for this environment.");
  }

  adminClient = createClient<any>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

// Do not initialize a service-role client while Next.js is collecting route data.
// The service key is read only at request time and never sent to the browser.
export const supabase = new Proxy({} as AdminSupabaseClient, {
  get(_target, property) {
    const client = getAdminClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { createClient };
