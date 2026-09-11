import path from "node:path";
import { createWorker } from "tesseract.js";

function resolveTesseractPaths() {
  const root = process.cwd();

  return {
    // Next.js otherwise resolves the worker under `.next/worker-script/...` and crashes.
    workerPath: path.join(
      root,
      "node_modules/tesseract.js/src/worker-script/node/index.js",
    ),
    corePath: path.join(root, "node_modules/tesseract.js-core"),
    langPath: path.join(
      root,
      "node_modules/@tesseract.js-data/eng/4.0.0",
    ),
  };
}

/**
 * Free offline OCR via Tesseract.js (no API key).
 * Accepts PNG/JPEG bytes from PDF screenshots or embedded images.
 */
export async function recognizeImageText(
  images: Array<Buffer | Uint8Array>,
): Promise<string> {
  if (images.length === 0) return "";

  const { workerPath, corePath, langPath } = resolveTesseractPaths();

  const worker = await createWorker("eng", 1, {
    workerPath,
    corePath,
    langPath,
    gzip: true,
    cachePath: path.join(process.cwd(), ".tess-cache"),
    // Avoid noisy worker logs in the Next.js server console.
    logger: () => undefined,
  });

  try {
    const parts: string[] = [];

    for (const image of images) {
      const input = Buffer.isBuffer(image) ? image : Buffer.from(image);
      const {
        data: { text },
      } = await worker.recognize(input);
      const trimmed = text.replace(/\u0000/g, "").trim();
      if (trimmed) parts.push(trimmed);
    }

    return parts.join("\n\n").trim();
  } finally {
    await worker.terminate();
  }
}
