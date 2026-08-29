// Canonical portal-adapter metadata & payload normalization.
// The DOM extractors live in the Chrome extension (extension/content/portal.js
// and generic.js). They emit the RawJobInput contract below; this module is the
// server-side contract used to tag and validate what the extension sends.

import type { RawJobInput } from "../engine/ingest";
import type { WorkMode } from "../store/types";

export interface AdapterMeta {
  id: string;               // matches Job.source
  label: string;
  hostPatterns: RegExp[];
  scope: string;            // MVP scope description
  autonomy: string;         // allowed autonomy modes
  autoSubmit: boolean;      // false = assisted fill only
}

export const ADAPTERS: AdapterMeta[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    hostPatterns: [/linkedin\.com\/jobs/i],
    scope: "Discovery, analysis, preparation, assisted filling with user confirmation.",
    autonomy: "assist, smart_apply",
    autoSubmit: false,
  },
  {
    id: "naukri",
    label: "Naukri",
    hostPatterns: [/naukri\.com/i],
    scope: "Quick/easy apply (first full adapter after policy + technical validation).",
    autonomy: "assist, smart_apply, supervised_auto",
    autoSubmit: false,
  },
  {
    id: "indeed",
    label: "Indeed",
    hostPatterns: [/indeed\.(com|co\.in)/i],
    scope: "Assisted filling with user confirmation.",
    autonomy: "assist, smart_apply",
    autoSubmit: false,
  },
  {
    id: "generic",
    label: "Generic (JSON-LD/meta)",
    hostPatterns: [/.+/],
    scope: "Any site with structured job data; assisted filling.",
    autonomy: "assist, smart_apply",
    autoSubmit: false,
  },
];

/** Given a URL, return the adapter metadata (defaults to generic). */
export function adapterForUrl(url: string): AdapterMeta {
  const match = ADAPTERS.find((a) => a.id !== "generic" && a.hostPatterns.some((r) => r.test(url)));
  return match || ADAPTERS[ADAPTERS.length - 1];
}

/** Validate/normalize a payload coming from an adapter or the extension. */
export function normalizeAdapterPayload(raw: any): RawJobInput {
  const workMode: WorkMode = ["remote", "hybrid", "onsite", "any"].includes(raw.workMode)
    ? raw.workMode
    : "any";
  return {
    title: String(raw.title || "").trim(),
    company: String(raw.company || "").trim(),
    externalId: String(raw.externalId || ""),
    source: ADAPTERS.some((a) => a.id === raw.source) ? raw.source : "api",
    location: String(raw.location || ""),
    workMode,
    description: String(raw.description || ""),
    domain: String(raw.domain || ""),
    salaryMin: Number(raw.salaryMin) || 0,
    salaryMax: Number(raw.salaryMax) || 0,
    requiredSkills: Array.isArray(raw.requiredSkills) ? raw.requiredSkills.map(String) : [],
    preferredSkills: Array.isArray(raw.preferredSkills) ? raw.preferredSkills.map(String) : [],
    url: String(raw.url || ""),
    postedAt: raw.postedAt || null,
  };
}
