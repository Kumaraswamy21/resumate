import { streamObject } from "ai";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getModel } from "@/lib/ai/provider";
import {
  ATSResultSchema,
  CURRENT_DATE_PLACEHOLDER,
  SYSTEM_PROMPT,
} from "@/lib/ai/prompt";
import { extractText } from "@/lib/parser";
import {
  UploadSchema,
  type AllowedMimeType,
} from "@/lib/validators/upload";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_JOB_DESCRIPTION_CHARS = 8000;

function currentDateYYYYMM(): string {
  return new Date().toISOString().slice(0, 7);
}

function systemPromptWithCurrentDate(): string {
  return SYSTEM_PROMPT.replaceAll(
    CURRENT_DATE_PLACEHOLDER,
    currentDateYYYYMM(),
  );
}

function parseJobDescription(
  value: FormDataEntryValue | null,
): { ok: true; value?: string } | { ok: false; error: string } {
  if (value === null || value === undefined) {
    return { ok: true };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "Job description must be text." };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true };
  }
  if (trimmed.length > MAX_JOB_DESCRIPTION_CHARS) {
    return {
      ok: false,
      error: `Job description must be at most ${MAX_JOB_DESCRIPTION_CHARS} characters.`,
    };
  }
  return { ok: true, value: trimmed };
}

function buildUserPrompt(resumeText: string, jobDescription?: string): string {
  if (!jobDescription) return resumeText;
  return [
    "A job description is provided below. When scoring keyword density and relevance,",
    "and when writing strengths, weaknesses, and suggestions, prefer alignment with this role.",
    "Still evaluate all ATS structure criteria on the resume itself.",
    "",
    "JOB DESCRIPTION:",
    jobDescription,
    "",
    "RESUME TEXT:",
    resumeText,
  ].join("\n");
}

function streamScore(prompt: string): Response {
  const result = streamObject({
    model: getModel(),
    schema: ATSResultSchema,
    system: systemPromptWithCurrentDate(),
    prompt,
  });
  return result.toTextStreamResponse();
}

export async function POST(req: NextRequest): Promise<Response> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid form data." },
      { status: 400 },
    );
  }

  const jobDescriptionResult = parseJobDescription(
    formData.get("jobDescription"),
  );
  if (!jobDescriptionResult.ok) {
    return NextResponse.json(
      { success: false, error: jobDescriptionResult.error },
      { status: 400 },
    );
  }
  const jobDescription = jobDescriptionResult.value;

  // Alternate path for the result page: score already-extracted text.
  // Primary path below follows the file → extract → streamObject flow.
  const extractedTextField = formData.get("extractedText");
  if (typeof extractedTextField === "string" && extractedTextField.trim().length > 0) {
    try {
      return streamScore(
        buildUserPrompt(extractedTextField, jobDescription),
      );
    } catch (err) {
      console.error("Analyze stream error:", err);
      return NextResponse.json(
        { success: false, error: "Failed to start AI analysis." },
        { status: 500 },
      );
    }
  }

  const resume = formData.get("resume");
  if (!resume || !(resume instanceof File)) {
    return NextResponse.json(
      { success: false, error: "A resume file is required." },
      { status: 400 },
    );
  }

  const parsed = UploadSchema.safeParse({
    mimeType: resume.type,
    sizeBytes: resume.size,
  });

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ??
      "Invalid file. Upload a PDF or DOCX under 5MB.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }

  const arrayBuffer = await resume.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = parsed.data.mimeType as AllowedMimeType;

  let extractedText: string;
  try {
    extractedText = await extractText(buffer, mimeType);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to extract text from the resume.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 422 },
    );
  }

  try {
    return streamScore(buildUserPrompt(extractedText, jobDescription));
  } catch (err) {
    console.error("Analyze stream error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to start AI analysis." },
      { status: 500 },
    );
  }
}
