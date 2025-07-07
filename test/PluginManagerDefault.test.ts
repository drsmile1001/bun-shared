import { describe, expect, test } from "bun:test";

import { PluginManagerDefault } from "~shared/PluginManager";
import { StaticResolver } from "~shared/ServiceContainer";
import { buildTestLogger } from "~shared/testkit/TestLogger";

describe("PluginManagerDefault", () => {
  test("可以載入插件與釋放插件", async () => {
    const logger = buildTestLogger();
    const message: string[] = [];
    const resolver = new StaticResolver({
      Callback: (msg: string) => {
        message.push(msg);
      },
    });
    const currentDir = import.meta.dir;
    const manager = new PluginManagerDefault<{
      Callback: (message: string) => void;
    }>(logger, resolver, {
      pluginDir: `${currentDir}/fixture/plugins`,
    });
    await manager.load("test");
    expect(message).toContain("Sample plugin initialized");
    await manager.dispose();
    expect(message).toContain("Sample plugin disposed");
  });
});
