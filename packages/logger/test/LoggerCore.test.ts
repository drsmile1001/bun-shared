import { describe, expect, test } from "bun:test";

import { LoggerCore } from "../src/LoggerCore";
import { MemoryTransport } from "../src/MemoryTransport";

describe("LoggerCore", () => {
  test("可以 fanout 到所有已附加的 transport", () => {
    const logger = new LoggerCore({ level: "debug" });
    const t1 = new MemoryTransport();
    const t2 = new MemoryTransport();

    logger.attachTransport(t1);
    logger.attachTransport(t2);

    logger.info({ event: "start", userId: "u1" }, "hello");

    expect(t1.records).toHaveLength(1);
    expect(t2.records).toHaveLength(1);
    expect(t1.records[0]).toMatchObject({
      level: "info",
      event: "start",
      msg: "hello",
      ctx: { userId: "u1" },
    });
  });

  test("extend 後會保留 transport 並追加 path/context", () => {
    const logger = new LoggerCore({ level: "debug" });
    const t = new MemoryTransport();
    logger.attachTransport(t);

    const child = logger.extend("svc", { traceId: "t1" });
    child.info({ event: "ok" }, "done");

    expect(t.records).toHaveLength(1);
    expect(t.records[0]).toMatchObject({
      path: ["svc"],
      ctx: { traceId: "t1" },
      event: "ok",
    });
  });

  test("error 未提供 error 物件時仍會建立 err 紀錄", () => {
    const logger = new LoggerCore({ level: "debug" });
    const t = new MemoryTransport();
    logger.attachTransport(t);

    logger.error("boom");

    expect(t.records).toHaveLength(1);
    expect(t.records[0]?.level).toBe("error");
    expect(t.records[0]?.err).toBeDefined();
  });

  test("flushTransports 會關閉並清空已附加的 transport", async () => {
    const logger = new LoggerCore({ level: "debug" });
    const t = new MemoryTransport();
    logger.attachTransport(t);

    await logger.flushTransports();

    expect(t.closed).toBe(true);
    expect(logger.listTransports()).toHaveLength(0);
  });

  test("block namespace 命中且 level 小於等於 blockLevel 時會被阻擋", () => {
    const logger = new LoggerCore({
      level: "debug",
      path: ["nats", "consume"],
      blockNamespaces: ["nats:consume"],
      blockLevel: "warn",
    });
    const t = new MemoryTransport();
    logger.attachTransport(t);

    logger.info("info-should-block");
    logger.error("error-should-pass");

    expect(t.records).toHaveLength(1);
    expect(t.records[0]?.level).toBe("error");
  });

  test("allow namespace 命中且 level 大於等於 allowLevel 時可繞過全域 LOG_LEVEL", () => {
    const logger = new LoggerCore({
      level: "warn",
      path: ["ooo-service", "worker"],
      allowNamespaces: ["ooo-service:"],
      allowLevel: "info",
    });
    const t = new MemoryTransport();
    logger.attachTransport(t);

    logger.info("info-allowed");
    logger.debug("debug-not-allowed");

    expect(t.records).toHaveLength(1);
    expect(t.records[0]?.level).toBe("info");
  });

  test("allow 與 block 同時命中時 allow 優先", () => {
    const logger = new LoggerCore({
      level: "warn",
      path: ["svc", "x"],
      allowNamespaces: ["svc:"],
      blockNamespaces: ["svc:"],
      allowLevel: "info",
      blockLevel: "warn",
    });
    const t = new MemoryTransport();
    logger.attachTransport(t);

    logger.info("info-should-pass-by-allow");

    expect(t.records).toHaveLength(1);
    expect(t.records[0]?.msg).toBe("info-should-pass-by-allow");
  });
});
