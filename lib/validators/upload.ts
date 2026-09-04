import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const UploadSchema = z.object({
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE_BYTES, {
      message: `File size must be at most ${MAX_FILE_SIZE_BYTES} bytes`,
    }),
});

export type UploadInput = z.infer<typeof UploadSchema>;
