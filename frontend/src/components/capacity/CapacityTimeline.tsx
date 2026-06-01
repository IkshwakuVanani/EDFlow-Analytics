import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CapacityTimelinePoint } from "../../api/client";

type CapacityTimelineProps = {
  data: CapacityTimelinePoint[];
};

export function CapacityTimeline({ data }: CapacityTimelineProps) {
  return (
    <div className="h-[265px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 18, right: 20, bottom: 8, left: -8 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time_label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <Tooltip
            cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
            contentStyle={{ borderRadius: 6, borderColor: "#cbd5e1", boxShadow: "0 10px 24px rgba(15, 23, 42, 0.1)" }}
          />
          <ReferenceArea yAxisId="left" x1="2 PM" x2="6 PM" fill="#fee2e2" fillOpacity={0.75} />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="unlockable_beds"
            name="Unlockable beds"
            fill="#dbeafe"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fillOpacity={0.32}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="boarders"
            name="Boarding pressure"
            stroke="#0f766e"
            strokeWidth={3}
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="predicted_boarders"
            name="Predicted boarders without action"
            stroke="#dc2626"
            strokeWidth={2}
            strokeDasharray="6 5"
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="available_beds"
            name="Projected available beds"
            stroke="#0e7490"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 2, fill: "#0e7490" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
