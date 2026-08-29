import { NextResponse } from "next/server";
import { cvs, candidates } from "@/lib/store/repos";
import * as db from "@/lib/store/db";
import { Collections } from "@/lib/store/repos";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

export const runtime = "nodejs";
export const config = { api: { bodyParser: { sizeLimit: "20mb" } } };

async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();
  
  try {
    if (ext === 'pdf') {
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items
          .map((item: any) => item.str)
          .join(' ');
      }
      return text;
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (ext === 'txt') {
      return buffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  } catch (error) {
    console.error(`Error extracting text from ${filename}:`, error);
    throw new Error(`Failed to parse ${ext} file`);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tags = formData.getAll('tags') as string[];

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const candidate = await candidates.first();
    if (!candidate) {
      return NextResponse.json({ error: "No candidate profile" }, { status: 400 });
    }

    // Extract text from file
    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromFile(buffer, file.name);

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
    }

    // Create CV record
    const cvRecord = {
      id: `cv_${Date.now()}`,
      candidateId: candidate.id,
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: 'tailored' as const,
      isMaster: false,
      content: {
        summary: rawText.substring(0, 500),
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
      },
      tags: tags || [],
      matchScore: 0,
      usageCount: 0,
      version: 1,
      fileName: file.name,
      rawText,
      uploadedAt: new Date().toISOString(),
      importedToProfile: false,
    };

    const created = await db.create(Collections.cvs, cvRecord as any);
    return NextResponse.json(created);
  } catch (error) {
    console.error("POST /api/cvs/upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload CV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
