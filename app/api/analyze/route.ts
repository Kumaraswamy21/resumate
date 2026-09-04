import { streamObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/ai/provider";
import { ATSResultSchema, SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { extractText } from "@/lib/parser";
import {
  UploadSchema,
  type AllowedMimeType,
} from "@/lib/validators/upload";

export const runtime = "nodejs";
export const maxDuration = 30;

function streamScore(prompt: string): Response {
  const result = streamObject({
    model: getModel(),
    schema: ATSResultSchema,
    system: SYSTEM_PROMPT,
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

  // Alternate path for the result page: score already-extracted text.
  // Primary path below follows the file → extract → streamObject flow.
  const extractedTextField = formData.get("extractedText");
  if (typeof extractedTextField === "string" && extractedTextField.trim().length > 0) {
    try {
      return streamScore(extractedTextField);
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
    return streamScore(extractedText);
  } catch (err) {
    console.error("Analyze stream error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to start AI analysis." },
      { status: 500 },
    );
  }
}
