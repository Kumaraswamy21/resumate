# Sanitized per-page OCR fixture

This directory describes a public-safe three-page PDF fixture for the per-page
OCR fallback. It contains no real person, contact detail, phone number, or
employer data.

To build a PDF from these sources, create three letter/A4 pages:

1. Place [`page-1-native.txt`](page-1-native.txt) as selectable PDF text.
2. Draw the header `Sample Resume | 2` as selectable PDF text, then render
   [`page-2-scanned-body.txt`](page-2-scanned-body.txt) into a full-page PNG and
   embed that PNG. The body must not be added as PDF text.
3. Place [`page-3-native.txt`](page-3-native.txt) as selectable PDF text.

The important property is page 2: native extraction sees only its short header,
while the full-page render contains the body for OCR.

Expected instrumentation for **native text before OCR**:

```text
page 1: 642 chars / 106 words / OCR false
page 2: 8 chars / 3 words / OCR true
page 3: 235 chars / 42 words / OCR false
```

Expected final text:

```text
page 1 native content

page 2 OCR body content

page 3 native content
```

The page-2 header should occur at most once. The exact character/word counts
above are the observed transcript for the mixed OCR sample; fixture generators
may use different line wrapping while preserving the same sparse-page behavior.

The page-2 OCR result is intentionally much longer than its native result: the
8-character native extraction is only the selectable header, while the scanned
body is recovered from the full-page image.
