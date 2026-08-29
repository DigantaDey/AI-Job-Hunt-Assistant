# Acceptance Criteria

Status: ✅ implemented in this build · 🚧 planned (next milestone)

## Core product goals

| # | Criterion | Status |
| --- | --- | --- |
| G1 | Manage job-application volume via a pipeline/queue | ✅ Applications board + statuses |
| G2 | Improve application quality via JD matching & CV selection | ✅ Deterministic scoring + CV similarity reuse |
| G3 | Reduce repeated manual answers via local answer memory | ✅ Answer Memory + resolution |
| G4 | Support multiple AI providers without vendor lock-in | ✅ mock/openai/openrouter/ollama/custom |
| G5 | Track every application, failure, retry, credential, and token | ✅ analytics + TokenUsage + Credential vault |
| G6 | Keep sensitive data local and exportable | ✅ local JSON store + `/api/export` |
| G7 | Allow continuous operation with pause/resume & clear user control | 🚧 continuous mode surfaced in config; worker next |

## Search & matching (FINAL_PLAN §8)

| # | Criterion | Status |
| --- | --- | --- |
| S1 | Search config derived from resume but user-editable | ✅ Settings → search criteria |
| S2 | Must-have / preferred skills, titles, excludes, locations, work mode, salary, experience, freshness, companies, min score, daily cap | ✅ all fields present |
| S3 | Track `job_posted_at` and `job_discovered_at` for freshness | ✅ Job model |
| S4 | Jobs below threshold skipped with a reason | ✅ `skipReason` + `isFresh` gate |

## Job scoring (FINAL_PLAN §9)

| # | Criterion | Status |
| --- | --- | --- |
| P1 | Score = required skills 25 · title 20 · experience 15 · location 15 · domain 10 · salary 10 · freshness 5 | ✅ `computeMatchScore` |
| P2 | Jobs below configured threshold skipped with reason | ✅ |

## Application queue (FINAL_PLAN §10)

| # | Criterion | Status |
| --- | --- | --- |
| Q1 | Statuses discovered→qualified→queued→preparing_cv→ready→applying→waiting_for_user→submitted/skipped/failed/retry_scheduled | ✅ full enum + board |
| Q2 | Pause/resume, prioritization, rate limiting, retries, human checkpoints, traceability | ✅ statuses + error + confidence; 🚧 scheduler |

## Answer memory (FINAL_PLAN §11)

| # | Criterion | Status |
| --- | --- | --- |
| A1 | Store normalized answers locally and reuse by intent | ✅ |
| A2 | Category → default action (SAFE auto / USER_APPROVED ask-once / AI_SUGGESTED ask / SENSITIVE confirm) | ✅ |
| A3 | Sensitive questions never auto-answered | ✅ |

## CV engine (FINAL_PLAN §12)

| # | Criterion | Status |
| --- | --- | --- |
| C1 | Maintain master, AI-generated, human-uploaded versions with tags/scores/usage | ✅ MASTER + AI_GENERATED; HUMAN_UPLOADED reserved |
| C2 | JD parse → match library → reuse/generate → validate truthfulness → approve → use | ✅ (approval = confirm before submit) |
| C3 | AI never invents facts (truthfulness guardrail) | ✅ `sanitizeAgainstMaster` |
| C4 | Downloadable DOCX output | ✅ `/api/cvs/[id]/docx` |

## Credentials (FINAL_PLAN §13)

| # | Criterion | Status |
| --- | --- | --- |
| CR1 | Store credentials in encrypted local vault, link to application, export | ✅ AES-256-GCM + vault + export |
| CR2 | Never silent creation | ✅ MVP is manual add |

## Analytics (FINAL_PLAN §15)

| # | Criterion | Status |
| --- | --- | --- |
| AN1 | Applied/failed/skipped/waiting counts, portal & company-wise, daily trend, score distribution, CV usage, token/cost | ✅ dashboard + `/api/analytics` |

## Out of scope (FINAL_PLAN §6) — explicitly NOT built

Mobile app, cloud multi-user backend, CAPTCHA solving, bot-evasion, email
inbox verification, automated scheduling, recruiter messaging campaigns, paid
scraping at scale, guaranteed ATS coverage.
