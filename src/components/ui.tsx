"use client";

import Link from "next/link";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-mint"
      : tone === "warn"
      ? "text-amber"
      : tone === "bad"
      ? "text-coral"
      : "text-ink-900";
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: "bg-mint/15 text-emerald-700 border-emerald-200",
    queued: "bg-brand-50 text-brand-700 border-brand-200",
    ready: "bg-sky-50 text-sky-700 border-sky-200",
    applying: "bg-indigo-50 text-indigo-700 border-indigo-200",
    preparing_cv: "bg-violet-50 text-violet-700 border-violet-200",
    waiting_for_user: "bg-amber-50 text-amber-700 border-amber-200",
    discovered: "bg-slate-100 text-slate-600 border-slate-200",
    qualified: "bg-teal-50 text-teal-700 border-teal-200",
    skipped: "bg-slate-100 text-slate-400 border-slate-200",
    failed: "bg-coral/10 text-rose-700 border-rose-200",
    retry_scheduled: "bg-orange-50 text-orange-700 border-orange-200",
  };
  const cls = map[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#34d399" : score >= 55 ? "#fbbf24" : "#fb7185";
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-ink-900"
        style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #e2e8f0 0deg)` }}
      >
        <span className="bg-white rounded-full h-8 w-8 flex items-center justify-center">{score}</span>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mb-4">⌕</div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{body}</p>
      {href && cta && (
        <Link href={href} className="btn-primary mt-5">
          {cta}
        </Link>
      )}
    </div>
  );
}
