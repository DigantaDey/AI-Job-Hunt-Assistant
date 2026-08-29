// Local encryption for sensitive data at rest (credential vault + stored API keys).
// Uses AES-256-GCM with a key derived from VAULT_KEY (HMAC-SHA256 of the env value).
// Falls back to a stable dev key so the app works out of the box (NOT for production).

import crypto from "crypto";

const FALLBACK_KEY =
  "0000000000000000000000000000000000000000000000000000000000000000";

function getKey(): Buffer {
  const raw = process.env.VAULT_KEY || FALLBACK_KEY;
  return crypto.createHash("sha256").update(raw).digest();
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decrypt(payload: string): string {
  if (!payload) return "";
  try {
    const [ivB64, tagB64, dataB64] = payload.split(".");
    const key = getKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return ""; // wrong key or malformed -> treat as unavailable
  }
}

export function mask(value: string): string {
  if (!value) return "";
  return value.length <= 4 ? "••••" : value.slice(0, 2) + "•".repeat(value.length - 4) + value.slice(-2);
}
