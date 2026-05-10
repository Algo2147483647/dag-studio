import type { GraphTheme, NodeKey } from "../graph/types";
import type { LayoutEdgeRoute, LayoutRoutePoint, StageNode, StageRoutePoint } from "./types";

const SUGIYAMA_CHANNEL_INSET = 12;
const SUGIYAMA_CHANNEL_SPACING = 10;
const SUGIYAMA_CHANNEL_MAX_SPREAD = 44;
const SUGIYAMA_CHANNEL_INTERVAL_GAP = 6;
const EDGE_LANE_PITCH = 10;
const EDGE_NODE_CLEARANCE_Y = 10;

interface SugiyamaLogicalRouteVertex {
  layer: number;
  order: number;
}

interface SugiyamaBoundarySegment {
  edgeId: string;
  upper: SugiyamaLogicalRouteVertex;
  lower: SugiyamaLogicalRouteVertex;
  startY: number;
  endY: number;
}

interface SugiyamaBoundaryBundle {
  bundleKey: string;
  segments: SugiyamaBoundarySegment[];
  startY: number;
  endY: number;
}

export function buildSugiyamaStageRoutes(input: {
  edgeRoutes: Map<string, LayoutEdgeRoute> | undefined;
  nodeMap: Record<NodeKey, StageNode>;
  nodesByLayer: Map<number, StageNode[]>;
  slotCountsByLayer: Map<number, number>;
  stageInnerHeight: number;
  theme: GraphTheme;
  laneCenters: Map<number, number>;
  absoluteOffset?: { x: number; y: number };
}): Map<string, StageRoutePoint[]> {
  const { edgeRoutes, nodeMap, nodesByLayer, slotCountsByLayer, stageInnerHeight, theme, laneCenters, absoluteOffset } = input;
  if (!edgeRoutes?.size) {
    return new Map();
  }

  const layerBounds = buildSugiyamaLayerBounds(nodesByLayer);
  const laneGeometryByLayer = buildLayerLaneGeometry(nodesByLayer, slotCountsByLayer, stageInnerHeight, theme);
  const boundarySegments = new Map<number, SugiyamaBoundarySegment[]>();
  const logicalRoutes = new Map<string, SugiyamaLogicalRouteVertex[]>();

  edgeRoutes.forEach((route, edgeId) => {
    const sourceNode = nodeMap[route.source];
    const targetNode = nodeMap[route.target];
    if (!sourceNode || !targetNode) {
      return;
    }

    const logicalRoute = buildSugiyamaLogicalRoute(route, sourceNode, targetNode);
    logicalRoutes.set(edgeId, logicalRoute);
    for (let index = 0; index < logicalRoute.length - 1; index += 1) {
      const upper = logicalRoute[index];
      const lower = logicalRoute[index + 1];
      if (lower.layer !== upper.layer + 1) {
        continue;
      }
      if (!boundarySegments.has(upper.layer)) {
        boundarySegments.set(upper.layer, []);
      }
      boundarySegments.get(upper.layer)!.push({
        edgeId,
        upper,
        lower,
        startY: getEdgeLaneY(upper.layer, upper.order, slotCountsByLayer, laneGeometryByLayer),
        endY: getEdgeLaneY(lower.layer, lower.order, slotCountsByLayer, laneGeometryByLayer),
      });
    }
  });

  const channelXByBoundary = new Map<number, Map<string, number>>();
  boundarySegments.forEach((segments, boundaryLayer) => {
    channelXByBoundary.set(
      boundaryLayer,
      assignSugiyamaBoundaryChannels(segments, boundaryLayer, layerBounds),
    );
  });

  const stageRoutes = new Map<string, StageRoutePoint[]>();
  logicalRoutes.forEach((logicalRoute, edgeId) => {
    const route = edgeRoutes.get(edgeId);
    const sourceNode = nodeMap[route?.source || ""];
    const targetNode = nodeMap[route?.target || ""];
    if (!route || !sourceNode || !targetNode) {
      return;
    }

    if (logicalRoute.length < 2 || logicalRoute[0].layer >= logicalRoute[logicalRoute.length - 1].layer) {
      stageRoutes.set(
        edgeId,
        route.points.map((point) =>
          getRoutePointPosition(point, laneCenters, slotCountsByLayer, stageInnerHeight, theme, absoluteOffset),
        ),
      );
      return;
    }

    const points: StageRoutePoint[] = [];
    let currentY = sourceNode.y;

    for (let index = 0; index < logicalRoute.length - 1; index += 1) {
      const upper = logicalRoute[index];
      const lower = logicalRoute[index + 1];
      if (lower.layer !== upper.layer + 1) {
        continue;
      }

      const channelX = channelXByBoundary.get(upper.layer)?.get(edgeId);
      if (channelX === undefined) {
        continue;
      }

      points.push({ layer: upper.layer, order: upper.order, x: channelX, y: currentY });
      currentY = getEdgeLaneY(lower.layer, lower.order, slotCountsByLayer, laneGeometryByLayer);
      points.push({ layer: lower.layer, order: lower.order, x: channelX, y: currentY });
    }

    stageRoutes.set(edgeId, simplifyStageRoutePoints(points, sourceNode, targetNode));
  });

  return stageRoutes;
}

