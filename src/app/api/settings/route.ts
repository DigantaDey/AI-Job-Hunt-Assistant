import { NextResponse } from "next/server";
import { settings } from "@/lib/store/repos";
import { encrypt, mask } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET() {
  try {
    const s = await settings.get();
    if (!s) {
      return NextResponse.json({ provider: "mock", model: "mock", baseUrl: "", schedulerEnabled: true });
    }
    return NextResponse.json({
      provider: s.provider || "mock",
      model: s.model || "mock",
      baseUrl: s.baseUrl || "",
      schedulerEnabled: typeof s.schedulerEnabled === "boolean" ? s.schedulerEnabled : true,
      schedulerIntervalSec: s.schedulerIntervalSec || 20,
      keyConfigured: Boolean(s.apiKeyEncrypted),
      keyMasked: s.apiKeyEncrypted ? mask("sk-abcdefghijkl") : "",
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ provider: "mock", model: "mock", baseUrl: "", schedulerEnabled: true });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { provider, model, apiKey, baseUrl, schedulerEnabled, schedulerIntervalSec } = body;

    const current = await settings.get();
    const patch: any = {
      provider: provider || "mock",
      model: model || "",
      baseUrl: baseUrl || "",
    };
    if (apiKey) patch.apiKeyEncrypted = encrypt(apiKey);
    if (typeof schedulerEnabled === "boolean") patch.schedulerEnabled = schedulerEnabled;
    if (schedulerIntervalSec) patch.schedulerIntervalSec = Number(schedulerIntervalSec);

    const s = await settings.upsert({
      ...patch,
      apiKeyEncrypted: apiKey ? patch.apiKeyEncrypted : current?.apiKeyEncrypted || "",
    });

    return NextResponse.json({
      provider: s.provider,
      model: s.model,
      baseUrl: s.baseUrl,
      schedulerEnabled: s.schedulerEnabled ?? true,
      schedulerIntervalSec: s.schedulerIntervalSec || 20,
      keyConfigured: Boolean(s.apiKeyEncrypted),
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
