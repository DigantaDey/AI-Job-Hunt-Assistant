# Final Product Plan — implementation mapping

This is the product plan you shared, with an **implementation status** column
for how it maps to the code built in this repository.

## 1. Product vision
Local-first Job Application Copilot: discovers, filters/scores, prepares the
strongest application package, fills forms, learns repeated answers, logs every
action, and gives the user control over submissions. ✅ Implemented.

## 2. Positioning — not a mass auto-applier; supervised with autonomy modes

| Mode | Behavior | Status |
| --- | --- | --- |
| Assist | Finds/analyzes/prepares; user submits | ✅ in `autonomyMode` |
| Smart Apply | Fills known fields + saved answers; user confirms | ✅ **default** |
| Supervised Auto | Submits when confidence high; pauses for risky steps | 🚧 surfaced; worker next |
| Continuous | Runs discovery/queue continuously | 🚧 next (scheduler) |

## 3. Core goals — ✅ implemented (see ACCEPTANCE_CRITERIA.md)

## 4. Non-negotiable boundaries — ✅ enforced in code
- No CAPTCHA/bot bypass, no login/paywall/rate-limit circumvention, no hidden
  automation, no invented resume claims, no auto-answering sensitive
  questions, no plaintext secrets.

## 5. In scope — ✅ (see Features in README)

## 6. Out of scope for MVP — ✅ not built (mobile, cloud multi-user, CAPTCHA,
bot-evasion, email verification, scheduling, recruiter messaging, paid scraping).

## 7. Primary user flow — ✅ implemented (`docs/ARCHITECTURE.md` §3).

## 8. Search & matching — ✅ all criteria fields + dual freshness timestamps.

## 9. Job scoring — ✅ weights implemented in `lib/engine/scoring.ts`.

## 10. Application queue — ✅ full status enum + board; worker/rate-limiter 🚧.

## 11. Answer memory — ✅ categories + reuse policies + sensitive handling.

## 12. CV strategy — ✅ master/tailored library, similarity reuse, truthfulness
guardrail, DOCX export.

## 13. Credential strategy — ✅ encrypted vault + export; creation is manual in
MVP (never silent).

## 14. AI provider strategy — ✅ mock/openai/openrouter/ollama/custom + token
accounting; rules-vs-AI split honored.

## 15. Analytics — ✅ counts, trends, distributions, CV usage, token cost.

## 16. MVP recommendation — ✅ core app, provider abstraction, token tracking,
answer memory, analytics, CV library + DOCX. Chrome extension & Naukri adapter 🚧.