function buildSugiyamaLayerBounds(nodesByLayer: Map<number, StageNode[]>): Map<number, { left: number; right: number; center: number }> {
  const bounds = new Map<number, { left: number; right: number; center: number }>();
  nodesByLayer.forEach((nodes, layer) => {
    if (!nodes.length) {
      return;
    }
    const left = Math.min(...nodes.map((node) => node.x - node.width / 2));
    const right = Math.max(...nodes.map((node) => node.x + node.width / 2));
    const center = nodes.reduce((sum, node) => sum + node.x, 0) / nodes.length;
    bounds.set(layer, { left, right, center });
  });
  return bounds;
}

function buildLayerLaneGeometry(
  nodesByLayer: Map<number, StageNode[]>,
  slotCountsByLayer: Map<number, number>,
  stageInnerHeight: number,
  theme: GraphTheme,
): Map<number, Map<number, number>> {
  const stageTop = theme.stagePaddingY;
  const stageBottom = theme.stagePaddingY + stageInnerHeight;
  const laneGeometryByLayer = new Map<number, Map<number, number>>();
  const allLayers = Array.from(new Set([
    ...slotCountsByLayer.keys(),
    ...nodesByLayer.keys(),
  ])).sort((left, right) => left - right);

  allLayers.forEach((layer) => {
    const slotCount = slotCountsByLayer.get(layer) || 1;
    const nodes = (nodesByLayer.get(layer) || []).slice().sort((left, right) => left.order - right.order);
    const orderY = new Map<number, number>();

    if (!nodes.length) {
      const center = stageTop + stageInnerHeight / 2;
      assignCompactLaneBand(orderY, 0, slotCount, center, center, "center");
      laneGeometryByLayer.set(layer, orderY);
      return;
    }

    nodes.forEach((node) => {
      orderY.set(node.order, node.y);
    });

    const firstNode = nodes[0];
    const lastNode = nodes[nodes.length - 1];
    if (firstNode) {
      assignCompactLaneBand(
        orderY,
        0,
        firstNode.order,
        stageTop + EDGE_NODE_CLEARANCE_Y,
        firstNode.y - firstNode.height / 2 - EDGE_NODE_CLEARANCE_Y,
        "end",
      );
    }

    for (let index = 0; index < nodes.length - 1; index += 1) {
      const upperNode = nodes[index];
      const lowerNode = nodes[index + 1];
      const gapCount = lowerNode.order - upperNode.order - 1;
      if (gapCount <= 0) {
        continue;
      }
      assignCompactLaneBand(
        orderY,
        upperNode.order + 1,
        gapCount,
        upperNode.y + upperNode.height / 2 + EDGE_NODE_CLEARANCE_Y,
        lowerNode.y - lowerNode.height / 2 - EDGE_NODE_CLEARANCE_Y,
        "center",
      );
    }

    if (lastNode) {
      assignCompactLaneBand(
        orderY,
        lastNode.order + 1,
        slotCount - lastNode.order - 1,
        lastNode.y + lastNode.height / 2 + EDGE_NODE_CLEARANCE_Y,
        stageBottom - EDGE_NODE_CLEARANCE_Y,
        "start",
      );
    }

    laneGeometryByLayer.set(layer, orderY);
  });

  return laneGeometryByLayer;
}

function buildSugiyamaLogicalRoute(
  route: LayoutEdgeRoute,
  sourceNode: StageNode,
  targetNode: StageNode,
): SugiyamaLogicalRouteVertex[] {
  const intermediate = sourceNode.layer <= targetNode.layer ? route.points : route.points.slice().reverse();
  return [
    { layer: sourceNode.layer, order: sourceNode.order },
    ...intermediate.map((point) => ({ layer: point.layer, order: point.order })),
    { layer: targetNode.layer, order: targetNode.order },
  ];
}

