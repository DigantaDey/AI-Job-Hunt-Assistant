// Shared domain types — mirrors DATA_MODEL.md / FINAL_PLAN.md.
// String-based statuses kept for SQLite/JSON portability.

export type AutonomyMode =
  | "assist"
  | "smart_apply"
  | "supervised_auto"
  | "continuous";

export type WorkMode = "any" | "remote" | "hybrid" | "onsite";

export const AUTONOMY_MODES: AutonomyMode[] = [
  "assist",
  "smart_apply",
  "supervised_auto",
  "continuous",
];

// ---------------------------------------------------------------------------

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentRole: string;
  summary: string;
  skills: string[];
  experienceYears: number;
  desiredRole: string;
  noticePeriodDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchConfig {
  id: string;
  candidateId: string;
  mustHaveSkills: string[];
  preferredSkills: string[];
  targetTitles: string[];
  excludedTitles: string[];
  locations: string[];
  workMode: WorkMode;
  salaryMin: number;
  salaryMax: number;
  experienceMin: number;
  experienceMax: number;
  freshnessDays: number;
  companiesInclude: string[];
  companiesExclude: string[];
  minMatchScore: number;
  maxApplicationsPerDay: number;
  autonomyMode: AutonomyMode;
  updatedAt: string;
}

export type JobStatus =
  | "discovered"
  | "qualified"
  | "queued"
  | "preparing_cv"
  | "ready"
  | "applying"
  | "waiting_for_user"
  | "submitted"
  | "skipped"
  | "failed"
  | "retry_scheduled";

export interface Job {
  id: string;
  externalId: string;
  source: string; // linkedin | naukri | indeed | manual | api
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  description: string;
  domain: string;
  salaryMin: number;
  salaryMax: number;
  requiredSkills: string[];
  preferredSkills: string[];
  url: string;
  postedAt: string | null;
  discoveredAt: string;
  matchScore: number;
  scoreBreakdown: Record<string, number>;
  skipReason: string;
  status: JobStatus;
  createdAt: string;
}

export type AppStatus = JobStatus;

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  cvId: string | null;
  status: AppStatus;
  autonomyMode: AutonomyMode;
  confidence: number;
  error: string;
  externalAppId: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CVType = "MASTER" | "AI_GENERATED" | "HUMAN_UPLOADED";

export interface CVItem {
  id: string;
  candidateId: string;
  name: string;
  type: CVType;
  isMaster: boolean;
  content: CVContent;
  tags: string[];
  matchScore: number;
  usageCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CVContent {
  summary: string;
  skills: string[];
  experience: CVExperience[];
  education: CVEducation[];
  projects: CVProject[];
  certifications: string[];
}

export interface CVExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface CVEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface CVProject {
  name: string;
  description: string;
  tech: string[];
}

export type AnswerCategory = "SAFE" | "USER_APPROVED" | "AI_SUGGESTED" | "SENSITIVE";
export type ReusePolicy = "auto_fill" | "ask_once_then_reuse" | "ask" | "always_confirm";

export interface AnswerMemory {
  id: string;
  candidateId: string;
  question: string;
  normalizedIntent: string;
  category: AnswerCategory;
  answer: string;
  source: "user" | "ai" | "manual";
  confidence: number;
  reusePolicy: ReusePolicy;
  lastConfirmed: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Credential {
  id: string;
  domain: string;
  username: string; // encrypted at rest
  password: string; // encrypted at rest
  notes: string;
  linkedApplicationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AITask =
  | "jd_parse"
  | "job_match"
  | "answer_suggest"
  | "cv_tailor"
  | "cover_letter"
  | "interview"
  | "classify";

export interface TokenUsage {
  id: string;
  provider: string;
  model: string;
  task: AITask;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  createdAt: string;
}

export interface Setting {
  id: string; // "app"
  provider: string; // mock | openai | ...
  model: string;
  apiKeyEncrypted: string;
  baseUrl: string;
  schedulerEnabled?: boolean;
  schedulerIntervalSec?: number;
  lastWorkerRunAt?: string;
  lastWorkerMode?: string;
  lastWorkerProcessed?: number;
  lastWorkerSubmittedToday?: number;
  lastWorkerDailyCap?: number;
  lastWorkerTransitions?: string;
  lastWorkerErrors?: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Analytics shapes
// ---------------------------------------------------------------------------

export interface MatchScoreBreakdown {
  requiredSkills: number;
  title: number;
  experience: number;
  location: number;
  domain: number;
  salary: number;
  freshness: number;
}

export interface ApplicationWithJob extends Application {
  job: Job;
}
