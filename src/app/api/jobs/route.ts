import { NextResponse } from "next/server";
import { jobs, applications } from "@/lib/store/repos";
import { ingestJob } from "@/lib/engine/ingest";

export const runtime = "nodejs";

export async function GET() {
  const all = await jobs.list();
  // newest first
  const sorted = [...all].sort(
    (a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime(),
  );
  return NextResponse.json(sorted);
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const { job, application } = await ingestJob(body);
    return NextResponse.json({ job, application }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to ingest job" }, { status: 400 });
  }
}
