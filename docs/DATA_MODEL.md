# Data Model

Mirrors `DATA_MODEL.md`. Storage is a single JSON file keyed by collection;
every row carries `id`, `createdAt`, `updatedAt`. All arrays are stored inline
(no joins needed) except Applications→Job, which is resolved by `jobId` at read
time.

## Entities

### Candidate (one per install)
- `fullName`, `email`, `phone`, `location`, `currentRole`, `summary`
- `skills: string[]`
- `experienceYears`, `desiredRole`, `noticePeriodDays`

### SearchConfig (1:1 with Candidate)
- `mustHaveSkills`, `preferredSkills`, `targetTitles`, `excludedTitles`, `locations`, `companiesInclude`, `companiesExclude`
- `workMode` (`any|remote|hybrid|onsite`)
- `salaryMin`, `salaryMax`, `experienceMin`, `experienceMax`, `freshnessDays`, `minMatchScore`, `maxApplicationsPerDay`
- `autonomyMode` (`assist|smart_apply|supervised_auto|continuous`)

### Job
- Identity: `externalId`, `source` (`linkedin|naukri|indeed|manual|api`)
- Attributes: `title`, `company`, `location`, `workMode`, `domain`,
  `description`, `salaryMin`, `salaryMax`, `requiredSkills`, `preferredSkills`, `url`
- Timing: `postedAt` (claimed), `discoveredAt` (first seen) — both tracked for
  freshness (FINAL_PLAN §8)
- Scoring: `matchScore`, `scoreBreakdown` (JSON per dimension), `skipReason`
- Lifecycle: `status` (`discovered|qualified|queued|preparing_cv|ready|applying|waiting_for_user|submitted|skipped|failed|retry_scheduled`)

### Application (the queue item)
- `jobId` → Job, `candidateId` → Candidate, `cvId` → CV
- `status` (same enum as Job), `autonomyMode`, `confidence`, `error`,
  `externalAppId`, `submittedAt`

### CV
- `type` (`MASTER|AI_GENERATED|HUMAN_UPLOADED`), `isMaster`, `name`
- `content: CVContent` → `{ summary, skills[], experience[{title,company,startDate,endDate,bullets[]}], education[{degree,institution,year}], projects[{name,description,tech[]}], certifications[] }`
- `tags[]`, `matchScore`, `usageCount`, `version`

### AnswerMemory
- `question`, `normalizedIntent`, `category` (`SAFE|USER_APPROVED|AI_SUGGESTED|SENSITIVE`)
- `answer`, `source` (`user|ai|manual`), `confidence`, `reusePolicy`
  (`auto_fill|ask_once_then_reuse|ask|always_confirm`)
- `lastConfirmed`, `usageCount`

### Credential
- `domain`, `username`, `password` (both encrypted at rest), `notes`,
  `linkedApplicationId`

### TokenUsage
- `provider`, `model`, `task`, `inputTokens`, `outputTokens`, `estimatedCost`

### Setting (singleton `id="app"`)
- `provider`, `model`, `apiKeyEncrypted`, `baseUrl`

## Scoring dimensions (FINAL_PLAN §9)
`requiredSkills 25% · title 20% · experience 15% · location 15% · domain 10% · salary 10% · freshness 5%`

## Answer categories & default actions (FINAL_PLAN §11)
| Category | Default reuse | Notes |
| --- | --- | --- |
| SAFE | auto_fill | name/email/years |
| USER_APPROVED | ask_once_then_reuse | salary/notice/relocation/work mode |
| AI_SUGGESTED | ask | why-this-company etc. |
| SENSITIVE | always_confirm | legal/demographic/disability — never auto-answered |
