"use client";

import { parsePartialJson } from "ai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ATSResultSchema, type ATSResult } from "@/lib/ai/prompt";

type StoredAtsResult = {
  extractedText: string;
  charCount?: number;
  wordCount?: number;
};

const GAUGE_CIRCUMFERENCE = 502.65;
const GAUGE_RADIUS = 80;
const GAUGE_CENTER = { x: 100, y: 100 };

type ScoreBand = {
  label: string;
  arcClass: string;
  textClass: string;
  barClass: string;
};

function getScoreBand(score: number): ScoreBand {
  if (score >= 90) {
    return {
      label: "Excellent",
      arcClass: "stroke-emerald-500",
      textClass: "text-emerald-700",
      barClass: "bg-emerald-500",
    };
  }
  if (score >= 75) {
    return {
      label: "Good",
      arcClass: "stroke-green-600",
      textClass: "text-green-700",
      barClass: "bg-green-600",
    };
  }
  if (score >= 60) {
    return {
      label: "Acceptable",
      arcClass: "stroke-yellow-500",
      textClass: "text-yellow-700",
      barClass: "bg-yellow-500",
    };
  }
  if (score >= 40) {
    return {
      label: "Poor",
      arcClass: "stroke-orange-500",
      textClass: "text-orange-700",
      barClass: "bg-orange-500",
    };
  }
  return {
    label: "Failing",
    arcClass: "stroke-red-600",
    textClass: "text-red-700",
    barClass: "bg-red-600",
  };
}

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

function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const band = getScoreBand(clamped);
  const offset = GAUGE_CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="flex w-full justify-center">
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`ATS score ${clamped} out of 100, ${band.label}`}
        className="relative w-full max-w-xs"
      >
        <svg viewBox="0 0 200 100" className="h-auto w-full" aria-hidden="true">
          <path
            d={`M ${GAUGE_CENTER.x - GAUGE_RADIUS} ${GAUGE_CENTER.y} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${GAUGE_CENTER.x + GAUGE_RADIUS} ${GAUGE_CENTER.y}`}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d={`M ${GAUGE_CENTER.x - GAUGE_RADIUS} ${GAUGE_CENTER.y} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${GAUGE_CENTER.x + GAUGE_RADIUS} ${GAUGE_CENTER.y}`}
            fill="none"
            className={band.arcClass}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${GAUGE_CIRCUMFERENCE / 2} ${GAUGE_CIRCUMFERENCE / 2}`}
            strokeDashoffset={offset / 2}
            pathLength={GAUGE_CIRCUMFERENCE / 2}
          />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center pb-1 text-center">
          <span className="text-4xl font-bold tabular-nums text-slate-900">
            {clamped}
          </span>
          <span className={`text-sm font-semibold ${band.textClass}`}>
            {band.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function CriteriaBreakdown({
  criteria,
}: {
  criteria: ATSResult["criteria"];
}) {
  const sorted = [...criteria].sort((a, b) => a.score - b.score);

  return (
    <section aria-labelledby="criteria-heading" className="space-y-4 text-left">
      <h2 id="criteria-heading" className="text-lg font-semibold text-slate-900">
        Criteria Breakdown
      </h2>
      <ul className="space-y-5">
        {sorted.map((row) => {
          const band = getScoreBand(row.score);
          return (
            <li key={row.name} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900">{row.name}</span>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                  {Math.round(row.weight * 100)}%
                </span>
                <span className={`text-xs font-semibold ${band.textClass}`}>
                  {band.label}
                </span>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={row.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${row.name}: ${row.score} out of 100, ${band.label}`}
              >
                <div
                  className={`h-full rounded-full transition-all ${band.barClass}`}
                  style={{ width: `${row.score}%` }}
                />
              </div>
              <p
                className="cursor-help text-sm leading-relaxed text-slate-600"
                title={row.detail}
              >
                {row.detail}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function StrengthsWeaknessesGrid({
  strengths,
  weaknesses,
}: {
  strengths: string[];
  weaknesses: string[];
}) {
  return (
    <section
      aria-labelledby="sw-heading"
      className="grid grid-cols-1 gap-6 text-left md:grid-cols-2"
    >
      <h2 id="sw-heading" className="sr-only">
        Strengths and weaknesses
      </h2>

      <div className="space-y-3 rounded-xl border border-green-200 bg-green-50/40 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900">
            ✅ Strengths
          </h3>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
            {strengths.length}
          </span>
        </div>
        {strengths.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {strengths.map((item) => (
              <li
                key={item}
                className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">No strengths identified.</p>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/40 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900">
            🚨 Weaknesses
          </h3>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
            {weaknesses.length}
          </span>
        </div>
        {weaknesses.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {weaknesses.map((item) => (
              <li
                key={item}
                className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">No weaknesses identified.</p>
        )}
      </div>
    </section>
  );
}

function SuggestionsPanel({
  suggestions,
}: {
  suggestions: ATSResult["suggestions"];
}) {
  const groups = [
    {
      key: "high" as const,
      title: "High Priority",
      empty: "No high-priority suggestions.",
      containerClass: "border-red-200 bg-red-50/50",
      badgeClass: "bg-red-100 text-red-800",
    },
    {
      key: "medium" as const,
      title: "Medium Priority",
      empty: "No medium-priority suggestions.",
      containerClass: "border-amber-200 bg-amber-50/50",
      badgeClass: "bg-amber-100 text-amber-800",
    },
    {
      key: "low" as const,
      title: "Low Priority",
      empty: "No low-priority suggestions.",
      containerClass: "border-slate-200 bg-slate-50",
      badgeClass: "bg-slate-200 text-slate-700",
    },
  ];

  return (
    <section aria-labelledby="suggestions-heading" className="space-y-4 text-left">
      <h2
        id="suggestions-heading"
        className="text-lg font-semibold text-slate-900"
      >
        Suggestions
      </h2>
      <div className="space-y-4">
        {groups.map((group) => {
          const items = suggestions.filter(
            (item) => item.priority === group.key,
          );

          return (
            <div
              key={group.key}
              className={`rounded-xl border p-4 ${group.containerClass}`}
            >
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-900">
                {group.title}
              </h3>
              {items.length > 0 ? (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={`${group.key}-${item.area}-${item.action}`}
                      className="rounded-lg border border-white/70 bg-white/80 p-3 shadow-sm"
                    >
                      <span
                        className={`mb-2 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${group.badgeClass}`}
                      >
                        {item.area}
                      </span>
                      <p className="text-sm leading-relaxed text-slate-800">
                        {item.action}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">{group.empty}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
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
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-600">
        Loading results…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
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
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
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

          {!isStreaming && result && atsScore !== null ? (
            <div className="mt-10 space-y-10">
              <p className="text-left text-base leading-relaxed text-slate-700">
                {contextualSentence(atsScore)}
              </p>
              <CriteriaBreakdown criteria={result.criteria} />
              <StrengthsWeaknessesGrid
                strengths={result.strengths}
                weaknesses={result.weaknesses}
              />
              <SuggestionsPanel suggestions={result.suggestions} />
            </div>
          ) : null}
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
