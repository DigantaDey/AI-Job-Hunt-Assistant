import { NextResponse } from "next/server";
import { candidates } from "@/lib/store/repos";
import * as db from "@/lib/store/db";
import { Collections } from "@/lib/store/repos";

export const runtime = "nodejs";

export async function GET() {
  try {
    const c = await candidates.first();
    return NextResponse.json(c || null);
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(null);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const existing = await candidates.first();
    if (existing) {
      const updated = await db.update(Collections.candidates, existing.id, body);
      return NextResponse.json(updated);
    }
    const created = await db.create(Collections.candidates, { id: "cand_1", ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return NextResponse.json(created);
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
