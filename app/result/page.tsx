"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AtsResult = {
  extractedText: string;
  charCount: number;
  wordCount: number;
};

function isAtsResult(value: unknown): value is AtsResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.extractedText === "string" &&
    typeof v.charCount === "number" &&
    typeof v.wordCount === "number"
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AtsResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ats_result");
      if (!raw) {
        router.replace("/");
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (!isAtsResult(parsed)) {
        sessionStorage.removeItem("ats_result");
        router.replace("/");
        return;
      }
      setResult(parsed);
    } catch {
      sessionStorage.removeItem("ats_result");
      router.replace("/");
      return;
    } finally {
      setReady(true);
    }
  }, [router]);

  function handleBack() {
    sessionStorage.removeItem("ats_result");
  }

  if (!ready || !result) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-slate-600">
        Loading results…
      </div>
    );
  }

  const preview =
    result.extractedText.length > 1000
      ? `${result.extractedText.slice(0, 1000)}…`
      : result.extractedText;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-action">
          Extraction complete
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Resume text preview
        </h1>
        <p className="text-base text-slate-600">
          Here is the plain text pulled from your file — roughly what an ATS
          parser would read.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Characters
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">
            {result.charCount.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Words
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-900">
            {result.wordCount.toLocaleString()}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="extracted-heading" className="space-y-3">
        <h2 id="extracted-heading" className="text-lg font-semibold text-slate-900">
          Extracted text (first 1,000 characters)
        </h2>
        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200/80 bg-white/90 p-4 text-sm leading-relaxed text-slate-800">
          {preview}
        </pre>
      </section>

      <Link
        href="/"
        onClick={handleBack}
        className="inline-flex items-center justify-center rounded-lg bg-action px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      >
        Check another resume
      </Link>
    </div>
  );
}
