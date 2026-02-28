import { describe, expect, test } from "bun:test";

import { ServiceMapBuilder } from "../src/ServiceMapBuilder";

describe("ServiceMapBuilder", () => {
  test("build resolves sync and async registrations", async () => {
    const map = await ServiceMapBuilder.create<{
      a: number;
      b: number;
      c: number;
    }>()
      .register("a", 1)
      .register("b", async () => 2)
      .register("c", async ({ a, b }) => a + (await b))
      .build();

    expect(map.a).toBe(1);
    expect(map.b).toBe(2);
    expect(map.c).toBe(3);
  });
});
