/**
 * Thin OpenAI-compatible chat completion client for managed models
 * (Qwen / compatible providers). Local adapters are tried first by callers
 * (e.g. Ollama in tutor.ts) with this as the fallback.
 */

export type LlmRole = "system" | "user" | "assistant" | "tool";
export type MessageContent =
  | string
  | ReadonlyArray<{ type: string; text?: string } | unknown>;

export type Message = {
  role: LlmRole;
  content: MessageContent;
};

export type LlmResponse = {
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string | ReadonlyArray<{ type: string; text?: string } | unknown>;
      contentStr?: string;
    };
  }>;
};

export async function invokeLLM(input: {
  model?: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}): Promise<LlmResponse> {
  const baseUrl = process.env.LLM_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("No LLM provider configured (set LLM_BASE_URL)");
  }
  const apiKey = process.env.LLM_API_KEY;
  const model = input.model || process.env.LLM_MODEL || "qwen-plus";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: input.messages.map((message) => ({
        role: message.role,
        content: typeof message.content === "string" ? message.content : JSON.stringify(message.content),
      })),
      max_tokens: input.maxTokens,
      temperature: input.temperature ?? 0.5,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    model?: string;
    choices?: Array<{ message?: { role?: string; content?: string | ReadonlyArray<unknown> } }>;
  };

  return {
    model: payload.model ?? model,
    choices: (payload.choices ?? []).map((choice) => ({
      message: {
        role: choice.message?.role ?? "assistant",
        content: choice.message?.content ?? "",
      },
    })),
  };
}
