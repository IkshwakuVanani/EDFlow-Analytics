import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BedDouble, Clock3, MoreVertical, SlidersHorizontal, UsersRound } from "lucide-react";

import {
  api,
  type CapacityAction,
  type CapacityCommandCenter,
  type CapacityKpi,
} from "../api/client";
import { ActionDetail } from "../components/capacity/ActionDetail";
import { CapacityFlow } from "../components/capacity/CapacityFlow";
import { CapacityPanel } from "../components/capacity/CapacityPanel";
import { CapacityTimeline } from "../components/capacity/CapacityTimeline";
import { StatusBadge } from "../components/capacity/StatusBadge";

type CommandCenterProps = {
  onOpenSimulation: () => void;
};

const kpiIcons = {
  ed_boarders: UsersRound,
  boarding_hours: Clock3,
  unlockable_beds: BedDouble,
  sla_tasks: AlertTriangle,
};

export function CommandCenter({ onOpenSimulation }: CommandCenterProps) {
  const [payload, setPayload] = useState<CapacityCommandCenter | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string>("");

  useEffect(() => {
    void api.commandCenter(360).then((data) => {
      setPayload(data);
      setSelectedActionId(data.selected_action_id);
    });
  }, []);

  const selectedAction = useMemo(
    () => payload?.actions.find((action) => action.id === selectedActionId) ?? payload?.actions[0] ?? null,
    [payload?.actions, selectedActionId],
  );

  async function handleActionUpdate(action: CapacityAction, status: CapacityAction["status"]) {
    const updated = await api.updateCapacityAction(action.id, { status });
    setPayload((current) =>
      current
        ? {
            ...current,
            actions: current.actions.map((item) => (item.id === updated.id ? updated : item)),
          }
        : current,
    );
    setSelectedActionId(updated.id);
  }

  if (!payload) {
    return <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading command center...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {payload.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,0.75fr)]">
        <CapacityPanel
          title="Capacity timeline (next 6 hours)"
          subtitle={`Risk window ${payload.risk_window}`}
          action={<TimelineControls />}
        >
          <CapacityTimeline data={payload.timeline} />
        </CapacityPanel>
        <CapacityPanel
          title="Capacity flow"
          subtitle={`as of ${payload.current_time}`}
          action={<button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><MoreVertical size={16} /></button>}
        >
          <CapacityFlow nodes={payload.flow_nodes} />
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Numbers reflect active synthetic operational counts.</p>
        </CapacityPanel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
        <CapacityPanel
          title="Top capacity blockers"
          action={<button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><SlidersHorizontal size={16} /></button>}
          className="min-h-[430px]"
        >
          <div className="divide-y divide-slate-100">
            {payload.blockers.slice(0, 5).map((blocker) => (
              <button
                key={blocker.id}
                className="grid w-full grid-cols-[34px_1fr_auto] items-center gap-3 px-4 py-4 text-left hover:bg-slate-50"
                onClick={() => {
                  const action = payload.actions.find((item) => item.dependency_ids.includes(blocker.id));
                  if (action) setSelectedActionId(action.id);
                }}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                  blocker.severity === "high" ? "border-red-300 text-red-600" : "border-amber-300 text-amber-600"
                }`}>
                  {blocker.rank}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-950">{blocker.title}</span>
                  <span className="block text-xs text-slate-500">{blocker.owner_role}</span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold text-red-600">-{blocker.estimated_beds_unlocked} beds</span>
                  <span className="text-xs text-slate-400">{blocker.trend === "up" ? "rising" : "flat"}</span>
                </span>
              </button>
            ))}
          </div>
          <button className="m-4 text-sm font-semibold text-teal-700 hover:text-teal-900">View all blockers</button>
        </CapacityPanel>

        <CapacityPanel
          title="Action console"
          subtitle="Next-best actions ranked by expected bed conversion"
          action={<button className="rounded-md bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800">Add action</button>}
          className="min-h-[430px]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">SLA</th>
                  <th className="px-4 py-3">Impact</th>
                </tr>
              </thead>
              <tbody>
                {payload.actions.map((action) => (
                  <tr
                    key={action.id}
                    onClick={() => setSelectedActionId(action.id)}
                    className={`cursor-pointer border-b border-slate-100 align-top hover:bg-slate-50 ${
                      action.id === selectedAction?.id ? "bg-teal-50/70" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-red-600">{action.priority}</td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="font-semibold text-slate-950">{action.title}</p>
                      <StatusBadge value={action.action_type} tone="online" />
                    </td>
                    <td className="px-4 py-3">
                      <p className={action.severity === "high" ? "font-semibold text-red-600" : "font-semibold text-amber-600"}>{action.sla_deadline}</p>
                      <p className="text-xs text-slate-500">in {action.minutes_to_deadline}m</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-teal-700">+{action.expected_beds_unlocked} beds</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CapacityPanel>

        <CapacityPanel title="Action details" className="min-h-[430px]">
          <ActionDetail action={selectedAction} onUpdate={handleActionUpdate} onSimulate={onOpenSimulation} />
        </CapacityPanel>
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: CapacityKpi }) {
  const Icon = kpiIcons[kpi.id as keyof typeof kpiIcons] ?? BedDouble;
  const iconTone = kpi.severity === "high" ? "text-red-600" : kpi.severity === "moderate" ? "text-amber-600" : "text-teal-700";

  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-50 ${iconTone}`}>
          <Icon size={26} strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
          <p className="mt-1 text-3xl font-semibold leading-none text-slate-950">{kpi.value}</p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className={kpi.severity === "high" ? "font-semibold text-red-600" : "font-semibold text-amber-600"}>{kpi.severity === "high" ? "High" : "Moderate"}</span>
            <span className="text-slate-500">{kpi.trend}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineControls() {
  return (
    <div className="flex items-center gap-2">
      <select className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600">
        <option>Boarders & Beds</option>
        <option>Actions</option>
      </select>
      <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
        <MoreVertical size={16} />
      </button>
    </div>
  );
}
