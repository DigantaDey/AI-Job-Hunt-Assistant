// Generic extractor — injected on-demand (popup → background → scripting)
// to read a job page on ANY site. Uses JSON-LD JobPosting and meta tags.
// Supervised: reads only, never submits.
(function () {
  "use strict";
  function text(node) { return (node && node.textContent || "").trim(); }
  function meta(name) {
    const el = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute("content") : "";
  }
  let job = null;
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    if (job) return;
    try {
      const data = JSON.parse(s.textContent);
      const arr = Array.isArray(data) ? data : [data];
      const found = arr.find((d) => d && d["@type"] === "JobPosting");
      if (found) {
        const loc = found.jobLocation && found.jobLocation.address;
        job = {
          title: found.title,
          company: found.hiringOrganization && found.hiringOrganization.name,
          location: (loc && (loc.addressLocality || loc.addressRegion)) || (found.jobLocation && found.jobLocation.name) || "",
          description: (found.description || "").replace(/<[^>]+>/g, " "),
          postedAt: found.datePosted || null,
        };
      }
    } catch (e) {}
  });
  if (!job) {
    job = {
      title: text(document.querySelector("h1")) || meta("og:title"),
      company: meta("og:site_name"),
      location: "",
      description: meta("og:description") || text(document.querySelector("article")) || text(document.body).slice(0, 6000),
      postedAt: null,
    };
  }
  const result = {
    portal: "generic",
    title: job.title,
    company: job.company,
    location: job.location,
    description: (job.description || "").slice(0, 6000),
    requiredSkills: [],
    preferredSkills: [],
    salaryMin: 0,
    salaryMax: 0,
    url: location.href,
    postedAt: job.postedAt,
    externalId: "gn_" + location.href.split("#")[0],
    workMode: (job.location || "").toLowerCase().includes("remote") ? "remote" : "any",
  };
  chrome.storage.local.set({ currentJob: { extractedAt: Date.now(), ...result } });
  try { chrome.runtime.sendMessage({ type: "JOB_EXTRACTED", job: result }); } catch (e) {}
  return result;
})();
