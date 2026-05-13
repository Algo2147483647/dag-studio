import assert from "node:assert/strict";
import {
  formatMappedFieldLabel,
  getDisplayFieldName,
  getDefaultFieldMapping,
  getSemanticFieldName,
  sanitizeFieldMapping,
  validateFieldMapping,
} from "../graph/fieldMapping";
import { serializeDag } from "../graph/serialize";
import { defineSuite, defineTest } from "./harness";
import { createCustomFieldMapping, createMappedSampleDag } from "./fixtures";

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

  defineTest("schema helpers resolve semantic names without rewriting raw field names", () => {
    const mapping = createCustomFieldMapping();

    assert.equal(getDisplayFieldName("title", mapping), "label");
    assert.equal(getDisplayFieldName("meta", mapping), "meta");
    assert.equal(getSemanticFieldName("label", mapping), "title");
    assert.equal(getSemanticFieldName("description", mapping), "define");
    assert.equal(getSemanticFieldName("next", mapping), "children");
    assert.equal(getSemanticFieldName("meta", mapping), null);
    assert.equal(formatMappedFieldLabel("label", mapping), "label (title)");
    assert.equal(formatMappedFieldLabel("meta", mapping), "meta");
  }),

  defineTest("serializeDag preserves mapped raw field names", () => {
    const mapping = createCustomFieldMapping();
    const dag = createMappedSampleDag();

    assert.deepEqual(serializeDag(dag, mapping).A, {
      label: "Alpha",
      description: "Root node",
      kind: "root",
      next: {
        B: "edge_ab",
        C: "edge_ac",
      },
    });
  }),

  defineTest("validateFieldMapping accepts unique names and rejects duplicates", () => {
    const mapping = {
      ...getDefaultFieldMapping(),
      title: "label",
      define: "description",
    };

    assert.deepEqual(validateFieldMapping(mapping), { ok: true });
    assert.deepEqual(validateFieldMapping({ ...mapping, type: "label" }), {
      ok: false,
      message: 'Field display name "label" is duplicated.',
    });
  }),
]);
