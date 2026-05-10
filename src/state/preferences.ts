import type { GraphLayoutMode, GraphMode } from "../graph/types";
import { getDefaultFieldMapping, sanitizeFieldMapping, type FieldMapping } from "../graph/fieldMapping";

const GRAPH_PAGE_PREFERENCES_KEY = "dag-studio:page-preferences";

export interface GraphPagePreferences {
  mode: GraphMode;
  layoutMode: GraphLayoutMode;
  consoleSidebarOpen: boolean;
  consoleSidebarWidth: number;
  fieldMapping: FieldMapping;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function getInitialGraphPagePreferences(): GraphPagePreferences {
  return {
    mode: "preview",
    layoutMode: "sugiyama",
    consoleSidebarOpen: false,
    consoleSidebarWidth: 360,
    fieldMapping: getDefaultFieldMapping(),
  };
}

export function loadGraphPagePreferences(storage: StorageLike | null = getBrowserStorage()): GraphPagePreferences {
  const defaults = getInitialGraphPagePreferences();
  if (!storage) {
    return defaults;
  }

  try {
    const parsed = parseGraphPagePreferences(storage.getItem(GRAPH_PAGE_PREFERENCES_KEY));
    return parsed ? { ...defaults, ...parsed } : defaults;
  } catch {
    return defaults;
  }
}

export function saveGraphPagePreferences(
  preferences: GraphPagePreferences,
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(GRAPH_PAGE_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage write failures so the page still works in private or locked-down contexts.
  }
}

export function parseGraphPagePreferences(raw: string | null): Partial<GraphPagePreferences> | null {
  if (!raw) {
    return null;
  }

  let parsed: {
    mode?: unknown;
    layoutMode?: unknown;
    consoleSidebarOpen?: unknown;
    consoleSidebarWidth?: unknown;
    fieldMapping?: unknown;
  } | null;
  try {
    parsed = JSON.parse(raw) as { mode?: unknown; layoutMode?: unknown } | null;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const next: Partial<GraphPagePreferences> = {};
  if (parsed.mode === "preview" || parsed.mode === "edit") {
    next.mode = parsed.mode;
  }
  if (parsed.layoutMode === "level" || parsed.layoutMode === "sugiyama" || parsed.layoutMode === "dagre") {
    next.layoutMode = parsed.layoutMode;
  }
  if (typeof parsed.consoleSidebarOpen === "boolean") {
    next.consoleSidebarOpen = parsed.consoleSidebarOpen;
  }
  if (typeof parsed.consoleSidebarWidth === "number" && Number.isFinite(parsed.consoleSidebarWidth)) {
    next.consoleSidebarWidth = clampConsoleSidebarWidth(parsed.consoleSidebarWidth);
  }
  if (parsed.fieldMapping && typeof parsed.fieldMapping === "object" && !Array.isArray(parsed.fieldMapping)) {
    next.fieldMapping = sanitizeFieldMapping(parsed.fieldMapping);
  }

  return Object.keys(next).length ? next : null;
}

export function clampConsoleSidebarWidth(width: number): number {
  return Math.max(280, Math.min(680, Math.round(width)));
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}
