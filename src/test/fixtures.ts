import { normalizeDagInput } from "../graph/normalize";
import type { NormalizedDag } from "../graph/types";

export function createSampleDag(): NormalizedDag {
  return normalizeDagInput({
    A: {
      title: "Alpha",
      define: "Root node",
      children: {
        B: "edge_ab",
        C: "edge_ac",
      },
    },
    B: {
      title: "Beta",
      define: "Child B",
      children: {
        D: "edge_bd",
      },
    },
    C: {
      title: "Gamma",
      define: "Child C",
    },
    D: {
      title: "Delta",
      define: "Leaf D",
      meta: { priority: 1 },
    },
  });
}

export function createForestDag(): NormalizedDag {
  return normalizeDagInput({
    Left: { define: "Left root" },
    Right: { define: "Right root" },
  });
}
