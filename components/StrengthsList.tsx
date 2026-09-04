type StrengthsListProps = {
  strengths: string[];
};

export function StrengthsList({ strengths }: StrengthsListProps) {
  if (strengths.length === 0) return null;

  return (
    <section aria-labelledby="strengths-heading" className="space-y-3">
      <h2
        id="strengths-heading"
        className="text-lg font-semibold text-slate-900"
      >
        Strengths
      </h2>
      <ul className="space-y-2">
        {strengths.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-800">
            <svg
              viewBox="0 0 20 20"
              className="mt-0.5 h-4 w-4 shrink-0 text-success"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.42l2.793 2.793 6.793-6.793a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
