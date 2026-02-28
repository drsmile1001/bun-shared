import { describe, expect, test } from "bun:test";

import { Type as t } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import {
  buildConfigFactoryEnv,
  envBoolean,
  envNumber,
} from "../src/ConfigFactoryEnv";

describe("ConfigFactoryEnv", () => {
  test("envBoolean decodes common true/false values", () => {
    const schema = envBoolean();
    expect(Value.Decode(schema, "true")).toBe(true);
    expect(Value.Decode(schema, "1")).toBe(true);
    expect(Value.Decode(schema, "enabled")).toBe(true);
    expect(Value.Decode(schema, "false")).toBe(false);
  });

  test("envNumber decodes numeric string and throws on invalid", () => {
    const schema = envNumber();
    expect(Value.Decode(schema, "42")).toBe(42);
    expect(() => Value.Decode(schema, "abc")).toThrow("Invalid numeric value");
  });

  test("buildConfigFactoryEnv validates Bun.env", () => {
    const KEY_PORT = "TEST_CF_PORT";
    const KEY_FLAG = "TEST_CF_FLAG";

    const schema = t.Object({
      TEST_CF_PORT: envNumber(),
      TEST_CF_FLAG: envBoolean(),
    });
    const getConfig = buildConfigFactoryEnv(schema);

    const oldPort = Bun.env[KEY_PORT];
    const oldFlag = Bun.env[KEY_FLAG];
    try {
      Bun.env[KEY_PORT] = "3000";
      Bun.env[KEY_FLAG] = "true";
      expect(getConfig()).toEqual({
        TEST_CF_PORT: 3000,
        TEST_CF_FLAG: true,
      });

      Bun.env[KEY_PORT] = "nan";
      expect(() => getConfig()).toThrow("Invalid numeric value");
    } finally {
      if (oldPort === undefined) {
        delete Bun.env[KEY_PORT];
      } else {
        Bun.env[KEY_PORT] = oldPort;
      }
      if (oldFlag === undefined) {
        delete Bun.env[KEY_FLAG];
      } else {
        Bun.env[KEY_FLAG] = oldFlag;
      }
    }
  });
});
