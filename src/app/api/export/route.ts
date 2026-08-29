import { NextResponse } from "next/server";
import { candidates, jobs, applications, cvs, answers, credentials, tokenUsage, searchConfigs } from "@/lib/store/repos";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET() {
  const [candidate, jobList, apps, cvList, ans, creds, usage] = await Promise.all([
    candidates.first(),
    jobs.list(),
    applications.list(),
    cvs.list(),
    answers.list("cand_1").catch(() => [] as any[]),
    credentials.list(),
    tokenUsage.list(),
  ]);
  const cfg = candidate ? await searchConfigs.forCandidate(candidate.id) : null;

  const exportable = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    candidate,
    searchConfig: cfg,
    jobs: jobList,
    applications: apps,
    cvs: cvList,
    answerMemory: ans,
    credentials: creds.map((c) => ({
      ...c,
      username: decrypt(c.username),
      password: decrypt(c.password),
    })),
    tokenUsage: usage,
  };

  return new NextResponse(JSON.stringify(exportable, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="jobhunt-export.json"',
    },
  });
}
