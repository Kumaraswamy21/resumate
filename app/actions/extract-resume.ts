"use server";

import { extractText } from "@/lib/parser";
import {
  UploadSchema,
  type AllowedMimeType,
} from "@/lib/validators/upload";

export type ExtractResumeResult =
  | {
      success: true;
      extractedText: string;
      charCount: number;
      wordCount: number;
    }
  | {
      success: false;
      error: string;
    };

function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Parses a resume file server-side so the upload page can store
 * extractedText in sessionStorage before navigating to /result.
 */
export async function extractResumeAction(
  formData: FormData,
): Promise<ExtractResumeResult> {
  const file = formData.get("resume");

  if (!file || !(file instanceof File)) {
    return { success: false, error: "A resume file is required." };
  }

  const parsed = UploadSchema.safeParse({
    mimeType: file.type,
    sizeBytes: file.size,
  });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid file. Upload a PDF or DOCX under 5MB.",
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = parsed.data.mimeType as AllowedMimeType;
    const extractedText = await extractText(buffer, mimeType);

    return {
      success: true,
      extractedText,
      charCount: extractedText.length,
      wordCount: wordCount(extractedText),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to extract text from the resume.",
    };
  }
}
