# Roadmap

Status legend: ✅ shipped in this build · 🚧 next · ⬜ later

## MVP (shipped)

- ✅ Full-stack Next.js app (App Router, TypeScript, Tailwind)
- ✅ Local-first JSON data store (zero native deps)
- ✅ Candidate profile + user-editable search criteria
- ✅ Deterministic job scoring + freshness gate
- ✅ Application queue with full status lifecycle + kanban board
- ✅ Answer Memory with category-based reuse + sensitive handling
- ✅ CV Library: master + tailored, similarity-based reuse, DOCX export
- ✅ Cover letters + interview prep (AI + mock)
- ✅ Encrypted credential vault
- ✅ AI provider abstraction (mock/openai/openrouter/ollama/custom) + token accounting
- ✅ Analytics dashboard + full JSON export

## Next milestone (largely shipped)

- ✅ **Chrome extension** (`extension/`) that reads job pages on LinkedIn /
  Naukri / Indeed and relays normalized `RawJobInput` to the local service
- ✅ **Generic extractor** for arbitrary sites (JSON-LD / meta), injectable on demand
- ✅ **Continuous-mode background scheduler** (instrumentation) with pause/resume,
  `maxApplicationsPerDay` rate limiting, retry scheduling, and CV tailoring in-flow
- ✅ **Server-side adapter contract** (`src/lib/adapters`) + `/api/ingest`
- 🚧 **Form-inspection engine** (map form fields → answer memory) and assisted
  form-filling in the extension (currently the extension reads; filling is next)
- 🚧 **HUMAN_UPLOADED CV** import + parsing (PDF/DOCX upload)

## Later

- ⬜ Account-creation assistance with guarded, user-approved credential creation
- ⬜ Failure classification via AI with suggested fixes
- ⬜ Weekly email-style digest (local)
- ⬜ Additional adapters (Indeed)
- ⬜ Mobile companion (out of MVP per plan §6)

## Explicitly out of scope (plan §6)

Mobile app, cloud multi-user backend, CAPTCHA solving, bot-evasion, automated
email inbox verification, automated interview scheduling, recruiter messaging
campaigns, paid scraping at scale, guaranteed portal coverage.
