// Job discovery → scoring → queue pipeline (FINAL_PLAN §8-10).
import { candidates, searchConfigs, jobs, applications } from "../store/repos";
import { computeMatchScore, isFresh } from "./scoring";
import type { Job, Application } from "../store/types";

export interface RawJobInput {
  title: string;
  company: string;
  externalId?: string;
  source?: string;
  location?: string;
  workMode?: string;
  description?: string;
  domain?: string;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
  url?: string;
  postedAt?: string | null;
}

/** Ingest a raw job: normalize, score, and create a qualified/queued application. */
export async function ingestJob(raw: RawJobInput): Promise<{ job: Job; application: Application | null }> {
  const candidate = await candidates.first();
  if (!candidate) throw new Error("No candidate profile. Please set up your profile in Settings first.");
  const cfg = await searchConfigs.forCandidate(candidate.id);
  if (!cfg) throw new Error("No search configuration found.");

  const now = new Date().toISOString();

  // Basic normalization / de-dup by (source, externalId) or (title+company+location)
  const existing = await jobs.list();
  const dup = existing.find(
    (j) =>
      (raw.externalId && j.externalId === raw.externalId) ||
      (j.title === raw.title && j.company === raw.company && j.location === (raw.location || "")),
  );
  if (dup) {
    return { job: dup, application: null };
  }

  const job: Job = {
    id: "",
    externalId: raw.externalId || "",
    source: raw.source || "manual",
    title: raw.title,
    company: raw.company,
    location: raw.location || "",
    workMode: (raw.workMode as any) || "any",
    description: raw.description || "",
    domain: raw.domain || "",
    salaryMin: raw.salaryMin || 0,
    salaryMax: raw.salaryMax || 0,
    requiredSkills: raw.requiredSkills || [],
    preferredSkills: raw.preferredSkills || [],
    url: raw.url || "",
    postedAt: raw.postedAt || null,
    discoveredAt: now,
    matchScore: 0,
    scoreBreakdown: {},
    skipReason: "",
    status: "discovered",
    createdAt: now,
  };

  // Freshness gate
  if (!isFresh(job, cfg)) {
    job.status = "skipped";
    job.skipReason = "Outside freshness window.";
    const saved = await jobs.create(job);
    return { job: saved, application: null };
  }

  // Score
  const score = computeMatchScore(job, cfg);
  job.matchScore = score.total;
  job.scoreBreakdown = score.breakdown;

  if (!score.passed) {
    job.status = "skipped";
    job.skipReason = score.skipReason || "Below minimum match score.";
    const saved = await jobs.create(job);
    return { job: saved, application: null };
  }

  // Qualified → queue it
  job.status = "queued";
  const savedJob = await jobs.create(job);

  const app = await applications.create({
    jobId: savedJob.id,
    candidateId: candidate.id,
    cvId: null,
    status: "queued",
    autonomyMode: cfg.autonomyMode,
    confidence: 0,
    error: "",
    externalAppId: "",
    submittedAt: null,
    createdAt: now,
  });

  return { job: savedJob, application: app };
}
