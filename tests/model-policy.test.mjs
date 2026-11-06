import assert from "node:assert/strict";
import { test } from "node:test";
import extension from "../src/index.ts";

function createHarness() {
  const handlers = new Map();
  extension({
    on(name, handler) {
      assert.equal(handlers.has(name), false);
      handlers.set(name, handler);
      return () => handlers.delete(name);
    },
  });
  assert.deepEqual([...handlers.keys()], ["tool_call"]);
  return (event, model) => handlers.get("tool_call")(event, { model });
}

test("preserves an explicit model and every other input field", () => {
  const handle = createHarness();
  const input = { model: "openai/explicit-model", task: "Example task", background: true };
  const original = structuredClone(input);
  const event = { toolName: "Agent", input };
  assert.equal(handle(event, { provider: "anthropic", id: "parent-model" }), undefined);
  assert.equal(event.input, input);
  assert.deepEqual(input, original);
});

test("defaults Anthropic Agent calls to Haiku in place", () => {
  const handle = createHarness();
  const input = { task: "Example task", subagent_type: "Explore" };
  const event = { toolName: "Agent", input };
  assert.equal(handle(event, { provider: "anthropic", id: "claude-sonnet-4-5" }), undefined);
  assert.equal(event.input, input);
  assert.deepEqual(input, {
    task: "Example task",
    subagent_type: "Explore",
    model: "anthropic/claude-haiku-4-5",
  });
});

for (const provider of ["openai", "example-provider"]) {
  test(`inherits the parent provider and model for ${provider}`, () => {
    const handle = createHarness();
    const input = { task: "Example task" };
    handle({ toolName: "Agent", input }, { provider, id: "parent/model-id" });
    assert.deepEqual(input, { task: "Example task", model: `${provider}/parent/model-id` });
  });
}

test("does not fill a model without a parent model", () => {
  const handle = createHarness();
  const input = { task: "Example task" };
  handle({ toolName: "Agent", input }, undefined);
  assert.deepEqual(input, { task: "Example task" });
});

test("does not fill a non-Anthropic model when the parent ID is missing", () => {
  const handle = createHarness();
  const input = { task: "Example task" };
  handle({ toolName: "Agent", input }, { provider: "example-provider" });
  assert.deepEqual(input, { task: "Example task" });
});

test("Anthropic selection needs only the provider, not a parent ID", () => {
  const handle = createHarness();
  const input = {};
  handle({ toolName: "Agent", input }, { provider: "anthropic" });
  assert.deepEqual(input, { model: "anthropic/claude-haiku-4-5" });
});

test("missing or null Agent input is ignored", () => {
  const handle = createHarness();
  for (const input of [undefined, null]) {
    const event = { toolName: "Agent", input };
    assert.equal(handle(event, { provider: "anthropic", id: "parent-model" }), undefined);
    assert.equal(event.input, input);
  }
});

test("an empty explicit model is treated as missing", () => {
  const handle = createHarness();
  const input = { model: "", task: "Example task" };
  handle({ toolName: "Agent", input }, { provider: "anthropic", id: "parent-model" });
  assert.deepEqual(input, { model: "anthropic/claude-haiku-4-5", task: "Example task" });
});

test("unrelated tools, workflows, and differently cased names are ignored", () => {
  const handle = createHarness();
  for (const toolName of ["bash", "read", "SubagentWorkflow", "agent"]) {
    const input = { task: "Example task" };
    const event = { toolName, input };
    assert.equal(handle(event, { provider: "anthropic", id: "parent-model" }), undefined);
    assert.equal(event.input, input);
    assert.deepEqual(input, { task: "Example task" });
  }
});
