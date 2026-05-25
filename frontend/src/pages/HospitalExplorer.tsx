import { useEffect, useState } from "react";

import { api, type HospitalDetail, type HospitalSummary } from "../api/client";
import { ChartCard } from "../components/ChartCard";
import { HospitalSearch } from "../components/HospitalSearch";

export function HospitalExplorer() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [hospitals, setHospitals] = useState<HospitalSummary[]>([]);
  const [selected, setSelected] = useState<HospitalDetail | null>(null);

  useEffect(() => {
    void api.hospitals(search, state).then((payload) => {
      setHospitals(payload.items);
      if (!selected && payload.items[0]) {
        void api.hospital(payload.items[0].provider_id).then(setSelected);
      }
    });
  }, [search, state, selected]);

  const selectHospital = (providerId: string) => {
    void api.hospital(providerId).then(setSelected);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.2fr]">
      <div className="space-y-4">
        <HospitalSearch search={search} state={state} onSearchChange={setSearch} onStateChange={setState} />
        <ChartCard title="Hospital Results" subtitle={`${hospitals.length} matching hospitals`}>
          <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
            {hospitals.map((hospital) => (
              <button
                key={hospital.provider_id}
                onClick={() => selectHospital(hospital.provider_id)}
                className={`w-full rounded-md border p-3 text-left transition ${
                  selected?.provider_id === hospital.provider_id
                    ? "border-teal bg-teal/5"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{hospital.facility_name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {hospital.city}, {hospital.state} · {hospital.provider_id}
                    </p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {hospital.ed_departure_minutes ?? "n/a"}m
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ChartCard>
      </div>

      <div>
        {selected ? (
          <ChartCard title={selected.facility_name} subtitle={`${selected.city}, ${selected.state} · Provider ${selected.provider_id}`}>
            <div className="grid gap-3 md:grid-cols-3">
              <MiniStat label="ED Departure" value={selected.ed_departure_minutes ? `${selected.ed_departure_minutes} min` : "n/a"} />
              <MiniStat label="LWBS" value={selected.left_without_seen_rate ? `${selected.left_without_seen_rate}%` : "n/a"} />
              <MiniStat label="Rating" value={selected.overall_rating ? `${selected.overall_rating} / 5` : "n/a"} />
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Measure</th>
                    <th className="py-2">Value</th>
                    <th className="py-2">Unit</th>
                    <th className="py-2">Period</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.measures.map((measure) => (
                    <tr key={measure.measure_id} className="border-b border-slate-100">
                      <td className="py-3">
                        <p className="font-semibold text-ink">{measure.measure_id}</p>
                        <p className="max-w-md text-xs text-slate-500">{measure.measure_name}</p>
                      </td>
                      <td className="py-3">{measure.score_value ?? measure.score_raw ?? "n/a"}</td>
                      <td className="py-3">{measure.unit}</td>
                      <td className="py-3">
                        {measure.start_date} - {measure.end_date}
                      </td>
                      <td className="py-3">{measure.data_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        ) : (
          <ChartCard title="Hospital Details">
            <p className="text-sm text-slate-500">No hospital selected.</p>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
