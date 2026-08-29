import { NextResponse } from "next/server";
import { jobs, cvs, candidates } from "@/lib/store/repos";
import { generateCoverLetter } from "@/lib/ai/writers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { jobId, cvId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const job = await jobs.get(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const candidate = await candidates.first();
  let cv = await cvs.get(cvId || "");
  if (!cv && candidate) cv = await cvs.master(candidate.id);

  const { text, provider } = await generateCoverLetter(job, cv?.content || {
    summary: "", skills: [], experience: [], education: [], projects: [], certifications: [],
  });

  return NextResponse.json({ text, provider });
}
