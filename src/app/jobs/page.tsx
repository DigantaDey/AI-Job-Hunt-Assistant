"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, ScoreRing, EmptyState } from "@/components/ui";
import { AddJobModal } from "@/components/AddJobModal";
import { JobActions } from "@/components/JobActions";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  domain: string;
  matchScore: number;
  status: string;
  skipReason: string;
  requiredSkills: string[];
  discoveredAt: string;
  url: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/jobs");
      setJobs(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="animate-pulse h-40 bg-slate-200 rounded-2xl" />;

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Discovered & scored opportunities. High matches are auto-queued; low ones are skipped with a reason."
        action={<button onClick={() => setShowAdd(true)} className="btn-primary">+ Add job</button>}
      />

      {jobs.length === 0 ? (
        <EmptyState title="No jobs yet" body="Add a job manually or connect a portal adapter to start discovering opportunities." href="#" cta="Add your first job" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <div key={j.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">{j.title}</p>
                  <p className="text-sm text-slate-500">{j.company}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{j.location} · <span className="capitalize">{j.source}</span> · {j.domain}</p>
                </div>
                <ScoreRing score={j.matchScore} />
              </div>

              {j.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {j.requiredSkills.slice(0, 6).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">{s}</span>
                  ))}
                </div>
              )}

              {j.status === "skipped" && j.skipReason && (
                <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">{j.skipReason}</p>
              )}

              <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">{new Date(j.discoveredAt).toLocaleDateString()}</span>
                <JobActions jobId={j.id} status={j.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  );
}
