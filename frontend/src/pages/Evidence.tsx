import { useState } from "react";

import { AnalystReport } from "./AnalystReport";
import { DataQuality } from "./DataQuality";
import { EDRiskModeling } from "./EDRiskModeling";
import { HospitalExplorer } from "./HospitalExplorer";
import { Outliers } from "./Outliers";
import { Overview } from "./Overview";

type EvidenceTab = "overview" | "hospitals" | "outliers" | "quality" | "report" | "modeling";

const tabs: Array<{ id: EvidenceTab; label: string }> = [
  { id: "overview", label: "CMS Overview" },
  { id: "hospitals", label: "Hospitals" },
  { id: "outliers", label: "Outliers" },
  { id: "quality", label: "Data Quality" },
  { id: "report", label: "Analyst Report" },
  { id: "modeling", label: "Modeling" },
];

export function Evidence() {
  const [tab, setTab] = useState<EvidenceTab>("overview");

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-950">Public-data evidence</h2>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
          CMS hospital quality analytics remain available as supporting evidence for the orchestration thesis. These measures are public,
          hospital-level operations signals and are not patient-level clinical guidance.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`h-9 rounded-md border px-3 text-sm font-semibold transition ${
                item.id === tab
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" ? <Overview /> : null}
      {tab === "hospitals" ? <HospitalExplorer /> : null}
      {tab === "outliers" ? <Outliers /> : null}
      {tab === "quality" ? <DataQuality /> : null}
      {tab === "report" ? <AnalystReport /> : null}
      {tab === "modeling" ? <EDRiskModeling /> : null}
    </div>
  );
}
