import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Building2, MapPinned } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { api, type Overview as OverviewData, type StateSummary } from "../api/client";
import { ChartCard } from "../components/ChartCard";
import { MetricCard } from "../components/MetricCard";

export function Overview() {
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    void api.overview().then(setOverview);
  }, []);

  if (!overview) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading overview...</div>;
  }

  const topStates = [...overview.state_summary].sort((a, b) => (b.average_score ?? 0) - (a.average_score ?? 0)).slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="National Median"
          value={overview.national_median_ed_time ? `${overview.national_median_ed_time} min` : "n/a"}
          detail="Median ED arrival-to-departure time"
          icon={Activity}
          tone="teal"
        />
        <MetricCard
          title="Reporting Hospitals"
          value={overview.reporting_hospitals.toLocaleString()}
          detail="Hospitals with ED throughput measures"
          icon={Building2}
          tone="slate"
        />
        <MetricCard
          title="Highest State Avg"
          value={overview.worst_state ? `${overview.worst_state.state} ${overview.worst_state.average_score}m` : "n/a"}
          detail="Highest OP_18B average in current data"
          icon={AlertTriangle}
          tone="risk"
        />
        <MetricCard
          title="LWBS Rate"
          value={overview.average_lwbs_rate ? `${overview.average_lwbs_rate}%` : "n/a"}
          detail="Average left-without-being-seen rate"
          icon={MapPinned}
          tone="amber"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <ChartCard title="ED Throughput Distribution" subtitle="Hospitals by OP_18B minute bucket">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.distribution} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="State ED Averages" subtitle="Highest average OP_18B minutes">
          <div className="space-y-3">
            {topStates.map((state) => (
              <StateRow key={state.state} state={state} max={topStates[0]?.average_score ?? 1} />
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Worst State Watchlist" subtitle="Average score, median, and hospital count by state">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">State</th>
                <th className="py-2">Average</th>
                <th className="py-2">Median</th>
                <th className="py-2">P75</th>
                <th className="py-2">Hospitals</th>
                <th className="py-2">Missing</th>
              </tr>
            </thead>
            <tbody>
              {topStates.map((state) => (
                <tr key={state.state} className="border-b border-slate-100">
                  <td className="py-3 font-semibold text-ink">{state.state}</td>
                  <td className="py-3">{state.average_score ?? "n/a"} min</td>
                  <td className="py-3">{state.median_score ?? "n/a"} min</td>
                  <td className="py-3">{state.p75_score ?? "n/a"} min</td>
                  <td className="py-3">{state.hospital_count}</td>
                  <td className="py-3">{state.missing_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function StateRow({ state, max }: { state: StateSummary; max: number }) {
  const value = state.average_score ?? 0;
  const width = Math.max(6, (value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-semibold text-ink">{state.state}</span>
        <span className="text-slate-600">{value} min</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-teal" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
