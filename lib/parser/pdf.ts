import { PDFParse } from "pdf-parse";
import { CanvasFactory } from "pdf-parse/worker";
import { recognizeImageTexts } from "./ocr";

const MIN_TEXT_LENGTH = 40;
/** A page this small is usually a header, page number, or failed extraction. */
const MIN_USABLE_PAGE_CHARS = 40;
const MIN_USABLE_PAGE_WORDS = 5;

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

function tableRows(table: Array<Array<string>>): string[] {
  return table
    .map((row) =>
      row
        .map((cell) => cell.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" | "),
    )
    .filter(Boolean);
}

function normalizedTableRow(row: string): string {
  return row.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Page tables are authoritative for page placement. Merged tables are only
 * used for rows not already present on a page, and each such row is assigned
 * once to the page with the greatest native-text overlap.
 */
function addUnplacedMergedRows(
  pageTableText: Map<number, string>,
  pagePlainText: Map<number, string>,
  mergedTables: Array<Array<Array<string>>>,
): void {
  const existingRows = new Set(
    [...pageTableText.values()]
      .flatMap((text) => text.split("\n"))
      .map(normalizedTableRow),
  );

  for (const table of mergedTables) {
    for (const row of tableRows(table)) {
      const normalizedRow = normalizedTableRow(row);
      if (!normalizedRow || existingRows.has(normalizedRow)) continue;

      const rowWords = normalizedRow.split(/\W+/).filter((word) => word.length > 2);
      let bestPage: number | undefined;
      let bestScore = 0;
      for (const [pageNumber, text] of pagePlainText) {
        const words = new Set(normalizedTableRow(text).split(/\W+/));
        const score = rowWords.reduce((total, word) => total + (words.has(word) ? 1 : 0), 0);
        if (score > bestScore) {
          bestPage = pageNumber;
          bestScore = score;
        }
      }

      if (bestPage === undefined) {
        bestPage = pagePlainText.keys().next().value as number | undefined;
      }
      if (bestPage === undefined) continue;
      const current = pageTableText.get(bestPage) ?? "";
      pageTableText.set(bestPage, normalizeExtractedText(`${current}\n${row}`));
      existingRows.add(normalizedRow);
    }
  }
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

async function extractViaOcr(
  parser: PDFParse,
  pageNumbers: number[],
): Promise<Map<number, string>> {
  if (pageNumbers.length === 0) return new Map();

  const screenshot = await parser.getScreenshot({
    partial: pageNumbers,
    scale: 2,
    imageBuffer: true,
    imageDataUrl: false,
  });

  const renderablePages = screenshot.pages.filter((page) => page.data?.length);
  const recognized = await recognizeImageTexts(renderablePages.map((page) => page.data));
  return new Map(
    renderablePages.map((page, index) => [
      page.pageNumber,
      normalizeExtractedText(recognized[index] ?? ""),
    ]),
  );
}

function isUsableNativeText(text: string): boolean {
  const chars = (text.match(/[A-Za-z0-9]/g) ?? []).length;
  const words = text.match(/[A-Za-z0-9]+/g) ?? [];
  return chars >= MIN_USABLE_PAGE_CHARS && words.length >= MIN_USABLE_PAGE_WORDS;
}

function betterText(nativeText: string, ocrText: string): string {
  if (!ocrText) return nativeText;
  if (!nativeText) return ocrText;
  const nativeScore = (nativeText.match(/[A-Za-z0-9]/g) ?? []).length;
  const ocrScore = (ocrText.match(/[A-Za-z0-9]/g) ?? []).length;
  return ocrScore > nativeScore ? ocrText : nativeText;
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

    const pagePlainText = new Map<number, string>();
    for (const page of textResult.pages) {
      pagePlainText.set(page.num, normalizeExtractedText(page.text));
    }

    const pageTableText = new Map<number, string>();
    try {
      const tableResult = await parser.getTable();
      for (const page of tableResult.pages) {
        const text = tableArrayToText(page.tables);
        if (text) pageTableText.set(page.num, normalizeExtractedText(text));
      }
      addUnplacedMergedRows(pageTableText, pagePlainText, tableResult.mergedTables ?? []);
    } catch {
      // Table detection is best-effort for bordered grids.
    }

    const pageText = new Map<number, string>();
    const pages = Array.from({ length: textResult.total }, (_, index) => index + 1);
    for (const pageNumber of pages) {
      const plain = pagePlainText.get(pageNumber) ?? "";
      const tableText = pageTableText.get(pageNumber) ?? "";
      pageText.set(pageNumber, pickBestText(plain, tableText));
    }

    // OCR is decided per page: short/sparse extraction is not evidence that
    // the whole PDF is text-based. This also prevents a selectable header or
    // page number from masking a scanned body below it.
    const ocrCandidates = pages.filter((pageNumber) =>
      !isUsableNativeText(pageText.get(pageNumber) ?? ""),
    );
    try {
      const ocrByPage = await extractViaOcr(parser, ocrCandidates);
      for (const pageNumber of ocrCandidates) {
        const nativeText = pageText.get(pageNumber) ?? "";
        pageText.set(pageNumber, betterText(nativeText, ocrByPage.get(pageNumber) ?? ""));
      }
    } catch {
      // Keep native text when rendering or OCR is unavailable.
    }

    const text = pages
      .map((pageNumber) => pageText.get(pageNumber) ?? "")
      .join("\n\n");

    if (normalizeExtractedText(text).length < MIN_TEXT_LENGTH) {
      throw new Error(
        "Could not extract enough text from this PDF, even with OCR. Try a clearer scan or a text-based resume.",
      );
    }

    return normalizeExtractedText(text);
  } finally {
    await parser.destroy();
  }
}
