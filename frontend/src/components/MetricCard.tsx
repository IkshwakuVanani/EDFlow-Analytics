import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "risk" | "slate";
};

const toneMap = {
  teal: "bg-teal text-white",
  amber: "bg-amber text-white",
  risk: "bg-risk text-white",
  slate: "bg-slate-800 text-white",
};

export function MetricCard({ title, value, detail, icon: Icon, tone = "teal" }: MetricCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${toneMap[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </section>
  );
}
