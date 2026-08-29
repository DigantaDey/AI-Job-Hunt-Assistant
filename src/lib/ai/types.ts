import type { AITask } from "../store/types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  task: AITask;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}

export interface CompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  provider: string;
  model: string;
}

export interface AIProvider {
  id: string;
  model: string;
  available: boolean;
  complete(messages: ChatMessage[], opts: CompletionOptions): Promise<CompletionResult>;
}
