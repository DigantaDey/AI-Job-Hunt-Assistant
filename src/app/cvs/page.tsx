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
  tags?: string[];
  extractedProfile?: any;
  aiClassification?: string;
  fileName?: string;
  rawText?: string;
  importedToProfile?: boolean;
}

interface ExtractionResult {
  extractedProfile: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    currentRole?: string;
    desiredRole?: string;
    experienceYears?: number;
    skills?: string[];
    summary?: string;
  };
  classification: string;
  confidence: number;
}

const TYPE_LABEL: Record<string, string> = {
  MASTER: "Master",
  AI_GENERATED: "AI-tailored",
  HUMAN_UPLOADED: "Uploaded",
};

export default function CVsPage() {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [extractedData, setExtractedData] = useState<Record<string, ExtractionResult>>({});

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/cvs");
      const data = await r.json();
      setCvs(Array.isArray(data) ? data : []);
      
      // Check if external AI is configured
      const settings = await fetch("/api/settings").then(r => r.json()).catch(() => ({}));
      setAiAvailable(settings.provider && settings.provider !== "mock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      tags.forEach(tag => formData.append("tags", tag));

      const response = await fetch("/api/cvs/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
        return;
      }

      const newCV = await response.json();
      setCvs([...cvs, newCV]);
      setTags([]);
      setTagInput("");

      // Auto-extract if external AI is available
      if (aiAvailable && newCV.rawText) {
        await handleExtract(newCV.id, newCV.rawText);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload CV");
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async (cvId: string, cvText: string) => {
    setExtracting(cvId);
    try {
      const response = await fetch("/api/cvs/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Extraction error:", error.error);
        return;
      }

      const result = await response.json() as ExtractionResult;
      setExtractedData(prev => ({ ...prev, [cvId]: result }));

      // Update CV with extracted data
      const updatedCvs = cvs.map(cv =>
        cv.id === cvId
          ? { 
              ...cv, 
              extractedProfile: result.extractedProfile, 
              aiClassification: result.classification 
            }
          : cv
      );
      setCvs(updatedCvs);

      // Auto-import to profile if fields are empty
      await autoImportProfile(result.extractedProfile);
    } catch (error) {
      console.error("Extract error:", error);
    } finally {
      setExtracting(null);
    }
  };

  const autoImportProfile = async (extractedProfile: any) => {
    try {
      const profileResp = await fetch("/api/profile");
      const profile = await profileResp.json();

      const updates: any = {};
      if (extractedProfile.fullName && !profile?.fullName) updates.fullName = extractedProfile.fullName;
      if (extractedProfile.email && !profile?.email) updates.email = extractedProfile.email;
      if (extractedProfile.phone && !profile?.phone) updates.phone = extractedProfile.phone;
      if (extractedProfile.location && !profile?.location) updates.location = extractedProfile.location;
      if (extractedProfile.currentRole && !profile?.currentRole) updates.currentRole = extractedProfile.currentRole;
      if (extractedProfile.desiredRole && !profile?.desiredRole) updates.desiredRole = extractedProfile.desiredRole;
      if (extractedProfile.experienceYears && !profile?.experienceYears) updates.experienceYears = extractedProfile.experienceYears;
      if (extractedProfile.skills && (!profile?.skills || profile.skills.length === 0)) {
        updates.skills = extractedProfile.skills;
      }
      if (extractedProfile.summary && !profile?.summary) updates.summary = extractedProfile.summary;

      if (Object.keys(updates).length > 0) {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      }
    } catch (error) {
      console.error("Auto-import error:", error);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  if (loading) return <div className="animate-pulse h-40 bg-slate-200 rounded-2xl" />;

  return (
    <div>
      <PageHeader title="CV Library" subtitle="Master, AI-tailored, and uploaded versions. Tailoring never invents facts beyond your master CV." />

      {/* Upload Section */}
      <div 
        className={`card p-8 mb-6 border-2 border-dashed transition-colors ${dragActive ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => { handleDrag(e); handleUpload(e.dataTransfer.files); setDragActive(false); }}
      >
        <div className="text-center">
          <p className="text-sm font-semibold text-ink-900 mb-2">📄 Upload your CV</p>
          <p className="text-xs text-slate-500 mb-4">Drag and drop PDF, DOCX, or TXT files here</p>
          
          <label className="inline-block">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
              className="hidden"
            />
            <span className={`btn-primary inline-block ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}>
              {uploading ? "Uploading..." : "Browse files"}
            </span>
          </label>

          {/* Tags Input */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Add tags (e.g., senior, startup)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              className="input !text-xs flex-1 min-w-40"
            />
            <button
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim()}
              className="btn-ghost !py-1.5 !px-3 !text-xs"
            >
              Add tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 text-xs">
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="text-brand-500 hover:text-brand-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CVs Grid */}
      {cvs.length === 0 ? (
        <EmptyState title="No CVs yet" body="Upload your CV or tailor one for any job from the Jobs page to start building your library." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map((cv) => {
            const extracted = extractedData[cv.id] || cv.extractedProfile;
            return (
              <div key={cv.id} className="card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink-900">{cv.name}</p>
                    <span className={`mt-1 inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${cv.isMaster ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {cv.isMaster ? "Master" : (cv.fileName ? "Uploaded" : TYPE_LABEL[cv.type]) || cv.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-600">{cv.matchScore || "—"}</p>
                    <p className="text-[10px] text-slate-400">match %</p>
                  </div>
                </div>

                {cv.tags && cv.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cv.tags.map(tag => (
                      <span key={tag} className="inline-flex px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI Extraction Section */}
                {cv.fileName && aiAvailable && !cv.extractedProfile && !extracting?.includes(cv.id) && (
                  <button
                    onClick={() => handleExtract(cv.id, cv.rawText || "")}
                    className="btn-ghost !text-xs py-1 px-2"
                  >
                    ✨ Extract Profile via AI
                  </button>
                )}

                {extracting === cv.id && (
                  <p className="text-xs text-slate-500 animate-pulse">Extracting profile...</p>
                )}

                {extracted && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs">
                    <div className="font-semibold text-ink-900">Extracted Data:</div>
                    {extracted.extractedProfile?.fullName && (
                      <p><b>Name:</b> {extracted.extractedProfile.fullName}</p>
                    )}
                    {extracted.extractedProfile?.currentRole && (
                      <p><b>Role:</b> {extracted.extractedProfile.currentRole}</p>
                    )}
                    {extracted.extractedProfile?.skills && extracted.extractedProfile.skills.length > 0 && (
                      <p><b>Skills:</b> {extracted.extractedProfile.skills.slice(0, 3).join(", ")}...</p>
                    )}
                    {extracted.classification && (
                      <p><b>Classification:</b> {extracted.classification}</p>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-500 space-y-1">
                  <p><b>Skills:</b> {cv.content?.skills?.slice(0, 6).join(", ") || "—"}</p>
                  <p><b>Exp:</b> {cv.content?.experience?.length || 0} roles · <b>v</b>{cv.version}</p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">{cv.usageCount} uses</span>
                  {!cv.fileName ? (
                    <a href={`/api/cvs/${cv.id}/docx`} className="btn-ghost !px-3 !py-1.5 !text-xs">Download .docx</a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Uploaded CV</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
