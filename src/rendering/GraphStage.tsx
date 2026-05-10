import { useCallback, useEffect, useState } from "react";
import type { StageData } from "../layout/types";
import GraphBackdrop from "./GraphBackdrop";
import GraphDefs from "./GraphDefs";
import GraphEdge from "./GraphEdge";
import GraphNode from "./GraphNode";

const EMPTY_CONNECTED_KEYS = new Set<string>();

interface GraphStageProps {
  stage: StageData;
  focusedKey: string | null;
  svgRef: React.RefObject<SVGSVGElement>;
  onNodeClick: (key: string) => void;
  onNodeContextMenu: (event: React.MouseEvent<SVGGElement>, key: string) => void;
  onFocusChange: (key: string | null) => void;
}

export default function GraphStage({ stage, focusedKey, svgRef, onNodeClick, onNodeContextMenu, onFocusChange }: GraphStageProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const interactiveKey = hoveredKey || focusedKey;
  const connectedKeys = interactiveKey ? (stage.connectedKeysByNode.get(interactiveKey) || EMPTY_CONNECTED_KEYS) : EMPTY_CONNECTED_KEYS;
  const hasInteractiveKey = Boolean(interactiveKey);

  useEffect(() => {
    if (hoveredKey && !stage.nodeMap[hoveredKey]) {
      setHoveredKey(null);
    }
  }, [hoveredKey, stage.nodeMap]);

  const handleHoverChange = useCallback((nextKey: string | null) => {
    setHoveredKey((currentKey) => (currentKey === nextKey ? currentKey : nextKey));
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${stage.stageWidth} ${stage.stageHeight}`}
      width={stage.stageWidth}
      height={stage.stageHeight}
      role="img"
      aria-label={`DAG view focused on ${stage.selection.label}`}
    >
      <GraphDefs />
      <GraphBackdrop stage={stage} />
      <g className="graph-edge-layer">
        {stage.edges.map((edge) => {
          const isActive = interactiveKey ? edge.source === interactiveKey || edge.target === interactiveKey : false;
          return (
            <GraphEdge
              key={edge.id}
              edge={edge}
              isActive={isActive}
              isDimmed={hasInteractiveKey && !isActive}
            />
          );
        })}
      </g>
      <g className="graph-node-layer">
        {stage.nodes.map((node) => {
          const isCurrent = interactiveKey === node.key;
          const isConnected = !hasInteractiveKey || connectedKeys.has(node.key);
          return (
            <GraphNode
              key={node.key}
              node={node}
              isActive={node.key === stage.root || isCurrent}
              isCurrent={isCurrent}
              isDimmed={!isConnected}
              onClick={onNodeClick}
              onContextMenu={onNodeContextMenu}
              onHoverChange={handleHoverChange}
              onFocusChange={onFocusChange}
            />
          );
        })}
      </g>
    </svg>
  );
}