function assignSugiyamaBoundaryChannels(
  segments: SugiyamaBoundarySegment[],
  boundaryLayer: number,
  layerBounds: Map<number, { left: number; right: number; center: number }>,
): Map<string, number> {
  const leftLayer = layerBounds.get(boundaryLayer);
  const rightLayer = layerBounds.get(boundaryLayer + 1);
  const corridorStart = (leftLayer?.right ?? leftLayer?.center ?? 0) + SUGIYAMA_CHANNEL_INSET;
  const corridorEnd = (rightLayer?.left ?? rightLayer?.center ?? corridorStart) - SUGIYAMA_CHANNEL_INSET;
  const corridorWidth = Math.max(corridorEnd - corridorStart, 0);
  const center = corridorStart <= corridorEnd ? (corridorStart + corridorEnd) / 2 : corridorStart;

  const bundles = buildSugiyamaBoundaryBundles(segments);
  const sortedBundles = bundles.slice().sort((left, right) => {
    if (left.startY !== right.startY) {
      return left.startY - right.startY;
    }
    if (left.endY !== right.endY) {
      return left.endY - right.endY;
    }
    return left.bundleKey.localeCompare(right.bundleKey);
  });

  const channelTailY: number[] = [];
  const channelIndexByBundle = new Map<string, number>();
  sortedBundles.forEach((bundle) => {
    let channelIndex = channelTailY.findIndex((tailY) => bundle.startY >= tailY + SUGIYAMA_CHANNEL_INTERVAL_GAP);
    if (channelIndex === -1) {
      channelIndex = channelTailY.length;
      channelTailY.push(bundle.endY);
    } else {
      channelTailY[channelIndex] = bundle.endY;
    }
    channelIndexByBundle.set(bundle.bundleKey, channelIndex);
  });

  const channelCount = Math.max(channelTailY.length, 1);
  const preferredSpread = Math.min(
    (channelCount - 1) * SUGIYAMA_CHANNEL_SPACING,
    SUGIYAMA_CHANNEL_MAX_SPREAD,
    corridorWidth,
  );
  const step = channelCount > 1 ? preferredSpread / (channelCount - 1) : 0;
  const bandStart = center - preferredSpread / 2;
  const xByEdge = new Map<string, number>();

  bundles.forEach((bundle) => {
    const channelIndex = channelIndexByBundle.get(bundle.bundleKey) || 0;
    const x = channelCount === 1 ? center : bandStart + channelIndex * step;
    const snappedX = snapSvgCoordinate(clamp(x, corridorStart, corridorEnd));
    bundle.segments.forEach((segment) => {
      xByEdge.set(segment.edgeId, snappedX);
    });
  });

  return xByEdge;
}

function buildSugiyamaBoundaryBundles(segments: SugiyamaBoundarySegment[]): SugiyamaBoundaryBundle[] {
  const bundlesByKey = new Map<string, SugiyamaBoundaryBundle>();

  segments.forEach((segment) => {
    const bundleKey = `${segment.upper.layer}:${segment.upper.order}`;
    const intervalStart = Math.min(segment.startY, segment.endY);
    const intervalEnd = Math.max(segment.startY, segment.endY);
    const existing = bundlesByKey.get(bundleKey);
    if (existing) {
      existing.segments.push(segment);
      existing.startY = Math.min(existing.startY, intervalStart);
      existing.endY = Math.max(existing.endY, intervalEnd);
      return;
    }

    bundlesByKey.set(bundleKey, {
      bundleKey,
      segments: [segment],
      startY: intervalStart,
      endY: intervalEnd,
    });
  });

  return Array.from(bundlesByKey.values());
}

function getEdgeLaneY(
  layer: number,
  order: number,
  slotCountsByLayer: Map<number, number>,
  laneGeometryByLayer: Map<number, Map<number, number>>,
): number {
  const explicitY = laneGeometryByLayer.get(layer)?.get(order);
  if (explicitY !== undefined) {
    return explicitY;
  }

  const slotCount = slotCountsByLayer.get(layer) || 1;
  const centerOrder = (slotCount - 1) / 2;
  const fallbackCenter = Array.from(laneGeometryByLayer.get(layer)?.values() || [0]).reduce((sum, value, index, list) => {
    return sum + value / Math.max(list.length, 1);
  }, 0);
  return fallbackCenter + (order - centerOrder) * EDGE_LANE_PITCH;
}

