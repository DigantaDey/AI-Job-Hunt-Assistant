// Portal adapter content script for LinkedIn, Naukri and Indeed.
// Extracts job data from the DOM and stores it for the popup, then notifies
// the background worker. This is a supervised extractor: it NEVER fills or
// submits anything automatically — it only reads the page.
//
// The extracted payload matches the local service's RawJobInput contract and
// is POSTed to {API_BASE}/api/jobs for scoring + queueing.

(function () {
  "use strict";

  function text(node) {
    return (node && node.textContent || "").trim();
  }
  function one(sel, root) {
    return (root || document).querySelector(sel);
  }
  function all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }
  function parseSalary(str) {
    const m = String(str || "").match(/[\d.,]+/g);
    if (!m) return null;
    const nums = m.map((s) => parseInt(s.replace(/[,.]/g, ""), 10));
    return { min: nums[0] || 0, max: nums[1] || nums[0] || 0 };
  }
  function workModeFrom(textStr) {
    const t = (textStr || "").toLowerCase();
    if (t.includes("remote")) return "remote";
    if (t.includes("hybrid")) return "hybrid";
    if (t.includes("on-site") || t.includes("onsite") || t.includes("in office")) return "onsite";
    return "any";
  }
  function metaContent(name) {
    const el = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute("content") : "";
  }
  // JSON-LD structured data fallback
  function jsonLd() {
    let out = null;
    all('script[type="application/ld+json"]').some((s) => {
      try {
        const data = JSON.parse(s.textContent);
        if (data["@type"] === "JobPosting" || (Array.isArray(data) && data.some((d) => d["@type"] === "JobPosting"))) {
          const j = Array.isArray(data) ? data.find((d) => d["@type"] === "JobPosting") : data;
          out = {
            title: j.title,
            company: j.hiringOrganization && j.hiringOrganization.name,
            location: j.jobLocation && (j.jobLocation.address && (j.jobLocation.address.addressLocality || j.jobLocation.address.addressRegion) || (j.jobLocation.name || "")),
            description: (j.description || "").replace(/<[^>]+>/g, " "),
            salary: j.baseSalary && j.baseSalary.value,
            postedAt: j.datePosted,
          };
          return true;
        }
      } catch (e) {}
      return false;
    });
    return out;
  }

  function detectPortal(url) {
    if (/linkedin\.com/i.test(url)) return "linkedin";
    if (/naukri\.com/i.test(url)) return "naukri";
    if (/indeed\.(com|co\.in)/i.test(url)) return "indeed";
    return "generic";
  }

  // ---- LinkedIn ----
  function extractLinkedin() {
    const title = text(one(".job-details-titles__title")) || text(one(".topcard__title")) || text(one("h1"));
    const company =
      text(one(".job-details-jobs-unified-top-card__company-name")) ||
      text(one("a.topcard__org-name-link")) ||
      text(one(".job-details-subtitle__org-name"));
    const metaText = text(one(".job-details-jobs-unified-top-card__primary-description-container")) ||
      text(one(".job-details-jobs-unified-top-card__meta"));
    const location = (metaText.split("\n").filter(Boolean)[0] || "").trim();
    const description = text(one(".jobs-description__content")) || text(one("#job-details"));
    const skills = all(".job-details-skill-match-status-list__list-item span, .job-details-skill-list span").map(text);
    const parsed = parseSalary(text(one(".job-details-jobs-unified-top-card__job-insight, .compensation-insight")));
    return {
      portal: "linkedin",
      title, company, location,
      workMode: workModeFrom(metaText),
      description: description.slice(0, 6000),
      requiredSkills: skills.slice(0, 10),
      preferredSkills: [],
      salaryMin: parsed ? parsed.min : 0,
      salaryMax: parsed ? parsed.max : 0,
      url: location.href,
      externalId: "li_" + ((location.pathname.match(/\/view\/(\d+)/) || [])[1] || String(Date.now())),
    };
  }

  // ---- Naukri ----
  function extractNaukri() {
    const title = text(one("h1")) || text(one(".and-text-large"));
    const company = text(one('a[href*="/company/"]')) || text(one(".and-text-small")) || text(one("h2"));
    const location = text(one('span[class*="location"], span[class*="loc"]')) || text(one('a[class*="location"]'));
    const skills = all('div[class*="key-skill"] a, span[class*="key-skill"], span[class*="chip"]').map(text).filter(Boolean);
    const descNode = one('div[class*="description"] section, section[class*="description"], div[class*="job-detail"]');
    const description = text(descNode);
    const salaryEl = one('span[class*="salary"], div[class*="salary"]');
    const parsed = parseSalary(text(salaryEl));
    return {
      portal: "naukri",
      title, company, location,
      workMode: workModeFrom(description + " " + location),
      description: description.slice(0, 6000),
      requiredSkills: skills.slice(0, 10),
      preferredSkills: [],
      salaryMin: parsed ? parsed.min : 0,
      salaryMax: parsed ? parsed.max : 0,
      url: location.href,
      externalId: "nk_" + ((location.href.match(/job-listings-(\d+)/) || location.href.match(/\/(\d+)\./) || [])[1] || String(Date.now())),
    };
  }

  // ---- Indeed ----
  function extractIndeed() {
    const title = text(one('h1[class*="jobsearch-JobInfoHeader-title"], h1[class*="JobInfoHeader"], h1')) || text(one('[data-testid="jobsearch-JobInfoHeader-title"]'));
    const company = text(one('[data-company-name], span[class*="companyName"], div[data-testid="inlineHeader-companyName"]'));
    const location = text(one('[data-testid="job-location"], div[class*="location"], span[class*="location"]'));
    const description = text(one("#jobDescriptionText, div[class*='jobsearch-jobDescriptionText']"));
    const parsed = parseSalary(text(one('[data-testid="jobsearch-JobInfoHeader-companyInfo"]')) || text(one('div[class*="salary"]')));
    return {
      portal: "indeed",
      title, company, location,
      workMode: workModeFrom(description),
      description: description.slice(0, 6000),
      requiredSkills: [],
      preferredSkills: [],
      salaryMin: parsed ? parsed.min : 0,
      salaryMax: parsed ? parsed.max : 0,
      url: location.href,
      externalId: "in_" + (location.pathname.match(/rc\/([^/]+)/) || [])[1] || String(Date.now()),
    };
  }

  // ---- Generic (JSON-LD / meta fallback) ----
  function extractGeneric() {
    const j = jsonLd();
    const title = j && j.title || text(one("h1")) || metaContent("og:title");
    const company = j && j.company || metaContent("og:site_name");
    const location = j && j.location || "";
    const description = j && j.description || text(one('meta[name="description"]')) || text(one("article")) || metaContent("og:description");
    const parsed = j && j.salary && parseSalary(String(j.salary) + " " + (j.salary.value ? String(j.salary.value) : ""));
    return {
      portal: "generic",
      title, company, location,
      workMode: workModeFrom(description),
      description: description.slice(0, 6000),
      requiredSkills: [], preferredSkills: [],
      salaryMin: parsed ? parsed.min : 0,
      salaryMax: parsed ? parsed.max : 0,
      url: location.href,
      postedAt: (j && j.postedAt) || null,
      externalId: "gn_" + location.href.split("#")[0],
    };
  }

  function extract() {
    const portal = detectPortal(location.href);
    let job;
    try {
      if (portal === "linkedin") job = extractLinkedin();
      else if (portal === "naukri") job = extractNaukri();
      else if (portal === "indeed") job = extractIndeed();
      else job = extractGeneric();
    } catch (e) {
      job = { portal, title: "", company: "", description: "" };
    }
    if (!job.title) {
      const g = extractGeneric();
      if (g.title) job = g;
    }
    return { portal, job };
  }

  function deliver() {
    const result = extract();
    if (!result.job.title) return;
    try {
      chrome.storage.local.set({ currentJob: { extractedAt: Date.now(), ...result.job } });
    } catch (e) {}
    try {
      chrome.runtime.sendMessage({ type: "JOB_EXTRACTED", job: result.job });
    } catch (e) {}
  }

  // Run after idle; retry a few times for SPAs (LinkedIn/Naukri render async).
  let tries = 0;
  function attempt() {
    const r = extract();
    if (r.job.title || tries >= 8) { deliver(); return; }
    tries++;
    setTimeout(attempt, 1200);
  }
  if (document.readyState === "complete" || document.readyState === "interactive") attempt();
  else document.addEventListener("DOMContentLoaded", attempt);
})();
