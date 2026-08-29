import { NextResponse } from "next/server";
import {
  applications,
  candidates,
  cvs,
  jobs,
  tokenUsage,
  credentials,
} from "@/lib/store/repos";
import {
  statusCounts,
  dailyTrend,
  averageScore,
  tokenTotals,
  countBy,
} from "@/lib/engine/analytics";

export const runtime = "nodejs";

export async function GET() {
  const [apps, allJobs, cvList, usage, creds, candidate] = await Promise.all([
    applications.list(),
    jobs.list(),
    cvs.list(),
    tokenUsage.list(),
    credentials.list(),
    candidates.first(),
  ]);

  const counts = statusCounts(apps);
  const trend = dailyTrend(apps, 14);

  const appsWithJob = apps.map((a) => ({
    ...a,
    job: allJobs.find((j) => j.id === a.jobId) || null,
  }));

  const scoreDistribution = {
    high: allJobs.filter((j) => j.matchScore >= 75).length,
    mid: allJobs.filter((j) => j.matchScore >= 55 && j.matchScore < 75).length,
    low: allJobs.filter((j) => j.matchScore > 0 && j.matchScore < 55).length,
  };

  return NextResponse.json({
    candidate: candidate
      ? { name: candidate.fullName, role: candidate.currentRole }
      : null,
    counts,
    totals: {
      discovered: allJobs.length,
      submitted: counts.submitted || 0,
      waiting: counts.waiting_for_user || 0,
      failed: counts.failed || 0,
      skipped: counts.skipped || 0,
    },
    trend,
    avgScore: averageScore(allJobs),
    scoreDistribution,
    bySource: countBy(apps, (a: any) => a.job?.source || "manual"),
    byCompany: countBy(apps, (a: any) => a.job?.company || "Unknown"),
    cvUsage: countBy(cvList.filter((c) => c.usageCount > 0), (c: any) => c.name),
    tokens: tokenTotals(usage),
    credentialsCreated: creds.length,
    appsWithJob,
  });
}
