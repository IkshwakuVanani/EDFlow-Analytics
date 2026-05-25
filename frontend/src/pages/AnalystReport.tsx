import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { api, type Outlier, type Overview } from "../api/client";
import { ChartCard } from "../components/ChartCard";

export function AnalystReport() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [outliers, setOutliers] = useState<Outlier[]>([]);

  useEffect(() => {
    void Promise.all([api.overview(), api.outliers()]).then(([overviewPayload, outlierPayload]) => {
      setOverview(overviewPayload);
      setOutliers(outlierPayload);
    });
  }, []);

  const reportRows = useMemo(() => {
    if (!overview) return [];
    return [
      { label: "National median ED time", value: overview.national_median_ed_time ? `${overview.national_median_ed_time} minutes` : "n/a" },
      { label: "Highest average state", value: overview.worst_state ? `${overview.worst_state.state} at ${overview.worst_state.average_score} minutes` : "n/a" },
      { label: "Lowest average state", value: overview.best_state ? `${overview.best_state.state} at ${overview.best_state.average_score} minutes` : "n/a" },
      { label: "Outlier hospitals flagged", value: `${outliers.length}` },
    ];
  }, [overview, outliers.length]);

  if (!overview) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading report...</div>;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <ChartCard title="Key Findings" subtitle="Current ED throughput summary">
        <div className="space-y-3">
          {reportRows.map((row) => (
            <div key={row.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">{row.label}</p>
              <p className="mt-1 text-lg font-semibold text-ink">{row.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-md border border-slate-200 p-3 text-sm text-slate-600">
          CMS quality data is reported at facility and measure level, so comparisons should account for reporting period, missing values, measure definitions, and local operating context.
        </div>
      </ChartCard>

      <ChartCard title="State Variation" subtitle="Average OP_18B minutes by state">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview.state_summary} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="state" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="average_score" fill="#134e4a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Limitations" subtitle="Interpretation guardrails">
        <ul className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <li className="rounded-md border border-slate-200 bg-white p-3">Hospital-level metrics cannot explain individual patient waits.</li>
          <li className="rounded-md border border-slate-200 bg-white p-3">Missing CMS scores may reflect reporting rules, not actual performance.</li>
          <li className="rounded-md border border-slate-200 bg-white p-3">State averages hide variation across hospital types and ownership.</li>
          <li className="rounded-md border border-slate-200 bg-white p-3">Outlier flags are analyst prompts, not final performance judgments.</li>
        </ul>
      </ChartCard>
    </div>
  );
}
