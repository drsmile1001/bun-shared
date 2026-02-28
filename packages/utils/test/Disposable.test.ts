import { describe, expect, test } from "bun:test";

import { callDispose, dispose, isDisposable } from "../src/Disposable";

describe("Disposable", () => {
  test("dispose supports dispose method", async () => {
    let called = 0;
    await dispose({
      dispose: async () => {
        called++;
      },
    });
    expect(called).toBe(1);
  });

  test("dispose supports symbol dispose methods", async () => {
    let a = 0;
    let b = 0;

    await dispose({
      [Symbol.dispose]: async () => {
        a++;
      },
    });

    await dispose({
      [Symbol.asyncDispose]: async () => {
        b++;
      },
    });

    expect(a).toBe(1);
    expect(b).toBe(1);
  });

  test("dispose supports finalize", async () => {
    let called = 0;
    await dispose({
      finalize: async () => {
        called++;
      },
    });
    expect(called).toBe(1);
  });

  test("callDispose and isDisposable", async () => {
    const no = { name: "plain" };
    expect(isDisposable(no)).toBe(false);
    expect(await callDispose(no)).toBe(false);

    let called = 0;
    const yes = {
      dispose: async () => {
        called++;
      },
    };
    expect(isDisposable(yes)).toBe(true);
    expect(await callDispose(yes)).toBe(true);
    expect(called).toBe(1);
  });
});
