"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatCard, StatusBadge, PageHeader } from "@/components/ui";

interface Dash {
  candidate: { name: string; role: string } | null;
  counts: Record<string, number>;
  totals: Record<string, number>;
  trend: { date: string; count: number }[];
  avgScore: number;
  scoreDistribution: { high: number; mid: number; low: number };
  bySource: [string, number][];
  byCompany: [string, number][];
  tokens: { input: number; output: number; total: number; cost: number };
  credentialsCreated: number;
  appsWithJob: any[];
}

export default function DashboardPage() {
  const [dash, setDash] = useState<Dash | null>(null);
  const [worker, setWorker] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setDash).catch(() => {});
    fetch("/api/worker/status").then((r) => r.json()).then(setWorker).catch(() => {});
  }, []);

  if (!dash) {
    return <div className="animate-pulse space-y-4"><div className="h-10 bg-slate-200 rounded-xl w-64" /><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="h-24 bg-slate-200 rounded-2xl" /><div className="h-24 bg-slate-200 rounded-2xl" /><div className="h-24 bg-slate-200 rounded-2xl" /><div className="h-24 bg-slate-200 rounded-2xl" /></div></div>;
  }

  const maxTrend = Math.max(1, ...dash.trend.map((t) => t.count));
  const recent = dash.appsWithJob.slice(0, 6);

  return (
    <div>
      <PageHeader
        title={dash.candidate ? `Welcome back, ${dash.candidate.name.split(" ")[0]}` : "Job Hunt Assistant"}
        subtitle={dash.candidate ? `Pipeline overview · ${dash.candidate.role}` : "Set up your profile in Settings to get started"}
        action={
          <Link href="/jobs" className="btn-primary">+ Add job</Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Applied" value={dash.totals.submitted} hint="total submitted" tone="good" />
        <StatCard label="Queued" value={dash.totals.discovered} hint="discovered jobs" />
        <StatCard label="Needs you" value={dash.totals.waiting} hint="waiting for input" tone="warn" />
        <StatCard label="Failed" value={dash.totals.failed} hint="application errors" tone="bad" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Trend */}
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Application activity</h2>
            <span className="text-xs text-slate-400">14 days</span>
          </div>
          <div className="flex items-end gap-1 h-32">
            {dash.trend.map((t) => (
              <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-brand-500 to-brand-400"
                  style={{ height: `${Math.max(4, (t.count / maxTrend) * 100)}%` }}
                  title={`${t.date}: ${t.count}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-[11px] text-slate-400">Daily applications (incl. submitted + queued)</div>
        </div>

        {/* Score distribution */}
        <div className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-4">Match scores</h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-4xl font-bold">{dash.avgScore}</div>
            <div className="text-xs text-slate-400">avg. match score across jobs</div>
          </div>
          <div className="space-y-2">
            {[
              { label: "High (75+)", v: dash.scoreDistribution.high, c: "bg-mint" },
              { label: "Mid (55-74)", v: dash.scoreDistribution.mid, c: "bg-amber" },
              { label: "Low (<55)", v: dash.scoreDistribution.low, c: "bg-coral" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-slate-500">{b.label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${b.c}`} style={{ width: `${Math.min(100, b.v * 8)}%` }} />
                </div>
                <span className="w-4 text-right font-semibold">{b.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Automation status */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink-900">Automation</h2>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${worker?.schedulerEnabled === false ? "text-slate-400" : "text-emerald-600"}`}>
              <span className={`h-2 w-2 rounded-full ${worker?.schedulerEnabled === false ? "bg-slate-300" : "bg-mint"}`} />
              {worker?.schedulerEnabled === false ? "paused" : "running"}
            </span>
          </div>
          <div className="text-3xl font-bold uppercase text-brand-600 mb-1">{worker?.lastReport?.mode || "—"}</div>
          <p className="text-xs text-slate-400">autonomy mode</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-[11px] text-slate-400">processed</p>
              <p className="font-semibold">{worker?.lastReport?.processed ?? 0}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-[11px] text-slate-400">submitted today</p>
              <p className="font-semibold">{worker?.lastReport?.submittedToday ?? 0}/{worker?.lastReport?.dailyCap ?? 8}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">Last run: {worker?.lastReport ? new Date(worker.lastReport.at).toLocaleTimeString() : "not yet"}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Sources */}
        <div className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-3">By source</h2>
          {dash.bySource.length === 0 ? <p className="text-sm text-slate-400">No data yet</p> : (
            <div className="space-y-2">
              {dash.bySource.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-slate-600">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-3">Token usage</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Input</p>
              <p className="text-lg font-bold">{dash.tokens.total.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Est. cost</p>
              <p className="text-lg font-bold">${dash.tokens.cost.toFixed(4)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">{dash.credentialsCreated} credential(s) in vault</p>
        </div>
      </div>

      {/* Recent applications */}
      <div className="card p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink-900">Recent applications</h2>
          <Link href="/applications" className="text-sm text-brand-600 font-medium hover:underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-400">No applications yet. Add jobs to start.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm text-ink-900">{a.job?.title}</p>
                  <p className="text-xs text-slate-400">{a.job?.company} · {a.job?.location}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
