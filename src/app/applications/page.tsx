"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";

const COLUMNS = [
  { status: "queued", label: "Queued" },
  { status: "preparing_cv", label: "Preparing CV" },
  { status: "waiting_for_user", label: "Needs you" },
  { status: "submitted", label: "Submitted" },
  { status: "failed", label: "Failed" },
  { status: "skipped", label: "Skipped" },
];

interface AppItem {
  id: string;
  status: string;
  confidence: number;
  error: string;
  externalAppId: string;
  job: { id: string; title: string; company: string; location: string; matchScore: number; source: string } | null;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/applications");
      setApps(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function markSubmitted(id: string) {
    await setStatus(id, "submitted");
  }

  if (loading) return <div className="animate-pulse h-40 bg-slate-200 rounded-2xl" />;

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Your supervised application queue — statuses per your plan (discovered → qualified → queued → preparing_cv → ready → applying → submitted)"
        action={<button onClick={load} className="btn-ghost">Refresh</button>}
      />

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
        {COLUMNS.map((col) => {
          const colApps = apps.filter((a) => a.status === col.status);
          return (
            <div key={col.status} className="bg-slate-100/70 rounded-2xl p-2 min-h-[120px]">
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{col.label}</span>
                <span className="text-xs text-slate-400">{colApps.length}</span>
              </div>
              <div className="space-y-2">
                {colApps.map((a) => {
                  const job = a.job;
                  return (
                  <div key={a.id} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                    <p className="font-medium text-sm text-ink-900 leading-tight">{job?.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{job?.company}</p>
                    {job && job.matchScore > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                          <span className="inline-flex px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[11px] font-semibold">
                            {job.matchScore}% match
                          </span>
                        </div>
                      )}
                    {a.error && <p className="mt-2 text-[11px] text-rose-600">{a.error}</p>}
                    {a.externalAppId && <p className="mt-1 text-[10px] text-slate-400">App ID: {a.externalAppId}</p>}

                    {col.status === "waiting_for_user" && (
                      <div className="mt-2 flex gap-1.5">
                        <button onClick={() => setStatus(a.id, "submitted")} className="btn-primary !px-2 !py-1 !text-xs">Submit</button>
                        <button onClick={() => setStatus(a.id, "failed")} className="btn-ghost !px-2 !py-1 !text-xs">Fail</button>
                      </div>
                    )}
                    {col.status === "queued" && (
                      <button onClick={() => setStatus(a.id, "preparing_cv")} className="btn-primary !px-2 !py-1 !text-xs mt-2 w-full">Prepare CV</button>
                    )}
                    {col.status === "failed" && (
                      <button onClick={() => setStatus(a.id, "retry_scheduled")} className="btn-ghost !px-2 !py-1 !text-xs mt-2 w-full">Schedule retry</button>
                    )}
                    {col.status === "submitted" && (
                      <div className="mt-2"><StatusBadge status="submitted" /></div>
                    )}
                  </div>
                  );
                })}
                {colApps.length === 0 && (
                  <div className="text-[11px] text-slate-400 text-center py-4 border border-dashed border-slate-300 rounded-xl">
                    empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
