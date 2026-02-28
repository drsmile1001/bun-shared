import { describe, expect, test } from "bun:test";

import { Value } from "@sinclair/typebox/value";

import { describe as describeSchema, enumLiterals } from "../src/TypeboxHelper";

describe("TypeboxHelper", () => {
  test("describe writes schema description", () => {
    const schema = describeSchema(enumLiterals(["A", "B"]), "letters");
    expect(schema.description).toBe("letters");
  });

  test("enumLiterals supports string literal arrays", () => {
    const schema = enumLiterals(["A", "B"]);
    expect(Value.Check(schema, "A")).toBe(true);
    expect(Value.Check(schema, "B")).toBe(true);
    expect(Value.Check(schema, "C")).toBe(false);
  });

  test("enumLiterals supports tuple defs with title/description", () => {
    const schema = enumLiterals("ops", [
      ["EQ", "equal"],
      ["NE", "not equal"],
    ] as const);

    expect(schema.description).toBe("ops");
    expect(Value.Check(schema, "EQ")).toBe(true);
    expect(Value.Check(schema, "NE")).toBe(true);
    expect(Value.Check(schema, "XX")).toBe(false);
  });
});
