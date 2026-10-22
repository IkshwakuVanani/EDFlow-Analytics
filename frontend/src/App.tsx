import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useCallback,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Activity, ArrowRight, LogOut, Plus, RefreshCw } from "lucide-react";
import {
  errorText,
  ops,
  request,
  savedSession,
  saveSession,
  type Hospital,
} from "./api/operations";
const Workspace = lazy(() => import("./components/operations/Workspace"));

class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="empty">
        <h2>Something interrupted this page</h2>
        <p>Your saved hospital data is still on the server.</p>
        <button className="btn" onClick={() => location.reload()}>
          Reload page
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Auth({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      saveSession(
        await ops.auth(
          mode,
          String(data.get("username")),
          String(data.get("password")),
        ),
      );
      onSignedIn();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <div className="brand">
          <Activity /> EDFlow <span>Orchestrator</span>
        </div>
        <div>
          <p className="eyebrow">Hospital operations, connected</p>
          <h1>
            Understand the flow.
            <br />
            Coordinate the next step.
          </h1>
          <p>
            Bring your hospital’s process and aggregate observations into one
            workspace. Track queues, examine trends, and give every operational
            task an owner.
          </p>
          <div className="auth-features">
            <span>Custom flow maps</span>
            <span>Time-series analysis</span>
            <span>Shared task history</span>
          </div>
        </div>
        <p className="muted">
          Data-driven operations. No AI or patient-level predictions.
        </p>
      </section>
      <section className="auth-form">
        <div className="card">
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="muted">
            {mode === "login"
              ? "Sign in to your hospital workspaces."
              : "Start with an empty workspace and your own data."}
          </p>
          <form onSubmit={submit} className="form-stack">
            <label>
              Username
              <input
                name="username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={80}
                pattern="[a-zA-Z0-9_.@\-]+"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={12}
                maxLength={200}
              />
            </label>
            <p className="muted text-xs">
              Use at least 12 characters. Store your password securely; email
              recovery is not configured.
            </p>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button className="btn primary w-full" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              <ArrowRight size={16} />
            </button>
          </form>
          <button
            className="btn link w-full mt-4"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login"
              ? "Create an account"
              : "Already registered? Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}
export default function App() {
  const [session, setSession] = useState(savedSession);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newHospital, setNewHospital] = useState(false);
  const [joining, setJoining] = useState(false);
  const updateHospital = useCallback(
    (next: Hospital) =>
      setHospitals((items) => items.map((h) => (h.id === next.id ? next : h))),
    [],
  );
  const hospital = hospitals.find((h) => h.id === selected);
  async function reload() {
    setBusy(true);
    setError("");
    try {
      const items = await ops.hospitals();
      setHospitals(items);
      setSelected((current) =>
        items.some((h) => h.id === current) ? current : (items[0]?.id ?? ""),
      );
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (session) void reload();
  }, [session?.token]);
  useEffect(() => {
    const expired = () => {
      setSession(null);
      setHospitals([]);
      setError("");
    };
    window.addEventListener("edflow-session-expired", expired);
    return () => window.removeEventListener("edflow-session-expired", expired);
  }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const hospital = await ops.createHospital(
        String(data.get("name")),
        String(data.get("timezone")),
      );
      setHospitals((items) => [...items, hospital]);
      setSelected(hospital.id);
      setNewHospital(false);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const hospital = await ops.join(String(data.get("code")));
      await reload();
      setSelected(hospital.id);
      setJoining(false);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setError("");
    try {
      await request("/auth/logout", { method: "POST" });
      saveSession(null);
      setSession(null);
      setHospitals([]);
    } catch (error) {
      setError(errorText(error));
    }
  }
  if (!session) return <Auth onSignedIn={() => setSession(savedSession())} />;
  return (
    <ErrorBoundary>
      <div className="app-shell">
        <header className="app-header">
          <a className="brand" href="#main">
            <Activity />
            EDFlow <span>Orchestrator</span>
          </a>
          <div className="header-actions">
            <span className="muted text-sm">{session.username}</span>
            <button className="btn subtle" onClick={() => void logout()}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>
        <main id="main" className="workspace">
          <div className="workspace-heading">
            <div>
              <p className="eyebrow">Operations workspace</p>
              <h1>Hospital flow, in focus.</h1>
              <p className="muted">
                Your observations. A shared picture. Accountable action.
              </p>
            </div>
            <div className="toolbar">
              <label className="sr-only" htmlFor="hospital">
                Hospital workspace
              </label>
              <select
                id="hospital"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={!hospitals.length}
              >
                <option value="" disabled>
                  Select hospital
                </option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              <button
                className="btn subtle icon"
                aria-label="Refresh hospitals"
                disabled={busy}
                onClick={() => void reload()}
              >
                <RefreshCw size={17} />
              </button>
              <button
                className="btn"
                onClick={() => {
                  setNewHospital(!newHospital);
                  setJoining(false);
                }}
                aria-expanded={newHospital}
              >
                <Plus size={16} />
                New hospital
              </button>
              <button
                className="btn subtle"
                onClick={() => {
                  setJoining(!joining);
                  setNewHospital(false);
                }}
                aria-expanded={joining}
              >
                Join workspace
              </button>
            </div>
          </div>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          {newHospital && (
            <form className="card inline-form" onSubmit={create}>
              <label>
                Hospital name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={160}
                  placeholder="Hospital or facility name"
                />
              </label>
              <label>
                Hospital time zone
                <input
                  name="timezone"
                  defaultValue={
                    Intl.DateTimeFormat().resolvedOptions().timeZone
                  }
                  required
                  placeholder="America/New_York"
                />
              </label>
              <button className="btn primary" disabled={busy}>
                Create workspace
              </button>
              <button
                type="button"
                className="btn subtle"
                onClick={() => setNewHospital(false)}
              >
                Cancel
              </button>
            </form>
          )}
          {joining && (
            <form className="card inline-form" onSubmit={join}>
              <label>
                Single-use invitation code
                <input name="code" required minLength={20} autoComplete="off" />
              </label>
              <button className="btn primary" disabled={busy}>
                Join hospital
              </button>
              <button
                type="button"
                className="btn subtle"
                onClick={() => setJoining(false)}
              >
                Cancel
              </button>
            </form>
          )}
          {hospital ? (
            <Suspense
              fallback={
                <p className="notice" role="status">
                  Loading workspace…
                </p>
              }
            >
              <Workspace
                key={hospital.id}
                hospital={hospital}
                onHospital={updateHospital}
              />
            </Suspense>
          ) : (
            <section className="card empty">
              <Activity size={36} />
              <h2>
                {busy ? "Loading your workspaces…" : "Start with your hospital"}
              </h2>
              <p>
                Create a workspace, define its flow, and import timestamped
                aggregate records.
                <br />
                Or join a colleague’s workspace with an invitation code.
              </p>
              <button
                className="btn primary"
                onClick={() => setNewHospital(true)}
              >
                Create a hospital
              </button>
            </section>
          )}
          <footer>
            EDFlow · Aggregate operations analysis · No AI · All timestamps
            include a time zone
          </footer>
        </main>
      </div>
    </ErrorBoundary>
  );
}
