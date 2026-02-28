import { describe, expect, test } from "bun:test";

import {
  BadRequestHTTPError,
  buildParams,
  tryGetErrorCode,
} from "../src/KyHelper";

describe("KyHelper", () => {
  test("buildParams filters empty values and supports arrays", () => {
    const params = buildParams({
      q: "hello",
      page: 2,
      enabled: true,
      empty: "",
      nil: null,
      undef: undefined,
      tags: ["a", "b"],
    });

    expect(params.get("q")).toBe("hello");
    expect(params.get("page")).toBe("2");
    expect(params.get("enabled")).toBe("true");
    expect(params.getAll("tags")).toEqual(["a", "b"]);
    expect(params.has("empty")).toBe(false);
    expect(params.has("nil")).toBe(false);
    expect(params.has("undef")).toBe(false);
  });

  test("tryGetErrorCode returns code from HTTPError response", async () => {
    const response = new Response(JSON.stringify("E_BAD"), {
      headers: {
        "content-type": "application/json",
      },
      status: 400,
    });
    const request = new Request("https://example.com");
    const error = new BadRequestHTTPError(
      response,
      request,
      {} as any,
      "E_BAD"
    );

    await expect(tryGetErrorCode(error)).resolves.toBe("E_BAD");
    await expect(tryGetErrorCode(new Error("x"))).resolves.toBeUndefined();
  });
});
