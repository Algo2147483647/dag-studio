import assert from "node:assert/strict";
import {
  createInitialAiHarnessState,
  createPlanFromAiResponse,
  createTurnId,
  installPlan,
  referencesPreviousWork,
  validateCommandBatch,
} from "../ai/harness";
import { buildAiHarnessStorageKey, parsePersistedAiHarnessState } from "../ai/persistence";
import { getDefaultFieldMapping } from "../graph/fieldMapping";
import { createSampleDag } from "./fixtures";
import { defineSuite, defineTest } from "./harness";

export const aiHarnessSuite = defineSuite("ai harness", [
  defineTest("detects requests that should continue a previous plan", () => {
    assert.equal(referencesPreviousWork("Based on your previous analysis, complete the changes."), true);
    assert.equal(referencesPreviousWork("基于你刚才的分析完成修改"), true);
    assert.equal(referencesPreviousWork("What does Group mean?"), false);
  }),

  defineTest("creates an active plan with a pending command batch from proposed changes", () => {
    const harness = createInitialAiHarnessState("review");
    const turnId = createTurnId();
    const plan = createPlanFromAiResponse({
      harness,
      turnId,
      userMessage: "Improve the group theory chain.",
      response: {
        kind: "propose_changes",
        answer: "I will add core group-theory concepts.",
        plan: {
          title: "Group theory chain cleanup",
          goal: "Add missing intermediate concepts.",
          affectedNodes: ["Group"],
          changes: [
            {
              kind: "add_node",
              target: { nodeId: "Subgroup" },
              rationale: "Subgroups are a core construction in group theory.",
              draftCommands: [
                "/add Subgroup -p Group",
                "/set Subgroup title \"Subgroup\"",
              ],
              risk: "medium",
            },
          ],
        },
      },
    });
    const next = installPlan(harness, plan, turnId);
    assert.equal(next.activePlan?.title, "Group theory chain cleanup");
    assert.deepEqual(next.pendingCommandBatch?.commands, [
      "/add Subgroup -p Group",
      "/set Subgroup title \"Subgroup\"",
    ]);
  }),

  defineTest("validates command batches before execution and reports risk", () => {
    const harness = createInitialAiHarnessState("review");
    const turnId = createTurnId();
    const plan = createPlanFromAiResponse({
      harness,
      turnId,
      userMessage: "Add a subgroup concept.",
      response: {
        kind: "run_console",
        answer: "Adding Subgroup under Group.",
        commandBatch: {
          commands: [
            "/add Subgroup -p A",
            "/set Subgroup define \"A subset that forms a group under the inherited operation.\"",
          ],
        },
      },
    });
    assert.ok(plan.commandBatch);
    const validation = validateCommandBatch({
      batch: plan.commandBatch,
      dag: createSampleDag(),
      contextNodeKey: null,
      mapping: getDefaultFieldMapping(),
      graphRevision: "0",
    });
    assert.equal(validation.allPassed, true);
    assert.equal(validation.riskLevel, "medium");
    assert.match(validation.summary, /Preflight passed/);
    const diffPreview = validation.results.flatMap((result) => result.expectedDiff || []);
    assert.ok(diffPreview.some((line) => line === "+ Node: Subgroup"));
    assert.ok(diffPreview.some((line) => line === "+ Edge: A -> Subgroup"));
  }),

  defineTest("parses persisted harness state with active plan and pending batch", () => {
    const harness = createInitialAiHarnessState("review");
    const turnId = createTurnId();
    const plan = createPlanFromAiResponse({
      harness,
      turnId,
      userMessage: "Add a subgroup concept.",
      response: {
        kind: "run_console",
        answer: "Adding Subgroup under Group.",
        commandBatch: {
          commands: ["/add Subgroup -p A"],
        },
      },
    });
    const next = installPlan(harness, plan, turnId);
    const parsed = parsePersistedAiHarnessState(JSON.stringify(next), "ask");
    assert.ok(parsed);
    assert.equal(parsed.mode, "review");
    assert.equal(parsed.activePlan?.title, plan.title);
    assert.deepEqual(parsed.pendingCommandBatch?.commands, ["/add Subgroup -p A"]);
  }),

  defineTest("builds stable per-graph persistence keys", () => {
    assert.equal(buildAiHarnessStorageKey("example.json"), "dag-studio:ai-harness:example.json");
    assert.equal(buildAiHarnessStorageKey("math graph.json"), "dag-studio:ai-harness:math%20graph.json");
  }),
]);
