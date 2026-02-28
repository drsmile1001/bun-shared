import { describe, expect, test } from "bun:test";

import { LoggerCore } from "@drsmile1001/logger";

import { DumpWriterDefault } from "../src/DumpWriterDefault";

describe("DumpWriterDefault", () => {
  test("printableContent truncates over 30 lines", () => {
    const logger = new LoggerCore({ level: "error" });
    const writer = new DumpWriterDefault(logger);
    const input = { rows: Array.from({ length: 40 }, (_, i) => i + 1) };

    const output = writer.printableContent(input);

    expect(output).toContain("... (共");
  });
});
