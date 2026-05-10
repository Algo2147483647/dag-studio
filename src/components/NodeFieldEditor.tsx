import type { NodeKey } from "../graph/types";
import { getDisplayFieldName, type FieldMapping } from "../graph/fieldMapping";
import { getRelationKeys, normalizeRelationField } from "../graph/relations";
import { parseRelationInput } from "./RelationEditorModal";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export type FieldEditorKind = "plainText" | "multilineText" | "json" | "relation";

export interface EditableField {
  name: string;
  displayName: string;
  value: unknown;
  editorKind: FieldEditorKind;
  locked?: boolean;
}

interface NodeFieldEditorProps {
  field: EditableField;
  mode: "preview" | "edit";
  value: string;
  showMarkdown: boolean;
  onChange: (value: string) => void;
}

export default function NodeFieldEditor({ field, mode, value, showMarkdown, onChange }: NodeFieldEditorProps) {
  if (mode === "preview") {
    return <FieldPreview name={field.name} displayName={field.displayName} value={field.value} showMarkdown={showMarkdown} />;
  }

  if (field.name === "key") {
    return <input className="node-detail-editor node-detail-editor--input" type="text" spellCheck={false} value={value} onChange={(event) => onChange(event.target.value)} />;
  }

  return (
    <div className="node-detail-editor-wrap">
      <textarea
        className="node-detail-editor node-detail-editor--textarea"
        rows={getEditorRows(field)}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {showMarkdown && supportsMarkdown(field) ? <MarkdownValue value={value} previewSurface /> : null}
      {getEditorHint(field) ? <p className="node-detail-editor-hint">{getEditorHint(field)}</p> : null}
    </div>
  );
}

function FieldPreview({ name, displayName, value, showMarkdown }: { name: string; displayName: string; value: unknown; showMarkdown: boolean }) {
  if (name === "parents" || name === "children") {
    const relationKeys = getRelationKeys(value);
    if (!relationKeys.length) {
      return <p className="node-detail-empty">No {displayName} linked.</p>;
    }
    return (
      <div className="node-detail-chip-list">
        {relationKeys.map((relationKey) => <span key={relationKey} className="node-detail-chip">{relationKey}</span>)}
      </div>
    );
  }

  if (showMarkdown && typeof value === "string") {
    return <MarkdownValue value={value} emphasize={name === "define"} />;
  }

  if (name === "define") {
    return <p className="node-detail-text node-detail-text--define">{String(value || "").trim() || "(empty string)"}</p>;
  }

  if (value === null || value === undefined) {
    return <p className="node-detail-empty">(empty)</p>;
  }

  if (typeof value === "string") {
    return <p className="node-detail-text">{value.trim() || "(empty string)"}</p>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <p className="node-detail-text">{String(value)}</p>;
  }

  if (Array.isArray(value) && value.every((item) => ["string", "number", "boolean"].includes(typeof item))) {
    return (
      <div className="node-detail-chip-list">
        {value.length ? value.map((item, index) => <span key={`${String(item)}-${index}`} className="node-detail-chip">{String(item)}</span>) : <span className="node-detail-chip">(empty)</span>}
      </div>
    );
  }

  return <pre className="node-detail-pre">{JSON.stringify(value, null, 2)}</pre>;
}

function MarkdownValue({ value, emphasize = false, previewSurface = false }: { value: string; emphasize?: boolean; previewSurface?: boolean }) {
  if (!value.trim()) {
    return <p className="node-detail-empty">(empty string)</p>;
  }

  return (
    <div
      className={[
        "node-detail-markdown",
        emphasize ? "node-detail-markdown--define" : "",
        previewSurface ? "node-detail-markdown--preview" : "",
      ].filter(Boolean).join(" ")}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {value}
      </ReactMarkdown>
    </div>
  );
}

export function buildEditableFields(nodeKey: NodeKey, node: Record<string, unknown>, fieldMapping: FieldMapping): EditableField[] {
  const clonedNode = { ...node };
  if (clonedNode.key === nodeKey) {
    delete clonedNode.key;
  }
  return [
    { name: "key", displayName: "key", value: nodeKey, editorKind: "plainText" },
    ...Object.entries(clonedNode).map(([name, value]) => ({
      name,
      displayName: getDisplayFieldName(name, fieldMapping),
      value,
      editorKind: inferEditorKind(name, value),
    })),
  ];
}

export function formatEditorValue(field: EditableField): string {
  if (field.name === "parents" || field.name === "children") {
    return JSON.stringify(normalizeRelationField(field.value), null, 2);
  }
  if (typeof field.value === "string") {
    return field.value;
  }
  if (typeof field.value === "number" || typeof field.value === "boolean") {
    return String(field.value);
  }
  return JSON.stringify(field.value, null, 2);
}

export function supportsMarkdown(field: EditableField): boolean {
  return field.name !== "key"
    && typeof field.value === "string"
    && (field.editorKind === "plainText" || field.editorKind === "multilineText");
}

export function parseNodeFieldValue(field: EditableField, rawValue: string): { ok: true; value: unknown } | { ok: false; message: string } {
  const text = String(rawValue || "");
  const trimmed = text.trim();

  if (field.name === "parents" || field.name === "children") {
    if (!trimmed) {
      return { ok: true, value: {} };
    }
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return parseJsonEditorValue(field.name, trimmed);
    }
    return { ok: true, value: parseRelationInput(trimmed) };
  }

  if (field.editorKind === "plainText" || field.editorKind === "multilineText") {
    return { ok: true, value: text };
  }

  if (typeof field.value === "number") {
    const nextNumber = Number(trimmed);
    if (!trimmed || !Number.isFinite(nextNumber)) {
      return { ok: false, message: `Field "${field.displayName}" must be a valid number.` };
    }
    return { ok: true, value: nextNumber };
  }

  if (typeof field.value === "boolean") {
    if (/^true$/i.test(trimmed)) {
      return { ok: true, value: true };
    }
    if (/^false$/i.test(trimmed)) {
      return { ok: true, value: false };
    }
    return { ok: false, message: `Field "${field.displayName}" must be true or false.` };
  }

  return parseJsonEditorValue(field.displayName, trimmed || "null");
}

function parseJsonEditorValue(fieldName: string, rawJson: string): { ok: true; value: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(rawJson) };
  } catch {
    return { ok: false, message: `Field "${fieldName}" contains invalid JSON.` };
  }
}

function inferEditorKind(name: string, value: unknown): FieldEditorKind {
  if (name === "parents" || name === "children") {
    return "relation";
  }
  if (name === "define" || typeof value === "string" && value.length > 80) {
    return "multilineText";
  }
  if (typeof value === "string") {
    return "plainText";
  }
  return "json";
}

function getEditorRows(field: EditableField): number {
  if (field.name === "define") {
    return 8;
  }
  if (field.name === "parents" || field.name === "children") {
    return 5;
  }
  if (field.editorKind === "json") {
    return 6;
  }
  return 3;
}

function getEditorHint(field: EditableField): string {
  if (field.name === "parents" || field.name === "children") {
    return "Use a JSON object, a JSON array, or one key per line.";
  }
  if (field.editorKind === "json") {
    return "Enter valid JSON.";
  }
  if (typeof field.value === "boolean") {
    return "Use true or false.";
  }
  return "";
}
