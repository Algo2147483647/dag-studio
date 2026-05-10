import { memo, type CSSProperties, type KeyboardEvent } from "react";
import type { StageNode } from "../layout/types";

const DETAIL_LINE_HEIGHT = 10;

interface GraphNodeProps {
  node: StageNode;
  isActive: boolean;
  isCurrent: boolean;
  isDimmed: boolean;
  onClick: (key: string) => void;
  onContextMenu: (event: React.MouseEvent<SVGGElement>, key: string) => void;
  onHoverChange: (key: string | null) => void;
  onFocusChange: (key: string | null) => void;
}

const GraphNode = memo(function GraphNode({
  node,
  isActive,
  isCurrent,
  isDimmed,
  onClick,
  onContextMenu,
  onHoverChange,
  onFocusChange,
}: GraphNodeProps) {
  const style = node.colorTokens ? ({
    "--graph-node-glow": node.colorTokens.glow,
    "--graph-node-fill": node.colorTokens.fill,
    "--graph-node-root-fill": node.colorTokens.rootFill,
    "--graph-node-active-fill": node.colorTokens.activeFill,
    "--graph-node-border": node.colorTokens.border,
    "--graph-node-border-strong": node.colorTokens.borderStrong,
    "--graph-node-active-border": node.colorTokens.activeBorder,
    "--graph-node-pin-fill": node.colorTokens.pinFill,
    "--graph-node-pin-stroke": node.colorTokens.pinStroke,
    "--graph-node-pin-core": node.colorTokens.pinCore,
    "--graph-node-affordance-bg": node.colorTokens.affordanceBg,
    "--graph-node-affordance-text": node.colorTokens.affordanceText,
  } as CSSProperties) : undefined;
  const className = [
    "graph-node",
    node.isRoot ? "is-root" : "",
    isActive ? "is-active" : "",
    isCurrent ? "is-hovered" : "",
    isDimmed ? "is-dimmed" : "",
  ].filter(Boolean).join(" ");

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(node.key);
    }
  }

  return (
    <g
      className={className}
      data-node-key={node.key}
      data-node-type={node.typeLabel}
      style={style}
      transform={`translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`}
      tabIndex={0}
      role="button"
      aria-label={`${node.title}. ${node.detail}. ${node.isRoot ? "Current focus." : "Activate to focus this branch."}`}
      onClick={() => onClick(node.key)}
      onContextMenu={(event) => onContextMenu(event, node.key)}
      onMouseEnter={() => onHoverChange(node.key)}
      onMouseLeave={() => onHoverChange(null)}
      onFocus={() => onFocusChange(node.key)}
      onBlur={() => onFocusChange(null)}
      onKeyDown={handleKeyDown}
    >
      <ellipse className="graph-node__glow" cx={node.width / 2} cy={node.height / 2} rx={node.width / 2 + 16} ry={node.height / 2 + 10} />
      <rect className="graph-node__shape" width={node.width} height={node.height} rx={24} ry={24} />
      <circle className="graph-node__pin" cx={26} cy={node.height / 2} r={11} />
      <circle className="graph-node__pin-core" cx={26} cy={node.height / 2} r={4} />
      <text className="graph-node__title" x={48} y={29}>
        {node.displayTitle}
      </text>
      <text className="graph-node__detail" x={48} y={45}>
        {node.detailLines.map((line, index) => (
          <tspan key={`${line}-${index}`} x={48} dy={index === 0 ? 0 : DETAIL_LINE_HEIGHT}>
            {line}
          </tspan>
        ))}
      </text>
      <g className="graph-node__affordance">
        <rect className="graph-node__affordance-bg" x={node.width - 90} y={node.height - 21} width={74} height={14} rx={7} ry={7} />
        <text className="graph-node__affordance-text" x={node.width - 53} y={node.height - 10} textAnchor="middle">
          {node.isRoot ? "Focused" : "Refocus"}
        </text>
      </g>
    </g>
  );
}, areEqualGraphNodeProps);

export default GraphNode;

function areEqualGraphNodeProps(previous: GraphNodeProps, next: GraphNodeProps): boolean {
  return previous.node === next.node
    && previous.isActive === next.isActive
    && previous.isCurrent === next.isCurrent
    && previous.isDimmed === next.isDimmed
    && previous.onClick === next.onClick
    && previous.onContextMenu === next.onContextMenu
    && previous.onHoverChange === next.onHoverChange
    && previous.onFocusChange === next.onFocusChange;
}
