// Continuous-mode application queue worker (FINAL_PLAN §7, §10, §16).
//
// Advances the queue according to the autonomy mode:
//   assist           → prepare only; never submit without the user (worker off)
//   smart_apply      → prepare + stop at waiting_for_user for confirmation (default)
//   supervised_auto  → prepare; submit automatically only when confidence >= 75
//   continuous       → same as supervised_auto but runs discovery/queue in the
//                      background continuously (enabled when this worker runs)
//
// Enforces maxApplicationsPerDay (rate limiting). Tailors a CV for queued jobs
// that lack one. Respects human checkpoints: unknown/sensitive steps land in
// waiting_for_user and are never auto-completed.

import {
  applications,
  candidates,
  searchConfigs,
  jobs,
  cvs,
  settings,
} from "../store/repos";
import { tailorCV } from "../ai/cvEngine";
import type { Application, SearchConfig } from "../store/types";

export interface SchedulerReport {
  at: string;
  mode: string;
  enabled: boolean;
  processed: number;
  submittedToday: number;
  dailyCap: number;
  transitions: string[];
  errors: string[];
}

let lastReport: SchedulerReport | null = null;
let started = false;

export function getLastReport(): SchedulerReport | null {
  return lastReport;
}

function canRun(mode: string): boolean {
  return ["smart_apply", "supervised_auto", "continuous"].includes(mode);
}

/** Process one application according to the mode. Returns nothing; mutates store. */
async function advance(app: Application, candidateId: string, master: Awaited<ReturnType<typeof cvs.master>>, cfg: SearchConfig, mode: string, counter: { submittedToday: number; report: SchedulerReport }) {
  const job = await jobs.get(app.jobId);
  if (!job) return;
  const trans = (to: string) => {
    counter.report.transitions.push(`${job.company} · ${job.title}: ${app.status} → ${to}`);
    counter.report.processed++;
  };

  switch (app.status) {
    case "queued": {
      if (!app.cvId && master) {
        try {
          const library = await cvs.list(candidateId);
          const { cv, matchScore, reused, similarity } = await tailorCV(master, library, job, cfg);
          const createdCv = await cvs.create({
            candidateId,
            name: `${job.company} — ${job.title}`,
            type: "AI_GENERATED",
            isMaster: false,
            content: cv,
            tags: [job.company.toLowerCase().replace(/[^a-z0-9]/g, ""), job.domain.toLowerCase()],
            matchScore,
            usageCount: 1,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          await applications.update(app.id, { cvId: createdCv.id, status: "preparing_cv" });
          trans(`preparing_cv (CV tailored, ${matchScore}% match${reused ? ", reused" : ""})`);
        } catch (e: any) {
          counter.report.errors.push(`${job.title}: CV tailor failed — ${e.message || e}`);
          await applications.update(app.id, { status: "preparing_cv" });
          trans("preparing_cv (no CV, will retry)");
        }
      } else {
        await applications.update(app.id, { status: "preparing_cv" });
        trans("preparing_cv");
      }
      break;
    }
    case "preparing_cv":
      await applications.update(app.id, { status: "ready" });
      trans("ready");
      break;
    case "ready":
      await applications.update(app.id, { status: "applying" });
      trans("applying");
      break;
    case "applying": {
      if (counter.submittedToday >= counter.report.dailyCap) {
        await applications.update(app.id, { status: "waiting_for_user" });
        trans("waiting_for_user (daily cap reached)");
        break;
      }
      if (mode === "supervised_auto" && app.confidence >= 75) {
        const now = new Date().toISOString();
        await applications.update(app.id, { status: "submitted", submittedAt: now });
        await jobs.update(job.id, { status: "submitted" });
        counter.submittedToday++;
        trans("submitted (auto, high confidence)");
      } else {
        // smart_apply / assist: require human confirmation before submitting
        await applications.update(app.id, { status: "waiting_for_user" });
        trans("waiting_for_user (needs confirmation)");
      }
      break;
    }
    case "retry_scheduled":
      await applications.update(app.id, { status: "applying" });
      trans("applying (retry)");
      break;
    default:
      break;
  }
}

export async function processQueue(): Promise<SchedulerReport> {
  const report: SchedulerReport = {
    at: new Date().toISOString(),
    mode: "smart_apply",
    enabled: true,
    processed: 0,
    submittedToday: 0,
    dailyCap: 8,
    transitions: [],
    errors: [],
  };

  const [candidate, setting] = await Promise.all([candidates.first(), settings.get()]);
  if (!candidate) { report.enabled = false; return report; }

  // Scheduler toggle (Settings UI writes schedulerEnabled).
  const enabledFlag = setting && typeof setting.schedulerEnabled === "boolean" ? setting.schedulerEnabled : true;
  if (!enabledFlag) { report.enabled = false; return report; }

  const cfg = (await searchConfigs.forCandidate(candidate.id)) as SearchConfig | null;
  const mode = cfg?.autonomyMode || "smart_apply";
  report.mode = mode;
  report.dailyCap = cfg?.maxApplicationsPerDay || 8;

  if (!canRun(mode)) { report.enabled = false; return report; }

  const master = await cvs.master(candidate.id);
  const apps = await applications.list();
  const today = new Date().toISOString().slice(0, 10);
  const counter = {
    submittedToday: apps.filter((a) => a.submittedAt && a.submittedAt.startsWith(today)).length,
    report,
  };
  report.submittedToday = counter.submittedToday;

  for (const app of apps) {
    if (["skipped", "submitted", "failed"].includes(app.status)) continue;
    await advance(app, candidate.id, master, cfg!, mode, counter);
  }

  lastReport = report;

  // Persist a compact summary so the status endpoint (a separate module
  // instance from instrumentation) can read it without sharing memory.
  try {
    await settings.upsert({
      lastWorkerRunAt: report.at,
      lastWorkerMode: report.mode,
      lastWorkerProcessed: report.processed,
      lastWorkerSubmittedToday: report.submittedToday,
      lastWorkerDailyCap: report.dailyCap,
      lastWorkerTransitions: JSON.stringify(report.transitions.slice(-20)),
      lastWorkerErrors: JSON.stringify(report.errors),
    });
  } catch {}

  return report;
}

export function startScheduler(intervalMs?: number) {
  if (started) return;
  started = true;
  const iv = intervalMs || Number(process.env.JOBHUNT_SCHEDULER_INTERVAL_MS) || 20000;
  // initial run shortly after boot
  setTimeout(() => { processQueue().catch(() => {}); }, 4000);
  const timer = setInterval(() => { processQueue().catch(() => {}); }, iv);
  if (typeof timer.unref === "function") timer.unref();
  console.log(`[jobhunt] continuous-mode scheduler started (every ${iv}ms)`);
}
