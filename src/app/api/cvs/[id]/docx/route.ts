import { NextResponse } from "next/server";
import { cvs } from "@/lib/store/repos";
import { toDocxBuffer } from "@/lib/export/docx";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const cv = await cvs.get(id);
  if (!cv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await toDocxBuffer(cv);
  const slug = cv.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "cv";

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slug}.docx"`,
    },
  });
}
