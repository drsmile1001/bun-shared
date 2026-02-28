import { describe, expect, test } from "bun:test";

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { withContext } from "@drsmile1001/testkit";

import { getAppInfo } from "../src/AppInfo";

describe("AppInfo", () => {
  test(
    "getAppInfo returns ok for valid package.json",
    withContext(
      async () => {
        const dir = await mkdtemp(join(tmpdir(), "app-info-test-"));
        const prev = process.cwd();
        process.chdir(dir);
        return {
          dir,
          prev,
          async finalize() {
            process.chdir(prev);
            await rm(dir, { recursive: true, force: true });
          },
        };
      },
      async ({ dir }) => {
        await writeFile(
          join(dir, "package.json"),
          JSON.stringify(
            {
              name: "demo",
              version: "1.0.0",
              description: "desc",
            },
            null,
            2
          )
        );

        const result = await getAppInfo();
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toEqual({
            name: "demo",
            version: "1.0.0",
            description: "desc",
          });
        }
      }
    )
  );

  test(
    "getAppInfo returns err when required fields are missing",
    withContext(
      async () => {
        const dir = await mkdtemp(join(tmpdir(), "app-info-test-"));
        const prev = process.cwd();
        process.chdir(dir);
        return {
          dir,
          prev,
          async finalize() {
            process.chdir(prev);
            await rm(dir, { recursive: true, force: true });
          },
        };
      },
      async ({ dir }) => {
        await writeFile(
          join(dir, "package.json"),
          JSON.stringify(
            {
              name: "demo",
              version: "1.0.0",
            },
            null,
            2
          )
        );

        const result = await getAppInfo();
        expect(result.ok).toBe(false);
      }
    )
  );
});
