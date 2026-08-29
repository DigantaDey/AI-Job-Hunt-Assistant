# CV Engine

Implements FINAL_PLAN §12. Source: `src/lib/ai/cvEngine.ts`.

## CV library

The system maintains:
- **Master CV** (`type=MASTER`, `isMaster=true`) — the canonical, verified profile.
- **AI-tailored versions** (`type=AI_GENERATED`) — per-job, from the master.
- **Human-polished uploads** (`type=HUMAN_UPLOADED`) — future/reserved.

Each CV has `tags[]`, a `matchScore`, and `usageCount` for reuse analytics.

## Default workflow

```
Job JD
  → parseJD (AI parse + rule-based skill extraction, merged)
  → cvSimilarity(job, existingCVs)  [deterministic, 0-100]
  → reuse best library CV if similarity >= 70   → bump usageCount
  → else tailor from master (AI, temperature 0.2)
  → sanitizeAgainstMaster (truthfulness guardrail)
  → save new CV / update reused CV
  → DOCX export on demand
```

## Truthfulness guardrail

`sanitizeAgainstMaster(gen, master)` drops anything the model produced that
cannot be sourced verbatim from the master CV:

- **Skills**: only those present in the master skill set are kept.
- **Experience**: only entries whose `(title, company)` match a master entry.
- **Education / projects / certifications**: only entries matching a master entry.

The AI may **reorder and re-emphasize**; it may **never invent**. The prompt
explicitly forbids adding skills, metrics, employers, dates, or legal
declarations, and a deterministic fallback (`deterministicTailor`) is used if
the provider is unavailable or output is malformed.

## Deterministic similarity

`cvSimilarity` = (% of job's `requiredSkills ∪ preferredSkills` present in the
CV's skills) mapped to 0-100. This is used instead of fuzzy matching so the
reuse decision is fast, auditable, and free.

## Export

`toDocxBuffer` (in `src/lib/export/docx.ts`) produces a standards-compliant
`.docx` (Office Open XML) using a pure-JS zip writer — no native binaries.
Exposed at `GET /api/cvs/[id]/docx`.
