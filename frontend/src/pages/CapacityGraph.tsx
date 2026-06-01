import { useEffect, useState } from "react";

import { api, type CapacityCommandCenter } from "../api/client";
import { CapacityFlow } from "../components/capacity/CapacityFlow";
import { CapacityPanel } from "../components/capacity/CapacityPanel";
import { CapacityTimeline } from "../components/capacity/CapacityTimeline";
import { severityTone, StatusBadge } from "../components/capacity/StatusBadge";

export function CapacityGraphPage() {
  const [payload, setPayload] = useState<CapacityCommandCenter | null>(null);

  useEffect(() => {
    void api.commandCenter(360).then(setPayload);
  }, []);

  if (!payload) return <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading capacity graph...</div>;

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_420px]">
      <div className="space-y-3">
        <CapacityPanel title="Capacity timeline" subtitle="Synthetic bed-conversion path through the active risk window">
          <CapacityTimeline data={payload.timeline} />
        </CapacityPanel>
        <CapacityPanel title="Bottleneck links" subtitle="Counts on each edge indicate current work blocking ready med-surg beds">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Dependency</th>
                  <th className="px-4 py-3">Count</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payload.flow_edges.map((edge) => (
                  <tr key={`${edge.source}-${edge.target}`} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-950">{nodeLabel(payload, edge.source)}</td>
                    <td className="px-4 py-3 text-slate-600">{nodeLabel(payload, edge.target)}</td>
                    <td className="px-4 py-3 text-slate-600">{edge.label}</td>
                    <td className="px-4 py-3 font-semibold text-slate-950">{edge.count}</td>
                    <td className="px-4 py-3"><StatusBadge value={edge.severity} tone={severityTone(edge.severity)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CapacityPanel>
      </div>
      <CapacityPanel title="Capacity flow map" subtitle={`Current synthetic state at ${payload.current_time}`}>
        <CapacityFlow nodes={payload.flow_nodes} />
      </CapacityPanel>
    </div>
  );
}

function nodeLabel(payload: CapacityCommandCenter, id: string) {
  return payload.flow_nodes.find((node) => node.id === id)?.label ?? id;
}
