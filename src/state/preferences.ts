import type { GraphLayoutMode, GraphMode, GraphTheme } from "../graph/types";
import { DEFAULT_GRAPH_THEME } from "../graph/types";
import { getDefaultFieldMapping, sanitizeFieldMapping, type FieldMapping } from "../graph/fieldMapping";

const GRAPH_PAGE_PREFERENCES_KEY = "dag-studio:page-preferences";

export interface GraphPagePreferences {
  mode: GraphMode;
  layoutMode: GraphLayoutMode;
  theme: GraphTheme;
  showNodeDetail: boolean;
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
    theme: DEFAULT_GRAPH_THEME,
    showNodeDetail: true,
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
    theme?: unknown;
    showNodeDetail?: unknown;
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
  if (parsed.theme && typeof parsed.theme === "object" && !Array.isArray(parsed.theme)) {
    next.theme = sanitizeGraphTheme(parsed.theme);
  }
  if (typeof parsed.showNodeDetail === "boolean") {
    next.showNodeDetail = parsed.showNodeDetail;
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

function sanitizeGraphTheme(input: object): GraphTheme {
  const record = input as Record<string, unknown>;
  const minNodeWidth = clampNumericPreference(record.minNodeWidth, DEFAULT_GRAPH_THEME.minNodeWidth, 140, 260);
  const maxNodeWidth = clampNumericPreference(record.maxNodeWidth, DEFAULT_GRAPH_THEME.maxNodeWidth, minNodeWidth, 480);
  return {
    stagePaddingX: DEFAULT_GRAPH_THEME.stagePaddingX,
    stagePaddingY: DEFAULT_GRAPH_THEME.stagePaddingY,
    columnGap: clampNumericPreference(record.columnGap, DEFAULT_GRAPH_THEME.columnGap, 48, 260),
    rowGap: clampNumericPreference(record.rowGap, DEFAULT_GRAPH_THEME.rowGap, 4, 140),
    edgeLaneGap: clampNumericPreference(record.edgeLaneGap, DEFAULT_GRAPH_THEME.edgeLaneGap, 4, 96),
    nodeHeight: clampNumericPreference(record.nodeHeight, DEFAULT_GRAPH_THEME.nodeHeight, 44, 160),
    minNodeWidth,
    maxNodeWidth,
  };
}

function clampNumericPreference(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}
