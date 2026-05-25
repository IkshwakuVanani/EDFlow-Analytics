import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  DatabaseZap,
  Hospital,
  LineChart,
  LucideIcon,
  ShieldAlert,
} from "lucide-react";

import { AnalystReport } from "./pages/AnalystReport";
import { DataQuality } from "./pages/DataQuality";
import { EDRiskModeling } from "./pages/EDRiskModeling";
import { HospitalExplorer } from "./pages/HospitalExplorer";
import { Outliers } from "./pages/Outliers";
import { Overview } from "./pages/Overview";

type PageId = "overview" | "hospitals" | "outliers" | "quality" | "report" | "modeling";

type NavItem = {
  id: PageId;
  label: string;
  description: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", description: "National ED metrics", icon: Activity },
  { id: "hospitals", label: "Hospitals", description: "Provider explorer", icon: Hospital },
  { id: "outliers", label: "Outliers", description: "Operational watchlist", icon: ShieldAlert },
  { id: "quality", label: "Data Quality", description: "Pipeline checks", icon: DatabaseZap },
  { id: "report", label: "Analyst Report", description: "Findings and limits", icon: ClipboardCheck },
  { id: "modeling", label: "ED Risk Modeling", description: "Explainable models", icon: LineChart },
];

function App() {
  const [page, setPage] = useState<PageId>("overview");
  const active = useMemo(() => navItems.find((item) => item.id === page) ?? navItems[0], [page]);

  return (
    <div className="min-h-screen bg-mist">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-deep text-white">
              <BarChart3 size={21} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-ink">EDFlow Analytics</h1>
              <p className="text-xs text-slate-500">CMS hospital operations</p>
            </div>
          </div>

          <nav className="mt-6 grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = item.id === page;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`flex items-center gap-3 rounded-md px-3 py-3 text-left transition ${
                    selected ? "bg-teal text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                  }`}
                >
                  <Icon size={18} />
                  <span>
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className={`block text-xs ${selected ? "text-teal-50" : "text-slate-400"}`}>{item.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            Public CMS hospital quality data. Healthcare operations analytics only.
          </div>
        </aside>

        <main className="min-w-0 px-4 py-5 md:px-7">
          <header className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal">{active.description}</p>
              <h2 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">{active.label}</h2>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
              Measure focus: OP_18B, OP_18C, OP_22, OP_23
            </div>
          </header>
          {page === "overview" ? <Overview /> : null}
          {page === "hospitals" ? <HospitalExplorer /> : null}
          {page === "outliers" ? <Outliers /> : null}
          {page === "quality" ? <DataQuality /> : null}
          {page === "report" ? <AnalystReport /> : null}
          {page === "modeling" ? <EDRiskModeling /> : null}
        </main>
      </div>
    </div>
  );
}

export default App;
