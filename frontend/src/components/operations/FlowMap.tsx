import type { FlowGraph, StageAnalysis } from "../../api/operations";
export function FlowMap({
  graph,
  stages = [],
  onSelect,
}: {
  graph: FlowGraph;
  stages?: StageAnalysis[];
  onSelect?: (id: string) => void;
}) {
  if (!graph.nodes.length)
    return (
      <p className="empty small">
        No stages yet. Define your hospital’s flow in the Flow map tab.
      </p>
    );
  const width = 1000,
    columns = 3,
    height = Math.ceil(graph.nodes.length / columns) * 145 + 30;
  const position = (index: number) => ({
    x: 20 + (index % columns) * 330,
    y: 25 + Math.floor(index / columns) * 145,
  });
  const coordinates = new Map(
    graph.nodes.map((node, i) => [node.id, position(i)]),
  );
  return (
    <div className="flow-scroll">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="flow-svg"
        role="group"
        aria-label="Hospital process flow; connections follow your saved graph"
      >
        <defs>
          <marker
            id="flow-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8" fill="#94a3b8" />
          </marker>
        </defs>
        {graph.edges.map((edge) => {
          const source = coordinates.get(edge.source),
            target = coordinates.get(edge.target);
          if (!source || !target) return null;
          const sameRow = source.y === target.y;
          const x1 = sameRow ? source.x + 285 : source.x + 142,
            y1 = sameRow ? source.y + 50 : source.y + 100;
          const x2 = sameRow ? target.x - 4 : target.x + 142,
            y2 = sameRow ? target.y + 50 : target.y - 4;
          return (
            <path
              key={`${edge.source}-${edge.target}`}
              d={`M${x1} ${y1} C${x1 + 20} ${y1 + 20}, ${x2 - 20} ${y2 - 20}, ${x2} ${y2}`}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              markerEnd="url(#flow-arrow)"
            >
              <title>
                {edge.source} → {edge.target}
                {edge.label ? `: ${edge.label}` : ""}
              </title>
            </path>
          );
        })}
        {graph.nodes.map((node, i) => {
          const { x, y } = position(i);
          const latest = stages.find((stage) => stage.id === node.id)?.latest;
          const overloaded =
            latest && latest.occupied > latest.staffed_capacity;
          return (
            <g
              key={node.id}
              transform={`translate(${x},${y})`}
              role={onSelect ? "button" : "img"}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={`${node.label}, ${latest ? `${latest.waiting} waiting` : "no observations"}`}
              onClick={() => onSelect?.(node.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(node.id);
                }
              }}
              style={{ cursor: onSelect ? "pointer" : "default" }}
            >
              <rect
                width="285"
                height="100"
                rx="12"
                fill={overloaded ? "#fff7ed" : "#fff"}
                stroke={overloaded ? "#fdba74" : "#cbd5e1"}
              />
              <text x="16" y="25" fill="#64748b" fontSize="11">
                {node.kind.toUpperCase()} · {node.id.slice(0, 25)}
              </text>
              <text x="16" y="51" fill="#0f172a" fontSize="16" fontWeight="600">
                {node.label.slice(0, 29)}
                <title>{node.label}</title>
              </text>
              <text x="16" y="78" fill="#0f766e" fontSize="12">
                {latest
                  ? `${latest.waiting} waiting · ${latest.occupied}/${latest.staffed_capacity} occupied`
                  : "Awaiting observations"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
