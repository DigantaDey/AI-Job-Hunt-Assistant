import { NextResponse } from "next/server";
import { applications, jobs } from "@/lib/store/repos";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const VALID_STATUSES = new Set([
  "discovered", "qualified", "queued", "preparing_cv", "ready", "applying",
  "waiting_for_user", "submitted", "skipped", "failed", "retry_scheduled",
]);

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const patch: any = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status;
    if (body.status === "submitted") patch.submittedAt = new Date().toISOString();
  }
  if (body.confidence !== undefined) patch.confidence = Number(body.confidence);
  if (body.error !== undefined) patch.error = body.error;
  if (body.cvId !== undefined) patch.cvId = body.cvId;
  if (body.externalAppId !== undefined) patch.externalAppId = body.externalAppId;

  const app = await applications.update(id, patch);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Keep the linked job status roughly in sync for queued/submitted.
  const job = await jobs.get(app.jobId);
  if (job) {
    if (patch.status === "submitted") await jobs.update(job.id, { status: "submitted" });
    else if (patch.status === "queued" && job.status === "discovered") {
      await jobs.update(job.id, { status: "queued" });
    }
  }
  return NextResponse.json(app);
}