function getRoutePointPosition(
  point: LayoutRoutePoint,
  laneCenters: Map<number, number>,
  slotCountsByLayer: Map<number, number>,
  stageInnerHeight: number,
  theme: GraphTheme,
  absoluteOffset?: { x: number; y: number },
): StageRoutePoint {
  if (typeof point.x === "number" && typeof point.y === "number") {
    return {
      layer: point.layer,
      order: point.order,
      x: point.x + (absoluteOffset?.x || 0),
      y: point.y + (absoluteOffset?.y || 0),
    };
  }

  const slotCount = slotCountsByLayer.get(point.layer) || 1;
  const layerHeight = slotCount * theme.nodeHeight + Math.max(slotCount - 1, 0) * theme.rowGap;
  const startY = theme.stagePaddingY + (stageInnerHeight - layerHeight) / 2;
  return {
    layer: point.layer,
    order: point.order,
    x: laneCenters.get(point.layer) || theme.stagePaddingX,
    y: startY + point.order * (theme.nodeHeight + theme.rowGap) + theme.nodeHeight / 2,
  };
}

function simplifyStageRoutePoints(points: StageRoutePoint[], sourceNode: StageNode, targetNode: StageNode): StageRoutePoint[] {
  const simplified: StageRoutePoint[] = [];
  const start = { x: sourceNode.x + sourceNode.width / 2 + 4, y: sourceNode.y };
  const end = { x: targetNode.x - targetNode.width / 2, y: targetNode.y };

  points.forEach((point) => {
    const previous = simplified[simplified.length - 1];
    if (previous && nearlyEqual(previous.x, point.x) && nearlyEqual(previous.y, point.y)) {
      return;
    }
    simplified.push(point);
    while (simplified.length >= 3) {
      const current = simplified[simplified.length - 1];
      const middle = simplified[simplified.length - 2];
      const before = simplified[simplified.length - 3];
      const first = simplified.length === 3 ? start : simplified[simplified.length - 4];
      if (isCollinearOrthogonal(first, before, middle) || isCollinearOrthogonal(before, middle, current)) {
        simplified.splice(simplified.length - 2, 1);
        continue;
      }
      break;
    }
  });

  while (simplified.length && nearlyEqual(simplified[0].x, start.x) && nearlyEqual(simplified[0].y, start.y)) {
    simplified.shift();
  }
  while (simplified.length && nearlyEqual(simplified[simplified.length - 1].x, end.x) && nearlyEqual(simplified[simplified.length - 1].y, end.y)) {
    simplified.pop();
  }

  return simplified.filter((point, index) => {
    const previous = index === 0 ? start : simplified[index - 1];
    const next = index === simplified.length - 1 ? end : simplified[index + 1];
    return !isCollinearOrthogonal(previous, point, next);
  });
}

function isCollinearOrthogonal(
  first: { x: number; y: number },
  middle: { x: number; y: number },
  last: { x: number; y: number },
): boolean {
  return (nearlyEqual(first.x, middle.x) && nearlyEqual(middle.x, last.x))
    || (nearlyEqual(first.y, middle.y) && nearlyEqual(middle.y, last.y));
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.001;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function snapSvgCoordinate(value: number): number {
  return Math.round(value) + 0.5;
}

function assignCompactLaneBand(
  orderY: Map<number, number>,
  startOrder: number,
  count: number,
  availableStart: number,
  availableEnd: number,
  anchor: "start" | "center" | "end",
): void {
  if (count <= 0) {
    return;
  }

  const safeStart = Math.min(availableStart, availableEnd);
  const safeEnd = Math.max(availableStart, availableEnd);
  const availableSpan = Math.max(safeEnd - safeStart, 0);
  const preferredSpread = Math.min((count - 1) * EDGE_LANE_PITCH, availableSpan);

  let bandStart = safeStart;
  if (anchor === "center") {
    bandStart = safeStart + (availableSpan - preferredSpread) / 2;
  } else if (anchor === "end") {
    bandStart = safeEnd - preferredSpread;
  }

  const step = count > 1 ? preferredSpread / (count - 1) : 0;
  for (let index = 0; index < count; index += 1) {
    orderY.set(startOrder + index, bandStart + step * index);
  }
}
