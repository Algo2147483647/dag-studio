import type { AiPlan, AiRequest, AiSettings } from "./types";

const SYSTEM_PROMPT = [
  "You are DAG Studio's AI control assistant.",
  "You can answer questions about the current graph and can operate the graph only by returning console commands.",
  "Every console command must start with / and must be one of the available commands in the command reference.",
  "Never invent hidden APIs. Never mutate graph data directly.",
  "When the user asks about a specific node, a bare node name, graph structure, paths, or data details that are not fully visible in context, return read-only console commands such as /find, /ls, /neighbors, /path, or /graph.",
  "Interpret bare words like \"Set node\" or \"Set 节点\" as a possible node lookup first; do not treat them as edit requests unless the user explicitly asks to change data or uses /set.",
  "Return only JSON with one of these shapes:",
  '{"type":"answer","text":"..."}',
  '{"type":"run_console","explanation":"...","commands":["/keys"]}',
  "Use run_console only when the user asks you to inspect or change the graph through commands.",
].join("\n");

export async function requestAiPlan({ settings, context, message }: AiRequest): Promise<AiPlan> {
  const prompt = buildUserPrompt(context.summary, context.commandReference, message);
  const raw = await requestProviderText(settings, SYSTEM_PROMPT, prompt);
  return parseAiPlan(raw);
}

export async function testAiConnection(settings: AiSettings): Promise<string> {
  const raw = await requestProviderText(
    settings,
    "Return only a short JSON object: {\"type\":\"answer\",\"text\":\"ok\"}.",
    "Reply with ok.",
  );
  const plan = parseAiPlan(raw);
  return plan.type === "answer" ? plan.text : "ok";
}

function buildUserPrompt(summary: string, commandReference: string, message: string): string {
  return [
    "Current graph context:",
    summary,
    "",
    "Available console commands:",
    commandReference,
    "",
    "User request:",
    message,
  ].join("\n");
}

async function requestProviderText(settings: AiSettings, systemPrompt: string, userPrompt: string): Promise<string> {
  switch (settings.provider) {
    case "deepseek":
      return requestOpenAiCompatible(settings, systemPrompt, userPrompt);
    case "anthropic":
      return requestAnthropic(settings, systemPrompt, userPrompt);
    case "gemini":
      return requestGemini(settings, systemPrompt, userPrompt);
    case "ollama":
      return requestOllama(settings, systemPrompt, userPrompt);
    default:
      return requestOpenAiCompatible(settings, systemPrompt, userPrompt);
  }
}

async function requestOpenAiCompatible(settings: AiSettings, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${trimTrailingSlash(settings.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: buildJsonHeaders(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
    body: JSON.stringify({
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const json = await parseResponseJson(response);
  const text = json?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new Error("AI response did not include message content.");
  }
  return text;
}

async function requestAnthropic(settings: AiSettings, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${trimTrailingSlash(settings.baseUrl)}/v1/messages`, {
    method: "POST",
    headers: buildJsonHeaders({
      "x-api-key": settings.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    }),
    body: JSON.stringify({
      model: settings.model,
      system: systemPrompt,
      max_tokens: settings.maxTokens,
      temperature: settings.temperature,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const json = await parseResponseJson(response);
  const text = json?.content?.map((item: { text?: unknown }) => item.text).filter((item: unknown) => typeof item === "string").join("\n");
  if (typeof text !== "string" || !text) {
    throw new Error("AI response did not include message content.");
  }
  return text;
}

async function requestGemini(settings: AiSettings, systemPrompt: string, userPrompt: string): Promise<string> {
  const endpoint = `${trimTrailingSlash(settings.baseUrl)}/v1beta/models/${encodeURIComponent(settings.model)}:generateContent`;
  const url = settings.apiKey ? `${endpoint}?key=${encodeURIComponent(settings.apiKey)}` : endpoint;
  const response = await fetch(url, {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: settings.temperature,
        maxOutputTokens: settings.maxTokens,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    }),
  });
  const json = await parseResponseJson(response);
  const text = json?.candidates?.[0]?.content?.parts?.map((part: { text?: unknown }) => part.text).filter((item: unknown) => typeof item === "string").join("\n");
  if (typeof text !== "string" || !text) {
    throw new Error("AI response did not include message content.");
  }
  return text;
}

async function requestOllama(settings: AiSettings, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${trimTrailingSlash(settings.baseUrl)}/api/chat`, {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify({
      model: settings.model,
      stream: false,
      options: {
        temperature: settings.temperature,
        num_predict: settings.maxTokens,
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  const json = await parseResponseJson(response);
  const text = json?.message?.content;
  if (typeof text !== "string") {
    throw new Error("AI response did not include message content.");
  }
  return text;
}

function parseAiPlan(raw: string): AiPlan {
  const parsed = JSON.parse(extractJsonObject(raw)) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI response was not a JSON object.");
  }
  const record = parsed as Record<string, unknown>;
  if (record.type === "answer" && typeof record.text === "string") {
    return { type: "answer", text: record.text };
  }
  if (
    record.type === "run_console"
    && typeof record.explanation === "string"
    && Array.isArray(record.commands)
    && record.commands.every((command) => typeof command === "string" && command.trim().startsWith("/"))
  ) {
    return {
      type: "run_console",
      explanation: record.explanation,
      commands: record.commands.map((command) => command.trim()).filter(Boolean),
    };
  }
  throw new Error("AI response did not match the expected plan schema.");
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  throw new Error("AI response did not contain JSON.");
}

async function parseResponseJson(response: Response): Promise<any> {
  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    const message = json?.error?.message || json?.error || text || `AI request failed with HTTP ${response.status}.`;
    throw new Error(typeof message === "string" ? message : `AI request failed with HTTP ${response.status}.`);
  }
  return json;
}

function buildJsonHeaders(extra: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  Object.keys(headers).forEach((key) => {
    if (!headers[key]) {
      delete headers[key];
    }
  });
  return headers;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
