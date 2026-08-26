import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate embedding using OpenAI text-embedding-3-small
async function getOpenAIEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  const data = await res.json();
  return data.data[0].embedding;
}

// Fallback: simple text search when embeddings unavailable
async function fallbackTextSearch(query: string, category: string) {
  const { data, error } = await supabase
    .from("knowledge_base")
    .select("id, category, title, content")
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .eq("category", category === "all" ? "" : category)
    .limit(3);

  if (error || !data || data.length === 0) {
    // Try without category filter
    const { data: allData } = await supabase
      .from("knowledge_base")
      .select("id, category, title, content")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(3);
    return allData || [];
  }

  return data;
}

export async function retrieveKnowledge(
  query: string,
  category: "web_dev" | "energy" | "insurance" | "all"
): Promise<string> {
  try {
    // Try vector search if OpenAI key available
    if (OPENAI_API_KEY) {
      const embedding = await getOpenAIEmbedding(query);

      const { data, error } = await supabase.rpc("match_knowledge", {
        query_embedding: embedding,
        match_category: category,
        match_threshold: 0.4,
        match_count: 3,
      });

      if (!error && data && data.length > 0) {
        return data
          .map((doc: any) => `[Document: ${doc.title}]\n${doc.content}`)
          .join("\n\n");
      }
    }

    // Fallback: text search
    const results = await fallbackTextSearch(query, category);
    if (results.length > 0) {
      return results
        .map((doc: any) => `[Document: ${doc.title}]\n${doc.content}`)
        .join("\n\n");
    }

    return "No specific knowledge base documents found for this query.";
  } catch (err) {
    console.error("RAG Retrieval Error:", err);
    return "Knowledge base lookup temporarily unavailable.";
  }
}
