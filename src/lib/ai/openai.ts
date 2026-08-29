// OpenAI / OpenAI-compatible provider (also used for OpenRouter, Ollama, custom
// endpoints via baseURL). Uses the official `openai` SDK which supports
// arbitrary baseURLs and chat-completions compatibility.

import OpenAI from "openai";
import type { AIProvider, ChatMessage, CompletionOptions, CompletionResult } from "./types";

export class OpenAIClient implements AIProvider {
  id: string;
  model: string;
  private client: OpenAI | null = null;
  available = false;

  constructor(id: string, apiKey: string, model: string, baseUrl?: string) {
    this.id = id;
    this.model = model;
    if (apiKey) {
      try {
        this.client = new OpenAI({
          apiKey,
          baseURL: baseUrl || undefined,
        });
        this.available = true;
      } catch {
        this.client = null;
        this.available = false;
      }
    }
  }

  async complete(messages: ChatMessage[], opts: CompletionOptions): Promise<CompletionResult> {
    if (!this.client) throw new Error(`${this.id} provider not configured (no API key).`);

    const resp = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1200,
      response_format: opts.json ? { type: "json_object" } : undefined,
    });

    const text = resp.choices[0]?.message?.content || "";
    return {
      text,
      inputTokens: resp.usage?.prompt_tokens ?? estimate(text.length),
      outputTokens: resp.usage?.completion_tokens ?? estimate(text.length),
      provider: this.id,
      model: this.model,
    };
  }
}

function estimate(len: number): number {
  return Math.max(1, Math.round(len / 4));
}
