import { useCallback, useEffect, useRef } from "react";
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
  const hoveredKeyRef = useRef<string | null>(null);
  const focusedKeyRef = useRef<string | null>(focusedKey);
  const appliedInteractiveKeyRef = useRef<string | null>(null);
  const nodeElementsByKeyRef = useRef(new Map<string, SVGGElement>());
  const edgeElementsByNodeKeyRef = useRef(new Map<string, SVGPathElement[]>());
  const connectedNodeElementsRef = useRef(new Set<SVGGElement>());
  const activeEdgeElementsRef = useRef(new Set<SVGPathElement>());
  const currentNodeElementRef = useRef<SVGGElement | null>(null);

  const clearInteractiveClasses = useCallback(() => {
    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    svgElement.classList.remove("has-interactive-node");

    if (currentNodeElementRef.current) {
      currentNodeElementRef.current.classList.remove("is-current");
      currentNodeElementRef.current = null;
    }

    connectedNodeElementsRef.current.forEach((nodeElement) => nodeElement.classList.remove("is-connected"));
    connectedNodeElementsRef.current.clear();

    activeEdgeElementsRef.current.forEach((edgeElement) => edgeElement.classList.remove("is-active-edge"));
    activeEdgeElementsRef.current.clear();
  }, [svgRef]);

  const applyInteractiveKey = useCallback((nextKey: string | null) => {
    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    const previousKey = appliedInteractiveKeyRef.current;
    if (previousKey === nextKey) {
      return;
    }

    if (!nextKey) {
      clearInteractiveClasses();
      appliedInteractiveKeyRef.current = null;
      return;
    }

    const nextNodeElement = nodeElementsByKeyRef.current.get(nextKey);
    if (!nextNodeElement) {
      clearInteractiveClasses();
      appliedInteractiveKeyRef.current = null;
      return;
    }

    const previousConnectedKeys = getAdjacentKeys(previousKey, stage);
    const nextConnectedKeys = getAdjacentKeys(nextKey, stage);

    const previousEdgeElements = new Set(edgeElementsByNodeKeyRef.current.get(previousKey || "") || []);
    const nextEdgeElements = new Set(edgeElementsByNodeKeyRef.current.get(nextKey) || []);

    if (!previousKey) {
      svgElement.classList.add("has-interactive-node");
    }

    if (currentNodeElementRef.current && currentNodeElementRef.current !== nextNodeElement) {
      currentNodeElementRef.current.classList.remove("is-current");
    }

    nextNodeElement.classList.add("is-current");
    currentNodeElementRef.current = nextNodeElement;

    previousConnectedKeys.forEach((connectedKey) => {
      if (nextConnectedKeys.has(connectedKey)) {
        return;
      }
      const connectedNodeElement = nodeElementsByKeyRef.current.get(connectedKey);
      if (!connectedNodeElement) {
        return;
      }
      connectedNodeElement.classList.remove("is-connected");
      connectedNodeElementsRef.current.delete(connectedNodeElement);
    });

    nextConnectedKeys.forEach((connectedKey) => {
      const connectedNodeElement = nodeElementsByKeyRef.current.get(connectedKey);
      if (!connectedNodeElement) {
        return;
      }
      connectedNodeElement.classList.add("is-connected");
      connectedNodeElementsRef.current.add(connectedNodeElement);
    });

    previousEdgeElements.forEach((edgeElement) => {
      if (nextEdgeElements.has(edgeElement)) {
        return;
      }
      edgeElement.classList.remove("is-active-edge");
      activeEdgeElementsRef.current.delete(edgeElement);
    });

    nextEdgeElements.forEach((edgeElement) => {
      edgeElement.classList.add("is-active-edge");
      activeEdgeElementsRef.current.add(edgeElement);
    });

    appliedInteractiveKeyRef.current = nextKey;
  }, [clearInteractiveClasses, stage.connectedKeysByNode, svgRef]);

  useEffect(() => {
    focusedKeyRef.current = focusedKey;
    if (!hoveredKeyRef.current) {
      applyInteractiveKey(resolveVisibleNodeKey(focusedKey, stage));
    }
  }, [applyInteractiveKey, focusedKey, stage]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    nodeElementsByKeyRef.current = collectNodeElements(svgElement);
    edgeElementsByNodeKeyRef.current = collectEdgeElements(svgElement);
    syncInteractiveKey(hoveredKeyRef.current);

    const handlePointerMove = (event: PointerEvent) => {
      const nextKey = resolveNodeKey(event.target);
      if (hoveredKeyRef.current === nextKey) {
        return;
      }
      syncInteractiveKey(nextKey);
    };

    const handlePointerLeave = () => {
      if (!hoveredKeyRef.current) {
        return;
      }
      syncInteractiveKey(null);
    };

    svgElement.addEventListener("pointermove", handlePointerMove);
    svgElement.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      svgElement.removeEventListener("pointermove", handlePointerMove);
      svgElement.removeEventListener("pointerleave", handlePointerLeave);
      hoveredKeyRef.current = null;
      appliedInteractiveKeyRef.current = null;
      clearInteractiveClasses();
      nodeElementsByKeyRef.current = new Map();
      edgeElementsByNodeKeyRef.current = new Map();
    };
  }, [applyInteractiveKey, clearInteractiveClasses, stage, svgRef]);

  return (
    <svg
      className="graph-stage"
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
        {stage.edges.map((edge) => (
          <GraphEdge
            key={edge.id}
            edge={edge}
          />
        ))}
      </g>
      <g className="graph-node-layer">
        {stage.nodes.map((node) => (
          <GraphNode
            key={node.key}
            node={node}
            isActive={node.key === stage.root}
            onClick={onNodeClick}
            onContextMenu={onNodeContextMenu}
            onFocusChange={onFocusChange}
          />
        ))}
      </g>
    </svg>
  );

  function syncInteractiveKey(nextHoveredKey: string | null) {
    hoveredKeyRef.current = resolveVisibleNodeKey(nextHoveredKey, stage);
    applyInteractiveKey(hoveredKeyRef.current || resolveVisibleNodeKey(focusedKeyRef.current, stage));
  }
}

