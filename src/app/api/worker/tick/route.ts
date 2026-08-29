import { NextResponse } from "next/server";
import { processQueue } from "@/lib/scheduler/worker";

export const runtime = "nodejs";

/** Manually trigger one queue-processing pass. */
export async function POST() {
  const report = await processQueue();
  return NextResponse.json(report);
}
