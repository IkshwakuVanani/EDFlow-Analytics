import { useMemo, useState } from "react";
import {
  ActivitySquare,
  BedDouble,
  Bell,
  ChevronDown,
  FileBarChart,
  GitFork,
  Grid2X2,
  ListChecks,
  LucideIcon,
  PlayCircle,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Siren,
} from "lucide-react";

import { ActionConsolePage } from "./pages/ActionConsole";
import { BlockerQueue } from "./pages/BlockerQueue";
import { CapacityGraphPage } from "./pages/CapacityGraph";
import { CommandCenter } from "./pages/CommandCenter";
import { Evidence } from "./pages/Evidence";
import { Simulation } from "./pages/Simulation";

type PageId = "command" | "graph" | "blockers" | "actions" | "simulation" | "evidence";

type NavItem = {
  id: PageId;
  label: string;
  description: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { id: "command", label: "Command Center", description: "Live capacity conversion", icon: Grid2X2 },
  { id: "graph", label: "Capacity Graph", description: "Boarders to ready beds", icon: GitFork },
  { id: "blockers", label: "Blocker Queue", description: "Ranked by bed-hour impact", icon: Siren },
  { id: "actions", label: "Action Console", description: "Owners, SLAs, escalation", icon: ListChecks },
  { id: "simulation", label: "Simulation", description: "What-if capacity levers", icon: PlayCircle },
  { id: "evidence", label: "Evidence", description: "CMS public-data analytics", icon: FileBarChart },
];

function App() {
  const [page, setPage] = useState<PageId>("command");
  const active = useMemo(() => navItems.find((item) => item.id === page) ?? navItems[0], [page]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[246px_1fr]">
        <aside className="bg-[#061927] text-white">
          <div className="flex flex-col lg:min-h-full">
            <div className="border-b border-white/10 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 grid-cols-2 gap-1 rounded-md p-1">
                  <span className="rounded-sm bg-teal-400" />
                  <span className="rounded-sm bg-slate-500" />
                  <span className="rounded-sm bg-slate-300" />
                  <span className="rounded-sm bg-teal-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold leading-5">EDFlow</h1>
                  <p className="text-sm font-semibold leading-4 text-slate-200">Orchestrator</p>
                </div>
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-1 px-3 py-4 lg:grid-cols-1 lg:py-5">
              {navItems.map((item) => {
                const selected = item.id === page;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition lg:py-3 ${
                      selected ? "bg-teal-700 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className={`hidden truncate text-xs sm:block ${selected ? "text-teal-50" : "text-slate-500"}`}>{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto hidden space-y-4 border-t border-white/10 px-4 py-5 lg:block">
              <div className="rounded-md border border-white/15 bg-white/5 p-3">
                <p className="text-xs font-semibold text-slate-400">Hospital / Unit</p>
                <select className="mt-2 h-9 w-full rounded-md border border-white/15 bg-[#0b2637] px-3 text-sm text-white">
                  <option>Cityview Medical Center</option>
                </select>
                <select className="mt-2 h-9 w-full rounded-md border border-white/15 bg-[#0b2637] px-3 text-sm text-white">
                  <option>Med-Surg Capacity</option>
                </select>
                <p className="mt-3 text-xs text-slate-400">Updated: 08:24 AM</p>
              </div>

              <button className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
                <span className="flex items-center gap-2"><Bell size={17} /> Notifications</span>
                <span className="rounded-full bg-teal-600 px-2 py-0.5 text-xs font-semibold text-white">6</span>
              </button>
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
                <Settings size={17} /> Settings
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-[245px] shrink-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                  <BedDouble size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="whitespace-nowrap text-xl font-semibold text-slate-950">Med-Surg Capacity</h2>
                    <ChevronDown size={16} className="text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
                <div className="flex items-center gap-2">
                  <span className="hidden whitespace-nowrap text-xs font-semibold text-slate-500 md:inline">Time horizon</span>
                  <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-1">
                    {["2h", "6h", "12h", "24h"].map((item) => (
                      <button
                        key={item}
                        className={`h-8 min-w-12 rounded px-3 text-xs font-semibold ${item === "6h" ? "bg-teal-700 text-white" : "text-slate-500 hover:bg-white"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex min-w-[112px] items-center gap-2 whitespace-nowrap text-sm text-slate-600">
                  <ActivitySquare size={17} />
                  <span className="font-semibold text-slate-950">Now</span>
                  <span>08:24 AM</span>
                </div>
                <div className="hidden items-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-xs md:flex">
                  <span className="font-semibold text-slate-500">Service health</span>
                  {["EHR", "ADT", "Capacity", "RTLS"].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 text-slate-600">
                      <ShieldCheck size={13} className="text-teal-700" />
                      {item}
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <Siren size={13} />
                    EVS
                  </span>
                </div>
                <button className="hidden h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 md:flex">
                  <RefreshCcw size={15} />
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-4 md:px-6">
            {active.id === "command" ? <CommandCenter onOpenSimulation={() => setPage("simulation")} /> : null}
            {active.id === "graph" ? <CapacityGraphPage /> : null}
            {active.id === "blockers" ? <BlockerQueue /> : null}
            {active.id === "actions" ? <ActionConsolePage onOpenSimulation={() => setPage("simulation")} /> : null}
            {active.id === "simulation" ? <Simulation /> : null}
            {active.id === "evidence" ? <Evidence /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
