import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type LegacyTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};

type LegacyView = {
  Row: Record<string, any>;
  Relationships: [];
};

type LegacyFunction = {
  Args: Record<string, any>;
  Returns: any;
};

// This project predates generated Supabase Database types. Keep a permissive
// record-based schema until types are generated, while still preserving array
// row inference so query callbacks receive contextual types instead of implicit any.
type LegacyDatabase = {
  public: {
    Tables: Record<string, LegacyTable>;
    Views: Record<string, LegacyView>;
    Functions: Record<string, LegacyFunction>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, unknown>;
  };
};

type AdminSupabaseClient = SupabaseClient<LegacyDatabase, "public">;

let adminClient: AdminSupabaseClient | null = null;

function getAdminClient(): AdminSupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server access is not configured for this environment.");
  }

  adminClient = createClient<LegacyDatabase>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input as any, { ...init, cache: "no-store" }),
    },
  });
  return adminClient;
}

// Do not initialize a service-role client while Next.js is collecting route data.
// The service key is read only at request time and never sent to the browser.
export const supabase: AdminSupabaseClient = new Proxy({} as AdminSupabaseClient, {
  get(_target, property) {
    const client = getAdminClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { createClient };
