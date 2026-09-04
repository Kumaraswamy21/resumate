import type { AllowedMimeType } from "@/lib/validators/upload";
import { parseDocx } from "./docx";
import { parsePdf } from "./pdf";

export async function extractText(
  buffer: Buffer,
  mimeType: AllowedMimeType,
): Promise<string> {
  if (mimeType === "application/pdf") {
    return parsePdf(buffer);
  }
  return parseDocx(buffer);
}
