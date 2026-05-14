import assert from "node:assert/strict";
import { parseConsoleSource } from "../console/dsl";
import { buildConsoleMutationLabel, collectBatchEffects, executeConsoleInstructions } from "../console/executor";
import { defineSuite, defineTest } from "./harness";
import { createSampleDag } from "./fixtures";

export const consoleSuite = defineSuite("console", [
  defineTest("parser accepts comments, quoted strings, and create-missing edges", () => {
    const parsed = parseConsoleSource([
      "# comment",
      "use A",
      "set . define \"hello world\"",
      "edge . Missing_Node true --create-missing",
    ].join("\n"));

    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }

    assert.equal(parsed.instructions.length, 3);
    assert.deepEqual(parsed.instructions[1], {
      type: "setField",
      key: { type: "context" },
      field: "define",
      value: "hello world",
      line: 3,
    });
    assert.deepEqual(parsed.instructions[2], {
      type: "setEdge",
      parentKey: { type: "context" },
      childKey: { type: "key", value: "Missing_Node" },
      weight: true,
      createMissing: true,
      line: 4,
    });
  }),

  defineTest("parser and executor accept clear inside multiline batches", () => {
    const dag = createSampleDag();
    const parsed = parseConsoleSource([
      "use A",
      "clear",
      "cls",
      "set . type concept",
    ].join("\n"));

    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }

    assert.deepEqual(parsed.instructions.slice(1, 3), [
      { type: "clear", line: 2 },
      { type: "clear", line: 3 },
    ]);

    const executed = executeConsoleInstructions(dag, parsed.instructions, null);
    assert.equal(executed.ok, true);
    if (!executed.ok) {
      return;
    }

    assert.equal(executed.dag.A.type, "concept");
    assert.equal(executed.contextNodeKey, "A");
    assert.equal(executed.instructionCount, 4);
    assert.equal(executed.mutationCount, 1);
  }),

  defineTest("executor applies batch mutations and tracks ui effects", () => {
    const dag = createSampleDag();
    const parsed = parseConsoleSource([
      "use A",
      "add New_Node -p .",
      "set New_Node title \"Created from console\"",
      "json New_Node",
      "mv New_Node Final_Node",
    ].join("\n"));

    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }

    const executed = executeConsoleInstructions(dag, parsed.instructions, null);
    assert.equal(executed.ok, true);
    if (!executed.ok) {
      return;
    }

    assert.ok(executed.dag.Final_Node);
    assert.equal(executed.dag.Final_Node.title, "Created from console");
    assert.equal(executed.contextNodeKey, "A");
    assert.equal(executed.uiEffects.at(-1)?.type, "json");
    assert.equal(executed.mutationCount, 3);

    const batchEffects = collectBatchEffects(executed.results);
    assert.deepEqual(batchEffects.renamedKeys, [{ from: "New_Node", to: "Final_Node" }]);
    assert.equal(buildConsoleMutationLabel(executed.mutationCount, executed.results.at(-1)?.message), "Executed 3 console commands.");
  }),

  defineTest("executor returns line-aware errors when context is missing", () => {
    const parsed = parseConsoleSource("show .");
    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }

    const executed = executeConsoleInstructions(createSampleDag(), parsed.instructions, null);
    assert.equal(executed.ok, false);
    if (executed.ok) {
      return;
    }

    assert.equal(executed.line, 1);
    assert.match(executed.message, /Current context is empty/);
  }),
]);
