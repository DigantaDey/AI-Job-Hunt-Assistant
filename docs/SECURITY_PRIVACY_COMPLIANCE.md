# Security, Privacy & Compliance

## Principles

The product is **local-first and supervised**. It is not a blind mass-apply
tool. It respects the non-negotiable boundaries from FINAL_PLAN §4:

- ❌ No CAPTCHA / anti-bot bypass
- ❌ No circumventing login restrictions, paywalls, rate limits, or portal protections
- ❌ No hiding automation from the user
- ❌ No inventing resume claims, skills, degrees, employers, titles, dates, metrics, or legal declarations
- ❌ No auto-answering sensitive legal/demographic questions
- ❌ No plaintext credentials or API keys

## Data residency

- All data persists in `data/jobhunt.json` on the local machine.
- `data/` is git-ignored — personal data is never committed.
- Single-user, no cloud backend, no accounts.
- **Export**: `GET /api/export` returns the full dataset as JSON (credentials
  decrypted for your own backup).

## Secrets at rest

- **Credential vault** (`Credential.username/password`) is encrypted with
  **AES-256-GCM**.
- **Stored API keys** (`Setting.apiKeyEncrypted`) are encrypted the same way.
- Key is derived via SHA-256 from `VAULT_KEY` (`.env`). Generate a strong one
  with `openssl rand -hex 32` — see `.env.example`.
- The browser API surface never returns raw/decrypted keys or passwords
  (they are masked in the UI and in `/api/credentials`).

## Guardrails in code

1. **CV truthfulness** (`sanitizeAgainstMaster` in `lib/ai/cvEngine.ts`):
   any generated experience, education, project, skill, or certification that
   cannot be sourced from the master CV is stripped. The CV engine never
   invents facts.
2. **Sensitive answers** (`lib/ai/answerSuggester.ts`): legal/demographic/
   disability/background questions are classified `SENSITIVE`, always require
   user confirmation, and are never auto-filled or auto-answered.
3. **Credential creation** is never silent — MVP keeps it manual in the vault.
4. **Rate limiting / daily caps** are enforced via `maxApplicationsPerDay`
   (surfaced in SearchConfig; enforcement logic in the queue worker).

## Compliance notes

- Does not store user tracking cookies; no analytics beacons.
- For EU/India personal-data handling, keep `VAULT_KEY` private and never
  share `data/jobhunt.json`. The export is your data-rights artifact.
