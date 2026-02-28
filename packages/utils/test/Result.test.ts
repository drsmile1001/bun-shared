import { describe, expect, test } from "bun:test";

import {
  andThen,
  err,
  isErr,
  isOk,
  map,
  ok,
  tryCatch,
  tryCatchAsync,
  unwrap,
  unwrapOr,
} from "../src/Result";

describe("Result", () => {
  test("ok/err and guards", () => {
    const a = ok(123);
    const b = err("E");

    expect(isOk(a)).toBe(true);
    expect(isErr(a)).toBe(false);
    expect(isOk(b)).toBe(false);
    expect(isErr(b)).toBe(true);
  });

  test("unwrap and unwrapOr", () => {
    expect(unwrap(ok("v"))).toBe("v");
    expect(unwrapOr(ok("v"), "fallback")).toBe("v");
    expect(unwrapOr(err("E"), "fallback")).toBe("fallback");
    expect(() => unwrap(err("bad"))).toThrow("無法解包 Result");
  });

  test("map and andThen", () => {
    const mapped = map(ok(2), (v) => v * 3);
    expect(mapped).toEqual(ok(6));

    const chained = andThen(ok(2), (v) => ok(v + 5));
    expect(chained).toEqual(ok(7));

    const keepErr = map(err("X"), (v: number) => v * 3);
    expect(keepErr).toEqual(err("X"));
  });

  test("tryCatch and tryCatchAsync", async () => {
    expect(tryCatch(() => 1 + 1)).toEqual(ok(2));
    expect(tryCatch(() => JSON.parse("x"))).toMatchObject({ ok: false });
    expect(
      tryCatch(
        () => JSON.parse("x"),
        () => "PARSE_ERROR"
      )
    ).toEqual(err("PARSE_ERROR"));

    expect(await tryCatchAsync(async () => 10)).toEqual(ok(10));
    expect(
      await tryCatchAsync(
        async () => {
          throw new Error("E");
        },
        () => "ASYNC_ERROR"
      )
    ).toEqual(err("ASYNC_ERROR"));
  });
});
