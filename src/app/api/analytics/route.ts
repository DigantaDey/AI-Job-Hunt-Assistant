import { NextResponse } from "next/server";
import { applications, jobs, tokenUsage, cvs, answers, credentials } from "@/lib/store/repos";
import {
  statusCounts,
  dailyTrend,
  averageScore,
  tokenTotals,
  countBy,
} from "@/lib/engine/analytics";
import { activeProvider } from "@/lib/ai/router";

export const runtime = "nodejs";

export async function GET() {
  const [apps, allJobs, usage, cvList, ans, creds, provider] = await Promise.all([
    applications.list(),
    jobs.list(),
    tokenUsage.list(),
    cvs.list(),
    answers.list("cand_1").catch(() => [] as any[]),
    credentials.list(),
    activeProvider(),
  ]);

  const counts = statusCounts(apps);

  const byTask = countBy(usage, (u: any) => u.task);
  const byProvider = countBy(usage, (u: any) => u.provider);

  return NextResponse.json({
    counts,
    totals: {
      submitted: counts.submitted || 0,
      waiting: counts.waiting_for_user || 0,
      failed: counts.failed || 0,
      skipped: counts.skipped || 0,
      queued: (counts.queued || 0) + (counts.preparing_cv || 0) + (counts.ready || 0),
    },
    trend: dailyTrend(apps, 21),
    avgScore: averageScore(allJobs),
    scoreDistribution: {
      high: allJobs.filter((j) => j.matchScore >= 75).length,
      mid: allJobs.filter((j) => j.matchScore >= 55 && j.matchScore < 75).length,
      low: allJobs.filter((j) => j.matchScore > 0 && j.matchScore < 55).length,
    },
    bySource: countBy(apps, (a: any) => a.job?.source || "manual"),
    byCompany: countBy(apps, (a: any) => a.job?.company || "Unknown"),
    cvUsage: countBy(cvList.filter((c) => c.usageCount > 0), (c: any) => c.name),
    answerUsage: countBy(ans.filter((a) => a.usageCount > 0), (a: any) => a.category),
    tokens: tokenTotals(usage),
    usageByTask: byTask,
    usageByProvider: byProvider,
    credentialsCreated: creds.length,
    provider,
  });
}
