// Generates a downloadable .docx CV from structured CVContent using jszip.
// Produces a standards-compliant Office Open XML document.

import JSZip from "jszip";
import type { CVContent, CVItem } from "../store/types";

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function para(text: string, bold = false, size = "22"): string {
  return `<w:p><w:r><w:rPr><w:b w:val="${bold ? 1 : 0}"/><w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function bullet(text: string): string {
  return `<w:p><w:pPr><w:ind w:left="360"/></w:pPr><w:r><w:t xml:space="preserve">• ${esc(text)}</w:t></w:r></w:p>`;
}

function heading(text: string): string {
  return `<w:p><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:r><w:rPr><w:b w:val="1"/><w:sz w:val="28"/><w:color w:val="354ceb"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

export function buildCVDocx(cv: CVItem): string {
  const c = cv.content;
  const body: string[] = [];

  // Header
  body.push(`<w:p><w:r><w:rPr><w:b w:val="1"/><w:sz w:val="36"/><w:color w:val="141b27"/></w:rPr><w:t>${esc(cv.name)}</w:t></w:r></w:p>`);
  body.push(para(c.summary));

  if (c.skills.length) {
    body.push(heading("Skills"));
    body.push(para(c.skills.join(" · ")));
  }

  if (c.experience.length) {
    body.push(heading("Experience"));
    for (const e of c.experience) {
      body.push(para(`${e.title} — ${e.company} (${e.startDate} – ${e.endDate})`, true));
      for (const b of e.bullets) body.push(bullet(b));
    }
  }

  if (c.projects.length) {
    body.push(heading("Projects"));
    for (const p of c.projects) {
      body.push(para(p.name, true));
      body.push(para(p.description));
      body.push(para(`Tech: ${p.tech.join(", ")}`));
    }
  }

  if (c.education.length) {
    body.push(heading("Education"));
    for (const e of c.education) body.push(para(`${e.degree} — ${e.institution} (${e.year})`));
  }

  if (c.certifications.length) {
    body.push(heading("Certifications"));
    for (const cert of c.certifications) body.push(bullet(cert));
  }

  return body.join("\n");
}

export async function toDocxBuffer(cv: CVItem): Promise<Buffer> {
  const bodyXml = buildCVDocx(cv);
  const zip = new JSZip();

  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${bodyXml}
</w:body>
</w:document>`);

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
  return Buffer.from(buf);
}
