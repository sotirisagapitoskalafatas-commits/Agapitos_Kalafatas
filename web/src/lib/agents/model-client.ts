// Model client with provider switch.
//
// Provides a uniform interface for the agent orchestrator regardless of
// which LLM backend is configured. Supports:
//   - Gemini (default, no extra deps)
//   - OpenAI-compatible endpoints (vLLM, Ollama, hosted providers)
//
// Set in .env:
//   LLM_PROVIDER=gemini|opencodeai   (default: gemini)
//   LLM_BASE_URL=http://localhost:8000/v1  (for opencodeai)
//   LLM_API_KEY=...                   (for opencodeai)
//   LLM_MODEL=Qwen/Qwen2.5-1.5B-Instruct  (for opencodeai)
//   GEMINI_API_KEY=...                (for gemini)

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
};

export type ToolCall = {
  id: string;
  name: string;
  arguments: string; // JSON string
};

export type ModelResponse = {
  content: string | null;
  toolCalls: ToolCall[];
};

export type ModelClient = {
  provider: string;
  model: string;
  chat: (messages: ChatMessage[], tools: ToolDefinition[]) => Promise<ModelResponse>;
};

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3-flash-preview";

const GEMINI_TOOLS_SCHEMA = (
  tools: ToolDefinition[]
) => ({
  functionDeclarations: tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters,
  })),
});

async function callGemini(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  model: string
): Promise<ModelResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const contents: any[] = [];
  let systemInstruction = "";

  for (const m of messages) {
    if (m.role === "system") {
      systemInstruction += m.content + "\n";
      continue;
    }
    if (m.role === "tool") {
      contents.push({
        role: "function",
        parts: [
          {
            functionResponse: {
              name: m.tool_call_id || "tool",
              response: JSON.parse(m.content),
            },
          },
        ],
      });
      continue;
    }
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }

  const body: Record<string, any> = {
    contents,
    generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 2048 },
  };

  if (systemInstruction.trim()) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (tools.length > 0) {
    body.tools = [GEMINI_TOOLS_SCHEMA(tools)];
  }

  const res = await fetch(`${url}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts?.length) {
    return { content: null, toolCalls: [] };
  }

  const parts = candidate.content.parts;
  const text = parts.filter((p: any) => p.text).map((p: any) => p.text).join("\n");
  const toolCalls: ToolCall[] = parts
    .filter((p: any) => p.functionCall)
    .map((p: any, i: number) => ({
      id: `${p.functionCall.name}-${i}`,
      name: p.functionCall.name,
      arguments: JSON.stringify(p.functionCall.args || {}),
    }));

  return { content: text || null, toolCalls };
}

async function callOpenAICompatible(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  model: string
): Promise<ModelResponse> {
  const baseURL = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  if (!baseURL || !apiKey) {
    throw new Error(
      "LLM_BASE_URL and LLM_API_KEY required for OpenAI-compatible provider"
    );
  }

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.filter((m) => m.role !== "tool" || m.tool_call_id),
      tools: tools.map((t) => ({
        type: "function",
        function: {
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        },
      })),
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM API error (${res.status}): ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  if (!msg) return { content: null, toolCalls: [] };

  const toolCalls: ToolCall[] = (msg.tool_calls || []).map((tc: any) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: tc.function.arguments || "{}",
  }));

  return { content: msg.content, toolCalls };
}

export function getModelClient(): ModelClient {
  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

  if (provider === "opencodeai" || provider === "openai" || provider === "ollama" || provider === "vllm") {
    return {
      provider,
      model: process.env.LLM_MODEL || "Qwen/Qwen2.5-1.5B-Instruct",
      chat: (messages, tools) =>
        callOpenAICompatible(messages, tools, process.env.LLM_MODEL || "Qwen/Qwen2.5-1.5B-Instruct"),
    };
  }

  return {
    provider: "gemini",
    model: GEMINI_MODEL,
    chat: (messages, tools) => callGemini(messages, tools, GEMINI_MODEL),
  };
}
