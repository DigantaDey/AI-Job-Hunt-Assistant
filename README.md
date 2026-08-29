# AI Job Hunt Assistant

A **local-first, supervised job-application copilot** built as a full-stack Next.js
web app. It discovers and scores jobs, queues qualified applications, tailors
CVs (with truthfulness guardrails), generates cover letters, preps you for
interviews, remembers your answers, and tracks every action — while keeping
your sensitive data on your own machine.

Built from the product brief in `FINAL_PLAN.md`. The `docs/` folder contains
architectural documents that mirror your spec file names so you can reconcile
this implementation against your full specs.

> **Data is local.** Everything is stored in a single JSON file
> (`data/jobhunt.json`), is fully exportable, and runs with **zero native
> binaries** — no database server, no compilation of native modules.

---

## ✨ Features

| Area | What it does |
| --- | --- |
| **Dashboard** | Live pipeline overview, application activity trend, match-score distribution, token usage, recent applications |
| **Applications** | Supervised kanban queue with all statuses from your plan (`discovered → qualified → queued → preparing_cv → ready → applying → waiting_for_user → submitted / failed / skipped / retry_scheduled`) |
| **Jobs** | Add/discover jobs; deterministic scoring (skills 25% · title 20% · experience 15% · location 15% · domain 10% · salary 10% · freshness 5%); auto-queue high matches, skip low with a reason |
| **AI Prep** | Per-job CV tailoring, cover letters, and interview question generation — with a truthfulness guardrail so the AI never invents resume facts |
| **CV Library** | Master CV + AI-tailored versions; reuse best match by similarity; download as `.docx` |
| **Answer Memory** | Reuse saved answers by category (`SAFE`, `USER_APPROVED`, `AI_SUGGESTED`, `SENSITIVE`); sensitive questions always require your confirmation |
| **Credential Vault** | Encrypted (AES-256-GCM) storage for account-creation credentials |
| **Chrome extension** | Reads jobs on LinkedIn/Naukri/Indeed (and any site) and sends them to the local app — supervised & read-only |
| **Continuous mode** | Background queue worker (instrumentation) with pause/resume, daily application caps, retries, and CV tailoring in-flow |
| **Settings** | Candidate profile, search criteria (skills, titles, locations, salary, freshness, autonomy mode), AI provider config, scheduler controls, full JSON export |

**Autonomy modes** (per your plan): `assist` · `smart_apply` (default) ·
`supervised_auto` · `continuous`.

---

## 🧠 AI provider strategy

The app ships with a built-in **mock provider** so it works with **zero API
keys**. The provider layer is pluggable:

- `mock` — deterministic/template AI (default, no setup)
- `openai` — GPT models
- `openrouter` — any model via OpenRouter
- `ollama` — local models (OpenAI-compatible endpoint)
- `custom` — any OpenAI-compatible endpoint (set a `baseUrl`)

**Rules vs. AI** follows your plan:
- **Code/rules** for: scoring, filters (location/salary/experience/freshness),
  queue status, token accounting, CV truthfulness validation.
- **AI** for: JD parsing, semantic matching, question-intent normalization,
  answer suggestion, CV tailoring, cover-letter writing, failure classification.

Every AI call is recorded in **token accounting** (provider, model, task,
input/output tokens, estimated cost) visible in the dashboard and analytics.

---

## 🚀 Getting started

Prerequisites: Node.js 18.18+ (tested on 22).

```bash
npm install
npm run seed          # loads realistic demo data (optional but recommended)
npm run dev           # → http://localhost:3000
```

For a production build:

```bash
npm run build && npm run start
```

### Configure a real AI provider

1. Open **Settings → AI provider**.
2. Choose a provider, enter your API key and model, save.
3. The key is encrypted at rest (AES-256-GCM) and never returned to the browser.

Leave everything on `mock` to explore the UI without any keys.

### Chrome extension (optional but recommended)

Reads job posts and sends them to the app for scoring & queueing.

```bash
# app running at http://localhost:3000 (npm run dev)
# 1. chrome://extensions → enable Developer mode
# 2. Load unpacked → select the extension/ folder
```

Open a job on LinkedIn/Naukri/Indeed, then click the extension icon →
**Send to Job Hunt**. See `extension/README.md` for details. It is
**read-only & supervised** — it never fills or submits forms.

### Continuous-mode scheduler

The app starts a background worker (via Next instrumentation) that advances
the application queue on an interval, tailoring CVs and enforcing your daily
cap. Control it in **Settings → Continuous automation** (toggle, interval,
"Run worker now"), and see the live status on the dashboard. Autonomy mode is
set in **Settings → Search criteria**.

---

## 🗂 Project structure

```
src/
  app/                     # Next.js App Router pages + API routes
    page.tsx               # Dashboard
    applications/ jobs/ cvs/ answers/ credentials/ settings/
    api/
      dashboard  analytics  export
      jobs  applications  cvs([id]/docx)  answers  credentials  profile  search-config  settings
      ai/cover-letter  ai/interview  ai/answer
  components/              # UI: AppShell, AddJobModal, JobActions, ui primitives
  lib/
    store/                 # types.ts, db.ts (JSON store), repos.ts, seed.ts
    ai/                    # provider abstraction (mock, openai), router, cvEngine, writers, answerSuggester
    engine/                # scoring.ts (deterministic), ingest.ts, analytics.ts
    export/docx.ts         # .docx generation (pure-JS zip)
    crypto.ts              # AES-256-GCM encryption for secrets
extension/                 # Chrome extension (MV3) + portal adapters
  content/portal.js        # LinkedIn / Naukri / Indeed extractors
  content/generic.js       # generic JSON-LD/meta extractor
  background.js popup/ icons/
docs/                      # architecture & spec-mapping docs
```

---

## 🔒 Security & privacy

- Local-first: no cloud database, no accounts, data stays on device.
- Secrets (credential vault, stored API keys) are encrypted with AES-256-GCM
  using a key derived from `VAULT_KEY` (see `.env.example`).
- Passwords are masked in the UI; full JSON export includes decrypted
  credentials for your own backup only.
- The product respects your non-negotiable boundaries: **no CAPTCHA solving,
  no bot-evasion, no hidden automation, no invented resume claims, no
  plaintext secrets, sensitive questions always require confirmation.**
- `data/` is git-ignored so your personal data is never committed.

See `docs/SECURITY_PRIVACY_COMPLIANCE.md`.

---

## 📄 Documentation

| Doc | Contents |
| --- | --- |
| `docs/ARCHITECTURE.md` | System design, data flow, module map |
| `docs/DATA_MODEL.md` | Entities & relationships |
| `docs/ROADMAP.md` | What's shipped vs. next (Chrome extension, portal adapters, continuous mode) |
| `docs/SECURITY_PRIVACY_COMPLIANCE.md` | Encryption, boundaries, compliance notes |
| `docs/PORTAL_ADAPTERS.md` | Portal-adapter design & planned first adapters |
| `docs/CV_ENGINE.md` | CV tailoring + truthfulness guardrail |
| `docs/AI_AND_PROMPTS.md` | Provider strategy, prompts, token accounting |
| `docs/ACCEPTANCE_CRITERIA.md` | Acceptance criteria mapped to implementation |
| `docs/DEVELOPMENT.md` | Local dev, scripts, config |
