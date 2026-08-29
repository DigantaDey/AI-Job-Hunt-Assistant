import { NextResponse } from "next/server";
import { candidates, answers } from "@/lib/store/repos";

export const runtime = "nodejs";

export async function GET() {
  const candidate = await candidates.first();
  if (!candidate) return NextResponse.json([]);
  const all = await answers.list(candidate.id);
  return NextResponse.json([...all].sort((a, b) => a.category.localeCompare(b.category)));
}

export async function POST(req: Request) {
  const candidate = await candidates.first();
  if (!candidate) return NextResponse.json({ error: "No candidate profile" }, { status: 400 });
  const body = await req.json();

  if (!body.question || body.answer === undefined) {
    return NextResponse.json({ error: "question and answer required" }, { status: 400 });
  }

  const created = await answers.create({
    candidateId: candidate.id,
    question: body.question,
    normalizedIntent: body.normalizedIntent || "",
    category: body.category || "USER_APPROVED",
    answer: body.answer,
    source: body.source || "user",
    confidence: Number(body.confidence ?? 100),
    reusePolicy: body.reusePolicy || "ask_once_then_reuse",
    lastConfirmed: new Date().toISOString(),
    usageCount: 0,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json(created, { status: 201 });
}
