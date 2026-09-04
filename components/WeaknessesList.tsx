type WeaknessesListProps = {
  weaknesses: string[];
};

export function WeaknessesList({ weaknesses }: WeaknessesListProps) {
  if (weaknesses.length === 0) return null;

  return (
    <section aria-labelledby="weaknesses-heading" className="space-y-3">
      <h2
        id="weaknesses-heading"
        className="text-lg font-semibold text-slate-900"
      >
        Weaknesses
      </h2>
      <ul className="space-y-2">
        {weaknesses.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-800">
            <svg
              viewBox="0 0 20 20"
              className="mt-0.5 h-4 w-4 shrink-0 text-danger"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
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
