export const MAPPABLE_SYSTEM_FIELD_KEYS = ["children", "parents", "define", "title", "type"] as const;

export type MappableSystemFieldKey = typeof MAPPABLE_SYSTEM_FIELD_KEYS[number];

export type FieldMapping = Record<MappableSystemFieldKey, string>;

const MAPPABLE_FIELD_SET = new Set<string>(MAPPABLE_SYSTEM_FIELD_KEYS);

export function getDefaultFieldMapping(): FieldMapping {
  return {
    children: "children",
    parents: "parents",
    define: "define",
    title: "title",
    type: "type",
  };
}

export function sanitizeFieldMapping(input: unknown): FieldMapping {
  const defaults = getDefaultFieldMapping();
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return defaults;
  }

  const candidate = input as Partial<Record<MappableSystemFieldKey, unknown>>;
  const next: FieldMapping = { ...defaults };
  const usedValues = new Set<string>();

  MAPPABLE_SYSTEM_FIELD_KEYS.forEach((systemKey) => {
    const rawValue = candidate[systemKey];
    const trimmedValue = typeof rawValue === "string" ? rawValue.trim() : "";
    const finalValue = trimmedValue && !usedValues.has(trimmedValue) ? trimmedValue : defaults[systemKey];
    next[systemKey] = finalValue;
    usedValues.add(finalValue);
  });

  return next;
}

export function validateFieldMapping(mapping: FieldMapping): { ok: true } | { ok: false; message: string } {
  const usedValues = new Set<string>();

  for (const systemKey of MAPPABLE_SYSTEM_FIELD_KEYS) {
    const displayName = String(mapping[systemKey] || "").trim();
    if (!displayName) {
      return { ok: false, message: `Field display name for "${systemKey}" cannot be empty.` };
    }
    if (usedValues.has(displayName)) {
      return { ok: false, message: `Field display name "${displayName}" is duplicated.` };
    }
    usedValues.add(displayName);
  }

  return { ok: true };
}

export function getDisplayFieldName(fieldName: string, mapping: FieldMapping): string {
  return isMappableSystemFieldKey(fieldName) ? mapping[fieldName] : fieldName;
}

export function getMappedFieldName(mapping: FieldMapping, fieldName: MappableSystemFieldKey): string {
  return mapping[fieldName];
}

export function getSemanticFieldName(fieldName: string, mapping: FieldMapping): MappableSystemFieldKey | null {
  for (const systemKey of MAPPABLE_SYSTEM_FIELD_KEYS) {
    if (mapping[systemKey] === fieldName) {
      return systemKey;
    }
  }
  return isMappableSystemFieldKey(fieldName) ? fieldName : null;
}

export function formatMappedFieldLabel(fieldName: string, mapping: FieldMapping): string {
  const semanticFieldName = getSemanticFieldName(fieldName, mapping);
  if (!semanticFieldName) {
    return fieldName;
  }
  const mappedFieldName = mapping[semanticFieldName];
  return mappedFieldName === semanticFieldName
    ? mappedFieldName
    : `${mappedFieldName} (${semanticFieldName})`;
}

export function isMappableSystemFieldKey(fieldName: string): fieldName is MappableSystemFieldKey {
  return MAPPABLE_FIELD_SET.has(fieldName);
}

export function remapGraphInputToSystemFields(input: unknown, _mapping: FieldMapping): unknown {
  return input;
}

export function remapGraphOutputFromSystemFields(input: unknown, _mapping: FieldMapping): unknown {
  return input;
}

export function canonicalizeGraphForFieldMappingChange(
  input: unknown,
  _previousMapping: FieldMapping,
  _nextMapping: FieldMapping,
): unknown {
  return input;
}

export function remapNodeInput(input: unknown, _mapping: FieldMapping): unknown {
  return input;
}

export function remapNodeOutput(input: unknown, _mapping: FieldMapping): unknown {
  return input;
}
