"use client";

import { useId, useRef, useState } from "react";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type AllowedMimeType,
} from "@/lib/validators/upload";

type UploadZoneProps = {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
};

function isAllowedMime(type: string): type is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type);
}

export function UploadZone({
  file,
  onFileSelect,
  disabled = false,
}: UploadZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndSet(selected: File | null) {
    setError(null);

    if (!selected) {
      onFileSelect(null);
      return;
    }

    if (!isAllowedMime(selected.type)) {
      setError("Only PDF and DOCX files are accepted.");
      onFileSelect(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError("File must be 5MB or smaller.");
      onFileSelect(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onFileSelect(selected);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    validateAndSet(selected);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const selected = e.dataTransfer.files?.[0] ?? null;
    validateAndSet(selected);
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          isDragging
            ? "border-action bg-blue-50"
            : "border-slate-300 bg-white/70 hover:border-action hover:bg-blue-50/60",
          disabled ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <span className="text-base font-medium text-slate-900">
          {file ? "Replace resume" : "Drop your resume here"}
        </span>
        <span className="text-sm text-slate-600">
          or click to browse · PDF or DOCX · max 5MB
        </span>
        {file ? (
          <span className="mt-2 max-w-full truncate text-sm font-medium text-action">
            {file.name}
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={handleChange}
          disabled={disabled}
        />
      </label>

      {error ? (
        <p role="alert" aria-live="polite" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
