"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, EmptyState } from "@/components/ui";

interface Answer {
  id: string;
  question: string;
  normalizedIntent: string;
  category: string;
  answer: string;
  source: string;
  confidence: number;
  reusePolicy: string;
  usageCount: number;
  lastConfirmed: string | null;
}

const CAT_STYLE: Record<string, string> = {
  SAFE: "bg-mint/15 text-emerald-700",
  USER_APPROVED: "bg-brand-50 text-brand-700",
  AI_SUGGESTED: "bg-amber-50 text-amber-700",
  SENSITIVE: "bg-coral/10 text-rose-700",
};

export default function AnswersPage() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/answers");
      setAnswers(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function test() {
    if (!question.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const r = await fetch("/api/ai/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      setTestResult(await r.json());
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <div className="animate-pulse h-40 bg-slate-200 rounded-2xl" />;

  return (
    <div>
      <PageHeader title="Answer Memory" subtitle="Reused answers by category. Sensitive questions always require your confirmation." />

      {/* Tester */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-ink-900 mb-1">Try an application question</h3>
        <p className="text-xs text-slate-400 mb-3">Type any question you might see on an application form to see how the system resolves it.</p>
        <div className="flex gap-2">
          <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Are you willing to relocate to Hyderabad?" onKeyDown={(e) => e.key === "Enter" && test()} />
          <button className="btn-primary shrink-0" onClick={test} disabled={testing}>{testing ? "..." : "Resolve"}</button>
        </div>
        {testResult && (
          <div className={`mt-4 rounded-xl p-4 border ${testResult.category === "SENSITIVE" ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${CAT_STYLE[testResult.category] || "bg-slate-100 text-slate-600"}`}>{testResult.category}</span>
              <span className="text-[11px] text-slate-500">source: {testResult.source}</span>
              <span className="text-[11px] text-slate-500">confidence: {testResult.confidence}%</span>
              <span className="text-[11px] text-slate-500">reuse: {testResult.reusePolicy?.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{testResult.answer || (testResult.requiresConfirmation ? "Requires your confirmation — no auto-answer." : "No suggestion available.")}</p>
            {testResult.normalizedIntent && <p className="mt-1 text-xs text-slate-400">intent: {testResult.normalizedIntent}</p>}
          </div>
        )}
      </div>

      {answers.length === 0 ? (
        <EmptyState title="No saved answers" body="Answers you approve get stored here and reused across applications." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {answers.map((a) => (
            <div key={a.id} className="card p-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${CAT_STYLE[a.category] || ""}`}>{a.category}</span>
                <span className="text-[11px] text-slate-400">{a.reusePolicy?.replace(/_/g, " ")}</span>
                {a.usageCount > 0 && <span className="text-[11px] text-slate-400">{a.usageCount}× used</span>}
              </div>
              <p className="text-sm font-medium text-ink-900">{a.question}</p>
              <p className="text-sm text-slate-500 mt-1">{a.answer || <span className="italic text-slate-400">No saved answer (always asks)</span>}</p>
              {a.normalizedIntent && <p className="mt-2 text-[11px] text-slate-300">intent: {a.normalizedIntent}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
