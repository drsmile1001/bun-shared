import { describe, expect, test } from "bun:test";

import { AsyncLock } from "../src/AsyncLock";

describe("AsyncLock", () => {
  test("serializes concurrent tasks", async () => {
    const lock = new AsyncLock();
    const output: string[] = [];

    const task = (name: string, waitMs: number) =>
      lock.run(async () => {
        output.push(`${name}:start`);
        await Bun.sleep(waitMs);
        output.push(`${name}:end`);
      });

    await Promise.all([task("A", 30), task("B", 10), task("C", 5)]);

    expect(output).toEqual([
      "A:start",
      "A:end",
      "B:start",
      "B:end",
      "C:start",
      "C:end",
    ]);
  });

  test("run(shouldRun, fn) skips when condition false", async () => {
    const lock = new AsyncLock();
    let called = false;

    const result = await lock.run(
      () => false,
      async () => {
        called = true;
        return 42;
      }
    );

    expect(called).toBe(false);
    expect(result).toBeUndefined();
  });
});
