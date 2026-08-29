import { NextResponse } from "next/server";
import { settings, applications, searchConfigs, candidates } from "@/lib/store/repos";

export const runtime = "nodejs";

/** Current worker status: last persisted run + config + live queue snapshot. */
export async function GET() {
  const [setting, apps, candidate] = await Promise.all([
    settings.get(),
    applications.list(),
    candidates.first(),
  ]);
  const cfg = candidate ? await searchConfigs.forCandidate(candidate.id) : null;
  const today = new Date().toISOString().slice(0, 10);

  const schedulerEnabled =
    setting && typeof setting.schedulerEnabled === "boolean" ? setting.schedulerEnabled : true;

  const pending = {
    queued: apps.filter((a) => a.status === "queued").length,
    preparing_cv: apps.filter((a) => a.status === "preparing_cv").length,
    ready: apps.filter((a) => a.status === "ready").length,
    applying: apps.filter((a) => a.status === "applying").length,
    waiting_for_user: apps.filter((a) => a.status === "waiting_for_user").length,
    retry_scheduled: apps.filter((a) => a.status === "retry_scheduled").length,
  };

  const lastReport = setting?.lastWorkerRunAt
    ? {
        at: setting.lastWorkerRunAt,
        mode: setting.lastWorkerMode || "smart_apply",
        processed: Number(setting.lastWorkerProcessed) || 0,
        submittedToday: Number(setting.lastWorkerSubmittedToday) || 0,
        dailyCap: Number(setting.lastWorkerDailyCap) || 8,
        transitions: safeParse(setting.lastWorkerTransitions),
        errors: safeParse(setting.lastWorkerErrors),
      }
    : null;

  return NextResponse.json({
    schedulerEnabled,
    intervalMs: Number(process.env.JOBHUNT_SCHEDULER_INTERVAL_MS) || 20000,
    mode: cfg?.autonomyMode || "smart_apply",
    dailyCap: cfg?.maxApplicationsPerDay || 8,
    submittedToday: apps.filter((a) => a.submittedAt && a.submittedAt.startsWith(today)).length,
    pending,
    lastReport,
  });
}

function safeParse(v?: string): string[] {
  if (!v) return [];
  try { return JSON.parse(v); } catch { return []; }
}
