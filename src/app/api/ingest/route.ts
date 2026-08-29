import { NextResponse } from "next/server";
import { ingestJob } from "@/lib/engine/ingest";
import { normalizeAdapterPayload, adapterForUrl } from "@/lib/adapters";

export const runtime = "nodejs";

/**
 * Ingest endpoint for portal adapters / the Chrome extension.
 * Accepts a RawJobInput payload (source = linkedin|naukri|indeed|generic|manual|api),
 * normalizes it, scores it, and queues a qualified application.
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || !body.title || !body.company) {
    return NextResponse.json({ error: "title and company are required" }, { status: 400 });
  }

  const url = body.url || "";
  const adapter = adapterForUrl(url);
  const raw = normalizeAdapterPayload({ ...body, source: body.source || adapter.id });

  try {
    const { job, application } = await ingestJob(raw);
    return NextResponse.json({
      ok: true,
      adapter: adapter.id,
      job,
      application,
      status: job.status,
      matchScore: job.matchScore,
      scoreBreakdown: job.scoreBreakdown,
      skipReason: job.skipReason,
    }, { status: job.status === "skipped" ? 202 : 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Ingest failed" }, { status: 400 });
  }
}
