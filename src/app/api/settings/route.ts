import { NextResponse } from "next/server";
import { settings } from "@/lib/store/repos";
import { encrypt, mask } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET() {
  const s = await settings.get();
  if (!s) {
    return NextResponse.json({ provider: "mock", model: "mock", baseUrl: "" });
  }
  return NextResponse.json({
    provider: s.provider || "mock",
    model: s.model || "mock",
    baseUrl: s.baseUrl || "",
    // never return the raw/decrypted key to the client
    keyConfigured: Boolean(s.apiKeyEncrypted),
    keyMasked: s.apiKeyEncrypted ? mask("sk-abcdefghijkl") : "",
  });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { provider, model, apiKey, baseUrl } = body;

  const current = await settings.get();
  const patch: any = {
    provider: provider || "mock",
    model: model || "",
    baseUrl: baseUrl || "",
  };
  // Only overwrite stored key if a new one is supplied.
  if (apiKey) patch.apiKeyEncrypted = encrypt(apiKey);

  const s = await settings.upsert({
    ...patch,
    apiKeyEncrypted: apiKey ? patch.apiKeyEncrypted : current?.apiKeyEncrypted || "",
  });

  return NextResponse.json({
    provider: s.provider,
    model: s.model,
    baseUrl: s.baseUrl,
    keyConfigured: Boolean(s.apiKeyEncrypted),
  });
}
