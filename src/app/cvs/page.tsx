"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, EmptyState } from "@/components/ui";

interface CV {
  id: string;
  name: string;
  type: string;
  isMaster: boolean;
  matchScore: number;
  usageCount: number;
  version: number;
  updatedAt: string;
  content: any;
}

const TYPE_LABEL: Record<string, string> = {
  MASTER: "Master",
  AI_GENERATED: "AI-tailored",
  HUMAN_UPLOADED: "Uploaded",
};

export default function CVsPage() {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/cvs");
      setCvs(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="animate-pulse h-40 bg-slate-200 rounded-2xl" />;

  return (
    <div>
      <PageHeader title="CV Library" subtitle="Master, AI-tailored, and uploaded versions. Tailoring never invents facts beyond your master CV." />
      {cvs.length === 0 ? (
        <EmptyState title="No CVs yet" body="Tailor a CV for any job from the Jobs page to start building your library." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map((cv) => (
            <div key={cv.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink-900">{cv.name}</p>
                  <span className={`mt-1 inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${cv.isMaster ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {cv.isMaster ? "Master" : TYPE_LABEL[cv.type] || cv.type}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-600">{cv.matchScore || "—"}</p>
                  <p className="text-[10px] text-slate-400">match %</p>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p><b>Skills:</b> {cv.content?.skills?.slice(0, 6).join(", ")}</p>
                <p><b>Exp:</b> {cv.content?.experience?.length} roles · <b>v</b>{cv.version}</p>
              </div>

              <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">{cv.usageCount} uses</span>
                <a href={`/api/cvs/${cv.id}/docx`} className="btn-ghost !px-3 !py-1.5 !text-xs">Download .docx</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
