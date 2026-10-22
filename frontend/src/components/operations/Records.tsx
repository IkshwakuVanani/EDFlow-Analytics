import { useEffect, useState, type FormEvent } from "react";
import { Download, Upload } from "lucide-react";
import {
  csvFields,
  download,
  errorText,
  localDateTime,
  ops,
  parseCSV,
  type Hospital,
  type Observation,
} from "../../api/operations";
export default function Records({
  hospital,
  onChanged,
}: {
  hospital: Hospital;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<Observation[]>([]);
  const [preview, setPreview] = useState<Observation[]>([]);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [validated, setValidated] = useState(false);
  async function load(nextOffset = offset) {
    try {
      setRows(await ops.observations(hospital.id, nextOffset));
      setOffset(nextOffset);
    } catch (error) {
      setError(errorText(error));
    }
  }
  useEffect(() => {
    void load(0);
  }, [hospital.id]);
  async function readFile(file?: File) {
    if (!file) return;
    setError("");
    setNotice("");
    setValidated(false);
    setPreview([]);
    try {
      if (file.size > 2000000)
        throw new Error("Upload CSV files smaller than 2 MB.");
      setPreview(parseCSV(await file.text()));
    } catch (error) {
      setError(errorText(error));
    }
  }
  async function importRows(dryRun: boolean) {
    setBusy(true);
    setError("");
    try {
      const result = await ops.import(hospital.id, preview, dryRun);
      setNotice(
        `${dryRun ? "Validated" : "Saved"} ${result.accepted} observations. ${result.duplicates} identical duplicates skipped.`,
      );
      setValidated(dryRun);
      if (!dryRun) {
        setPreview([]);
        onChanged();
        await load(0);
      }
    } catch (error) {
      setError(errorText(error));
      setValidated(false);
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const observation: Record<string, string | number> = {};
    csvFields.forEach((key) => {
      observation[key] =
        key === "observed_at"
          ? new Date(String(data.get(key))).toISOString()
          : key === "stage_id"
            ? String(data.get(key))
            : Number(data.get(key));
    });
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await ops.import(
        hospital.id,
        [observation as Observation],
        false,
      );
      setNotice(
        result.accepted
          ? "Observation saved."
          : "Identical observation already exists.",
      );
      onChanged();
      await load(0);
      form.reset();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function exportAll() {
    setBusy(true);
    setError("");
    try {
      const all: Observation[] = [];
      let page = 0;
      while (true) {
        const records = await ops.observations(hospital.id, page, 5000);
        all.push(...records);
        if (records.length < 5000) break;
        page += 5000;
      }
      download(
        "hospital-observations.csv",
        [
          csvFields.join(","),
          ...all.map((row) => csvFields.map((key) => row[key]).join(",")),
        ].join("\n"),
        "text/csv",
      );
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="section-stack">
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Import aggregate observations</h2>
            <p className="muted">
              CSV records map directly to your saved stage IDs. Validate before
              saving. No patient names or identifiers.
            </p>
          </div>
          <button
            className="btn subtle"
            onClick={() =>
              download(
                "observations-template.csv",
                csvFields.join(",") + "\n",
                "text/csv",
              )
            }
          >
            <Download size={16} />
            CSV template
          </button>
        </div>
        <div className="upload-zone">
          <Upload size={25} />
          <div>
            <label htmlFor="observations-file">Choose a CSV file</label>
            <p className="muted text-sm">
              Up to 5,000 records · 2 MB · Existing identical records are
              skipped
            </p>
            <input
              id="observations-file"
              type="file"
              accept=".csv,text/csv"
              disabled={busy || !hospital.graph.nodes.length}
              onChange={(e) => {
                void readFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        {!hospital.graph.nodes.length && (
          <p className="notice warning">
            Save at least one stage in Flow map before importing.
          </p>
        )}
        <details>
          <summary>Field definitions and time handling</summary>
          <p className="muted">
            One row describes one stage at a timezone-aware ISO timestamp, such
            as 2026-10-22T14:00:00-04:00. Waiting, occupied, and
            staffed_capacity are point-in-time counts. Arrivals and departures
            count transitions during the interval_minutes ending at observed_at.
            Reporting intervals must not overlap within a stage. Counts must be
            nonnegative integers. Repeated counts at successive stages are not
            unique patients. Use the same timestamp across stages for complete
            snapshot charts.
          </p>
          <code className="csv-schema">{csvFields.join(", ")}</code>
        </details>
        {preview.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold">
              {preview.length} rows ready for validation
            </p>
            <ObservationTable
              rows={preview.slice(0, 5)}
              timezone={hospital.timezone}
            />
            <div className="toolbar mt-4">
              <button
                className="btn"
                disabled={busy}
                onClick={() => void importRows(true)}
              >
                {busy ? "Working…" : "Validate import"}
              </button>
              <button
                className="btn primary"
                disabled={busy || !validated}
                onClick={() => void importRows(false)}
              >
                Save validated records
              </button>
              <button
                className="btn subtle"
                disabled={busy}
                onClick={() => {
                  setPreview([]);
                  setValidated(false);
                }}
              >
                Cancel import
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="card">
        <h2>Record an observation</h2>
        <p className="muted">
          Enter aggregate counts for one stage. This form uses your device’s
          local time ({Intl.DateTimeFormat().resolvedOptions().timeZone}); saved
          records are normalized to UTC.
        </p>
        <form className="form-grid mt-4" onSubmit={submit}>
          <label>
            Stage
            <select name="stage_id" required>
              <option value="">Choose stage</option>
              {hospital.graph.nodes.map((node) => (
                <option value={node.id} key={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Observed at (device local)
            <input
              name="observed_at"
              type="datetime-local"
              defaultValue={localDateTime()}
              required
            />
          </label>
          {csvFields.slice(2).map((key) => (
            <label key={key}>
              {key.replace(/_/g, " ")}
              <input
                type="number"
                name={key}
                required
                min={key === "interval_minutes" ? 1 : 0}
                max={key === "interval_minutes" ? 1440 : 100000}
                step={1}
                defaultValue={key === "interval_minutes" ? 60 : undefined}
              />
            </label>
          ))}
          <div className="form-actions">
            <button
              className="btn primary"
              disabled={busy || !hospital.graph.nodes.length}
            >
              {busy ? "Saving…" : "Save observation"}
            </button>
          </div>
        </form>
      </section>
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Saved records</h2>
            <p className="muted">
              Newest first · Displayed in {hospital.timezone}
            </p>
          </div>
          <div className="toolbar">
            <button
              className="btn subtle"
              disabled={busy}
              onClick={() => void load()}
            >
              Refresh records
            </button>
            <button
              className="btn subtle"
              disabled={busy}
              onClick={() => void exportAll()}
            >
              <Download size={16} />
              Export all CSV
            </button>
          </div>
        </div>
        <ObservationTable rows={rows} timezone={hospital.timezone} />
        <div className="toolbar mt-4">
          <button
            className="btn subtle"
            disabled={offset === 0 || busy}
            onClick={() => void load(Math.max(0, offset - 500))}
          >
            Previous
          </button>
          <span className="muted text-sm">
            {rows.length
              ? `${offset + 1}–${offset + rows.length}`
              : "No saved records"}
          </span>
          <button
            className="btn subtle"
            disabled={rows.length < 500 || busy}
            onClick={() => void load(offset + 500)}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
function ObservationTable({
  rows,
  timezone,
}: {
  rows: Observation[];
  timezone: string;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Stage</th>
            <th>Observed at</th>
            <th>Waiting</th>
            <th>Occupied</th>
            <th>Staffed</th>
            <th>Arrivals</th>
            <th>Departures</th>
            <th>Interval (min)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? index}>
              <td>
                <code>{row.stage_id}</code>
              </td>
              <td>
                {isNaN(Date.parse(row.observed_at))
                  ? row.observed_at
                  : new Date(row.observed_at).toLocaleString(undefined, {
                      timeZone: timezone,
                    })}
              </td>
              <td>{row.waiting}</td>
              <td>{row.occupied}</td>
              <td>{row.staffed_capacity}</td>
              <td>{row.arrivals}</td>
              <td>{row.departures}</td>
              <td>{row.interval_minutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="empty small">Your saved observations will appear here.</p>
      )}
    </div>
  );
}
