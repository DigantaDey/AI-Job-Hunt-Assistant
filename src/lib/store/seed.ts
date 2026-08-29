// Seeds the local data store with a realistic demo candidate + pipeline so the
// app is immediately explorable. Safe to re-run (it wipes and re-seeds).
import { promises as fs } from "fs";
import path from "path";
import * as db from "./db";
import { Collections } from "./repos";
import * as T from "./types";

const DATA_FILE = process.env.JOBHUNT_DATA_FILE || path.join(process.cwd(), "data", "jobhunt.json");

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

async function wipe() {
  try {
    await fs.rm(DATA_FILE, { force: true });
  } catch {}
}

function jobData(partial: Partial<T.Job>): Omit<T.Job, "id" | "createdAt"> & { id?: string } {
  return { status: "discovered", matchScore: 0, scoreBreakdown: {}, skipReason: "", ...partial } as any;
}

export async function seed() {
  await wipe();
  await db.flush();

  // Candidate
  await db.create(Collections.candidates, {
    id: "cand_1",
    fullName: "Ananya Sharma",
    email: "ananya.sharma@example.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    currentRole: "Full-Stack Developer",
    summary:
      "Product-minded full-stack engineer with 5 years building web platforms with React, TypeScript, Node.js and cloud services.",
    skills: ["React", "TypeScript", "Node.js", "Next.js", "PostgreSQL", "AWS", "Tailwind", "Prisma"],
    experienceYears: 5,
    desiredRole: "Senior Full-Stack Engineer",
    noticePeriodDays: 30,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
  });

  // Search config
  await db.create(Collections.searchConfigs, {
    id: "cfg_1",
    candidateId: "cand_1",
    mustHaveSkills: ["React", "TypeScript", "Node.js"],
    preferredSkills: ["Next.js", "AWS", "GraphQL", "PostgreSQL"],
    targetTitles: ["Senior Full-Stack Engineer", "Full-Stack Developer", "Frontend Engineer", "Software Engineer II"],
    excludedTitles: ["Lead", "Manager", "Director", "Principal", "Intern"],
    locations: ["Bengaluru", "Remote"],
    workMode: "any",
    salaryMin: 2500000,
    salaryMax: 4500000,
    experienceMin: 3,
    experienceMax: 8,
    freshnessDays: 30,
    companiesInclude: [],
    companiesExclude: [],
    minMatchScore: 60,
    maxApplicationsPerDay: 8,
    autonomyMode: "smart_apply",
    updatedAt: daysAgo(40),
  });

  // CVs
  await db.create(Collections.cvs, {
    id: "cv_master",
    candidateId: "cand_1",
    name: "Master CV",
    type: "MASTER",
    isMaster: true,
    content: {
      summary: "Full-stack engineer with 5 years building product at scale using React, TypeScript, Node.js and AWS.",
      skills: ["React", "TypeScript", "Node.js", "Next.js", "PostgreSQL", "AWS"],
      experience: [
        {
          title: "Full-Stack Developer",
          company: "Cloudworks Tech",
          startDate: "2022-01",
          endDate: "Present",
          bullets: [
            "Built and shipped a multi-tenant SaaS dashboard used by 40k+ monthly users.",
            "Reduced p95 API latency by 38% via query optimization and caching.",
            "Led migration of a legacy PHP monolith to a Next.js + Node.js stack.",
          ],
        },
        {
          title: "Frontend Engineer",
          company: "PayNex",
          startDate: "2019-06",
          endDate: "2021-12",
          bullets: [
            "Developed a payments reconciliation UI in React with sub-second rendering.",
            "Introduced a component design system adopted across 6 squads.",
          ],
        },
      ],
      education: [{ degree: "B.Tech Computer Science", institution: "NIT Trichy", year: "2019" }],
      projects: [
        { name: "CareConnect", description: "Telehealth appointment platform", tech: ["Next.js", "PostgreSQL", "AWS"] },
      ],
      certifications: ["AWS Solutions Architect - Associate"],
    },
    tags: ["master", "default"],
    matchScore: 0,
    usageCount: 3,
    version: 3,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
  });

  // Jobs + applications
  const apps: { job: Partial<T.Job>; status: T.AppStatus; days: number; score: number; conf: number }[] = [
    {
      job: jobData({
        title: "Senior Full-Stack Engineer", company: "Finlytics", source: "linkedin",
        location: "Remote", workMode: "remote", domain: "Fintech",
        requiredSkills: ["React", "TypeScript", "Node.js"], preferredSkills: ["AWS", "GraphQL"],
        description: "Build scalable fintech dashboards for 1M+ users.", url: "https://linkedin.com/jobs/1",
        postedAt: daysAgo(1),
      }),
      status: "submitted", days: 2, score: 88, conf: 90,
    },
    {
      job: jobData({
        title: "Full-Stack Developer", company: "UrbanCart", source: "naukri",
        location: "Bengaluru", workMode: "hybrid", domain: "E-commerce",
        requiredSkills: ["React", "Node.js", "PostgreSQL"], preferredSkills: ["Next.js"],
        description: "Own checkout and order management experiences.", url: "https://naukri.com/job/5",
        postedAt: daysAgo(2),
      }),
      status: "queued", days: 1, score: 74, conf: 0,
    },
    {
      job: jobData({
        title: "Software Engineer II", company: "MedLens", source: "linkedin",
        location: "Bengaluru", workMode: "onsite", domain: "Healthtech",
        requiredSkills: ["TypeScript", "Node.js", "AWS"], preferredSkills: ["Python"],
        description: "Backend services for clinical data platform.", url: "https://linkedin.com/jobs/8",
        postedAt: daysAgo(4),
      }),
      status: "preparing_cv", days: 1, score: 69, conf: 0,
    },
    {
      job: jobData({
        title: "Frontend Engineer", company: "Nimbus AI", source: "indeed",
        location: "Remote", workMode: "remote", domain: "AI / SaaS",
        requiredSkills: ["React", "TypeScript", "Tailwind"], preferredSkills: ["Next.js"],
        description: "Build AI assistant interfaces.", url: "https://indeed.com/job/12",
        postedAt: daysAgo(1),
      }),
      status: "waiting_for_user", days: 1, score: 81, conf: 62,
    },
    {
      job: jobData({
        title: "Full-Stack Developer", company: "RetailPeak", source: "linkedin",
        location: "Gurugram", workMode: "onsite", domain: "Retail",
        requiredSkills: ["Java", "Spring"], preferredSkills: [],
        description: "Backend Java services for retail platform.",
        url: "https://linkedin.com/jobs/3", postedAt: daysAgo(6),
      }),
      status: "skipped", days: 5, score: 34, conf: 0,
    },
    {
      job: jobData({
        title: "Senior Frontend Engineer", company: "ZetaPay", source: "naukri",
        location: "Remote", workMode: "remote", domain: "Fintech",
        requiredSkills: ["React", "TypeScript"], preferredSkills: ["GraphQL"],
        description: "Lead frontend architecture for payments flows.", url: "https://naukri.com/job/20",
        postedAt: daysAgo(3),
      }),
      status: "failed", days: 3, score: 83, conf: 0,
    },
  ];

  for (const a of apps) {
    const job = (await db.create(Collections.jobs, a.job)) as T.Job;
    await db.create(Collections.applications, {
      jobId: job.id,
      candidateId: "cand_1",
      cvId: "cv_master",
      status: a.status,
      autonomyMode: "smart_apply",
      confidence: a.conf,
      error: a.status === "failed" ? "Form validation failed: unexpected CAPTCHA field on Naukri quick-apply." : "",
      externalAppId: a.status === "submitted" ? "app-" + Math.floor(Math.random() * 99999) : "",
      submittedAt: a.status === "submitted" ? daysAgo(a.days) : null,
      createdAt: daysAgo(a.days),
      updatedAt: daysAgo(a.days),
    });
  }

  // Answer memory
  const ans = [
    { q: "Are you willing to relocate to Hyderabad?", intent: "relocation_willingness.location_specific", cat: "USER_APPROVED" as const, answer: "Yes, open to relocating for the right role.", conf: 100, reuse: "ask_once_then_reuse" as const },
    { q: "What is your current notice period?", intent: "availability.notice_period", cat: "USER_APPROVED" as const, answer: "30 days", conf: 100, reuse: "auto_fill" as const },
    { q: "What is your current CTC?", intent: "compensation.current_ctc", cat: "USER_APPROVED" as const, answer: "32 LPA", conf: 100, reuse: "always_confirm" as const },
    { q: "What is your expected CTC?", intent: "compensation.expected_ctc", cat: "USER_APPROVED" as const, answer: "40 LPA", conf: 100, reuse: "always_confirm" as const },
    { q: "How many years of experience do you have with React?", intent: "experience.react_years", cat: "SAFE" as const, answer: "5 years", conf: 100, reuse: "auto_fill" as const },
    { q: "What is your preferred work mode?", intent: "preference.work_mode", cat: "USER_APPROVED" as const, answer: "Remote or hybrid", conf: 95, reuse: "ask_once_then_reuse" as const },
    { q: "Do you have any criminal convictions? (US disclosure)", intent: "legal.criminal_disclosure", cat: "SENSITIVE" as const, answer: "", conf: 0, reuse: "always_confirm" as const },
    { q: "Are you legally authorized to work in the US?", intent: "legal.work_authorization_us", cat: "SENSITIVE" as const, answer: "", conf: 0, reuse: "always_confirm" as const },
  ];
  for (const a of ans) {
    await db.create(Collections.answers, {
      candidateId: "cand_1",
      question: a.q,
      normalizedIntent: a.intent,
      category: a.cat,
      answer: a.answer,
      source: "user",
      confidence: a.conf,
      reusePolicy: a.reuse,
      lastConfirmed: a.conf ? daysAgo(5) : null,
      usageCount: Math.floor(Math.random() * 4),
      createdAt: daysAgo(30),
      updatedAt: daysAgo(5),
    });
  }

  // Token usage
  const usage = [
    { provider: "openai", model: "gpt-4o-mini", task: "jd_parse" as T.AITask, in: 820, out: 340, cost: 0.003 },
    { provider: "openai", model: "gpt-4o-mini", task: "job_match" as T.AITask, in: 1400, out: 210, cost: 0.004 },
    { provider: "openai", model: "gpt-4o-mini", task: "cv_tailor" as T.AITask, in: 3100, out: 980, cost: 0.011 },
    { provider: "openai", model: "gpt-4o-mini", task: "cover_letter" as T.AITask, in: 1200, out: 640, cost: 0.005 },
  ];
  for (const u of usage) {
    await db.create(Collections.tokenUsage, {
      provider: u.provider, model: u.model, task: u.task,
      inputTokens: u.in, outputTokens: u.out, estimatedCost: u.cost, createdAt: daysAgo(1),
    });
  }

  // Settings
  await db.create(Collections.settings, {
    id: "app", provider: "mock", model: "mock", apiKeyEncrypted: "", baseUrl: "", updatedAt: daysAgo(2),
  });

  await db.flush();
  console.log("Seeded local data →", DATA_FILE);
}

// Run when executed directly
if (require.main === module) {
  seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
