import { useEffect, useState } from "react";
import { AlertTriangle, BrainCircuit } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  api,
  type ClusterResponse,
  type FeatureImportance,
  type HighRiskHospital,
  type ModelSummary,
  type Outlier,
} from "../api/client";
import { ChartCard } from "../components/ChartCard";

export function EDRiskModeling() {
  const [highRisk, setHighRisk] = useState<HighRiskHospital[]>([]);
  const [outliers, setOutliers] = useState<Outlier[]>([]);
  const [clusters, setClusters] = useState<ClusterResponse | null>(null);
  const [features, setFeatures] = useState<FeatureImportance[]>([]);
  const [summary, setSummary] = useState<ModelSummary | null>(null);
  const featureChartData = features.map((feature) => ({
    ...feature,
    label: shortenFeature(feature.feature_name),
  }));

  useEffect(() => {
    void Promise.all([
      api.highRisk(),
      api.modelOutliers(),
      api.clusters(),
      api.featureImportance(),
      api.modelSummary(),
    ]).then(([riskPayload, outlierPayload, clusterPayload, featurePayload, summaryPayload]) => {
      setHighRisk(riskPayload);
      setOutliers(outlierPayload);
      setClusters(clusterPayload);
      setFeatures(featurePayload);
      setSummary(summaryPayload);
    });
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <p>This model is for healthcare operations analysis only. It does not make clinical decisions or patient-level predictions.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="High-Risk Hospitals" subtitle="Risk categories from hospital-level ED features">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Hospital</th>
                  <th className="py-2">State</th>
                  <th className="py-2">Probability</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Drivers</th>
                </tr>
              </thead>
              <tbody>
                {highRisk.map((hospital) => (
                  <tr key={hospital.provider_id} className="border-b border-slate-100 align-top">
                    <td className="py-3">
                      <p className="font-semibold text-ink">{hospital.facility_name}</p>
                      <p className="text-xs text-slate-500">{hospital.provider_id}</p>
                    </td>
                    <td className="py-3">{hospital.state}</td>
                    <td className="py-3">{Math.round(hospital.risk_probability * 100)}%</td>
                    <td className="py-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${hospital.risk_category === "high" ? "bg-red-50 text-risk" : "bg-amber-50 text-amber"}`}>
                        {hospital.risk_category}
                      </span>
                    </td>
                    <td className="max-w-sm py-3 text-slate-600">{hospital.drivers.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Feature Importance" subtitle="Baseline classification drivers">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureChartData} layout="vertical" margin={{ left: 10, right: 15, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={128} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="importance" fill="#0f766e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <ChartCard title="Model Metrics" subtitle={summary?.model_type ?? "No run loaded"}>
          <div className="space-y-2">
            {summary
              ? Object.entries(summary.metrics).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <span className="font-semibold text-slate-600">{key}</span>
                    <span className="text-ink">{value ?? "n/a"}</span>
                  </div>
                ))
              : null}
          </div>
        </ChartCard>

        <ChartCard title="Cluster Breakdown" subtitle="Hospital performance groups">
          <div className="space-y-2">
            {clusters?.summary.map((cluster) => (
              <div key={cluster.cluster_label} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{cluster.cluster_label}</p>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold">{cluster.count}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{cluster.states.join(", ")}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Outlier Model Queue" subtitle="Top flagged hospitals">
          <div className="space-y-2">
            {outliers.slice(0, 5).map((outlier) => (
              <div key={outlier.provider_id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{outlier.facility_name}</p>
                  <p className="text-xs text-slate-500">{outlier.state} · z {outlier.z_score}</p>
                </div>
                <BrainCircuit size={18} className="text-teal" />
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {summary ? (
        <ChartCard title="Model Limitations">
          <ul className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
            {summary.limitations.map((limitation) => (
              <li key={limitation} className="rounded-md border border-slate-200 bg-white p-3">
                {limitation}
              </li>
            ))}
          </ul>
        </ChartCard>
      ) : null}
    </div>
  );
}

function shortenFeature(featureName: string) {
  return featureName
    .replace("OP_18B departure minutes", "OP_18B ED time")
    .replace("OP_22 left without being seen rate", "OP_22 LWBS")
    .replace("OP_18C psychiatric ED time", "OP_18C psych")
    .replace("Overall hospital rating", "Rating")
    .replace("State-level average", "State avg");
}
