import { CheckCircle2, Flag, PlayCircle, UserPlus, type LucideIcon } from "lucide-react";

import type { CapacityAction } from "../../api/client";
import { formatStatus, severityTone, StatusBadge } from "./StatusBadge";

type ActionDetailProps = {
  action: CapacityAction | null;
  onUpdate: (action: CapacityAction, status: CapacityAction["status"]) => void;
  onSimulate?: () => void;
};

export function ActionDetail({ action, onUpdate, onSimulate }: ActionDetailProps) {
  if (!action) {
    return <div className="p-4 text-sm text-slate-500">Select an action to inspect ownership, dependencies, and escalation path.</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold leading-6 text-slate-950">{action.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge value={action.action_type} tone="online" />
              <StatusBadge value={action.escalation_state} tone={severityTone(action.escalation_state)} />
              <StatusBadge value={action.status} tone={action.status === "done" ? "low" : "neutral"} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase text-slate-500">Priority</p>
            <p className="text-3xl font-semibold text-red-600">{action.priority}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 border-b border-slate-100 text-sm">
        <Metric label="Impact" value={`+${action.expected_beds_unlocked} beds`} detail={`${action.expected_bed_hours_saved} bed hrs`} tone="text-teal-700" />
        <Metric label="Deadline" value={action.sla_deadline} detail={`in ${action.minutes_to_deadline}m`} tone="text-red-600" />
        <Metric label="Patients" value={`${action.patients_impacted}`} detail="impacted" tone="text-slate-950" />
      </div>

      <div className="space-y-4 p-4 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reason</p>
          <p className="mt-1 leading-5 text-slate-700">{action.reason}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoBlock label="Owner" value={action.owner} detail={action.owner_role} />
          <InfoBlock label="Unit" value={action.unit} detail={action.dependency_label} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dependencies</p>
          <div className="mt-2 space-y-2">
            <Dependency label="EVS turnover" status="On track" tone="low" />
            <Dependency label="Transport queue" status={action.severity === "high" ? "At risk" : "Monitor"} tone={action.severity === "high" ? "high" : "moderate"} />
          </div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 p-4 xl:grid-cols-4">
        <ActionButton icon={UserPlus} label="Assign" onClick={() => onUpdate(action, "assigned")} />
        <ActionButton icon={Flag} label="Escalate" onClick={() => onUpdate(action, "escalated")} />
        <ActionButton icon={CheckCircle2} label={action.status === "done" ? "Done" : "Mark Done"} onClick={() => onUpdate(action, "done")} primary />
        <ActionButton icon={PlayCircle} label="Simulate" onClick={onSimulate ?? (() => undefined)} />
      </div>
    </div>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <div className="border-r border-slate-100 px-4 py-3 last:border-r-0">
      <p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${tone}`}>{value}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function InfoBlock({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Dependency({ label, status, tone }: { label: string; status: string; tone: "low" | "moderate" | "high" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <StatusBadge value={status} tone={tone} />
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  primary = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
        primary
          ? "border-teal-700 bg-teal-700 text-white hover:bg-teal-800"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon size={15} />
      {formatStatus(label)}
    </button>
  );
}
