import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Activity,
  ArrowDownToLine,
  ClipboardList,
  GitFork,
  RefreshCw,
  Table2,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  download,
  errorText,
  localDateTime,
  ops,
  type Analysis,
  type Hospital,
  type Task,
} from "../../api/operations";
import { FlowMap } from "./FlowMap";
const FlowEditor = lazy(() => import("./FlowEditor"));
const Records = lazy(() => import("./Records"));
const Coordination = lazy(() => import("./Coordination"));
type Tab = "overview" | "flow" | "records" | "coordination";
const tabs = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "flow", label: "Flow map", icon: GitFork },
  { id: "records", label: "Observations", icon: Table2 },
  { id: "coordination", label: "Coordination", icon: ClipboardList },
] as const;
export default function Workspace({
  hospital,
  onHospital,
}: {
  hospital: Hospital;
  onHospital: (hospital: Hospital) => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [visited, setVisited] = useState<Tab[]>(["overview"]);
  function navigate(next: Tab) {
    setTab(next);
    setVisited((current) =>
      current.includes(next) ? current : [...current, next],
    );
  }
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [range, setRange] = useState("24");
  const [start, setStart] = useState(
    localDateTime(new Date(Date.now() - 86400000)),
  );
  const [end, setEnd] = useState(localDateTime());
  const [applied, setApplied] = useState<{ start?: string; end?: string }>({});
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setBusy(true);
    try {
      const query =
        range === "custom"
          ? applied
          : {
              start: new Date(
                Date.now() - Number(range) * 3600000,
              ).toISOString(),
              end: new Date().toISOString(),
            };
      const result = await Promise.all([
        ops.analysis(hospital.id, query.start, query.end),
        ops.tasks(hospital.id),
        ops.hospitals(),
      ]);
      if (id !== requestId.current) return;
      const latestHospital = result[2].find((item) => item.id === hospital.id);
      if (latestHospital && latestHospital.version !== hospital.version)
        onHospital(latestHospital);
      setAnalysis(result[0]);
      setTasks(result[1]);
      setUpdated(new Date());
      setError("");
    } catch (error) {
      if (id === requestId.current) setError(errorText(error));
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }, [
    hospital.id,
    hospital.version,
    applied.start,
    applied.end,
    range,
    onHospital,
  ]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 15000);
    return () => {
      clearInterval(timer);
      requestId.current++;
    };
  }, [refresh]);
  function applyCustom() {
    if (!start || !end || new Date(start) >= new Date(end)) {
      setError("Choose a start time before the end time.");
      return;
    }
    setApplied({
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
    });
  }
  return (
    <div className="section-stack">
      <div className="workspace-bar">
        <nav aria-label="Workspace sections" className="tabs">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`tab ${tab === item.id ? "active" : ""}`}
                aria-current={tab === item.id ? "page" : undefined}
                key={item.id}
                onClick={() => navigate(item.id)}
              >
                <Icon size={17} />
                {item.label}
                {item.id === "coordination" &&
                  tasks.filter((t) => t.status !== "done").length > 0 && (
                    <span className="tab-count">
                      {tasks.filter((t) => t.status !== "done").length}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>
        <div className="toolbar">
          <span
            className={`sync-status ${error ? "offline" : ""}`}
            role="status"
          >
            {error
              ? "Connection issue · values may be stale"
              : busy
                ? "Syncing…"
                : updated
                  ? `Synced ${updated.toLocaleTimeString()} · every 15s`
                  : "Connecting…"}
          </span>
          <button
            className="btn subtle icon"
            aria-label="Refresh workspace data"
            disabled={busy}
            onClick={() => void refresh()}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <Suspense
        fallback={
          <p className="notice" role="status">
            Loading {tab}…
          </p>
        }
      >
        {tab === "overview" && (
          <>
            <div className="section-heading">
              <div>
                <h2>{hospital.name}</h2>
                <p className="muted text-sm">
                  Observed operations · {hospital.timezone}
                </p>
              </div>
              <div className="toolbar">
                <label className="compact-label">
                  Analysis window
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                  >
                    <option value="6">Last 6 hours</option>
                    <option value="24">Last 24 hours</option>
                    <option value="168">Last 7 days</option>
                    <option value="custom">Custom dates</option>
                  </select>
                </label>
                <button
                  className="btn subtle"
                  disabled={!analysis}
                  onClick={() =>
                    download(
                      "hospital-analysis.json",
                      JSON.stringify(
                        {
                          hospital: {
                            name: hospital.name,
                            timezone: hospital.timezone,
                          },
                          generated_at: new Date().toISOString(),
                          analysis,
                        },
                        null,
                        2,
                      ),
                    )
                  }
                >
                  <ArrowDownToLine size={16} />
                  Export report
                </button>
              </div>
            </div>
            {range === "custom" && (
              <div className="card inline-form">
                <label>
                  From (device local)
                  <input
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </label>
                <label>
                  To (device local)
                  <input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </label>
                <button className="btn" onClick={applyCustom}>
                  Apply dates
                </button>
              </div>
            )}
            {!hospital.graph.nodes.length ? (
              <section className="card empty">
                <GitFork size={32} />
                <h2>Define the process first</h2>
                <p>
                  Add the stages and connections that describe this hospital’s
                  operations.
                  <br />
                  Then record observations to start the time series.
                </p>
                <button
                  className="btn primary"
                  onClick={() => navigate("flow")}
                >
                  Build hospital flow
                </button>
              </section>
            ) : analysis ? (
              <Overview
                analysis={analysis}
                hospital={hospital}
                tasks={tasks}
                onRecords={() => navigate("records")}
              />
            ) : (
              <p className="notice">
                {busy
                  ? "Loading observed data…"
                  : "No analysis loaded. Refresh to retry."}
              </p>
            )}
          </>
        )}
        {visited.includes("flow") && (
          <div hidden={tab !== "flow"}>
            <FlowEditor hospital={hospital} onHospital={onHospital} />
          </div>
        )}
        {visited.includes("records") && (
          <div hidden={tab !== "records"}>
            <Records hospital={hospital} onChanged={() => void refresh()} />
          </div>
        )}
        {visited.includes("coordination") && (
          <div hidden={tab !== "coordination"}>
            <Coordination
              hospital={hospital}
              tasks={tasks}
              onChanged={() => void refresh()}
            />
          </div>
        )}
      </Suspense>
    </div>
  );
}
function Overview({
  analysis,
  hospital,
  tasks,
  onRecords,
}: {
  analysis: Analysis;
  hospital: Hospital;
  tasks: Task[];
  onRecords: () => void;
}) {
  const observed = analysis.stages.filter((stage) => stage.latest);
  const queue = observed.reduce((sum, s) => sum + (s.latest?.waiting ?? 0), 0);
  const overdue = tasks.filter(
    (t) => t.status !== "done" && new Date(t.due_at).getTime() < Date.now(),
  ).length;
  const formatTime = (value: string | number) =>
    new Date(value).toLocaleString(undefined, {
      timeZone: hospital.timezone,
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const chartData = analysis.timeline.map((point) => ({
    ...point,
    timestamp: Date.parse(point.time),
  }));
  return (
    <>
      <div className="metric-grid">
        {[
          {
            label: "Observed stage queues",
            value: observed.length ? queue : "—",
            note: `${observed.length}/${analysis.stages.length} stages reporting · latest per stage`,
          },
          {
            label: "Observations in window",
            value: analysis.observation_count,
            note: `${analysis.complete_snapshots} complete flow snapshots`,
          },
          {
            label: "Open coordination tasks",
            value: tasks.filter((t) => t.status !== "done").length,
            note: `${overdue} past their deadline`,
          },
          {
            label: "Latest observation",
            value: analysis.latest_observed_at
              ? new Date(analysis.latest_observed_at).toLocaleTimeString(
                  undefined,
                  {
                    timeZone: hospital.timezone,
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )
              : "—",
            note: analysis.latest_observed_at
              ? formatTime(analysis.latest_observed_at)
              : "Waiting for your first record",
          },
        ].map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p className="muted text-sm">{metric.label}</p>
            <strong>{metric.value}</strong>
            <p className="muted text-xs">{metric.note}</p>
          </article>
        ))}
      </div>
      {analysis.warnings.length > 0 && (
        <details
          className="notice warning"
          open={analysis.observation_count === 0}
        >
          <summary>
            {analysis.warnings.length} data coverage{" "}
            {analysis.warnings.length === 1 ? "notice" : "notices"}
          </summary>
          <ul>
            {analysis.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
          {analysis.observation_count === 0 && (
            <button className="btn mt-3" onClick={onRecords}>
              Add observations
            </button>
          )}
        </details>
      )}
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Flow over time</h2>
            <p className="muted">
              Complete snapshots only · Counts across configured stages · Actual
              elapsed time
            </p>
          </div>
          <TrendingUp size={21} className="text-teal-700" />
        </div>
        {chartData.length ? (
          <div className="time-chart">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 12, right: 20, left: 0, bottom: 12 }}
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={formatTime}
                  minTickGap={50}
                  tick={{ fontSize: 11 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(label) => formatTime(Number(label))}
                />
                <Legend />
                <Line
                  dataKey="waiting"
                  name="Observed waiting"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="occupied"
                  name="Observed occupied"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="rolling_waiting"
                  name="Waiting: last 3 snapshot mean"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="empty small">
            A chart appears when all configured stages have observations at
            matching timestamps.
          </p>
        )}
      </section>
      <div className="dashboard-split">
        <section className="card">
          <h2>Process and capacity</h2>
          <FlowMap graph={hospital.graph} stages={analysis.stages} />
        </section>
        <section className="card">
          <h2>Conclusions from your data</h2>
          <p className="muted text-sm">
            Descriptive findings. No causal claims or AI-generated advice.
          </p>
          {analysis.conclusions.length ? (
            <ul className="insight-list">
              {analysis.conclusions.map((conclusion, i) => (
                <li key={i}>{conclusion}</li>
              ))}
            </ul>
          ) : (
            <p className="empty small">
              Record observations to generate data-backed findings.
            </p>
          )}
        </section>
      </div>
      <section className="card">
        <h2>Stage-level analysis</h2>
        <p className="muted text-sm">
          Rates refer to the recorded intervals in each stage. A person moving
          through several stages may be counted more than once.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stage</th>
                <th>Waiting</th>
                <th>Occupied / staffed</th>
                <th>Queue change</th>
                <th>Departures / hour</th>
                <th>Queue trend / hour</th>
                <th>60-minute projection</th>
                <th>Samples</th>
              </tr>
            </thead>
            <tbody>
              {analysis.stages.map((stage) => (
                <tr key={stage.id}>
                  <td>
                    <strong>{stage.label}</strong>
                    <small className="block muted">
                      {stage.latest
                        ? formatTime(stage.latest.observed_at)
                        : "No observations"}
                    </small>
                  </td>
                  <td>{stage.latest?.waiting ?? "—"}</td>
                  <td>
                    {stage.latest
                      ? `${stage.latest.occupied} / ${stage.latest.staffed_capacity}`
                      : "—"}
                  </td>
                  <td>
                    {stage.queue_change === null
                      ? "—"
                      : `${stage.queue_change > 0 ? "+" : ""}${stage.queue_change}`}
                  </td>
                  <td>{stage.departures_per_hour ?? "—"}</td>
                  <td>{stage.queue_slope_per_hour ?? "—"}</td>
                  <td>
                    {stage.projected_waiting_60m ?? "Insufficient / stale data"}
                  </td>
                  <td>{stage.samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="mt-4">
          <summary>How this analysis is calculated</summary>
          <p className="muted">{analysis.methodology}</p>
          <p className="muted">
            Window: {formatTime(analysis.window_start)} to{" "}
            {formatTime(analysis.window_end)} ({hospital.timezone}). Median
            interval between complete snapshots:{" "}
            {analysis.median_interval_minutes ?? "unavailable"} minutes.
          </p>
        </details>
      </section>
    </>
  );
}
