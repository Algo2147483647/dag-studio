import { memo } from "react";
import type { StageEdge } from "../layout/types";

interface GraphEdgeProps {
  edge: StageEdge;
  isActive: boolean;
  isDimmed: boolean;
}

const GraphEdge = memo(function GraphEdge({ edge, isActive, isDimmed }: GraphEdgeProps) {
  const className = ["graph-edge", isDimmed ? "is-dimmed" : "", isActive ? "is-active" : ""].filter(Boolean).join(" ");

  return (
    <g className="graph-edge-group">
      <path className={className} d={edge.path} data-source={edge.source} data-target={edge.target} markerEnd="url(#arrowhead)" />
      {edge.label ? <EdgeLabel label={edge.label} x={edge.labelPosition.x} y={edge.labelPosition.y} /> : null}
    </g>
  );
}, areEqualGraphEdgeProps);

export default GraphEdge;

function areEqualGraphEdgeProps(previous: GraphEdgeProps, next: GraphEdgeProps): boolean {
  return previous.edge === next.edge && previous.isActive === next.isActive && previous.isDimmed === next.isDimmed;
}

function EdgeLabel({ label, x, y }: { label: string; x: number; y: number }) {
  const labelWidth = Math.max(18, label.length * 7 + 10);

  return (
    <>
      <rect className="graph-edge-label-bg" x={x - labelWidth / 2} y={y - 10} width={labelWidth} height={16} rx={8} ry={8} />
      <text className="graph-edge-label" x={x} y={y + 1} textAnchor="middle">
        {label}
      </text>
    </>
  );
}
