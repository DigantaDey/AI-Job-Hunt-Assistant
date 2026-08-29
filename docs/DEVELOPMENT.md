# Development Guide

## Prerequisites

- Node.js 18.18+ (tested on 22) and npm 9+
- No native compilation required (pure-JS stack).

## Setup

```bash
npm install
cp .env.example .env   # adjust VAULT_KEY for real secret encryption
npm run seed           # optional: load realistic demo data
npm run dev            # http://localhost:3000
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server (binds 0.0.0.0 for previews) |
| `npm run build` | Production build + type checking |
| `npm run start` | Run the production build |
| `npm run seed` | Reset & seed demo data (`data/jobhunt.json`) |
| `npm run lint` | Next lint |

## Environment variables (`.env`)

| Var | Purpose |
| --- | --- |
| `JOBHUNT_DATA_FILE` | Override the JSON data file path (default `data/jobhunt.json`) |
| `AI_PROVIDER` | Default provider: `mock\|openai\|openrouter\|ollama\|custom` |
| `AI_MODEL` | Default model name |
| `OPENAI_API_KEY` / `OPENROUTER_API_KEY` | Real provider keys (or set in Settings) |
| `VAULT_KEY` | 64-char hex key for AES-256-GCM secret encryption (`openssl rand -hex 32`) |

## Project layout

```
src/lib/store     data layer (types, JSON db, repos, seed)
src/lib/engine    deterministic logic (scoring, ingest, analytics)
src/lib/ai        AI provider layer (mock/openai, router, cvEngine, writers, answerSuggester)
src/lib/export    docx generation
src/lib/crypto    AES-256-GCM encryption
src/app           pages + API routes (App Router)
src/components    UI components
docs/             architecture & spec docs
```

## Conventions

- **Deterministic logic in `lib/engine`, AI in `lib/ai`.** Scoring, filters and
  truthfulness validation must stay rule-based and testable.
- **New AI providers** implement `AIProvider` in `lib/ai/types.ts` and register
  in `lib/ai/router.ts`.
- **New portal adapters** normalize to `RawJobInput` (see
  `lib/engine/ingest.ts`) and call `ingestJob()`.
- **Secrets** must go through `lib/crypto.ts` (encrypt/decrypt). Never return
  raw secrets to the browser.
- **Data dir is git-ignored.** Don't commit `data/`.

## Testing notes

- API routes and pages are verified via the dev server (see the build +
  endpoint checks performed during the initial build).
- The mock provider is the default so all AI features are testable offline.
