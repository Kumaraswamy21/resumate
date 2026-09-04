import type { ATSResult } from "@/lib/ai/prompt";

type SuggestionsListProps = {
  suggestions: ATSResult["suggestions"];
};

const PRIORITY_STYLES = {
  high: "bg-red-50 text-danger",
  medium: "bg-amber-50 text-amber-500",
  low: "bg-slate-100 text-slate-600",
} as const;

const PRIORITY_LABELS = {
  high: "High",
  medium: "Medium",
  low: "Low",
} as const;

export function SuggestionsList({ suggestions }: SuggestionsListProps) {
  if (suggestions.length === 0) return null;

  return (
    <section aria-labelledby="suggestions-heading" className="space-y-3">
      <h2
        id="suggestions-heading"
        className="text-lg font-semibold text-slate-900"
      >
        Suggestions
      </h2>
      <ul className="space-y-4">
        {suggestions.map((item) => (
          <li key={`${item.area}-${item.action}`} className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {item.area}
              </span>
              <span
                className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[item.priority]}`}
              >
                {PRIORITY_LABELS[item.priority]}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              {item.action}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
