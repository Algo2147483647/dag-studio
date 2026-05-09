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

export function remapGraphInputToSystemFields(input: unknown, mapping: FieldMapping): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => remapNodeInput(item, mapping));
  }

  if (!input || typeof input !== "object") {
    return input;
  }

  const objectValue = input as Record<string, unknown>;
  if (Array.isArray(objectValue.nodes)) {
    return {
      ...objectValue,
      nodes: objectValue.nodes.map((item) => remapNodeInput(item, mapping)),
    };
  }

  return Object.fromEntries(
    Object.entries(objectValue).map(([nodeKey, nodeValue]) => [nodeKey, remapNodeInput(nodeValue, mapping)]),
  );
}

export function remapGraphOutputFromSystemFields(input: unknown, mapping: FieldMapping): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => remapNodeOutput(item, mapping));
  }

  if (!input || typeof input !== "object") {
    return input;
  }

  const objectValue = input as Record<string, unknown>;
  if (Array.isArray(objectValue.nodes)) {
    return {
      ...objectValue,
      nodes: objectValue.nodes.map((item) => remapNodeOutput(item, mapping)),
    };
  }

  return Object.fromEntries(
    Object.entries(objectValue).map(([nodeKey, nodeValue]) => [nodeKey, remapNodeOutput(nodeValue, mapping)]),
  );
}

export function remapNodeInput(input: unknown, mapping: FieldMapping): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }

  const reverseMapping = buildReverseFieldMapping(mapping);
  const output: Record<string, unknown> = {};

  Object.entries(input as Record<string, unknown>).forEach(([rawFieldName, fieldValue]) => {
    const systemFieldName = resolveSystemFieldName(rawFieldName, reverseMapping);
    const shouldOverrideExisting = systemFieldName !== rawFieldName;
    if (!shouldOverrideExisting && Object.prototype.hasOwnProperty.call(output, systemFieldName)) {
      return;
    }
    output[systemFieldName] = fieldValue;
  });

  return output;
}

export function remapNodeOutput(input: unknown, mapping: FieldMapping): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }

  const output: Record<string, unknown> = {};
  Object.entries(input as Record<string, unknown>).forEach(([systemFieldName, fieldValue]) => {
    output[getDisplayFieldName(systemFieldName, mapping)] = fieldValue;
  });
  return output;
}

function buildReverseFieldMapping(mapping: FieldMapping): Record<string, MappableSystemFieldKey> {
  const reverseMapping: Partial<Record<string, MappableSystemFieldKey>> = {};

  MAPPABLE_SYSTEM_FIELD_KEYS.forEach((systemKey) => {
    reverseMapping[systemKey] = systemKey;
    reverseMapping[mapping[systemKey]] = systemKey;
  });

  return reverseMapping as Record<string, MappableSystemFieldKey>;
}

function resolveSystemFieldName(
  fieldName: string,
  reverseMapping: Record<string, MappableSystemFieldKey>,
): string {
  if (Object.prototype.hasOwnProperty.call(reverseMapping, fieldName)) {
    return reverseMapping[fieldName];
  }
  return isMappableSystemFieldKey(fieldName) ? fieldName : fieldName;
}

function isMappableSystemFieldKey(fieldName: string): fieldName is MappableSystemFieldKey {
  return MAPPABLE_FIELD_SET.has(fieldName);
}
