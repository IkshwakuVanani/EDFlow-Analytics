export type Stage = {
  id: string;
  label: string;
  kind: "arrival" | "care" | "transfer" | "discharge" | "support";
  owner: string;
};
export type FlowGraph = {
  nodes: Stage[];
  edges: { source: string; target: string; label: string }[];
};
export type Hospital = {
  id: string;
  name: string;
  timezone: string;
  graph: FlowGraph;
  version: number;
};
export type Observation = {
  id?: string;
  stage_id: string;
  observed_at: string;
  waiting: number;
  occupied: number;
  staffed_capacity: number;
  arrivals: number;
  departures: number;
  interval_minutes: number;
};
export type StageAnalysis = Stage & {
  latest: Omit<Observation, "id" | "stage_id"> | null;
  samples: number;
  queue_change: number | null;
  departures_per_hour: number | null;
  queue_slope_per_hour: number | null;
  projected_waiting_60m: number | null;
};
export type Analysis = {
  stages: StageAnalysis[];
  timeline: {
    time: string;
    waiting: number;
    occupied: number;
    rolling_waiting: number;
    reporting_stages: number;
  }[];
  conclusions: string[];
  warnings: string[];
  observation_count: number;
  complete_snapshots: number;
  median_interval_minutes: number | null;
  latest_observed_at: string | null;
  window_start: string;
  window_end: string;
  methodology: string;
};
export type Task = {
  id: string;
  title: string;
  stage_id: string;
  owner: string;
  status: "queued" | "in_progress" | "blocked" | "done";
  due_at: string;
  notes: string;
  version: number;
  updated_at: string;
};
export type History = { actor: string; change: unknown; created_at: string };
const base = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://localhost:8000" : "/api")
).replace(/\/$/, "");
export function savedSession(): { token: string; username: string } | null {
  try {
    return JSON.parse(sessionStorage.getItem("edflow-session") ?? "null");
  } catch {
    return null;
  }
}
export function saveSession(value: { token: string; username: string } | null) {
  if (value) sessionStorage.setItem("edflow-session", JSON.stringify(value));
  else sessionStorage.removeItem("edflow-session");
}
export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = savedSession()?.token;
  let response: Response;
  try {
    response = await fetch(`${base}/ops${path}`, {
      ...options,
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Check your connection and try again. Your saved data has not changed.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body.detail === "string"
        ? body.detail
        : Array.isArray(body.detail)
          ? body.detail
              .map(
                (e: { loc: string[]; msg: string }) =>
                  `${e.loc.slice(1).join(".")}: ${e.msg}`,
              )
              .join("; ")
          : `Request failed (${response.status})`;
    if (response.status === 401 && !path.startsWith("/auth/")) {
      saveSession(null);
      window.dispatchEvent(new Event("edflow-session-expired"));
    }
    throw new Error(message);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const ops = {
  auth: (mode: string, username: string, password: string) =>
    request<{ token: string; username: string }>(`/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  hospitals: () => request<Hospital[]>("/hospitals"),
  createHospital: (name: string, timezone: string) =>
    request<Hospital>("/hospitals", {
      method: "POST",
      body: JSON.stringify({ name, timezone }),
    }),
  graph: (id: string, graph: FlowGraph, version: number) =>
    request<Hospital>(`/hospitals/${id}/graph`, {
      method: "PUT",
      body: JSON.stringify({ ...graph, version }),
    }),
  invite: (id: string) =>
    request<{ code: string; expires_in_hours: number }>(
      `/hospitals/${id}/invitations`,
      { method: "POST" },
    ),
  join: (code: string) =>
    request<Hospital>("/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  observations: (id: string, offset = 0, limit = 500) =>
    request<Observation[]>(
      `/hospitals/${id}/observations?offset=${offset}&limit=${limit}`,
    ),
  import: (id: string, observations: Observation[], dry_run: boolean) =>
    request<{ accepted: number; duplicates: number; dry_run: boolean }>(
      `/hospitals/${id}/observations`,
      { method: "POST", body: JSON.stringify({ observations, dry_run }) },
    ),
  analysis: (id: string, start?: string, end?: string) =>
    request<Analysis>(
      `/hospitals/${id}/analysis${start && end ? `?${new URLSearchParams({ start, end })}` : ""}`,
    ),
  tasks: (id: string) => request<Task[]>(`/hospitals/${id}/tasks`),
  createTask: (
    id: string,
    data: Omit<Task, "id" | "status" | "version" | "updated_at">,
  ) =>
    request<Task>(`/hospitals/${id}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, task: Task) =>
    request<Task>(`/hospitals/${id}/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        version: task.version,
        status: task.status,
        owner: task.owner,
        notes: task.notes,
      }),
    }),
  history: (id: string, taskId: string) =>
    request<History[]>(`/hospitals/${id}/tasks/${taskId}/history`),
};
export function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
export function download(
  name: string,
  value: string,
  mime = "application/json",
) {
  const url = URL.createObjectURL(new Blob([value], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const csvFields = [
  "stage_id",
  "observed_at",
  "waiting",
  "occupied",
  "staffed_capacity",
  "arrivals",
  "departures",
  "interval_minutes",
] as const;
export function parseCSV(text: string): Observation[] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    closed = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
        closed = true;
      } else field += ch;
    } else if (ch === '"' && !field && !closed) quoted = true;
    else if (ch === "," || ch === "\n" || ch === "\r") {
      row.push(field.trim());
      field = "";
      closed = false;
      if (ch !== ",") {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (ch === "\r" && text[i + 1] === "\n") i++;
      }
    } else {
      if (closed && ch.trim())
        throw new Error("Unexpected text after a quoted CSV field.");
      field += ch;
    }
  }
  if (quoted) throw new Error("Unclosed quote in CSV.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  const header = rows.shift();
  if (
    !header ||
    header.length !== csvFields.length ||
    new Set(header).size !== header.length ||
    csvFields.some((key) => !header.includes(key))
  )
    throw new Error(`CSV columns must be exactly: ${csvFields.join(", ")}`);
  if (!rows.length || rows.length > 5000)
    throw new Error("Upload between 1 and 5,000 observations per import.");
  return rows.map((values, i) => {
    if (values.length !== header.length)
      throw new Error(`Row ${i + 2}: wrong number of columns.`);
    const result: Record<string, string | number> = {};
    header.forEach((key, index) => {
      const value = values[index];
      if (key === "stage_id" || key === "observed_at") result[key] = value;
      else {
        if (!/^\d+$/.test(value))
          throw new Error(
            `Row ${i + 2}: ${key} must be a nonnegative integer.`,
          );
        result[key] = Number(value);
      }
    });
    return result as Observation;
  });
}
export function localDateTime(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
