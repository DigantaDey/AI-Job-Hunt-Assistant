import { NextResponse } from "next/server";
import { searchConfigs, candidates } from "@/lib/store/repos";
import * as db from "@/lib/store/db";
import { Collections } from "@/lib/store/repos";
import type { WorkMode, AutonomyMode } from "@/lib/store/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const candidate = await candidates.first();
    if (!candidate) return NextResponse.json(null);
    return NextResponse.json(await searchConfigs.forCandidate(candidate.id));
  } catch (error) {
    console.error("GET /api/search-config error:", error);
    return NextResponse.json(null);
  }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json();
    const candidate = await candidates.first();
    if (!candidate) return NextResponse.json({ error: "No candidate profile" }, { status: 400 });

    const existing = await searchConfigs.forCandidate(candidate.id);
    const data = {
      candidateId: candidate.id,
      mustHaveSkills: b.mustHaveSkills || [],
      preferredSkills: b.preferredSkills || [],
      targetTitles: b.targetTitles || [],
      excludedTitles: b.excludedTitles || [],
      locations: b.locations || [],
      workMode: (b.workMode as WorkMode) || "any",
      salaryMin: Number(b.salaryMin) || 0,
      salaryMax: Number(b.salaryMax) || 0,
      experienceMin: Number(b.experienceMin) || 0,
      experienceMax: Number(b.experienceMax) || 30,
      freshnessDays: Number(b.freshnessDays) || 30,
      companiesInclude: b.companiesInclude || [],
      companiesExclude: b.companiesExclude || [],
      minMatchScore: Number(b.minMatchScore) || 60,
      maxApplicationsPerDay: Number(b.maxApplicationsPerDay) || 8,
      autonomyMode: (b.autonomyMode as AutonomyMode) || "smart_apply",
    };

    if (existing) {
      const updated = await db.update(Collections.searchConfigs, existing.id, data as any);
      return NextResponse.json(updated);
    }
    const created = await db.create(Collections.searchConfigs, { id: "cfg_1", ...data, updatedAt: new Date().toISOString() } as any);
    return NextResponse.json(created);
  } catch (error) {
    console.error("PUT /api/search-config error:", error);
    return NextResponse.json({ error: "Failed to save search config" }, { status: 500 });
  }
}
