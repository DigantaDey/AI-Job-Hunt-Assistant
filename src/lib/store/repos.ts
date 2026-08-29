// Typed repository wrappers over the JSON store.
import * as db from "./db";
import * as T from "./types";

export const Collections = {
  candidates: "candidates",
  searchConfigs: "searchConfigs",
  jobs: "jobs",
  applications: "applications",
  cvs: "cvs",
  answers: "answers",
  credentials: "credentials",
  tokenUsage: "tokenUsage",
  settings: "settings",
} as const;

// --- Candidates ---
export const candidates = {
  list: () => db.listAll<T.Candidate>(Collections.candidates),
  get: (id: string) => db.getById<T.Candidate>(Collections.candidates, id),
  first: () => db.findOne<T.Candidate>(Collections.candidates, () => true),
  upsert: (data: Partial<T.Candidate> & { id?: string }) =>
    db.upsertSetting(Collections.candidates, data.id || "cand_1", data),
};

// --- Search configs ---
export const searchConfigs = {
  forCandidate: (candidateId: string) =>
    db.findOne<T.SearchConfig>(Collections.searchConfigs, (c) => c.candidateId === candidateId),
  upsert: (data: Omit<T.SearchConfig, "id" | "updatedAt">) =>
    db.upsertSetting(Collections.searchConfigs, "cfg_1", data),
};

// --- Jobs ---
export const jobs = {
  list: () => db.listAll<T.Job>(Collections.jobs),
  get: (id: string) => db.getById<T.Job>(Collections.jobs, id),
  create: (data: Partial<T.Job>) =>
    db.create<T.Job>(Collections.jobs, data as any),
  update: (id: string, patch: Partial<T.Job>) =>
    db.update<T.Job>(Collections.jobs, id, patch),
  byStatus: (status: T.JobStatus) =>
    db.where<T.Job>(Collections.jobs, (j) => j.status === status),
};

// --- Applications ---
export const applications = {
  list: () => db.listAll<T.Application>(Collections.applications),
  get: (id: string) => db.getById<T.Application>(Collections.applications, id),
  create: (data: Partial<T.Application>) =>
    db.create<T.Application>(Collections.applications, data as any),
  update: (id: string, patch: Partial<T.Application>) =>
    db.update<T.Application>(Collections.applications, id, patch),
  byCandidate: (candidateId: string) =>
    db.where<T.Application>(Collections.applications, (a) => a.candidateId === candidateId),
  byStatus: (status: T.AppStatus) =>
    db.where<T.Application>(Collections.applications, (a) => a.status === status),
};

// --- CVs ---
export const cvs = {
  list: (candidateId?: string) =>
    candidateId
      ? db.where<T.CVItem>(Collections.cvs, (c) => c.candidateId === candidateId)
      : db.listAll<T.CVItem>(Collections.cvs),
  get: (id: string) => db.getById<T.CVItem>(Collections.cvs, id),
  create: (data: Partial<T.CVItem>) => db.create<T.CVItem>(Collections.cvs, data as any),
  update: (id: string, patch: Partial<T.CVItem>) =>
    db.update<T.CVItem>(Collections.cvs, id, patch),
  master: (candidateId: string) =>
    db.findOne<T.CVItem>(Collections.cvs, (c) => c.candidateId === candidateId && c.isMaster),
};

// --- Answer memory ---
export const answers = {
  list: (candidateId: string) =>
    db.where<T.AnswerMemory>(Collections.answers, (a) => a.candidateId === candidateId),
  byCategory: (candidateId: string, category: T.AnswerCategory) =>
    db.where<T.AnswerMemory>(Collections.answers, (a) => a.candidateId === candidateId && a.category === category),
  create: (data: Partial<T.AnswerMemory>) =>
    db.create<T.AnswerMemory>(Collections.answers, data as any),
  update: (id: string, patch: Partial<T.AnswerMemory>) =>
    db.update<T.AnswerMemory>(Collections.answers, id, patch),
  remove: (id: string) => db.remove(Collections.answers, id),
  matchIntent: (candidateId: string, intent: string) =>
    db.findOne<T.AnswerMemory>(Collections.answers, (a) => a.candidateId === candidateId && a.normalizedIntent === intent),
};

// --- Credentials ---
export const credentials = {
  list: () => db.listAll<T.Credential>(Collections.credentials),
  get: (id: string) => db.getById<T.Credential>(Collections.credentials, id),
  create: (data: Partial<T.Credential>) =>
    db.create<T.Credential>(Collections.credentials, data as any),
  update: (id: string, patch: Partial<T.Credential>) =>
    db.update<T.Credential>(Collections.credentials, id, patch),
  remove: (id: string) => db.remove(Collections.credentials, id),
};

// --- Token usage ---
export const tokenUsage = {
  list: () => db.listAll<T.TokenUsage>(Collections.tokenUsage),
  create: (data: Partial<T.TokenUsage>) =>
    db.create<T.TokenUsage>(Collections.tokenUsage, data as any),
};

// --- Settings ---
export const settings = {
  get: () => db.findOne<any>(Collections.settings, () => true),
  upsert: (data: Partial<T.Setting>) =>
    db.upsertSetting(Collections.settings, "app", data),
};
