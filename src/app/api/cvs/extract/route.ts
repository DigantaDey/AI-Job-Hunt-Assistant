import { NextResponse } from "next/server";
import { settings } from "@/lib/store/repos";
import { runCompletion } from "@/lib/ai/router";

export const runtime = "nodejs";

interface ExtractionRequest {
  cvText: string;
}

interface ExtractedProfile {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  currentRole?: string;
  desiredRole?: string;
  experienceYears?: number;
  skills?: string[];
  summary?: string;
}

interface ExtractionResponse {
  extractedProfile: ExtractedProfile;
  classification: string;
  confidence: number;
}

const EXTRACTION_PROMPT = `Extract professional profile information from this CV/resume text. Return a JSON object with:
- fullName: Person's full name
- email: Email address
- phone: Phone number
- location: Location/city
- currentRole: Current job title
- desiredRole: Desired/target job role (if mentioned)
- experienceYears: Years of experience (as number)
- skills: Array of key technical and professional skills
- summary: 1-2 sentence professional summary

Also determine the "classification" (e.g., "Senior Developer", "DevOps Engineer", "Product Manager", etc.) and confidence (0-1).

CV Text:
{cvText}

Return ONLY valid JSON with this structure:
{
  "extractedProfile": {
    "fullName": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "currentRole": "...",
    "desiredRole": "...",
    "experienceYears": 5,
    "skills": ["...", "..."],
    "summary": "..."
  },
  "classification": "...",
  "confidence": 0.9
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json() as ExtractionRequest;
    const { cvText } = body;

    if (!cvText || cvText.trim().length === 0) {
      return NextResponse.json({ error: "No CV text provided" }, { status: 400 });
    }

    const aiSettings = await settings.get();
    const provider = aiSettings?.provider || "mock";

    // Skip extraction if using mock provider
    if (provider === "mock") {
      return NextResponse.json({
        extractedProfile: {
          fullName: "Extracted Name",
          email: "extracted@example.com",
          phone: "+1-234-567-8900",
          location: "San Francisco, CA",
          currentRole: "Software Engineer",
          desiredRole: "Senior Engineer",
          experienceYears: 5,
          skills: ["JavaScript", "React", "Node.js", "TypeScript"],
          summary: "Experienced software engineer with 5+ years in full-stack development.",
        },
        classification: "Senior Software Engineer",
        confidence: 0.75,
      });
    }

    // Use real AI provider for extraction
    const prompt = EXTRACTION_PROMPT.replace("{cvText}", cvText.substring(0, 3000));

    let response: string;
    try {
      const result = await runCompletion(
        [{ role: "user", content: prompt }],
        { task: "classify", temperature: 0.3 }
      );
      response = result.text;
    } catch (error) {
      console.error("AI extraction error:", error);
      throw new Error("Failed to extract profile using AI. Ensure AI provider is properly configured.");
    }

    // Parse the response
    let result: ExtractionResponse;
    try {
      // Extract JSON from response (in case AI adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", response);
      throw new Error("Failed to parse extracted profile data");
    }

    // Validate response structure
    if (!result.extractedProfile) {
      throw new Error("Missing extractedProfile in response");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/cvs/extract error:", error);
    const message = error instanceof Error ? error.message : "Failed to extract profile from CV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
