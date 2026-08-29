// Mock / deterministic AI provider. Ships with the app so it works with zero
// API keys. Produces plausible-but-clearly-template output; marks provenance
// so the UI can tell users this is a simulation and not a real LLM.

import type { AIProvider, ChatMessage, CompletionOptions, CompletionResult } from "./types";

function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

function systemTaskHint(opts: CompletionOptions): string {
  switch (opts.task) {
    case "jd_parse": return "JD parser";
    case "job_match": return "Job matcher";
    case "answer_suggest": return "Answer suggester";
    case "cv_tailor": return "CV tailor";
    case "cover_letter": return "Cover letter generator";
    case "interview": return "Interview coach";
    case "classify": return "Failure classifier";
  }
}

export class MockProvider implements AIProvider {
  id = "mock";
  model = "mock";
  available = true;

  async complete(
    _messages: ChatMessage[],
    _opts: CompletionOptions,
  ): Promise<CompletionResult> {
    throw new Error("MockProvider.complete must be called through the router");
  }

  async respond(msgs: { role: string; content: string }[], opts: CompletionOptions): Promise<CompletionResult> {
    const user = msgs.filter((m) => m.role === "user").map((m) => m.content).join("\n");
    const isJson = opts.json;

    let body = "";
    switch (opts.task) {
      case "job_match": body = this.matchOutput(); break;
      case "answer_suggest": body = this.answerOutput(user); break;
      case "classify": body = this.classifyOutput(user); break;
      case "interview": body = isJson ? this.interviewJson() : this.interviewOutput(); break;
      case "jd_parse": body = isJson ? this.jdParseJson(user) : this.structuredOutput(user); break;
      case "cv_tailor": body = isJson ? this.cvTailorJson(user) : this.structuredOutput(user); break;
      case "cover_letter": body = isJson ? JSON.stringify({ text: this.structuredOutput(user), mock: true }) : this.structuredOutput(user); break;
      default: body = this.structuredOutput(user);
    }

    const inputTokens = msgs.reduce((s, m) => s + estimateTokens(m.content), 0);
    const outputTokens = estimateTokens(body);

    if (isJson) {
      // Ensure the body is parseable JSON; if a task didn't produce JSON, wrap it.
      try { JSON.parse(body); } catch { body = JSON.stringify({ mock: true, text: body }); }
    }

    return { text: body, inputTokens, outputTokens, provider: this.id, model: this.model };
  }

  private structuredOutput(user: string): string {
    const subject = user.split("\n").find((l) => /job title|role|position/i.test(l))?.split(":")[1]?.trim() || "the role";
    return [
      `# Draft`,
      ``,
      `This is a template draft tailored toward ${subject}. In the live product the AI provider rewrites this ` +
        `section using only facts present in your master CV.`,
      ``,
      `## Suggested summary`,
      `Full-stack engineer focused on ${subject}, with hands-on experience across the product lifecycle.`,
      ``,
      `## Highlight bullets`,
      `- Drove measurable improvements in performance and reliability of production systems.`,
      `- Collaborated across teams to ship user-facing features end to end.`,
      ``,
      `> Truthfulness guardrail: every claim above is a placeholder. The CV engine validates all generated ` +
        `content against the master CV and strips anything that cannot be sourced.`,
    ].join("\n");
  }

  private jdParseJson(user: string): string {
    const skills = ["React", "TypeScript", "Node.js"];
    return JSON.stringify({
      title: (user.match(/Job title: (.+)/)?.[1] || "").trim(),
      company: (user.match(/Company: (.+)/)?.[1] || "").trim(),
      requiredSkills: skills,
      preferredSkills: [],
      experienceYears: 4,
      domain: "SaaS",
      keyResponsibilities: ["Build user-facing features", "Improve performance"],
    });
  }

  private cvTailorJson(user: string): string {
    // Re-emphasize the master skills mentioned in the job description.
    return JSON.stringify({
      summary: "Product-minded full-stack engineer focused on building scalable, user-facing software.",
      skills: ["React", "TypeScript", "Node.js", "Next.js", "PostgreSQL", "AWS"],
      experience: [
        { title: "Full-Stack Developer", company: "Cloudworks Tech", startDate: "2022-01", endDate: "Present", bullets: ["Built a multi-tenant SaaS dashboard used by 40k+ monthly users.", "Reduced p95 API latency by 38% via query optimization."] },
        { title: "Frontend Engineer", company: "PayNex", startDate: "2019-06", endDate: "2021-12", bullets: ["Developed a payments reconciliation UI in React.", "Introduced a component design system."] },
      ],
      education: [{ degree: "B.Tech Computer Science", institution: "NIT Trichy", year: "2019" }],
      projects: [{ name: "CareConnect", description: "Telehealth appointment platform", tech: ["Next.js", "PostgreSQL", "AWS"] }],
      certifications: ["AWS Solutions Architect - Associate"],
    });
  }

  private matchOutput(): string {
    return JSON.stringify({
      scores: { requiredSkills: 78, title: 84, experience: 90, location: 100, domain: 70, salary: 85, freshness: 95 },
      total: 85,
      matchedRequired: ["React", "TypeScript"],
      missingRequired: [],
      reasons: ["Strong skill overlap", "Location matches preference"],
      verdict: "strong",
    });
  }

  private answerOutput(question: string): string {
    const lower = question.toLowerCase();
    if (/(notice period)/.test(lower)) {
      return JSON.stringify({ confidence: 95, answer: "30 days", category: "USER_APPROVED" });
    }
    if (/(relocate|relocation)/.test(lower)) {
      return JSON.stringify({ confidence: 70, answer: "Open to relocating for the right role.", category: "AI_SUGGESTED" });
    }
    if (/(expected|current).*(ctc|salary|compensation)/.test(lower)) {
      return JSON.stringify({ confidence: 85, answer: "Based on your saved preferences.", category: "USER_APPROVED" });
    }
    if (/(why).*(company|us)/.test(lower)) {
      return JSON.stringify({ confidence: 55, answer: "I'm excited by the opportunity to build impactful products and grow with the team.", category: "AI_SUGGESTED" });
    }
    if (/(conviction|criminal|legal|race|gender|disabilit)/.test(lower)) {
      return JSON.stringify({ confidence: 0, answer: "", category: "SENSITIVE", sensitive: true });
    }
    return JSON.stringify({ confidence: 40, answer: "Draft answer available after review.", category: "AI_SUGGESTED" });
  }

  private classifyOutput(error: string): string {
    return JSON.stringify({
      category: "unknown_field",
      reason: "Could not map an unknown form field",
      detail: error.slice(0, 160),
      suggestedAction: "ask_user",
      confidence: 60,
    });
  }

  private interviewJson(): string {
    return JSON.stringify({
      questions: [
        { kind: "behavioral", question: "Tell me about a time you disagreed with a teammate on a technical decision." },
        { kind: "technical", question: "How do you approach debugging a production performance issue end to end?" },
        { kind: "technical", question: "Walk me through how you'd design a resilient API service for this domain." },
        { kind: "hr", question: "Why do you want to work here?" },
        { kind: "hr", question: "Describe a project you're proud of and the impact it had." },
      ],
    });
  }

  private interviewOutput(): string {
    return [
      "Mock interview coach — enable a real provider for dynamic role-play.",
      "",
      "Sample behavioral question: Tell me about a time you disagreed with a teammate on a technical decision.",
      "Suggested STAR answer structure: Situation → Task → Action → Result.",
    ].join("\n");
  }
}
