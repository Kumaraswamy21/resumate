import type { ATSResult } from "@/lib/ai/prompt";

type CriteriaTableProps = {
  criteria: ATSResult["criteria"];
};

export function CriteriaTable({ criteria }: CriteriaTableProps) {
  return (
    <section aria-labelledby="criteria-heading" className="space-y-3">
      <h2
        id="criteria-heading"
        className="text-lg font-semibold text-slate-900"
      >
        Criteria
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <caption className="sr-only">ATS Criteria Breakdown</caption>
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th scope="col" className="px-3 py-2 font-semibold">
                Criterion
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Weight
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Score
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((row) => (
              <tr
                key={row.name}
                className="border-b border-slate-100 text-slate-800"
              >
                <td className="px-3 py-2.5">
                  <div className="font-medium">{row.name}</div>
                  <p className="mt-0.5 text-xs text-slate-500">{row.detail}</p>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-slate-600">
                  {Math.round(row.weight * 100)}%
                </td>
                <td className="px-3 py-2.5 tabular-nums">{row.score}</td>
                <td className="px-3 py-2.5">
                  {row.passed ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-success">
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.42l2.793 2.793 6.793-6.793a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Pass
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-medium text-danger">
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Fail
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
