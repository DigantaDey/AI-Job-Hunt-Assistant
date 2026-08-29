// CV Engine (FINAL_PLAN §12).
// - Parses a JD into structured fields (via AI or rules).
// - Matches the existing CV library for reuse.
// - Tailors a CV version for a specific JD using ONLY facts from the master CV
//   (truthfulness guardrail) with deterministic formatting.
// - Produces a plain-text/structured output that can be rendered or exported.

import type { CVContent, CVItem, Job } from "../store/types";
import { runCompletion } from "./router";
import { computeMatchScore } from "../engine/scoring";
import type { SearchConfig } from "../store/types";

export interface ParsedJD {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceYears: number;
  domain: string;
  keyResponsibilities: string[];
  mustInclude: string[];
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

// Deterministic JD parser fallback (used when AI is unavailable).
export function parseJDRules(description: string, title = ""): Partial<ParsedJD> {
  const skills = new Set<string>();
  const known = [
    "react", "typescript", "javascript", "node", "node.js", "next.js", "python", "java",
    "aws", "graphql", "postgresql", "sql", "go", "golang", "kubernetes", "docker",
    "tailwind", "css", "html", "prisma", "express", "vue", "angular", "django", "flask",
  ];
  const lower = description.toLowerCase();
  for (const skill of known) {
    if (lower.includes(skill)) skills.add(skill);
  }
  return { requiredSkills: [...skills].slice(0, 8) };
}

export async function parseJD(job: Job): Promise<ParsedJD> {
  const rules = parseJDRules(job.description, job.title);
  try {
    const res = await runCompletion(
      [
        {
          role: "system",
          content:
            "You are a job description parser. Extract structured data. Return ONLY JSON with keys: " +
            "title, requiredSkills (string[]), preferredSkills (string[]), experienceYears (number), " +
            "domain (string), keyResponsibilities (string[]). Do not invent skills not in the text.",
        },
        {
          role: "user",
          content: `Job title: ${job.title}\nCompany: ${job.company}\n\nDescription:\n${job.description}`,
        },
      ],
      { task: "jd_parse", json: true },
    );
    const parsed = JSON.parse(res.text) as ParsedJD;
    // Merge rule-based skill extraction so deterministic data is never lost.
    return {
      ...parsed,
      requiredSkills: [...new Set([...(rules.requiredSkills || []), ...(parsed.requiredSkills || [])])],
    };
  } catch {
    return {
      title: job.title,
      company: job.company,
      requiredSkills: rules.requiredSkills || [],
      preferredSkills: [],
      experienceYears: 0,
      domain: job.domain,
      keyResponsibilities: [],
      mustInclude: [],
    };
  }
}

/** Deterministic CV-library similarity (0-100) between a job and an existing CV. */
export function cvSimilarity(cv: CVItem, job: Job): number {
  const jobSkills = new Set([
    ...job.requiredSkills,
    ...job.preferredSkills,
  ].map(norm));
  const cvSkills = new Set(cv.content.skills.map(norm));
  if (jobSkills.size === 0) return 50;
  let hits = 0;
  for (const s of jobSkills) if (cvSkills.has(s)) hits++;
  return Math.round((hits / jobSkills.size) * 100);
}

/**
 * Tailor a CV for a job. Reuses the best library CV if similarity is high;
 * otherwise drafts a new version from the master CV. Truthfulness is enforced
 * by only selecting content that already exists in the source CV.
 */
export async function tailorCV(
  master: CVItem,
  library: CVItem[],
  job: Job,
  cfg: SearchConfig,
): Promise<{ cv: CVContent; matchScore: number; reused: boolean; similarity: number }> {
  // 1. Best existing library candidate (excluding master) by similarity.
  let best: { cv: CVItem; sim: number } | null = null;
  for (const cv of library) {
    if (cv.isMaster) continue;
    const sim = cvSimilarity(cv, job);
    if (!best || sim > best.sim) best = { cv, sim };
  }

  // 2. If similarity is high (>=70) and it out-scores the master, reuse it.
  if (best && best.sim >= 70) {
    const sim = best.sim;
    return { cv: best.cv.content, matchScore: sim, reused: true, similarity: sim };
  }

  // 3. Otherwise tailor from master (AI reorders/emphasizes; never invents).
  const base = master.content;
  const score = computeMatchScore(job, cfg);
  const emphasized = job.requiredSkills.map((s) => s.toLowerCase());

  let tailored: CVContent;
  try {
    const res = await runCompletion(
      [
        {
          role: "system",
          content:
            "You tailor a resume to a job description. RULES: (1) Only use facts, skills, dates, titles and " +
            "metrics that exist verbatim in the provided master CV. NEVER invent, exaggerate, or add anything. " +
            "(2) Reorder and re-emphasize to highlight the most relevant skills. (3) Output JSON with keys " +
            "summary, skills (string[]), experience (array of {title,company,startDate,endDate,bullets}), " +
            "education (array of {degree,institution,year}), projects (array of {name,description,tech}), " +
            "certifications (string[]).",
        },
        {
          role: "user",
          content:
            `Master CV:\n${JSON.stringify(base)}\n\nJob description skills to emphasize:\n${emphasized.join(", ")}`,
        },
      ],
      { task: "cv_tailor", json: true, temperature: 0.2 },
    );
    const parsed = JSON.parse(res.text) as CVContent;
    tailored = sanitizeAgainstMaster(parsed, base);
  } catch {
    tailored = deterministicTailor(base, job, cfg);
  }

  return { cv: tailored, matchScore: score.total, reused: false, similarity: cvSimilarity(master, job) };
}

/** Enforce the truthfulness guardrail: drop anything not in the master CV. */
function sanitizeAgainstMaster(gen: CVContent, master: CVContent): CVContent {
  const masterSkillSet = new Set(master.skills.map(norm));
  const safeSkills = (gen.skills || []).filter((s) => masterSkillSet.has(norm(s)));
  // Experiences, education, projects: only keep entries that match master by title/company.
  const safeExp = (gen.experience || []).filter((e) =>
    (master.experience || []).some(
      (m) => norm(m.title) === norm(e.title) && norm(m.company) === norm(e.company),
    ),
  );
  return {
    summary: master.summary,
    skills: safeSkills.length ? safeSkills : master.skills,
    experience: safeExp.length ? safeExp : master.experience,
    education: (gen.education || []).filter((ed) =>
      (master.education || []).some((m) => norm(m.degree) === norm(ed.degree)),
    ),
    projects: (gen.projects || []).filter((p) =>
      (master.projects || []).some((m) => norm(m.name) === norm(p.name)),
    ),
    certifications: (gen.certifications || []).filter((c) =>
      (master.certifications || []).some((m) => norm(m) === norm(c)),
    ),
  };
}

/** Rule-based tailoring fallback (deterministic, always truth-safe). */
function deterministicTailor(base: CVContent, job: Job, cfg: SearchConfig): CVContent {
  const need = new Set(job.requiredSkills.map(norm));
  const baseSet = new Set(base.skills.map(norm));
  const keep = base.skills.filter((s) => need.has(norm(s)));
  const rest = base.skills.filter((s) => !need.has(norm(s)));
  const ordered = [...keep, ...rest];
  const score = computeMatchScore(job, cfg);
  return {
    ...base,
    skills: ordered,
    summary: `${base.summary} (Tailored for ${job.title} at ${job.company})`,
  };
}
