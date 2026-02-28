import { describe, expect, test } from "bun:test";

import { expectToThrow } from "../src/ExpectToThrow";

describe("expectToThrow", () => {
  test("captures thrown async error", async () => {
    const error = await expectToThrow<Error>(async () => {
      throw new Error("boom");
    });

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe("boom");
  });
});
