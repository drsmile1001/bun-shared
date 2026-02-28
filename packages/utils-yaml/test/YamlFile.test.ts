import { describe, expect, test } from "bun:test";

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { withContext } from "@drsmile1001/testkit";

import { YamlFile } from "../src/YamlFile";

describe("YamlFile", () => {
  test(
    "write then read returns same content",
    withContext(
      async () => {
        const dir = await mkdtemp(join(tmpdir(), "yaml-file-test-"));
        return {
          dir,
          async finalize() {
            await rm(dir, { recursive: true, force: true });
          },
        };
      },
      async ({ dir }) => {
        const filePath = join(dir, "a.yaml");
        const yamlFile = new YamlFile<{ a: number; b: string }>({
          filePath,
          fallback: { a: 0, b: "" },
        });

        await yamlFile.write({ a: 1, b: "x" });
        const readData = await yamlFile.read();

        expect(readData).toEqual({ a: 1, b: "x" });
      }
    )
  );

  test(
    "read returns fallback when file does not exist",
    withContext(
      async () => {
        const dir = await mkdtemp(join(tmpdir(), "yaml-file-test-"));
        return {
          dir,
          async finalize() {
            await rm(dir, { recursive: true, force: true });
          },
        };
      },
      async ({ dir }) => {
        const filePath = join(dir, "missing.yaml");
        const fallback = { enabled: true };
        const yamlFile = new YamlFile<{ enabled: boolean }>({
          filePath,
          fallback,
        });

        const readData = await yamlFile.read();
        expect(readData).toEqual(fallback);
      }
    )
  );
});
