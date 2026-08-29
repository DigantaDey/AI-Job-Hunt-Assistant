# AI & Prompts

## Provider strategy (FINAL_PLAN §14)

Common adapter interface in `src/lib/ai/types.ts`:

```ts
interface AIProvider {
  id: string;
  model: string;
  available: boolean;
  complete(messages: ChatMessage[], opts: CompletionOptions): Promise<CompletionResult>;
}
```

Providers:
- **mock** — built-in deterministic/template AI (default, no keys).
- **openai** — GPT models via the official SDK.
- **openrouter** — any model via OpenRouter (OpenAI-compatible).
- **ollama** — local models (OpenAI-compatible endpoint).
- **custom** — any OpenAI-compatible endpoint with a `baseUrl`.

The router (`lib/ai/router.ts`) picks the active provider from settings/env,
decrypts a stored API key if present, runs the completion, and **records token
usage** for every call.

## Rules vs. AI (per plan §14)

**Code/rules** (deterministic, in `lib/engine/`):
- Required fields, location filters, salary thresholds, experience thresholds,
  freshness, queue status, token accounting, CV truthfulness validation.

**AI** (fuzzy tasks):
- JD parsing, semantic job matching, question-intent normalization, answer
  suggestion, CV tailoring, cover letters, failure classification.

## Task prompts

- **JD parse** — "extract structured data, do not invent skills not in the text." → JSON.
- **Job match** — returns per-dimension scores + missing skills. (Primarily
  deterministic; AI augmentation optional.)
- **CV tailor** — "Only use facts that exist verbatim in the master CV. Never
  invent. Reorder and re-emphasize." → JSON CV.
- **Answer suggest** — "truthful, grounded in the candidate profile; if
  sensitive return {answer:\"\", confidence:0, sensitive:true}." → JSON.
- **Cover letter** — "Only reference facts present in the CV." → prose.
- **Interview** — "Mix behavioral (STAR), technical, HR." → JSON questions.

## Token accounting (FINAL_PLAN §15)

Each completion writes a `TokenUsage` row: `{ provider, model, task,
inputTokens, outputTokens, estimatedCost }`. Estimated cost uses a rough
`$0.15/1M input + $0.60/1M output`. Aggregated on the dashboard and `/api/analytics`.

## Mock behavior

The mock provider clearly labels its output as simulated (`[MOCK ...]`), emits
task-appropriate JSON, and never pretends to be a live model. The UI shows a
provider badge so the user always knows whether output is mock or real.
