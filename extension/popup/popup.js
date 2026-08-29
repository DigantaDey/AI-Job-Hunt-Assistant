// Popup logic: read the extracted job, ping the local service, send on demand.
(function () {
  "use strict";
  const el = (id) => document.getElementById(id);

  let currentJob = null;

  async function refresh() {
    const resp = await chrome.runtime.sendMessage({ type: "GET_JOB" });
    currentJob = resp.job;
    const dot = el("status-dot");
    if (currentJob && currentJob.title) {
      el("current").innerHTML =
        `<div class="job-title">${escapeHtml(currentJob.title)}</div>` +
        `<div class="job-meta">${escapeHtml(currentJob.company || "")}${currentJob.location ? " · " + escapeHtml(currentJob.location) : ""}</div>`;
    } else {
      el("current").innerHTML = `<p class="empty">Open a job page on LinkedIn, Naukri, Indeed (or any site) to extract it.</p>`;
    }
    if (resp.lastSend) {
      showResult(resp.lastSend.ok, resp.lastSend.ok ? "Sent ✓ " + (resp.lastSend.title || "") : "Send failed: " + (resp.lastSend.error || ""));
    }
    // health
    const health = await chrome.runtime.sendMessage({ type: "PING" });
    dot.className = "dot " + (health.ok ? "dot-green" : "dot-red");
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function showResult(ok, text) {
    const r = el("result-msg");
    r.className = "result " + (ok ? "ok" : "err");
    r.textContent = text;
  }

  el("send").addEventListener("click", async () => {
    if (!currentJob) { showResult(false, "No job extracted yet."); return; }
    el("send").disabled = true;
    const resp = await chrome.runtime.sendMessage({ type: "SEND_JOB", job: currentJob });
    el("send").disabled = false;
    if (resp.ok) { showResult(true, "Sent to Job Hunt — scored & queued ✓"); refresh(); }
    else showResult(false, "Error: " + resp.error);
  });

  el("extract").addEventListener("click", async () => {
    el("extract").disabled = true;
    const resp = await chrome.runtime.sendMessage({ type: "EXTRACT_NOW" });
    el("extract").disabled = false;
    if (resp.ok) { currentJob = resp.job; refresh(); showResult(true, "Extracted ✓"); }
    else showResult(false, "No job detected on this page.");
  });

  el("autosend").addEventListener("change", async (e) => {
    await chrome.runtime.sendMessage({ type: "SET_AUTOSEND", value: e.target.checked });
  });
  el("api").addEventListener("change", async (e) => {
    await chrome.storage.local.set({ apiBase: e.target.value });
  });

  (async () => {
    const stored = await chrome.storage.local.get(["apiBase", "autoSend"]);
    if (stored.apiBase) el("api").value = stored.apiBase;
    el("autosend").checked = stored.autoSend === true;
    refresh();
  })();
})();
