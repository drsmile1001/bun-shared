import { describe, expect, test } from "bun:test";

import { normalizeDates } from "../src/NormalizeDates";

describe("normalizeDates", () => {
  test("normalizes nested Date values to ISO strings", () => {
    const date = new Date("2024-01-02T03:04:05.000Z");
    const input = {
      at: date,
      list: [1, date],
      obj: {
        at: date,
      },
    };

    const output = normalizeDates(input) as unknown;

    expect(output).toEqual({
      at: "2024-01-02T03:04:05.000Z",
      list: [1, "2024-01-02T03:04:05.000Z"],
      obj: {
        at: "2024-01-02T03:04:05.000Z",
      },
    });
  });
});
