import { NextResponse } from "next/server";
import { jobs, cvs, candidates } from "@/lib/store/repos";
import { generateInterviewQuestions } from "@/lib/ai/writers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const job = await jobs.get(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const candidate = await candidates.first();
  const master = candidate ? await cvs.master(candidate.id) : null;

  const { questions, provider } = await generateInterviewQuestions(job, master?.content || {
    summary: "", skills: [], experience: [], education: [], projects: [], certifications: [],
  });

  return NextResponse.json({ questions, provider });
}
