import { describe, expect, test } from "bun:test";

import { withContext } from "../src/TestContextRunner";

describe("TestContextRunner", () => {
  test("calls finalize after success", async () => {
    const calls: string[] = [];
    const run = withContext(
      async () => ({
        value: 1,
        async finalize() {
          calls.push("finalize");
        },
      }),
      async (ctx) => {
        calls.push(`run:${ctx.value}`);
      }
    );

    await run();

    expect(calls).toEqual(["run:1", "finalize"]);
  });

  test("calls finalize even when run throws", async () => {
    const calls: string[] = [];
    const run = withContext(
      async () => ({
        async finalize() {
          calls.push("finalize");
        },
      }),
      async () => {
        calls.push("run");
        throw new Error("boom");
      }
    );

    await expect(run()).rejects.toThrow("boom");
    expect(calls).toEqual(["run", "finalize"]);
  });
});
