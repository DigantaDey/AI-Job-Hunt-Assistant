"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";
import { AUTONOMY_MODES } from "@/lib/store/types";

function TagEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  function add() {
    if (input.trim() && !value.includes(input.trim())) { onChange([...value, input.trim()]); setInput(""); }
  }
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add} className="btn-ghost shrink-0">Add</button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
              {v}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} className="text-slate-400 hover:text-rose-500">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [cfg, setCfg] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [providerForm, setProviderForm] = useState({ provider: "mock", model: "", apiKey: "", baseUrl: "" });
  const [schedulerEnabled, setSchedulerEnabled] = useState(true);
  const [schedulerInterval, setSchedulerInterval] = useState(20);
  const [workerStatus, setWorkerStatus] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/search-config").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/worker/status").then((r) => r.json()),
    ]).then(([p, c, s, w]) => {
      setProfile(p); setCfg(c); setSettings(s);
      setProviderForm({ provider: s.provider || "mock", model: s.model || "", apiKey: "", baseUrl: s.baseUrl || "" });
      setSchedulerEnabled(s.schedulerEnabled !== false);
      setSchedulerInterval(s.schedulerIntervalSec || 20);
      setWorkerStatus(w);
    });
  }, []);

  async function toggleScheduler() {
    const next = !schedulerEnabled;
    setSchedulerEnabled(next);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedulerEnabled: next }) });
    setSaved(next ? "Scheduler enabled ✓" : "Scheduler paused ✓");
  }

  async function saveScheduler(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedulerIntervalSec: schedulerInterval, schedulerEnabled }) });
    setSaved("Scheduler settings saved ✓");
  }

  async function runNow() {
    setRunning(true);
    setWorkerStatus(null);
    try {
      const r = await fetch("/api/worker/tick", { method: "POST" });
      setWorkerStatus({ lastReport: await r.json() });
      setSaved("Worker pass completed ✓");
    } finally {
      setRunning(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    setSaved("Profile saved ✓");
  }
  async function saveCfg(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/search-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
    setSaved("Search criteria saved ✓");
  }
  async function saveProvider(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(providerForm) });
    setSaved("AI provider saved ✓");
  }

  if (!profile) return <div className="animate-pulse h-40 bg-slate-200 rounded-2xl" />;

  const cfgVal = (v: string[]) => (Array.isArray(v) ? v : []);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Profile, search criteria, and AI provider configuration." />
      {saved && <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mint/15 text-emerald-700 text-sm">{saved}</div>}

      <div className="space-y-6">
        {/* Profile */}
        <form className="card p-6" onSubmit={saveProfile}>
          <h2 className="font-semibold text-ink-900 mb-4">Candidate profile</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Full name</label><input className="input" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div><label className="label">Location</label><input className="input" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></div>
            <div><label className="label">Current role</label><input className="input" value={profile.currentRole} onChange={(e) => setProfile({ ...profile, currentRole: e.target.value })} /></div>
            <div><label className="label">Desired role</label><input className="input" value={profile.desiredRole} onChange={(e) => setProfile({ ...profile, desiredRole: e.target.value })} /></div>
            <div><label className="label">Years of experience</label><input className="input" type="number" value={profile.experienceYears} onChange={(e) => setProfile({ ...profile, experienceYears: Number(e.target.value) })} /></div>
            <div><label className="label">Notice period (days)</label><input className="input" type="number" value={profile.noticePeriodDays} onChange={(e) => setProfile({ ...profile, noticePeriodDays: Number(e.target.value) })} /></div>
          </div>
          <div className="mt-4"><label className="label">Skills</label>
            <TagEditor value={cfgVal(profile.skills)} placeholder="Add skill" onChange={(v) => setProfile({ ...profile, skills: v })} />
          </div>
          <div className="mt-4"><label className="label">Summary</label><textarea className="input" rows={3} value={profile.summary} onChange={(e) => setProfile({ ...profile, summary: e.target.value })} /></div>
          <div className="flex justify-end mt-5"><button className="btn-primary">Save profile</button></div>
        </form>

        {/* Search config */}
        <form className="card p-6" onSubmit={saveCfg}>
          <h2 className="font-semibold text-ink-900 mb-4">Search criteria</h2>
          {!cfg ? <p className="text-sm text-slate-400 mb-4">No config yet — set one up below.</p> : null}
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Must-have skills</label><TagEditor value={cfgVal(cfg?.mustHaveSkills)} placeholder="Add" onChange={(v) => setCfg({ ...cfg, mustHaveSkills: v })} /></div>
            <div><label className="label">Preferred skills</label><TagEditor value={cfgVal(cfg?.preferredSkills)} placeholder="Add" onChange={(v) => setCfg({ ...cfg, preferredSkills: v })} /></div>
            <div><label className="label">Target titles</label><TagEditor value={cfgVal(cfg?.targetTitles)} placeholder="Add title" onChange={(v) => setCfg({ ...cfg, targetTitles: v })} /></div>
            <div><label className="label">Excluded titles</label><TagEditor value={cfgVal(cfg?.excludedTitles)} placeholder="Add" onChange={(v) => setCfg({ ...cfg, excludedTitles: v })} /></div>
            <div><label className="label">Locations</label><TagEditor value={cfgVal(cfg?.locations)} placeholder="Add location" onChange={(v) => setCfg({ ...cfg, locations: v })} /></div>
            <div><label className="label">Work mode</label><select className="input" value={cfg?.workMode || "any"} onChange={(e) => setCfg({ ...cfg, workMode: e.target.value })}><option value="any">Any</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option></select></div>
            <div><label className="label">Salary min (₹)</label><input className="input" type="number" value={cfg?.salaryMin || 0} onChange={(e) => setCfg({ ...cfg, salaryMin: Number(e.target.value) })} /></div>
            <div><label className="label">Salary max (₹)</label><input className="input" type="number" value={cfg?.salaryMax || 0} onChange={(e) => setCfg({ ...cfg, salaryMax: Number(e.target.value) })} /></div>
            <div><label className="label">Experience min</label><input className="input" type="number" value={cfg?.experienceMin || 0} onChange={(e) => setCfg({ ...cfg, experienceMin: Number(e.target.value) })} /></div>
            <div><label className="label">Experience max</label><input className="input" type="number" value={cfg?.experienceMax || 30} onChange={(e) => setCfg({ ...cfg, experienceMax: Number(e.target.value) })} /></div>
            <div><label className="label">Freshness (days)</label><input className="input" type="number" value={cfg?.freshnessDays || 30} onChange={(e) => setCfg({ ...cfg, freshnessDays: Number(e.target.value) })} /></div>
            <div><label className="label">Min match score (%)</label><input className="input" type="number" value={cfg?.minMatchScore || 60} onChange={(e) => setCfg({ ...cfg, minMatchScore: Number(e.target.value) })} /></div>
            <div><label className="label">Max applications/day</label><input className="input" type="number" value={cfg?.maxApplicationsPerDay || 8} onChange={(e) => setCfg({ ...cfg, maxApplicationsPerDay: Number(e.target.value) })} /></div>
            <div><label className="label">Autonomy mode</label><select className="input" value={cfg?.autonomyMode || "smart_apply"} onChange={(e) => setCfg({ ...cfg, autonomyMode: e.target.value })}>
              {AUTONOMY_MODES.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
            </select></div>
          </div>
          <div className="flex justify-end mt-5"><button className="btn-primary">Save criteria</button></div>
        </form>

        {/* AI provider */}
        <form className="card p-6" onSubmit={saveProvider}>
          <h2 className="font-semibold text-ink-900 mb-1">AI provider</h2>
          <p className="text-xs text-slate-400 mb-4">Default is <b>mock</b> — built-in deterministic AI that works with no keys. Connect a real provider for live LLM output.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Provider</label><select className="input" value={providerForm.provider} onChange={(e) => setProviderForm({ ...providerForm, provider: e.target.value })}>
              <option value="mock">Mock (no key)</option>
              <option value="openai">OpenAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="ollama">Ollama (local)</option>
              <option value="custom">Custom endpoint</option>
            </select></div>
            <div><label className="label">Model</label><input className="input" value={providerForm.model} onChange={(e) => setProviderForm({ ...providerForm, model: e.target.value })} placeholder="gpt-4o-mini" /></div>
            <div><label className="label">API key {settings?.keyConfigured && "(reconfigured)"}</label><input className="input" type="password" value={providerForm.apiKey} onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })} placeholder="sk-..." /></div>
            <div><label className="label">Base URL (optional)</label><input className="input" value={providerForm.baseUrl} onChange={(e) => setProviderForm({ ...providerForm, baseUrl: e.target.value })} placeholder="https://..." /></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Keys are encrypted at rest with AES-256-GCM and never returned to the browser.</p>
          <div className="flex justify-end mt-4"><button className="btn-primary">Save provider</button></div>
        </form>

          {/* Continuous automation / scheduler */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-ink-900">Continuous automation</h2>
              <button
                type="button"
                onClick={toggleScheduler}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${schedulerEnabled ? "bg-brand-600" : "bg-slate-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedulerEnabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              A background worker advances the application queue on an interval. In <b>smart_apply</b> (default) it
              prepares everything and stops at <i>needs you</i> for confirmation; in <b>supervised_auto</b> it submits only
              high-confidence (≥75) applications. Daily application caps are always respected.
            </p>
            <form onSubmit={saveScheduler} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="label">Interval (seconds)</label>
                <input className="input !w-28" type="number" min={5} value={schedulerInterval}
                  onChange={(e) => setSchedulerInterval(Number(e.target.value))} />
              </div>
              <button type="submit" className="btn-ghost">Save interval</button>
              <button type="button" className="btn-primary" onClick={runNow} disabled={running}>
                {running ? "Running…" : "Run worker now"}
              </button>
            </form>

            {workerStatus?.lastReport && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex flex-wrap gap-3 text-xs mb-2">
                  <span>mode: <b className="uppercase">{workerStatus.lastReport.mode}</b></span>
                  <span>processed: <b>{workerStatus.lastReport.processed}</b></span>
                  <span>submitted today: <b>{workerStatus.lastReport.submittedToday}/{workerStatus.lastReport.dailyCap}</b></span>
                  <span>at: {new Date(workerStatus.lastReport.at).toLocaleTimeString()}</span>
                </div>
                {workerStatus.lastReport.transitions.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-600">
                    {workerStatus.lastReport.transitions.slice(0, 12).map((t: string, i: number) => <li key={i}>→ {t}</li>)}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">No transitions this pass.</p>
                )}
                {workerStatus.lastReport.errors.length > 0 && (
                  <ul className="space-y-1 text-xs text-rose-600 mt-2">
                    {workerStatus.lastReport.errors.map((e: string, i: number) => <li key={i}>⚠ {e}</li>)}
                  </ul>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-3">
              Autonomy mode is set in <b>Search criteria</b>. Scheduler runs server-side on boot via instrumentation.
            </p>
          </div>

          {/* Export */}
          <div className="card p-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink-900">Export data</h2>
            <p className="text-xs text-slate-400">Download all your local data (including decrypted credentials) as JSON.</p>
          </div>
          <a href="/api/export" className="btn-primary">Export JSON</a>
        </div>
      </div>
    </div>
  );
}
