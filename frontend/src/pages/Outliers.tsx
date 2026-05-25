import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { api, type Outlier } from "../api/client";
import { ChartCard } from "../components/ChartCard";

export function Outliers() {
  const [outliers, setOutliers] = useState<Outlier[]>([]);

  useEffect(() => {
    void api.outliers().then(setOutliers);
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle size={18} />
          Outlier review queue
        </div>
      </div>
      <ChartCard title="ED Throughput Outliers" subtitle="Highest OP_18B values and model severity">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Hospital</th>
                <th className="py-2">State</th>
                <th className="py-2">Measure</th>
                <th className="py-2">Value</th>
                <th className="py-2">Z-score</th>
                <th className="py-2">Severity</th>
                <th className="py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {outliers.map((outlier) => (
                <tr key={`${outlier.provider_id}-${outlier.measure_id}`} className="border-b border-slate-100 align-top">
                  <td className="py-3">
                    <p className="font-semibold text-ink">{outlier.facility_name}</p>
                    <p className="text-xs text-slate-500">{outlier.provider_id}</p>
                  </td>
                  <td className="py-3">{outlier.state}</td>
                  <td className="py-3">{outlier.measure_id}</td>
                  <td className="py-3">{outlier.score_value} min</td>
                  <td className="py-3">{outlier.z_score ?? "n/a"}</td>
                  <td className="py-3">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${outlier.severity === "high" ? "bg-red-50 text-risk" : "bg-amber-50 text-amber"}`}>
                      {outlier.severity}
                    </span>
                  </td>
                  <td className="max-w-sm py-3 text-slate-600">{outlier.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
