import { NextResponse } from "next/server";
import { extractText } from "@/lib/parser";
import {
  UploadSchema,
  type AllowedMimeType,
} from "@/lib/validators/upload";

export const runtime = "nodejs";

function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: "A resume file is required." },
        { status: 400 },
      );
    }

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "A resume file is required." },
        { status: 400 },
      );
    }

    const parsed = UploadSchema.safeParse({
      mimeType: file.type,
      sizeBytes: file.size,
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

    const arrayBuffer = await file.arrayBuffer();
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

    return NextResponse.json({
      success: true,
      extractedText,
      charCount: extractedText.length,
      wordCount: wordCount(extractedText),
    });
  } catch (err) {
    console.error("Analyze route error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong while analyzing the file." },
      { status: 500 },
    );
  }
}
