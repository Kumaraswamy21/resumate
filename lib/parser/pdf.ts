import { PDFParse } from "pdf-parse";

export async function parsePdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    if (text.length < 50) {
      throw new Error(
        "Could not extract enough text from this PDF. Try a text-based resume (not a scanned image).",
      );
    }
    return text;
  } finally {
    await parser.destroy();
  }
}
