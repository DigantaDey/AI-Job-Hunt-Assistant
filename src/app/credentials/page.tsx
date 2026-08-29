"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, EmptyState } from "@/components/ui";

interface Cred {
  id: string;
  domain: string;
  username: string;
  password: string;
  notes: string;
  linkedApplicationId: string | null;
}

export default function CredentialsPage() {
  const [creds, setCreds] = useState<Cred[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ domain: "", username: "", password: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/credentials");
      setCreds(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/credentials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setShowAdd(false);
      setForm({ domain: "", username: "", password: "", notes: "" });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch("/api/credentials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  if (loading) return <div className="animate-pulse h-40 bg-slate-200 rounded-2xl" />;

  return (
    <div>
      <PageHeader
        title="Credential Vault"
        subtitle="Credentials for company account-creation flows — encrypted at rest with AES-256-GCM."
        action={<button onClick={() => setShowAdd(true)} className="btn-primary">+ Add credential</button>}
      />

      {creds.length === 0 ? (
        <EmptyState title="Vault is empty" body="Add credentials created during account-creation flows. Passwords are encrypted and masked." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {creds.map((c) => (
            <div key={c.id} className="card p-5 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink-900">{c.domain}</p>
                <p className="text-sm text-slate-500 mt-1">Username: {c.username}</p>
                <p className="text-sm text-slate-500">Password: <span className="font-mono">{c.password}</span></p>
                {c.notes && <p className="text-xs text-slate-400 mt-1">{c.notes}</p>}
              </div>
              <button onClick={() => remove(c.id)} className="text-rose-500 hover:text-rose-700 text-sm">Delete</button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <form className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={add}>
            <h2 className="font-bold text-ink-900">Add credential</h2>
            <div><label className="label">Domain *</label><input className="input" required value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="company.ats.com" /></div>
            <div><label className="label">Username *</label><input className="input" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div><label className="label">Password *</label><input className="input" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <p className="text-[11px] text-slate-400">Stored encrypted locally. Never auto-shared.</p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
