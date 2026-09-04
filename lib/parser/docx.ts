import mammoth from "mammoth";

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  if (text.length < 50) {
    throw new Error(
      "Could not extract enough text from this DOCX. Make sure the file contains readable resume text.",
    );
  }
  return text;
}
