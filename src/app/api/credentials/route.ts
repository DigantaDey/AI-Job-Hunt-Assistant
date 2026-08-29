import { NextResponse } from "next/server";
import { credentials } from "@/lib/store/repos";
import { encrypt } from "@/lib/crypto";
import type { Credential } from "@/lib/store/types";

export const runtime = "nodejs";

/** Returns credentials with passwords masked; raw decryption only via POST /reveal. */
export async function GET() {
  const all = await credentials.list();
  const safe = all.map((c) => ({
    ...c,
    password: "•".repeat(Math.min(8, Math.max(4, c.password.length))),
  }));
  return NextResponse.json(safe);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.domain || !body.username || !body.password) {
    return NextResponse.json({ error: "domain, username, password required" }, { status: 400 });
  }
  const created = await credentials.create({
    domain: body.domain,
    username: encrypt(body.username),
    password: encrypt(body.password),
    notes: body.notes || "",
    linkedApplicationId: body.linkedApplicationId || null,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json(maskCredential(created), { status: 201 });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const ok = await credentials.remove(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

function maskCredential(c: Credential) {
  return { ...c, password: "•".repeat(Math.min(8, Math.max(4, c.password.length))) };
}
