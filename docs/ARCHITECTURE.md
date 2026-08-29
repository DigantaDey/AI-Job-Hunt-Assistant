# Architecture

This document describes the implemented system architecture. It mirrors the
intent of the `ARCHITECTURE.md` spec; reconcile against your full spec when it
becomes available.

## 1. Design principles

- **Local-first** — all persistent state lives on the machine in a single JSON
  file (`data/jobhunt.json`). No database server, no accounts, no cloud lock-in.
- **Zero native binaries** — pure-JS stack (chosen because the sandbox blocked
  Prisma's native query-engine download). This also keeps deploys trivial.
- **Rules for deterministic, AI for fuzzy** — scoring, filtering, queue
  status, token accounting and truthfulness validation are code; JD parsing,
  semantic matching, answer suggestion, CV tailoring and prose are AI.
- **Supervised by default** — `smart_apply` is the default autonomy mode. The
  system prepares but always gives the user control before anything sensitive
  is submitted.

## 2. High-level modules

```
┌────────────────────────── Next.js App Router ──────────────────────────┐
│  Pages (client):                                                        │
│    Dashboard · Applications · Jobs · CV Library · Answer Memory ·       │
│    Credentials · Settings                                               │
│  API routes (server):                                                   │
│    /api/dashboard  /api/analytics  /api/export                          │
│    /api/jobs  /api/applications  /api/cvs(/[id]/docx)  /api/answers     │
│    /api/credentials  /api/profile  /api/search-config  /api/settings    │
│    /api/ai/cover-letter  /api/ai/interview  /api/ai/answer              │
└───────────────┬──────────────────────────────────────────┬──────────────┘
                │                                          │
┌───────────────▼───────────────┐        ┌─────────────────▼───────────────┐
│  Engine (lib/engine)          │        │  AI layer (lib/ai)              │
│  scoring.ts  — deterministic  │        │  router.ts — provider selection │
│              match scoring    │        │  mock.ts / openai.ts — providers│
│  ingest.ts   — discovery→queue│        │  cvEngine.ts — tailor + validate│
│  analytics.ts— dashboard agg  │        │  writers.ts  — cover/interview  │
│                               │        │  answerSuggester.ts — memory    │
└───────────────┬───────────────┘        └─────────────────┬───────────────┘
                │                                          │
┌───────────────▼──────────────────────────────────────────▼───────────────┐
│  Store (lib/store):  types.ts · db.ts (JSON store) · repos.ts · seed.ts  │
│  Crypto (lib/crypto.ts): AES-256-GCM for secrets                         │
│  Export (lib/export/docx.ts): pure-JS .docx generation                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3. Primary data flow (matches FINAL_PLAN §7)

```
Onboarding (profile + search criteria)
  → Job ingested (manual or adapter)
  → Normalize
  → Freshness gate (postedAt + discoveredAt)
  → Deterministic scoring (computeMatchScore)
  → Pass threshold? → create Application (status=queued)   else status=skipped + reason
  → Queue worker advances: queued → preparing_cv → ready → applying → submitted/failed
  → Analytics updated (counts, trend, tokens, score distribution)
```

## 4. Concurrency & persistence

The store keeps an in-memory cache and serializes writes through a promise
queue. Reads hit the cache. This is sufficient for a single-user local app and
keeps behavior deterministic in the dev server.

## 5. Data flow for CV tailoring

```
Job JD
  → parseJD (AI + rule merge)
  → cvSimilarity against library (deterministic)
  → reuse best if similarity >= 70
  → else tailor from master via AI
  → sanitizeAgainstMaster (truthfulness guardrail)
  → save as new CV / bump usage on reused
  → DOCX export on demand
```

## 6. Extensibility points

- **Portal adapters** — `lib/adapters/` (see `PORTAL_ADAPTERS.md`) will feed
  normalized `RawJobInput` into `ingestJob`. The ingest pipeline is already
  adapter-agnostic.
- **AI providers** — implement the `AIProvider` interface in `lib/ai/types.ts`
  and register it in `router.ts`.
