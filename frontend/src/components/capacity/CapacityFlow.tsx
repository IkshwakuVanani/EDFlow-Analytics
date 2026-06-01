import type { CapacityFlowNode } from "../../api/client";
import { severityTone, StatusBadge } from "./StatusBadge";

type CapacityFlowProps = {
  nodes: CapacityFlowNode[];
};

export function CapacityFlow({ nodes }: CapacityFlowProps) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const top = [byId.get("ed_boarders"), byId.get("pending_discharges")].filter(Boolean) as CapacityFlowNode[];
  const middle = [byId.get("evs_clean"), byId.get("transport"), byId.get("placement")].filter(Boolean) as CapacityFlowNode[];
  const ready = byId.get("ready_beds");

  return (
    <div className="px-4 py-2.5">
      <div className="grid grid-cols-2 gap-3">
        {top.map((node) => (
          <FlowNode key={node.id} node={node} />
        ))}
      </div>
      <div className="mx-auto my-1 h-3 w-px bg-slate-300" />
      <div className="grid grid-cols-3 gap-3">
        {middle.map((node) => (
          <FlowNode key={node.id} node={node} compact />
        ))}
      </div>
      <div className="mx-auto my-1 h-3 w-px bg-slate-300" />
      {ready ? (
        <div className="mx-auto max-w-[180px]">
          <FlowNode node={ready} />
        </div>
      ) : null}
    </div>
  );
}

function FlowNode({ node, compact = false }: { node: CapacityFlowNode; compact?: boolean }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
      <p className={`${compact ? "text-[11px]" : "text-xs"} font-semibold text-slate-600`}>{node.label}</p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className="text-xl font-semibold text-slate-950">{node.value}</span>
        <StatusBadge value={node.severity} tone={severityTone(node.severity)} />
      </div>
    </div>
  );
}
