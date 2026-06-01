import { useEffect, useState } from "react";

import { api, type SimulationResult, type SimulationScenario } from "../api/client";
import { CapacityPanel } from "../components/capacity/CapacityPanel";

const initialScenario: SimulationScenario = {
  extra_staffed_beds: 2,
  evs_rooms_prioritized: 4,
  transporters_added: 1,
  accelerated_discharges: 3,
  observation_overflow: 0,
};

export function Simulation() {
  const [scenario, setScenario] = useState<SimulationScenario>(initialScenario);
  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    void api.simulateCapacity(initialScenario).then(setResult);
  }, []);

  async function runSimulation(nextScenario = scenario) {
    setScenario(nextScenario);
    setResult(await api.simulateCapacity(nextScenario));
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[420px_minmax(0,1fr)]">
      <CapacityPanel title="Simulation controls" subtitle="Synthetic what-if levers for the next six-hour capacity window">
        <div className="space-y-4 p-4">
          {Object.entries(scenario).map(([key, value]) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatLabel(key)}</span>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={key === "transporters_added" ? 8 : 12}
                  value={value}
                  onChange={(event) => setScenario((current) => ({ ...current, [key]: Number(event.target.value) }))}
                  className="w-full accent-teal-700"
                />
                <input
                  type="number"
                  min={0}
                  value={value}
                  onChange={(event) => setScenario((current) => ({ ...current, [key]: Number(event.target.value) }))}
                  className="h-9 w-16 rounded-md border border-slate-200 px-2 text-sm"
                />
              </div>
            </label>
          ))}
          <button
            onClick={() => void runSimulation()}
            className="h-10 w-full rounded-md bg-teal-700 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Run simulation
          </button>
        </div>
      </CapacityPanel>

      <CapacityPanel title="Simulation result" subtitle="Estimated change from the synthetic baseline">
        {result ? (
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <ResultMetric label="Projected boarding hours" value={result.projected_boarding_hours.toString()} tone="text-slate-950" />
            <ResultMetric label="Boarding hours reduced" value={`-${result.boarding_hours_reduced}`} tone="text-teal-700" />
            <ResultMetric label="Beds unlocked" value={`+${result.beds_unlocked}`} tone="text-teal-700" />
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 md:col-span-3">
              <p className="text-sm font-semibold text-slate-950">{result.risk_window_after}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{result.explanation}</p>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {result.recommended_actions.map((action) => (
                  <div key={action} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-sm text-slate-500">Run a scenario to compare against baseline.</div>
        )}
      </CapacityPanel>
    </div>
  );
}

function ResultMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function formatLabel(key: string) {
  return key.replace(/_/g, " ");
}
