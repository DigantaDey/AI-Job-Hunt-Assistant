import { NextResponse } from "next/server";
import { candidates, cvs, jobs, searchConfigs } from "@/lib/store/repos";
import { tailorCV } from "@/lib/ai/cvEngine";
import type { CVItem } from "@/lib/store/types";

export const runtime = "nodejs";

export async function GET() {
  const all = await cvs.list();
  const sorted = [...all].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return NextResponse.json(sorted);
}

/** Body: { jobId } — tailor (or reuse) a CV for the given job and save it. */
export async function POST(req: Request) {
  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const candidate = await candidates.first();
  if (!candidate) return NextResponse.json({ error: "No candidate profile" }, { status: 400 });

  const job = await jobs.get(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const cfg = await searchConfigs.forCandidate(candidate.id);
  const master = await cvs.master(candidate.id);
  if (!master) return NextResponse.json({ error: "No master CV" }, { status: 400 });

  const library = await cvs.list(candidate.id);
  const { cv, matchScore, reused, similarity } = await tailorCV(master, library, job, cfg as any);

  // Reuse: bump usage on the existing matching CV rather than creating duplicates.
  if (reused) {
    const existing = library.find((c) => c.content === cv) || library.find((c) => !c.isMaster && c.usageCount >= 0);
    if (existing) {
      const updated = await cvs.update(existing.id, {
        usageCount: existing.usageCount + 1,
        matchScore: Math.max(existing.matchScore, matchScore),
      });
      return NextResponse.json({ cv: updated, reused: true, matchScore, similarity });
    }
  }

  const created = await cvs.create({
    candidateId: candidate.id,
    name: `${job.company} — ${job.title}`,
    type: "AI_GENERATED",
    isMaster: false,
    content: cv,
    tags: [job.company.toLowerCase().replace(/[^a-z]/g, ""), job.domain.toLowerCase()],
    matchScore,
    usageCount: 1,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ cv: created, reused: false, matchScore, similarity }, { status: 201 });
}
