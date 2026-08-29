# Portal Adapters

## Design

Portal adapters are the pluggable integration layer between job boards/ATS
pages and the core engine. The core is **adapter-agnostic**: every adapter must
normalize raw scraped/extracted data into a `RawJobInput` and pass it to
`ingestJob()` in `src/lib/engine/ingest.ts`.

```ts
interface RawJobInput {
  title: string;
  company: string;
  externalId?: string;
  source?: string;        // linkedin | naukri | indeed | manual | api
  location?: string;
  workMode?: "any" | "remote" | "hybrid" | "onsite";
  description?: string;
  domain?: string;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
  url?: string;
  postedAt?: string | null;
}
```

Because adapters run in a browser/extension context (fetching pages and filling
forms), the MVP ships **no live scrapers**. The extension will host adapters
and relay normalized payloads to the local service over its API.

## Intended adapter contract (next milestone)

```
discoverJobs()      -> RawJobInput[]          (search & parse listing)
fillApplication()   -> FormStep[]             (map fields to saved answers)
askForUnknown()     -> unknown field prompt   (via Answer Memory / AI suggestion)
submit()            -> { status, externalAppId, error }
```

## Planned adapters (FINAL_PLAN §16)

| Portal | Scope for MVP | Notes |
| --- | --- | --- |
| Naukri | quick/easy apply | first full adapter after policy + technical validation |
| LinkedIn | discovery, analysis, preparation, assisted filling | user confirmation required for submit |
| Indeed | assisted filling | follow-on |

## Autonomy & safety

- **Assist** — prepare only, user submits.
- **Smart Apply** (default) — fill known fields from Answer Memory, user confirms submit.
- **Supervised Auto** — submit only when confidence is high; pause for unknown/sensitive/risky steps.
- **Continuous** — background discovery + queue processing where permitted.

No adapter ever bypasses CAPTCHA, rate limits, or portal protections, and
automation is never hidden from the user.
