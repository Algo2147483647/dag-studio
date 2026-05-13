import assert from "node:assert/strict";
import {
  canonicalizeGraphForFieldMappingChange,
  getDefaultFieldMapping,
  remapGraphInputToSystemFields,
  remapGraphOutputFromSystemFields,
  sanitizeFieldMapping,
  validateFieldMapping,
} from "../graph/fieldMapping";
import { defineSuite, defineTest } from "./harness";

export const fieldMappingSuite = defineSuite("field-mapping", [
  defineTest("sanitizeFieldMapping falls back when aliases are duplicated or invalid", () => {
    const mapping = sanitizeFieldMapping({
      title: "label",
      define: "label",
      children: "kids",
      parents: "parents",
      type: "",
    });

    assert.deepEqual(mapping, {
      children: "kids",
      parents: "parents",
      define: "label",
      title: "title",
      type: "type",
    });
  }),

  defineTest("remapGraphInputToSystemFields understands display aliases", () => {
    const mapping = {
      ...getDefaultFieldMapping(),
      title: "label",
      define: "description",
      children: "next",
      parents: "prev",
    };

    const remapped = remapGraphInputToSystemFields({
      A: {
        label: "Alpha",
        description: "From alias",
        next: { B: "edge_ab" },
        extra: 1,
      },
    }, mapping) as Record<string, Record<string, unknown>>;

    assert.deepEqual(remapped.A, {
      title: "Alpha",
      define: "From alias",
      children: { B: "edge_ab" },
      extra: 1,
    });
  }),

  defineTest("canonicalizeGraphForFieldMappingChange preserves first defined semantic value", () => {
    const previousMapping = {
      ...getDefaultFieldMapping(),
      title: "label",
      define: "description",
    };
    const nextMapping = {
      ...getDefaultFieldMapping(),
      title: "name",
      define: "summary",
    };

    const canonical = canonicalizeGraphForFieldMappingChange({
      A: {
        label: "Old title",
        name: "New title that should not win",
        description: "Old define",
        summary: "New define that should not win",
      },
    }, previousMapping, nextMapping) as Record<string, Record<string, unknown>>;

    assert.deepEqual(canonical.A, {
      title: "Old title",
      define: "Old define",
    });
  }),

  defineTest("remapGraphOutputFromSystemFields emits display aliases and validateFieldMapping rejects duplicates", () => {
    const mapping = {
      ...getDefaultFieldMapping(),
      title: "label",
      define: "description",
    };

    const exported = remapGraphOutputFromSystemFields({
      A: {
        title: "Alpha",
        define: "Root",
        children: { B: "edge_ab" },
      },
    }, mapping) as Record<string, Record<string, unknown>>;

    assert.deepEqual(exported.A, {
      label: "Alpha",
      description: "Root",
      children: { B: "edge_ab" },
    });
    assert.deepEqual(validateFieldMapping(mapping), { ok: true });
    assert.deepEqual(validateFieldMapping({ ...mapping, type: "label" }), {
      ok: false,
      message: 'Field display name "label" is duplicated.',
    });
  }),
]);