function resolveNodeKey(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }
  return target.closest<SVGGElement>(".graph-node[data-node-key]")?.dataset.nodeKey || null;
}

function collectNodeElements(svgElement: SVGSVGElement): Map<string, SVGGElement> {
  const nodeElementsByKey = new Map<string, SVGGElement>();
  svgElement.querySelectorAll<SVGGElement>(".graph-node[data-node-key]").forEach((nodeElement) => {
    const nodeKey = nodeElement.dataset.nodeKey;
    if (nodeKey) {
      nodeElementsByKey.set(nodeKey, nodeElement);
    }
  });
  return nodeElementsByKey;
}

function collectEdgeElements(svgElement: SVGSVGElement): Map<string, SVGPathElement[]> {
  const edgeElementsByNodeKey = new Map<string, SVGPathElement[]>();
  svgElement.querySelectorAll<SVGPathElement>(".graph-edge[data-source][data-target]").forEach((edgeElement) => {
    const sourceKey = edgeElement.dataset.source;
    const targetKey = edgeElement.dataset.target;
    if (sourceKey) {
      const sourceEdges = edgeElementsByNodeKey.get(sourceKey) || [];
      sourceEdges.push(edgeElement);
      edgeElementsByNodeKey.set(sourceKey, sourceEdges);
    }
    if (targetKey && targetKey !== sourceKey) {
      const targetEdges = edgeElementsByNodeKey.get(targetKey) || [];
      targetEdges.push(edgeElement);
      edgeElementsByNodeKey.set(targetKey, targetEdges);
    }
  });
  return edgeElementsByNodeKey;
}

function resolveVisibleNodeKey(nodeKey: string | null, stage: StageData): string | null {
  return nodeKey && stage.nodeMap[nodeKey] ? nodeKey : null;
}

function getAdjacentKeys(nodeKey: string | null, stage: StageData): ReadonlySet<string> {
  if (!nodeKey) {
    return EMPTY_CONNECTED_KEYS;
  }

  const connectedKeys = stage.connectedKeysByNode.get(nodeKey);
  if (!connectedKeys) {
    return EMPTY_CONNECTED_KEYS;
  }

  return new Set(Array.from(connectedKeys).filter((connectedKey) => connectedKey !== nodeKey));
}
