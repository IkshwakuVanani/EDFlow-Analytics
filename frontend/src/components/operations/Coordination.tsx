import { useEffect, useState, type FormEvent } from "react";
import { History as HistoryIcon, Plus } from "lucide-react";
import {
  errorText,
  localDateTime,
  ops,
  type History,
  type Hospital,
  type Task,
} from "../../api/operations";
export default function Coordination({
  hospital,
  tasks,
  onChanged,
}: {
  hospital: Hospital;
  tasks: Task[];
  onChanged: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("active");
  const [invitation, setInvitation] = useState("");
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await ops.createTask(hospital.id, {
        title: String(data.get("title")),
        owner: String(data.get("owner")),
        stage_id: String(data.get("stage_id")),
        due_at: new Date(String(data.get("due_at"))).toISOString(),
        notes: String(data.get("notes")),
      });
      form.reset();
      onChanged();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function invite() {
    setBusy(true);
    setError("");
    try {
      setInvitation((await ops.invite(hospital.id)).code);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  const visible = tasks.filter(
    (task) =>
      filter === "all" ||
      (filter === "active" ? task.status !== "done" : task.status === "done"),
  );
  return (
    <div className="section-stack">
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Coordinate with your team</h2>
            <p className="muted">
              Owners, deadlines, notes, and a saved history for every action.
            </p>
          </div>
          <button
            className="btn subtle"
            disabled={busy}
            onClick={() => void invite()}
          >
            Create collaborator invitation
          </button>
        </div>
        {invitation && (
          <div className="notice">
            <p>
              Share this single-use code with a colleague who has an EDFlow
              account. They can join from “Join workspace.” Expires in 24 hours.
            </p>
            <input
              aria-label="Invitation code"
              readOnly
              value={invitation}
              onFocus={(e) => e.target.select()}
              className="mt-2"
            />
            <button
              className="btn subtle mt-2"
              onClick={() => setInvitation("")}
            >
              Hide invitation
            </button>
          </div>
        )}
        <form className="form-grid mt-4" onSubmit={create}>
          <label className="wide">
            Task title
            <input
              name="title"
              required
              minLength={3}
              maxLength={240}
              placeholder="Describe the operational action"
            />
          </label>
          <label>
            Flow stage
            <select name="stage_id" required>
              <option value="">Choose stage</option>
              {hospital.graph.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Owner or team
            <input
              name="owner"
              required
              maxLength={100}
              placeholder="Named owner or responsible team"
            />
          </label>
          <label>
            Due at (device local)
            <input
              type="datetime-local"
              name="due_at"
              required
              defaultValue={localDateTime(new Date(Date.now() + 3600000))}
            />
          </label>
          <label className="wide">
            Coordination notes
            <textarea
              name="notes"
              maxLength={4000}
              rows={2}
              placeholder="Dependencies, handoff, and next steps. Use aggregate information only."
            />
          </label>
          <div className="form-actions">
            <button
              className="btn primary"
              disabled={busy || !hospital.graph.nodes.length}
            >
              <Plus size={16} />
              Create task
            </button>
          </div>
        </form>
      </section>
      <section className="card">
        <div className="section-heading">
          <h2>Action queue</h2>
          <label className="compact-label">
            Show
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="active">Active tasks</option>
              <option value="done">Completed tasks</option>
              <option value="all">All tasks</option>
            </select>
          </label>
        </div>
        <div className="task-list">
          {visible.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              hospital={hospital}
              onChanged={onChanged}
            />
          ))}
          {!visible.length && (
            <p className="empty small">
              No{" "}
              {filter === "done"
                ? "completed"
                : filter === "all"
                  ? ""
                  : "active"}{" "}
              tasks. Create one above to coordinate the next step.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
function TaskRow({
  task,
  hospital,
  onChanged,
}: {
  task: Task;
  hospital: Hospital;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState(task);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty && task.version >= draft.version) setDraft(task);
  }, [task.version, dirty, draft.version]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<History[] | null>(null);
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const updated = await ops.updateTask(hospital.id, draft);
      setDraft(updated);
      setDirty(false);
      setHistory(null);
      onChanged();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function showHistory() {
    setError("");
    try {
      setHistory(history ? null : await ops.history(hospital.id, task.id));
    } catch (error) {
      setError(errorText(error));
    }
  }
  const overdue =
    task.status !== "done" && new Date(task.due_at).getTime() < Date.now();
  return (
    <article className="task">
      <div className="section-heading">
        <div>
          <h3>{task.title}</h3>
          <p className="muted text-sm">
            {hospital.graph.nodes.find((n) => n.id === task.stage_id)?.label} ·
            Due{" "}
            {new Date(task.due_at).toLocaleString(undefined, {
              timeZone: hospital.timezone,
            })}{" "}
            ({hospital.timezone})
          </p>
        </div>
        <span
          className={`badge ${overdue ? "danger" : task.status === "done" ? "success" : ""}`}
        >
          {overdue ? "Overdue" : task.status.replace("_", " ")}
        </span>
      </div>
      {dirty && task.version !== draft.version && (
        <p className="notice warning">
          This task changed in another session. Your unsaved edits are
          preserved.{" "}
          <button
            type="button"
            className="btn subtle"
            onClick={() => {
              setDraft(task);
              setDirty(false);
              setError("");
            }}
          >
            Load latest saved version
          </button>
        </p>
      )}
      <form onSubmit={save} className="inline-form mt-4">
        <label>
          Owner
          <input
            value={draft.owner}
            required
            maxLength={100}
            onChange={(e) => (
              setDirty(true),
              setDraft((current) => ({ ...current, owner: e.target.value }))
            )}
          />
        </label>
        <label>
          Status
          <select
            value={draft.status}
            onChange={(e) => (
              setDirty(true),
              setDraft((current) => ({
                ...current,
                status: e.target.value as Task["status"],
              }))
            )}
          >
            {["queued", "in_progress", "blocked", "done"].map((status) => (
              <option value={status} key={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="grow">
          Notes
          <input
            value={draft.notes}
            maxLength={4000}
            onChange={(e) => (
              setDirty(true),
              setDraft((current) => ({ ...current, notes: e.target.value }))
            )}
          />
        </label>
        <button
          className="btn"
          disabled={busy || JSON.stringify(draft) === JSON.stringify(task)}
        >
          {busy ? "Saving…" : "Save update"}
        </button>
        <button
          type="button"
          className="btn subtle"
          onClick={() => void showHistory()}
          aria-expanded={!!history}
        >
          <HistoryIcon size={16} />
          History
        </button>
      </form>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {history && (
        <ol className="history-list">
          {history.map((event, index) => (
            <li key={index}>
              <strong>{event.actor}</strong> ·{" "}
              {new Date(event.created_at).toLocaleString(undefined, {
                timeZone: hospital.timezone,
              })}
              <details>
                <summary>View changes</summary>
                <pre>{JSON.stringify(event.change, null, 2)}</pre>
              </details>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
