import { describe, expect, test } from "bun:test";

import { LoggerConsole, emojiMapDefault } from "@drsmile1001/logger";
import { isOk } from "@drsmile1001/utils/Result";

import { ServiceContainerDefault } from "../src/ServiceContainerDefault";

describe("ServiceContainerDefault", () => {
  test("build resolves factories with dependencies", async () => {
    const logger = new LoggerConsole(
      "error",
      [],
      {},
      emojiMapDefault,
      false,
      false,
      false
    );
    const container = ServiceContainerDefault.create<{
      a: number;
      b: number;
      sum: number;
    }>(logger);

    container.register("a", 1);
    container.register("b", 2);
    container.register("sum", ["a", "b"], ({ a, b }) => a + b);

    const result = await container.build();
    expect(isOk(result)).toBe(true);
    expect(container.resolve("sum")).toBe(3);
  });
});
