// Answer memory + suggestion (FINAL_PLAN §11).
// - Normalizes a raw question into a semantic intent (via rules; AI optional).
// - Looks up the answer memory for reuse.
// - Suggests an AI answer with a confidence score and a category/action.

import type { AnswerCategory, AnswerMemory, Candidate, ReusePolicy } from "../store/types";
import { answers } from "../store/repos";
import { runCompletion } from "./router";

export interface AnswerResolution {
  resolved: boolean;
  answer: string;
  source: "memory" | "ai" | "none";
  category: AnswerCategory;
  reusePolicy: ReusePolicy;
  confidence: number;
  requiresConfirmation: boolean;
  fromMemory?: AnswerMemory;
}

// --- Rule-based intent normalization ---
export function normalizeIntent(question: string): string {
  const q = question.toLowerCase();
  if (/(relocate|relocation|relocating|transfer to)/.test(q)) return "relocation_willingness.location_specific";
  if (/(notice period)/.test(q)) return "availability.notice_period";
  if (/(current).*(ctc|salary|compensation)/.test(q)) return "compensation.current_ctc";
  if (/(expected).*(ctc|salary|compensation)/.test(q)) return "compensation.expected_ctc";
  if (/(years|experience).*(react|js|node|java)/.test(q)) return "experience.relevant_years";
  if (/(work mode|remote|hybrid|onsite|wfh)/.test(q)) return "preference.work_mode";
  if (/(conviction|criminal|legal)/.test(q)) return "legal.criminal_disclosure";
  if (/(work authorization|authorized to work|visa|sponsorship)/.test(q)) return "legal.work_authorization";
  if (/(race|ethnicity|gender|disability|veteran|religion)/.test(q)) return "demographic.disclosure";
  if (/(why).*(company|us|join)/.test(q)) return "motivation.why_company";
  return "unknown.generic";
}

const SENSITIVE_INTENTS = new Set([
  "legal.criminal_disclosure",
  "legal.work_authorization",
  "demographic.disclosure",
]);

export function classifyCategory(intent: string): AnswerCategory {
  if (SENSITIVE_INTENTS.has(intent)) return "SENSITIVE";
  if (intent.startsWith("compensation") || intent.startsWith("availability") || intent.startsWith("relocation")) {
    return "USER_APPROVED";
  }
  return "AI_SUGGESTED";
}

export function defaultReuse(category: AnswerCategory): ReusePolicy {
  if (category === "SENSITIVE") return "always_confirm";
  if (category === "USER_APPROVED") return "ask_once_then_reuse";
  if (category === "SAFE") return "auto_fill";
  return "ask";
}

// --- Resolution pipeline ---
export async function resolveAnswer(
  question: string,
  candidate: Candidate,
  candidateId: string,
): Promise<AnswerResolution> {
  const intent = normalizeIntent(question);
  const category = classifyCategory(intent);

  // 1. Exact intent match from memory.
  const memory = await answers.matchIntent(candidateId, intent);
  if (memory && memory.answer) {
    await answers.update(memory.id, { usageCount: memory.usageCount + 1 });
    return {
      resolved: true,
      answer: memory.answer,
      source: "memory",
      category: memory.category,
      reusePolicy: memory.reusePolicy,
      confidence: memory.confidence,
      requiresConfirmation: category === "SENSITIVE" || memory.reusePolicy === "always_confirm",
      fromMemory: memory,
    };
  }

  // 2. Sensitive always requires confirmation and never auto-answers.
  if (category === "SENSITIVE") {
    return {
      resolved: false,
      answer: "",
      source: "none",
      category,
      reusePolicy: "always_confirm",
      confidence: 0,
      requiresConfirmation: true,
    };
  }

  // 3. AI suggestion (falls back to none on failure).
  try {
    const res = await runCompletion(
      [
        {
          role: "system",
          content:
            "You are a job-application question answerer. Give a concise, professional, truthful answer " +
            "grounded in the candidate profile. NEVER invent facts. Respond with JSON: {answer:string, " +
            "confidence:number 0-100}. If the question is sensitive (legal, demographic, criminal, visa), " +
            "respond {answer:\"\", confidence:0, sensitive:true}.",
        },
        {
          role: "user",
          content: `Question: ${question}\nCandidate: ${candidate.fullName}, ${candidate.currentRole}, ${candidate.experienceYears} yrs, location ${candidate.location}`,
        },
      ],
      { task: "answer_suggest", json: true, temperature: 0.3 },
    );
    const parsed = JSON.parse(res.text);
    const requiresConfirm = parsed.sensitive === true;
    return {
      resolved: (parsed.confidence || 0) >= 60,
      answer: parsed.answer || "",
      source: "ai",
      category,
      reusePolicy: defaultReuse(category),
      confidence: parsed.confidence || 40,
      requiresConfirmation: requiresConfirm,
    };
  } catch {
    return {
      resolved: false,
      answer: "",
      source: "none",
      category,
      reusePolicy: defaultReuse(category),
      confidence: 0,
      requiresConfirmation: true,
    };
  }
}
