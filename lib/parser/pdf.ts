import { PDFParse } from "pdf-parse";
import type { TableResult } from "pdf-parse";
import { CanvasFactory } from "pdf-parse/worker";
import { recognizeImageText } from "./ocr";

const MIN_TEXT_LENGTH = 40;
/** Ignore tiny decorative/tracking images when selecting OCR sources. */
const MIN_OCR_IMAGE_EDGE = 400;

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function tableArrayToText(tables: Array<Array<Array<string>>>): string {
  const blocks: string[] = [];

  for (const table of tables) {
    const rows = table
      .map((row) =>
        row
          .map((cell) => cell.replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .join(" | "),
      )
      .filter(Boolean);

    if (rows.length > 0) {
      blocks.push(rows.join("\n"));
    }
  }

  return blocks.join("\n\n");
}

function tablesToText(result: TableResult): string {
  const pageTables = result.pages.flatMap((page) => page.tables);
  const fromPages = tableArrayToText(pageTables);
  const fromMerged = tableArrayToText(result.mergedTables ?? []);
  return normalizeExtractedText(
    [fromPages, fromMerged].filter(Boolean).join("\n\n"),
  );
}

/** Prefer the richer extraction; use tables when plain text is sparse (common with table layouts). */
function pickBestText(plain: string, tableText: string): string {
  if (!tableText) return plain;
  if (!plain) return tableText;
  if (plain.length < MIN_TEXT_LENGTH) {
    return tableText.length >= plain.length
      ? tableText
      : normalizeExtractedText(`${plain}\n\n${tableText}`);
  }
  return tableText.length > plain.length * 1.25 ? tableText : plain;
}

async function collectOcrImages(parser: PDFParse): Promise<Uint8Array[]> {
  const images: Uint8Array[] = [];

  try {
    const imageResult = await parser.getImage({ imageThreshold: MIN_OCR_IMAGE_EDGE });
    for (const page of imageResult.pages) {
      for (const image of page.images) {
        if (
          image.data?.length &&
          (image.width >= MIN_OCR_IMAGE_EDGE || image.height >= MIN_OCR_IMAGE_EDGE)
        ) {
          images.push(image.data);
        }
      }
    }
  } catch {
    // Embedded-image extraction is optional.
  }

  if (images.length > 0) return images;

  // Image-only / scanned PDFs: render pages and OCR the screenshots.
  const screenshot = await parser.getScreenshot({
    scale: 2,
    imageBuffer: true,
    imageDataUrl: false,
  });

  for (const page of screenshot.pages) {
    if (page.data?.length) images.push(page.data);
  }

  return images;
}

async function extractViaOcr(parser: PDFParse): Promise<string> {
  const images = await collectOcrImages(parser);
  if (images.length === 0) return "";
  return normalizeExtractedText(await recognizeImageText(images));
}

export async function parsePdf(buffer: Buffer): Promise<string> {
  // Copy bytes so the PDF.js worker transfer does not detach the original Buffer.
  const data = new Uint8Array(buffer);

  const parser = new PDFParse({
    data,
    CanvasFactory,
    useSystemFonts: true,
  });

  try {
    const textResult = await parser.getText({
      lineEnforce: true,
      cellSeparator: " | ",
      cellThreshold: 5,
      pageJoiner: "\n",
      itemJoiner: " ",
    });

    const plain = normalizeExtractedText(textResult.text);

    let tableText = "";
    try {
      const tableResult = await parser.getTable();
      tableText = tablesToText(tableResult);
    } catch {
      // Table detection is best-effort for bordered grids.
    }

    let text = pickBestText(plain, tableText);

    if (text.length < MIN_TEXT_LENGTH) {
      const ocrText = await extractViaOcr(parser);
      if (ocrText.length >= MIN_TEXT_LENGTH) {
        text = ocrText;
      }
    }

    if (text.length < MIN_TEXT_LENGTH) {
      throw new Error(
        "Could not extract enough text from this PDF, even with OCR. Try a clearer scan or a text-based resume.",
      );
    }

    return text;
  } finally {
    await parser.destroy();
  }
}
