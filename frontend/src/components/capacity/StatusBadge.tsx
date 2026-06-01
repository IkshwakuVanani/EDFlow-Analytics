type StatusBadgeProps = {
  value: string;
  tone?: "low" | "moderate" | "high" | "neutral" | "online" | "watch";
};

const toneClasses = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  moderate: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  online: "border-teal-200 bg-teal-50 text-teal-700",
  watch: "border-amber-200 bg-amber-50 text-amber-700",
};

export function StatusBadge({ value, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold ${toneClasses[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {formatStatus(value)}
    </span>
  );
}

export function severityTone(severity: string): StatusBadgeProps["tone"] {
  if (severity === "high" || severity === "at_risk" || severity === "escalated") return "high";
  if (severity === "moderate" || severity === "monitor" || severity === "watch") return "moderate";
  if (severity === "low" || severity === "resolved" || severity === "done" || severity === "online") return "low";
  return "neutral";
}

export function formatStatus(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
