import { describe, expect, test } from "bun:test";

import { Type as t } from "@sinclair/typebox";

import { buildConfigFactoryEnv, envBoolean } from "@drsmile1001/config-factory";
import { dispose } from "@drsmile1001/utils/Disposable";

import { ConsoleTransport } from "../src/ConsoleTransport";
import { DiscordWebhookTransport } from "../src/DiscordWebhookTransport";
import { LoggerCore } from "../src/LoggerCore";
import { MemoryTransport } from "../src/MemoryTransport";
import { RfsTransport } from "../src/RfsTransport";
import { captureConsole } from "./helpers/captureConsole";

const getLoggerTestConfig = buildConfigFactoryEnv(
  t.Object({
    TEST_LOGGER_DISCORD_WEBHOOK_URL: t.Optional(t.String()),
    TEST_SKIP_DISCORD_WEBHOOK_TEST: t.Optional(envBoolean()),
  })
);

const { TEST_SKIP_DISCORD_WEBHOOK_TEST, TEST_LOGGER_DISCORD_WEBHOOK_URL } =
  getLoggerTestConfig();

const emojiMap = {
  start: "🏁",
  done: "✅",
  info: "ℹ️",
  error: "❌",
  warn: "⚠️",
  debug: "🐛",
};

function buildLogger(
  level: "debug" | "info" | "warn" | "error" | "devlog" = "debug"
) {
  const logger = new LoggerCore({ level });
  logger.attachTransport(
    new ConsoleTransport({
      levelFloor: "debug",
      emojiMap,
      withEmoji: true,
      withColor: false,
      withContext: "inline",
    })
  );
  return logger;
}

describe("LoggerCore + ConsoleTransport", () => {
  test("emoji 覆蓋與 event fallback 行為", () => {
    const logger = buildLogger("debug");
    const { output } = captureConsole(() => {
      logger.info({ event: "start", emoji: "🌟", userId: "abc" }, "啟動");
      logger.info({ event: "start" }, "同步開始");
      logger.info({}, "預設 info emoji");
    });

    expect(output).toContain("🌟");
    expect(output).toContain("start: 啟動");
    expect(output).toContain('"userId":"abc"');
    expect(output).toContain("🏁");
    expect(output).toContain("同步開始");
    expect(output).toContain("ℹ️");
    expect(output).toContain("預設 info emoji");
  });

  test("extend / append / template 仍可產生預期 record", () => {
    const logger = buildLogger("debug");
    const memory = new MemoryTransport();
    logger.attachTransport(memory);

    const scoped = logger
      .extend("base", { traceId: "t-1" })
      .append({ reqId: "r-1" });
    scoped.info({ event: "done", count: 10 })`完成 ${10} 項任務`;

    expect(memory.records).toHaveLength(1);
    expect(memory.records[0]).toMatchObject({
      path: ["base"],
      event: "done",
      ctx: {
        traceId: "t-1",
        reqId: "r-1",
        count: 10,
        __0: 10,
      },
    });
  });

  test("error 會帶 stack 並傳遞到 transport", () => {
    const logger = buildLogger("debug");
    const memory = new MemoryTransport();
    logger.attachTransport(memory);

    const { errorOutput } = captureConsole(() => {
      logger.error("錯誤測試");
    });

    expect(errorOutput).toContain("錯誤測試");
    expect(memory.records[0]?.err?.stack).toBeDefined();
  });

  test("可搭配 RfsTransport 寫入檔案", async () => {
    const logger = buildLogger("debug");
    const transport = new RfsTransport({
      filename: "test.log",
      rfs: {
        path: "logs",
      },
    });
    logger.attachTransport(transport);

    logger.info({ event: "start", userId: "abc" }, "啟動");
    logger.error({ error: new Error("爆炸了"), event: "error" }, "錯誤");

    await dispose(transport);
    const fs = Bun.file("logs/test.log");
    const text = await fs.text();

    expect(text).toContain('"level":"info"');
    expect(text).toContain('"event":"start"');
    expect(text).toContain('"msg":"啟動"');
    expect(text).toContain('"userId":"abc"');
    expect(text).toContain('"level":"error"');
    expect(text).toContain('"event":"error"');
    expect(text).toContain('"msg":"錯誤"');

    await fs.delete();
  });

  test.skipIf(TEST_SKIP_DISCORD_WEBHOOK_TEST ?? true)(
    "可搭配 DiscordWebhookTransport 發送 error 以上事件",
    async () => {
      if (!TEST_LOGGER_DISCORD_WEBHOOK_URL) {
        throw new Error("TEST_LOGGER_DISCORD_WEBHOOK_URL not set");
      }

      const logger = buildLogger("debug");
      const transport = new DiscordWebhookTransport({
        webhookUrl: TEST_LOGGER_DISCORD_WEBHOOK_URL,
        levelFloor: "error",
      });
      logger.attachTransport(transport);

      logger.info({ event: "start" }, "不應送出");
      logger.error({ event: "error", error: new Error("爆炸了") }, "應送出");

      await dispose(transport);
    }
  );
});
