import { getNodeDefine, getNodeTitle } from "../graph/accessors";
import type { FieldMapping } from "../graph/fieldMapping";
import type { DagNode, NodeKey } from "../graph/types";
import { sanitizeNodeLabel } from "../graph/selectors";

export function getNodeVisual(
  nodeKey: NodeKey,
  node: DagNode & { synthetic?: boolean },
  mapping: FieldMapping,
  minNodeWidth: number,
  maxNodeWidth: number,
  showDetail: boolean,
  alignToMaxWidth = false,
): { title: string; detail: string; width: number } {
  if (node.synthetic) {
    const syntheticTitle = getNodeTitle(node, mapping) || "Selected roots";
    return {
      title: syntheticTitle,
      detail: showDetail ? "Combined entry point for every detected root branch." : "",
      width: alignToMaxWidth ? maxNodeWidth : clamp(232, minNodeWidth, maxNodeWidth),
    };
  }

  const title = sanitizeNodeLabel(getNodeTitle(node, mapping) || nodeKey);
  const detail = showDetail ? getNodeDetail(node, title, mapping) : "";
  const longestLine = Math.max(title.length, detail.length * 0.76);
  const width = alignToMaxWidth ? maxNodeWidth : clamp(132 + longestLine * 6.1, minNodeWidth, maxNodeWidth);
  return { title: title || nodeKey, detail, width };
}

export function getNodeDetail(node: DagNode, fallbackTitle: string, mapping: FieldMapping): string {
  const defineText = stripRichText(getNodeDefine(node, mapping));
  return firstMeaningfulSegment(defineText) || fallbackTitle;
}

export function stripRichText(text: unknown): string {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$\n]+\$/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/<img[^>]*>/gi, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#|-]/g, " ")
    .replace(/\bhttps?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstMeaningfulSegment(text: string): string {
  if (!text) {
    return "";
  }
  const segments = text
    .split(/[.?!:;]\s+|\s{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments.find((segment) => /[A-Za-z\u4e00-\u9fff]/.test(segment)) || "";
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}...`;
}

export function truncateTitleToWidth(text: string, nodeWidth: number): string {
  const availableWidth = Math.max(nodeWidth - 74, 72);
  const estimatedMaxLength = Math.max(10, Math.floor(availableWidth / 7.1));
  return truncate(text, estimatedMaxLength);
}

export function wrapDetailText(text: string, maxLineLength: number, maxLines: number): string[] {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [""];
  }

  const lines: string[] = [];
  let remaining = normalized;
  while (remaining && lines.length < maxLines) {
    if (remaining.length <= maxLineLength) {
      lines.push(remaining);
      remaining = "";
      break;
    }

    const candidate = remaining.slice(0, maxLineLength + 1);
    let breakAt = candidate.lastIndexOf(" ");
    if (breakAt < Math.floor(maxLineLength * 0.5)) {
      breakAt = maxLineLength;
    }
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }

  if (remaining) {
    const availableLength = Math.max(maxLineLength - 3, 1);
    const lastLine = lines[lines.length - 1] || "";
    const truncatedLine = lastLine.length > availableLength ? lastLine.slice(0, availableLength).trimEnd() : lastLine;
    lines[lines.length - 1] = `${truncatedLine}...`;
  }

  return lines.slice(0, maxLines);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
