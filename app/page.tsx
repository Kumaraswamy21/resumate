"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { extractResumeAction } from "@/app/actions/extract-resume";
import { ErrorBanner } from "@/components/ErrorBanner";
import { UploadZone } from "@/components/UploadZone";

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!file || isUploading) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const data = await extractResumeAction(formData);

      if (!data.success) {
        setError(data.error);
        return;
      }

      sessionStorage.setItem(
        "ats_result",
        JSON.stringify({
          extractedText: data.extractedText,
          charCount: data.charCount,
          wordCount: data.wordCount,
        }),
      );
      router.push("/result");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-action">
          Resumate
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Check your resume&apos;s ATS score
        </h1>
        <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
          Upload a PDF or DOCX resume. We extract the text an applicant tracking
          system would see, then score how ATS-friendly it is.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-7">
        {error ? (
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        ) : null}

        <UploadZone
          file={file}
          onFileSelect={setFile}
          disabled={isUploading}
        />

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!file || isUploading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-action px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        >
          {isUploading ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              Analyzing…
            </>
          ) : (
            "Analyze resume"
          )}
        </button>
      </div>
    </div>
  );
}
