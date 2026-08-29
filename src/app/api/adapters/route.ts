import { NextResponse } from "next/server";
import { ADAPTERS } from "@/lib/adapters";

export const runtime = "nodejs";

/** List known portal adapters (metadata for the UI/docs). */
export async function GET() {
  return NextResponse.json({
    adapters: ADAPTERS.map((a) => ({
      id: a.id,
      label: a.label,
      scope: a.scope,
      autonomy: a.autonomy,
      autoSubmit: a.autoSubmit,
    })),
    note: "DOM extraction runs in the Chrome extension (extension/). This endpoint documents the server-side adapter contract.",
  });
}
