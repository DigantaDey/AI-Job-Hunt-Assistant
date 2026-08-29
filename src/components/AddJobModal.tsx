"use client";

import { useState } from "react";

const SKILLS_SUGGESTIONS = [
  "React", "TypeScript", "Node.js", "Next.js", "JavaScript", "Python", "Java", "Go",
  "AWS", "GraphQL", "PostgreSQL", "SQL", "Docker", "Kubernetes", "Tailwind", "Prisma",
];

export function AddJobModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    source: "manual",
    location: "",
    workMode: "any",
    domain: "",
    description: "",
    url: "",
    salaryMin: "",
    salaryMax: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggleSkill(s: string) {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : 0,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : 0,
          requiredSkills: skills,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      onAdded();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-bold text-ink-900">Add a job</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Job title *</label>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Senior Full-Stack Engineer" />
            </div>
            <div>
              <label className="label">Company *</label>
              <input className="input" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc" />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Remote" />
            </div>
            <div>
              <label className="label">Work mode</label>
              <select className="input" value={form.workMode} onChange={(e) => setForm({ ...form, workMode: e.target.value })}>
                <option value="any">Any</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option>
              </select>
            </div>
            <div>
              <label className="label">Domain</label>
              <input className="input" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="Fintech" />
            </div>
            <div>
              <label className="label">Source</label>
              <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="manual">Manual</option><option value="linkedin">LinkedIn</option><option value="naukri">Naukri</option><option value="indeed">Indeed</option><option value="api">API</option>
              </select>
            </div>
            <div>
              <label className="label">Salary min (₹)</label>
              <input className="input" type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} placeholder="2500000" />
            </div>
            <div>
              <label className="label">Salary max (₹)</label>
              <input className="input" type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} placeholder="4500000" />
            </div>
          </div>

          <div>
            <label className="label">Job URL</label>
            <input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
          </div>

          <div>
            <label className="label">Required skills</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SKILLS_SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => toggleSkill(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${skills.includes(s) ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add custom skill" />
              <button type="button" className="btn-ghost shrink-0" onClick={() => { if (skillInput.trim()) { toggleSkill(skillInput.trim()); setSkillInput(""); } }}>Add</button>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Paste the job description. It is used for JD parsing and CV tailoring." />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary">{busy ? "Adding..." : "Add & score"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
