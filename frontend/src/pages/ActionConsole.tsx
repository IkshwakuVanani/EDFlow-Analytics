import { useEffect, useMemo, useState } from "react";

import { api, type CapacityAction } from "../api/client";
import { ActionDetail } from "../components/capacity/ActionDetail";
import { CapacityPanel } from "../components/capacity/CapacityPanel";
import { severityTone, StatusBadge } from "../components/capacity/StatusBadge";

type ActionConsolePageProps = {
  onOpenSimulation: () => void;
};

export function ActionConsolePage({ onOpenSimulation }: ActionConsolePageProps) {
  const [actions, setActions] = useState<CapacityAction[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    void api.capacityActions().then((payload) => {
      setActions(payload);
      setSelectedId(payload[0]?.id ?? "");
    });
  }, []);

  const selected = useMemo(() => actions.find((action) => action.id === selectedId) ?? actions[0] ?? null, [actions, selectedId]);

  async function handleUpdate(action: CapacityAction, status: CapacityAction["status"]) {
    const updated = await api.updateCapacityAction(action.id, { status });
    setActions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedId(updated.id);
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_430px]">
      <CapacityPanel title="Action console" subtitle="Owner, deadline, dependency, and capacity impact for each next-best action">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">SLA</th>
                <th className="px-4 py-3">Impact</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr
                  key={action.id}
                  onClick={() => setSelectedId(action.id)}
                  className={`cursor-pointer border-b border-slate-100 align-top hover:bg-slate-50 ${action.id === selected?.id ? "bg-teal-50/70" : ""}`}
                >
                  <td className="px-4 py-3 font-semibold text-red-600">{action.priority}</td>
                  <td className="max-w-md px-4 py-3">
                    <p className="font-semibold text-slate-950">{action.title}</p>
                    <p className="text-xs text-slate-500">{action.reason}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{action.owner}</td>
                  <td className="px-4 py-3"><StatusBadge value={action.status} tone={action.status === "done" ? "low" : "neutral"} /></td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-red-600">{action.sla_deadline}</p>
                    <p className="text-xs text-slate-500">in {action.minutes_to_deadline}m</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-teal-700">+{action.expected_beds_unlocked} beds</p>
                    <StatusBadge value={action.escalation_state} tone={severityTone(action.escalation_state)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CapacityPanel>
      <CapacityPanel title="Selected action">
        <ActionDetail action={selected} onUpdate={handleUpdate} onSimulate={onOpenSimulation} />
      </CapacityPanel>
    </div>
  );
}
