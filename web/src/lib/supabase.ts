import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  session_id: string;
}

export interface AgentSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  status: "active" | "inactive";
}

// Chat operations
export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving message:", error);
    return null;
  }
  return data;
}

export async function getMessages(sessionId: string, limit = 50) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data;
}

export async function createSession(name: string) {
  const { data, error } = await supabase
    .from("agent_sessions")
    .insert({ name, status: "active" })
    .select()
    .single();

  if (error) {
    console.error("Error creating session:", error);
    return null;
  }
  return data;
}

export async function getSessions() {
  const { data, error } = await supabase
    .from("agent_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
  return data;
}
