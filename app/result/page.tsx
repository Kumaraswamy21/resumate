"use client";

import { parsePartialJson } from "ai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CriteriaTable } from "@/components/CriteriaTable";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ScoreGauge } from "@/components/ScoreGauge";
import { StrengthsList } from "@/components/StrengthsList";
import { SuggestionsList } from "@/components/SuggestionsList";
import { WeaknessesList } from "@/components/WeaknessesList";
import { ATSResultSchema, type ATSResult } from "@/lib/ai/prompt";

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

function contextualSentence(score: number): string {
  if (score >= 75) {
    return "Your resume is well optimised for ATS systems.";
  }
  if (score >= 50) {
    return "Your resume passes basic ATS filters but has room to improve.";
  }
  return "Your resume needs significant improvements to pass most ATS filters.";
}

function isPartialObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default function ResultPage() {
  const router = useRouter();
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [result, setResult] = useState<ATSResult | null>(null);
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

    async function streamAnalysis() {
      setIsStreaming(true);
      setError(null);
      setAtsScore(null);
      setResult(null);

      try {
        const formData = new FormData();
        formData.append("extractedText", extractedText!);

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let message = "Could not analyze this resume. Please try again.";
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
          if (!cancelled) setError("Empty response from analysis service.");
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
            isPartialObject(partial.value) &&
            "atsScore" in partial.value &&
            typeof partial.value.atsScore === "number" &&
            !Number.isNaN(partial.value.atsScore)
          ) {
            if (!cancelled) {
              setAtsScore(Math.round(partial.value.atsScore));
            }
          }
        }

        const finalPartial = await parsePartialJson(accumulated);
        if (
          finalPartial.state !== "successful-parse" &&
          finalPartial.state !== "repaired-parse"
        ) {
          if (!cancelled) {
            setError("Could not parse the analysis response. Please try again.");
          }
          return;
        }

        const validated = ATSResultSchema.safeParse(finalPartial.value);
        if (!validated.success) {
          if (!cancelled) {
            setError("Analysis returned an incomplete result. Please try again.");
          }
          return;
        }

        if (!cancelled) {
          setAtsScore(validated.data.atsScore);
          setResult(validated.data);
        }
      } catch {
        if (!cancelled) {
          setError("Network error while analyzing. Check your connection.");
        }
      } finally {
        if (!cancelled) setIsStreaming(false);
      }
    }

    void streamAnalysis();

    return () => {
      cancelled = true;
    };
  }, [ready, extractedText]);

  function handleBack() {
    sessionStorage.removeItem("ats_result");
  }

  if (!ready || !extractedText) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-600">
        Loading results…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-16">
      {error ? (
        <div className="space-y-4">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <Link
            href="/"
            onClick={handleBack}
            className="inline-flex text-sm font-semibold text-action underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          >
            Return home
          </Link>
        </div>
      ) : null}

      {!error ? (
        <div className="flex flex-col items-center gap-6">
          {atsScore !== null ? <ScoreGauge score={atsScore} /> : null}

          {isStreaming ? (
            <div
              className="flex flex-col items-center gap-3 text-slate-600"
              role="status"
              aria-live="polite"
            >
              <span
                className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-action border-t-transparent"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">Analyzing your resume…</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {!error && !isStreaming && result && atsScore !== null ? (
        <div className="space-y-10">
          <p className="text-center text-base leading-relaxed text-slate-700">
            {contextualSentence(atsScore)}
          </p>
          <CriteriaTable criteria={result.criteria} />
          <StrengthsList strengths={result.strengths} />
          <WeaknessesList weaknesses={result.weaknesses} />
          <SuggestionsList suggestions={result.suggestions} />
        </div>
      ) : null}

      <div className="pt-2">
        <Link
          href="/"
          onClick={handleBack}
          className="inline-flex items-center justify-center rounded-lg bg-action px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        >
          Check another resume
        </Link>
      </div>
    </div>
  );
}
