import { useEffect, useState } from "react";
import { CheckCircle2, Database, TriangleAlert, XCircle } from "lucide-react";

import { api, type DataQuality as DataQualityData } from "../api/client";
import { ChartCard } from "../components/ChartCard";
import { MetricCard } from "../components/MetricCard";

export function DataQuality() {
  const [quality, setQuality] = useState<DataQualityData | null>(null);

  useEffect(() => {
    void api.quality().then(setQuality);
  }, []);

  if (!quality) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading data quality...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Raw Rows" value={quality.raw_row_count.toLocaleString()} detail="Rows preserved from CMS source" icon={Database} tone="slate" />
        <MetricCard title="Clean Hospitals" value={quality.clean_hospital_count.toLocaleString()} detail="Hospitals in dim_hospital" icon={CheckCircle2} tone="teal" />
        <MetricCard title="Clean Facts" value={quality.clean_fact_count.toLocaleString()} detail="ED measure fact rows" icon={CheckCircle2} tone="teal" />
        <MetricCard title="Check Warnings" value={`${quality.warning_checks}`} detail={`${quality.failed_checks} failed checks`} icon={TriangleAlert} tone={quality.failed_checks ? "risk" : "amber"} />
      </div>

      <ChartCard title="Validation Checks" subtitle="Pipeline checks for completeness, numeric parsing, and row counts">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Check</th>
                <th className="py-2">Table</th>
                <th className="py-2">Status</th>
                <th className="py-2">Value</th>
                <th className="py-2">Threshold</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {quality.checks.map((check) => (
                <tr key={`${check.table_name}-${check.check_name}`} className="border-b border-slate-100 align-top">
                  <td className="py-3 font-semibold text-ink">{check.check_name}</td>
                  <td className="py-3">{check.table_name}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${statusClass(check.status)}`}>
                      {check.status === "fail" ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                      {check.status}
                    </span>
                  </td>
                  <td className="py-3">{check.metric_value ?? "n/a"}</td>
                  <td className="py-3">{check.threshold ?? "n/a"}</td>
                  <td className="max-w-md py-3 text-slate-600">{check.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "fail") return "bg-red-50 text-risk";
  if (status === "warning") return "bg-amber-50 text-amber";
  return "bg-teal-50 text-teal";
}
