// Provider registry: picks the active provider from settings/env, routes a
// completion, and records token usage for the analytics dashboard.

import { settings, tokenUsage } from "../store/repos";
import { decrypt } from "../crypto";
import type { AIProvider, ChatMessage, CompletionOptions, CompletionResult } from "./types";
import { MockProvider } from "./mock";
import { OpenAIClient } from "./openai";

const registry = new Map<string, () => AIProvider>();
registry.set("mock", () => new MockProvider());
registry.set("openai", () => new OpenAIClient("openai", process.env.OPENAI_API_KEY || "", "gpt-4o-mini"));
registry.set("openrouter", () => new OpenAIClient("openrouter", process.env.OPENROUTER_API_KEY || "", "openai/gpt-4o-mini", "https://openrouter.ai/api/v1"));
registry.set("ollama", () => new OpenAIClient("ollama", "ollama", "llama3", "http://localhost:11434/v1"));
registry.set("custom", () => new OpenAIClient("custom", "", "custom-model", ""));

function estimateCost(inputTokens: number, outputTokens: number): number {
  // Rough USD estimate at ~$0.15 / 1M input and ~$0.60 / 1M output tokens.
  return Math.round((inputTokens * 0.00000015 + outputTokens * 0.0000006) * 10000) / 10000;
}

async function resolveProvider(): Promise<{ provider: AIProvider; label: string }> {
  const setting = await settings.get();
  const providerId = setting?.provider || process.env.AI_PROVIDER || "mock";

  // If a stored provider has an encrypted key, use it.
  if (providerId === "openai" && setting?.apiKeyEncrypted) {
    const key = decrypt(setting.apiKeyEncrypted);
    return { provider: new OpenAIClient("openai", key, setting?.model || "gpt-4o-mini"), label: "openai" };
  }

  const factory = registry.get(providerId);
  if (!factory) return { provider: new MockProvider(), label: "mock" };
  const provider = factory();
  return { provider, label: providerId };
}

/** Run a completion through the active provider and log token usage. */
export async function runCompletion(
  messages: ChatMessage[],
  opts: CompletionOptions,
): Promise<CompletionResult> {
  const { provider } = await resolveProvider();

  let result: CompletionResult;
  if (provider instanceof MockProvider) {
    const mock = provider as unknown as MockProvider;
    result = await mock.respond(messages as any, opts);
  } else {
    result = await provider.complete(messages, opts);
  }

  try {
    await tokenUsage.create({
      provider: result.provider || "mock",
      model: result.model || "mock",
      task: opts.task,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: estimateCost(result.inputTokens, result.outputTokens),
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Non-fatal: analytics logging must never break a completion.
  }

  return result;
}

/** Which provider is currently active (for UI badges). */
export async function activeProvider(): Promise<{ id: string; model: string }> {
  const setting = await settings.get();
  const id = setting?.provider || process.env.AI_PROVIDER || "mock";
  return { id, model: setting?.model || "mock" };
}
