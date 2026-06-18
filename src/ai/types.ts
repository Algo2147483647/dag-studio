export type AiProvider = "openai-compatible" | "deepseek" | "anthropic" | "gemini" | "ollama";

export type AiExecutionMode = "ask" | "auto-readonly" | "auto-edit";

export interface AiSettings {
  enabled: boolean;
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  executionMode: AiExecutionMode;
}

export type AiPlan =
  | { type: "answer"; text: string }
  | { type: "run_console"; explanation: string; commands: string[] };

export interface AiGraphContext {
  summary: string;
  commandReference: string;
}

export interface AiRequest {
  settings: AiSettings;
  context: AiGraphContext;
  message: string;
}
