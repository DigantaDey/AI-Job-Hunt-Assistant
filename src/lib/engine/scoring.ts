// Deterministic job scoring engine (FINAL_PLAN §9).
// Uses code/rules (NOT AI) so it is fast, auditable, and free. Weights:
//   required skills 25% | title 20% | experience 15% | location 15%
//   domain 10% | salary 10% | freshness 5%

import type { Job, SearchConfig } from "../store/types";

export interface ScoreResult {
  total: number; // 0-100
  breakdown: Record<string, number>;
  matchedRequired: string[];
  missingRequired: string[];
  reasons: string[];
  passed: boolean;
  skipReason?: string;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function tokenOverlap(a: string[], b: string[]): number {
  if (b.length === 0) return 0;
  let hits = 0;
  for (const item of b) {
    if (a.some((t) => norm(t) === norm(item))) hits++;
  }
  return hits / b.length;
}

export function computeMatchScore(job: Job, cfg: SearchConfig): ScoreResult {
  const reasons: string[] = [];
  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];

  // --- Required skills (25%) ---
  const candSkills = cfg.mustHaveSkills;
  let skillScore = 0;
  for (const skill of job.requiredSkills) {
    if (candSkills.some((c) => norm(c) === norm(skill))) {
      matchedRequired.push(skill);
    } else if (cfg.preferredSkills.some((p) => norm(p) === norm(skill))) {
      matchedRequired.push(skill);
    } else {
      missingRequired.push(skill);
    }
  }
  const requiredMatched = job.requiredSkills.length === 0
    ? 1
    : matchedRequired.length / job.requiredSkills.length;
  skillScore = Math.round(requiredMatched * 25);
  reasons.push(
    job.requiredSkills.length
      ? `${matchedRequired.length}/${job.requiredSkills.length} required skills matched`
      : "No required skills listed",
  );

  // --- Title match (20%) ---
  const titleScore = Math.round(tokenOverlap(cfg.targetTitles, [job.title]) * 20);
  reasons.push(`Title match: ${titleScore}/20`);

  // --- Experience match (15%) ---
  let expScore = 15;
  const yrs = cfg.experienceMin;
  // Heuristic: if we cannot infer seniority from the job, award neutral score.
  if (job.title.toLowerCase().includes("senior") && yrs < 4) expScore = 8;
  else if (job.title.toLowerCase().includes("junior") && yrs > 3) expScore = 8;
  reasons.push(`Experience fit: ${expScore}/15`);

  // --- Location / work mode (15%) ---
  let locScore = 15;
  const workModeOk = cfg.workMode === "any" || cfg.workMode === job.workMode;
  if (!workModeOk) locScore -= 7;
  const locMatch = cfg.locations.some((l) => norm(job.location).includes(norm(l).split(",")[0]));
  if (!locMatch && cfg.locations.length) locScore -= 5;
  reasons.push(`Location/work-mode: ${locScore}/15`);

  // --- Domain match (10%) ---
  const domains = cfg.mustHaveSkills.join(" ").toLowerCase();
  let domainScore = 7;
  if (job.domain && domains && job.description.toLowerCase().includes(job.domain.toLowerCase().slice(0, 6))) {
    domainScore = 9;
  }
  reasons.push(`Domain: ${domainScore}/10`);

  // --- Salary fit (10%) ---
  let salaryScore = 10;
  if (cfg.salaryMax > 0 && job.salaryMax > 0 && job.salaryMax < cfg.salaryMin) {
    salaryScore = 3;
  }
  reasons.push(`Salary fit: ${salaryScore}/10`);

  // --- Freshness (5%) ---
  let freshnessScore = 5;
  const posted = job.postedAt ? new Date(job.postedAt).getTime() : new Date(job.discoveredAt).getTime();
  const ageDays = (Date.now() - posted) / 86400000;
  if (ageDays > cfg.freshnessDays) freshnessScore = 2;
  else if (ageDays > 7) freshnessScore = 4;
  reasons.push(`Freshness: ${freshnessScore}/5`);

  const breakdown = {
    requiredSkills: skillScore,
    title: titleScore,
    experience: expScore,
    location: locScore,
    domain: domainScore,
    salary: salaryScore,
    freshness: freshnessScore,
  };
  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);

  const passed = total >= cfg.minMatchScore && missingRequired.length === 0;
  let skipReason: string | undefined;
  if (!passed) {
    if (missingRequired.length) skipReason = `Missing required skill(s): ${missingRequired.join(", ")}`;
    else skipReason = `Score ${total} below minimum ${cfg.minMatchScore}`;
  }

  return { total, breakdown, matchedRequired, missingRequired, reasons, passed, skipReason };
}

/** Helper to detect jobs older than the freshness window using both postedAt and discoveredAt. */
export function isFresh(job: Job, cfg: SearchConfig): boolean {
  const reference = job.postedAt ?? job.discoveredAt;
  const age = (Date.now() - new Date(reference).getTime()) / 86400000;
  return age <= cfg.freshnessDays;
}
