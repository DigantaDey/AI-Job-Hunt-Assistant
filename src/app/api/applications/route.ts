import { NextResponse } from "next/server";
import { applications, jobs } from "@/lib/store/repos";

export const runtime = "nodejs";

export async function GET() {
  const apps = await applications.list();
  const allJobs = await jobs.list();
  const enriched = [...apps]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((a) => ({
      ...a,
      job: allJobs.find((j) => j.id === a.jobId) || null,
    }));
  return NextResponse.json(enriched);
}
