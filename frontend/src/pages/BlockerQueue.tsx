import { useEffect, useState } from "react";

import { api, type CapacityBlocker } from "../api/client";
import { CapacityPanel } from "../components/capacity/CapacityPanel";
import { severityTone, StatusBadge } from "../components/capacity/StatusBadge";

export function BlockerQueue() {
  const [blockers, setBlockers] = useState<CapacityBlocker[]>([]);

  useEffect(() => {
    void api.capacityBlockers().then(setBlockers);
  }, []);

  return (
    <CapacityPanel title="Blocker queue" subtitle="Ranked by estimated bed-hour impact, not by age">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Blocker</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Capacity impact</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {blockers.map((blocker) => (
              <tr key={blocker.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-950">{blocker.rank}</td>
                <td className="max-w-sm px-4 py-3">
                  <p className="font-semibold text-slate-950">{blocker.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{blocker.reason}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{blocker.unit}</td>
                <td className="px-4 py-3 text-slate-600">{blocker.owner_role}</td>
                <td className="px-4 py-3 font-semibold text-red-600">{blocker.sla_minutes_remaining}m</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-red-600">-{blocker.estimated_beds_unlocked} beds</p>
                  <p className="text-xs text-slate-500">{blocker.estimated_bed_hour_impact} bed hrs</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{Math.round(blocker.confidence * 100)}%</td>
                <td className="px-4 py-3"><StatusBadge value={blocker.status} tone={severityTone(blocker.status)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CapacityPanel>
  );
}
