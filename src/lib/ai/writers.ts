// Cover letter generator + interview coach.
import type { CVContent, Job } from "../store/types";
import { runCompletion } from "./router";

/** Generate a tailored cover letter grounded in the CV. Falls back to a template. */
export async function generateCoverLetter(job: Job, cv: CVContent): Promise<{ text: string; provider: string }> {
  try {
    const res = await runCompletion(
      [
        {
          role: "system",
          content:
            "Write a concise, professional cover letter for the job described. Only reference facts present in " +
            "the candidate CV. Do not invent skills, metrics, companies, or claims. 3-4 short paragraphs, " +
            "ending with a call to action.",
        },
        {
          role: "user",
          content: `Job: ${job.title} at ${job.company} (${job.location}).\nJD summary: ${job.description.slice(0, 600)}\nCandidate CV:\n${JSON.stringify(cv)}`,
        },
      ],
      { task: "cover_letter", temperature: 0.5 },
    );
    return { text: res.text, provider: res.provider };
  } catch {
    return {
      text: `Dear Hiring Team at ${job.company},\n\nI'm excited to apply for the ${job.title} position. With ${cv.skills.join(", ")}, I believe I can contribute meaningfully from day one.\n\n${cv.summary}\n\nI look forward to discussing how my background fits ${job.company}'s goals.\n\nSincerely,\n[Your Name]`,
      provider: "mock",
    };
  }
}

export interface InterviewQuestion {
  id: string;
  question: string;
  kind: "behavioral" | "technical" | "hr";
  sampleAnswer: string;
}

/** Generate interview prep questions for a role. Falls back to a deterministic set. */
export async function generateInterviewQuestions(
  job: Job,
  cv: CVContent,
): Promise<{ questions: InterviewQuestion[]; provider: string }> {
  try {
    const res = await runCompletion(
      [
        {
          role: "system",
          content:
            "You are an interview coach. Generate 5 interview questions tailored to the job and the candidate's " +
            "CV: mix behavioral (STAR), technical, and HR questions. Return JSON: {questions:[{kind,question}]}.",
        },
        {
          role: "user",
          content: `Job: ${job.title} (${job.domain}). Required skills: ${job.requiredSkills.join(", ")}. CV skills: ${cv.skills.join(", ")}.`,
        },
      ],
      { task: "interview", json: true, temperature: 0.5 },
    );
    const parsed = JSON.parse(res.text);
    const questions: InterviewQuestion[] = (parsed.questions || []).map((q: any, i: number) => ({
      id: `iq_${i}_${Date.now().toString(36)}`,
      question: q.question,
      kind: q.kind || "behavioral",
      sampleAnswer: "",
    }));
    return { questions, provider: res.provider };
  } catch {
    return {
      questions: [
        { id: "iq_1", kind: "behavioral", question: "Tell me about a time you disagreed with a teammate on a technical decision.", sampleAnswer: "Use the STAR method: Situation, Task, Action, Result." },
        { id: "iq_2", kind: "technical", question: `Walk me through how you'd design a scalable service for ${job.domain} using ${job.requiredSkills.slice(0, 3).join(", ") || "your core stack"}.`, sampleAnswer: "Discuss architecture, data model, trade-offs, and testing." },
        { id: "iq_3", kind: "technical", question: "How do you debug a production performance issue end to end?", sampleAnswer: "Instrument, isolate, reproduce, fix, verify." },
        { id: "iq_4", kind: "hr", question: `Why do you want to work at ${job.company}?`, sampleAnswer: "Connect the role to your career goals and the company's mission." },
        { id: "iq_5", kind: "hr", question: "Describe a recent project and the impact it had.", sampleAnswer: "Quantify the outcome and what you learned." },
      ],
      provider: "mock",
    };
  }
}
