import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Download, Plus, Save, Trash2, Upload } from "lucide-react";
import {
  download,
  errorText,
  ops,
  type FlowGraph,
  type Hospital,
  type Stage,
} from "../../api/operations";
import { FlowMap } from "./FlowMap";
export default function FlowEditor({
  hospital,
  onHospital,
}: {
  hospital: Hospital;
  onHospital: (hospital: Hospital) => void;
}) {
  const [graph, setGraph] = useState<FlowGraph>(hospital.graph);
  const [version, setVersion] = useState(hospital.version);
  const [savedGraph, setSavedGraph] = useState(hospital.graph);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(graph) !== JSON.stringify(savedGraph);
  function loadSavedFlow() {
    setGraph(hospital.graph);
    setSavedGraph(hospital.graph);
    setVersion(hospital.version);
    setError("");
  }
  useEffect(() => {
    if (!dirty && hospital.version !== version) loadSavedFlow();
  }, [hospital.version, dirty]);
  function addStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const stage: Stage = {
      id: String(data.get("id")),
      label: String(data.get("label")),
      owner: String(data.get("owner")),
      kind: String(data.get("kind")) as Stage["kind"],
    };
    if (graph.nodes.some((node) => node.id === stage.id)) {
      setError("Choose a unique stage ID.");
      return;
    }
    setGraph((current) => ({ ...current, nodes: [...current.nodes, stage] }));
    setError("");
    setNotice("");
    form.reset();
  }
  function addConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const source = String(data.get("source")),
      target = String(data.get("target"));
    if (
      source === target ||
      graph.edges.some(
        (edge) => edge.source === source && edge.target === target,
      )
    ) {
      setError("Choose two different stages without an existing connection.");
      return;
    }
    setGraph((current) => ({
      ...current,
      edges: [
        ...current.edges,
        { source, target, label: String(data.get("label")) },
      ],
    }));
    setError("");
    setNotice("");
  }
  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await ops.graph(hospital.id, graph, version);
      setGraph(next.graph);
      setSavedGraph(next.graph);
      setVersion(next.version);
      onHospital(next);
      setNotice(
        "Flow saved. New observations can now reference these stage IDs.",
      );
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function importGraph(file?: File) {
    if (!file) return;
    setError("");
    setNotice("");
    try {
      if (file.size > 500000)
        throw new Error("Flow files must be smaller than 500 KB.");
      const value = JSON.parse(await file.text());
      if (
        !Array.isArray(value.nodes) ||
        !Array.isArray(value.edges) ||
        value.nodes.length > 100 ||
        value.edges.length > 300
      )
        throw new Error(
          "Use a JSON object with nodes (up to 100) and edges (up to 300).",
        );
      const kinds = ["arrival", "care", "transfer", "discharge", "support"];
      if (
        value.nodes.some(
          (n: Stage) =>
            !n ||
            typeof n.id !== "string" ||
            !/^[a-zA-Z0-9_-]+$/.test(n.id) ||
            typeof n.label !== "string" ||
            !n.label.trim() ||
            (n.kind && !kinds.includes(n.kind)) ||
            (n.owner !== undefined && typeof n.owner !== "string"),
        )
      )
        throw new Error(
          "Each node needs an ID and label; kind and owner are optional.",
        );
      const ids = new Set(value.nodes.map((n: Stage) => n.id));
      if (
        ids.size !== value.nodes.length ||
        value.edges.some(
          (e: FlowGraph["edges"][number]) =>
            !e ||
            !ids.has(e.source) ||
            !ids.has(e.target) ||
            e.source === e.target ||
            (e.label !== undefined && typeof e.label !== "string"),
        )
      )
        throw new Error(
          "Use unique node IDs and connections between existing different nodes.",
        );
      setGraph({
        nodes: value.nodes.map((n: Stage) => ({
          ...n,
          kind: n.kind || "care",
          owner: n.owner || "",
        })),
        edges: value.edges.map((e: FlowGraph["edges"][number]) => ({
          ...e,
          label: e.label || "",
        })),
      });
      setNotice("Flow loaded for review. Save to apply it.");
    } catch (error) {
      setError(errorText(error));
    }
  }
  return (
    <div className="section-stack">
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Your hospital flow</h2>
            <p className="muted">
              Build stages and connections, or import a JSON flow definition.
              Save before recording observations.
            </p>
          </div>
          <div className="toolbar">
            <label className="btn subtle upload">
              <Upload size={16} />
              Import JSON
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  void importGraph(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              className="btn subtle"
              onClick={() =>
                download("hospital-flow.json", JSON.stringify(graph, null, 2))
              }
            >
              <Download size={16} />
              Export JSON
            </button>
            <button
              className="btn primary"
              disabled={busy || !dirty}
              onClick={() => void save()}
            >
              <Save size={16} />
              {busy ? "Saving…" : "Save flow"}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        {dirty && hospital.version !== version && (
          <p className="notice warning">
            A collaborator saved a newer flow. Your draft is preserved.{" "}
            <button className="btn subtle" onClick={loadSavedFlow}>
              Discard draft and load latest
            </button>
          </p>
        )}
        {dirty && (
          <p className="notice warning">
            Unsaved changes. Save the flow before leaving this tab.
          </p>
        )}
        <FlowMap graph={graph} />
      </section>
      <section className="card">
        <h2>Stages</h2>
        <form onSubmit={addStage} className="inline-form mt-4">
          <label>
            Stage ID
            <input
              name="id"
              required
              pattern="[a-zA-Z0-9_\-]+"
              maxLength={80}
              placeholder="ed_arrival"
            />
          </label>
          <label>
            Display name
            <input
              name="label"
              required
              maxLength={100}
              placeholder="ED arrival"
            />
          </label>
          <label>
            Type
            <select name="kind">
              {["arrival", "care", "transfer", "discharge", "support"].map(
                (kind) => (
                  <option key={kind}>{kind}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Responsible team
            <input name="owner" maxLength={100} placeholder="Bed management" />
          </label>
          <button className="btn" disabled={graph.nodes.length >= 100}>
            <Plus size={16} />
            Add stage
          </button>
        </form>
        <div className="table-wrap mt-4">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Stage name</th>
                <th>Responsible team</th>
                <th>Type</th>
                <th>
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {graph.nodes.map((node) => (
                <tr key={node.id}>
                  <td>
                    <code>{node.id}</code>
                  </td>
                  <td>
                    <input
                      aria-label={`Name for ${node.id}`}
                      value={node.label}
                      maxLength={100}
                      onChange={(e) =>
                        setGraph((current) => ({
                          ...current,
                          nodes: current.nodes.map((n) =>
                            n.id === node.id
                              ? { ...n, label: e.target.value }
                              : n,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`Owner for ${node.id}`}
                      value={node.owner}
                      maxLength={100}
                      onChange={(e) =>
                        setGraph((current) => ({
                          ...current,
                          nodes: current.nodes.map((n) =>
                            n.id === node.id
                              ? { ...n, owner: e.target.value }
                              : n,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td>{node.kind}</td>
                  <td>
                    <button
                      className="btn subtle icon"
                      aria-label={`Remove ${node.label}`}
                      onClick={() =>
                        setGraph((current) => ({
                          nodes: current.nodes.filter((n) => n.id !== node.id),
                          edges: current.edges.filter(
                            (e) => e.source !== node.id && e.target !== node.id,
                          ),
                        }))
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <h2>Connections</h2>
        <form onSubmit={addConnection} className="inline-form mt-4">
          <label>
            From
            <select name="source" required>
              <option value="">Select stage</option>
              {graph.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <ArrowRight className="connection-arrow" size={16} />
          <label>
            To
            <select name="target" required>
              <option value="">Select stage</option>
              {graph.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Connection label
            <input name="label" maxLength={100} placeholder="Bed assignment" />
          </label>
          <button
            className="btn"
            disabled={graph.nodes.length < 2 || graph.edges.length >= 300}
          >
            Add connection
          </button>
        </form>
        <ul className="connection-list">
          {graph.edges.map((edge) => (
            <li key={`${edge.source}-${edge.target}`}>
              <span>
                {graph.nodes.find((n) => n.id === edge.source)?.label} →{" "}
                {graph.nodes.find((n) => n.id === edge.target)?.label}{" "}
                {edge.label && <span className="muted">· {edge.label}</span>}
              </span>
              <button
                className="btn subtle icon"
                aria-label={`Remove connection ${edge.source} to ${edge.target}`}
                onClick={() =>
                  setGraph((current) => ({
                    ...current,
                    edges: current.edges.filter((e) => e !== edge),
                  }))
                }
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        <details className="mt-4">
          <summary>JSON format and importing existing charts</summary>
          <p className="muted">
            Convert your process chart to nodes and directed edges. Node IDs
            link the flow to your observations. Images and PDFs cannot be
            analyzed as structured flow definitions.
          </p>
          <pre>
            {JSON.stringify(
              {
                nodes: [
                  {
                    id: "your_stage_id",
                    label: "Your stage",
                    kind: "care",
                    owner: "Responsible team",
                  },
                ],
                edges: [],
              },
              null,
              2,
            )}
          </pre>
        </details>
      </section>
    </div>
  );
}
