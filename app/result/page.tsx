"use client";

import { parsePartialJson } from "ai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type StoredAtsResult = {
  extractedText: string;
  charCount?: number;
  wordCount?: number;
};

function readExtractedText(): string | null {
  try {
    const raw = sessionStorage.getItem("ats_result");
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const extractedText = (parsed as StoredAtsResult).extractedText;
    if (typeof extractedText !== "string" || extractedText.length === 0) {
      return null;
    }
    return extractedText;
  } catch {
    return null;
  }
}

function scoreTone(score: number): {
  label: string;
  className: string;
} {
  if (score >= 80) {
    return { label: "Strong ATS fit", className: "text-success" };
  }
  if (score >= 60) {
    return { label: "Moderate ATS fit", className: "text-action" };
  }
  return { label: "Needs improvement", className: "text-danger" };
}

export default function ResultPage() {
  const router = useRouter();
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    const text = readExtractedText();
    if (!text) {
      sessionStorage.removeItem("ats_result");
      router.replace("/");
      return;
    }
    setExtractedText(text);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready || !extractedText || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    async function streamScore() {
      setIsStreaming(true);
      setError(null);
      setAtsScore(null);

      try {
        const formData = new FormData();
        formData.append("extractedText", extractedText!);

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let message = "Could not score this resume. Please try again.";
          try {
            const data = (await response.json()) as { error?: string };
            if (data.error) message = data.error;
          } catch {
            // ignore JSON parse failure on error bodies
          }
          if (!cancelled) setError(message);
          return;
        }

        if (!response.body) {
          if (!cancelled) setError("Empty response from scoring service.");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          const partial = await parsePartialJson(accumulated);
          if (
            (partial.state === "successful-parse" ||
              partial.state === "repaired-parse") &&
            partial.value &&
            typeof partial.value === "object" &&
            !Array.isArray(partial.value) &&
            "atsScore" in partial.value
          ) {
            const score = (partial.value as { atsScore?: unknown }).atsScore;
            if (typeof score === "number" && !cancelled) {
              setAtsScore(Math.round(score));
            }
          }
        }
      } catch {
        if (!cancelled) {
          setError("Network error while scoring. Check your connection.");
        }
      } finally {
        if (!cancelled) setIsStreaming(false);
      }
    }

    void streamScore();

    return () => {
      cancelled = true;
    };
  }, [ready, extractedText]);

  function handleBack() {
    sessionStorage.removeItem("ats_result");
  }

  if (!ready || !extractedText) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-slate-600">
        Loading results…
      </div>
    );
  }

  const tone =
    atsScore !== null
      ? scoreTone(atsScore)
      : { label: "Scoring…", className: "text-slate-500" };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-action">
          Resumate
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Your ATS score
        </h1>
        <p className="text-base text-slate-600">
          AI is analyzing how applicant tracking systems are likely to parse
          your resume.
        </p>
      </div>

      <section
        aria-labelledby="score-heading"
        className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm sm:p-8"
      >
        <h2 id="score-heading" className="sr-only">
          ATS compatibility score
        </h2>

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : (
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:gap-6">
            <p
              className="text-6xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-7xl"
              aria-live="polite"
            >
              {atsScore !== null ? atsScore : "—"}
              <span className="ml-1 text-2xl font-semibold text-slate-400">
                /100
              </span>
            </p>
            <div className="pb-1">
              <p className={`text-sm font-semibold ${tone.className}`}>
                {isStreaming && atsScore === null ? "Scoring in progress…" : tone.label}
              </p>
              {isStreaming ? (
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-action border-t-transparent"
                    aria-hidden="true"
                  />
                  Streaming AI analysis
                </p>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="preview-heading" className="space-y-3">
        <h2 id="preview-heading" className="text-lg font-semibold text-slate-900">
          Extracted text preview
        </h2>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200/80 bg-white/90 p-4 text-sm leading-relaxed text-slate-800">
          {extractedText.length > 1000
            ? `${extractedText.slice(0, 1000)}…`
            : extractedText}
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
