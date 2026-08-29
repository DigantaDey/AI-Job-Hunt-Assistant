import { NextResponse } from "next/server";
import { candidates } from "@/lib/store/repos";
import { resolveAnswer } from "@/lib/ai/answerSuggester";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { question } = await req.json();
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });

  const candidate = await candidates.first();
  if (!candidate) return NextResponse.json({ error: "No candidate profile" }, { status: 400 });

  const result = await resolveAnswer(question, candidate, candidate.id);
  return NextResponse.json(result);
}
