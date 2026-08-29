// Background service worker for the AI Job Hunt Assistant extension.
// - Persists the extracted job
// - Sends it to the local Job Hunt Assistant service (default http://localhost:3000)
// - Answers popup queries and health checks
// - Handles on-demand extraction for arbitrary sites

const DEFAULTS = { apiBase: "http://localhost:3000", autoSend: false };

async function getConfig() {
  const stored = await chrome.storage.local.get(["apiBase", "autoSend"]);
  return {
    apiBase: stored.apiBase || DEFAULTS.apiBase,
    autoSend: stored.autoSend === true,
  };
}

function normalize(job) {
  return {
    title: job.title,
    company: job.company,
    source: job.portal || "api",
    externalId: job.externalId || "",
    location: job.location || "",
    workMode: job.workMode || "any",
    description: job.description || "",
    domain: "",
    salaryMin: Number(job.salaryMin) || 0,
    salaryMax: Number(job.salaryMax) || 0,
    requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills : [],
    preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills : [],
    url: job.url || "",
    postedAt: job.postedAt || null,
  };
}

async function sendJob(job, apiBase) {
  const base = (apiBase || DEFAULTS.apiBase).replace(/\/+$/, "");
  const resp = await fetch(base + "/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-jobhunt-token": "extension" },
    body: JSON.stringify(normalize(job)),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "Send failed (" + resp.status + ")");
  return data;
}

async function health(apiBase) {
  try {
    const base = (apiBase || DEFAULTS.apiBase).replace(/\/+$/, "");
    const resp = await fetch(base + "/api/settings");
    return { ok: resp.ok, status: resp.status };
  } catch (e) {
    return { ok: false, status: "unreachable" };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    const cfg = await getConfig();
    if (msg.type === "JOB_EXTRACTED") {
      if (cfg.autoSend) {
        try {
          await sendJob(msg.job, cfg.apiBase);
          await chrome.storage.local.set({ lastSend: { ok: true, at: Date.now(), title: msg.job.title } });
        } catch (e) {
          await chrome.storage.local.set({ lastSend: { ok: false, at: Date.now(), error: String(e.message || e) } });
        }
      }
      sendResponse({ ok: true });
    } else if (msg.type === "GET_JOB") {
      const data = await chrome.storage.local.get(["currentJob", "lastSend"]);
      sendResponse({ job: data.currentJob || null, lastSend: data.lastSend || null });
    } else if (msg.type === "SEND_JOB") {
      try {
        const result = await sendJob(msg.job, cfg.apiBase);
        await chrome.storage.local.set({ lastSend: { ok: true, at: Date.now(), title: msg.job.title, result } });
        sendResponse({ ok: true, result });
      } catch (e) {
        sendResponse({ ok: false, error: String(e.message || e) });
      }
    } else if (msg.type === "EXTRACT_NOW") {
      // Inject the generic extractor into the active tab for arbitrary sites.
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) { sendResponse({ ok: false, error: "No active tab" }); return; }
      try {
        const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/generic.js"] });
        const job = results && results[0] && results[0].result;
        sendResponse({ ok: Boolean(job && job.title), job });
      } catch (e) {
        sendResponse({ ok: false, error: String(e.message || e) });
      }
    } else if (msg.type === "PING") {
      sendResponse(await health(cfg.apiBase));
    } else if (msg.type === "SET_AUTOSEND") {
      await chrome.storage.local.set({ autoSend: msg.value === true });
      sendResponse({ ok: true });
    }
  })();
  return true; // async response
});
