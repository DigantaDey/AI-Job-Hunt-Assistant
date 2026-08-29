import { NextResponse } from "next/server";
import { answers } from "@/lib/store/repos";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const patch: any = {};
  if (body.answer !== undefined) patch.answer = body.answer;
  if (body.category !== undefined) patch.category = body.category;
  if (body.reusePolicy !== undefined) patch.reusePolicy = body.reusePolicy;
  if (body.confidence !== undefined) patch.confidence = Number(body.confidence);
  if (body.lastConfirmed !== undefined) patch.lastConfirmed = body.lastConfirmed;

  const updated = await answers.update(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ok = await answers.remove(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
