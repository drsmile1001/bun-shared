import { describe, expect, test } from "bun:test";

import { ConsoleTransport } from "../src/ConsoleTransport";
import type { LogRecord } from "../src/Logger";
import { captureConsole } from "./helpers/captureConsole";

function rec(partial: Partial<LogRecord>): LogRecord {
  return {
    ts: Date.now(),
    level: "info",
    path: ["svc"],
    msg: "hello",
    ...partial,
  };
}

describe("ConsoleTransport", () => {
  test("會依 levelFloor 過濾輸出層級", () => {
    const transport = new ConsoleTransport({
      levelFloor: "info",
      withColor: false,
      withEmoji: false,
    });

    const { output } = captureConsole(() => {
      transport.write(rec({ level: "debug", msg: "dbg" }));
      transport.write(rec({ level: "info", msg: "inf" }));
    });

    expect(output).toContain("inf");
    expect(output).not.toContain("dbg");
  });

  test("可輸出 inline context 與 error stack", () => {
    const transport = new ConsoleTransport({
      withColor: false,
      withEmoji: false,
      withContext: "inline",
      levelFloor: "debug",
    });

    const { errorOutput } = captureConsole(() => {
      transport.write(
        rec({
          level: "error",
          event: "failed",
          msg: "boom",
          ctx: { a: 1 },
          err: {
            name: "Error",
            message: "x",
            stack: "STACK_LINE",
          },
        })
      );
    });

    expect(errorOutput).toContain("failed");
    expect(errorOutput).toContain('"a":1');
    expect(errorOutput).toContain("STACK_LINE");
  });
});
