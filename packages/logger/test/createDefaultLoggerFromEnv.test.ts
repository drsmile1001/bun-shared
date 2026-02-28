import { describe, expect, test } from "bun:test";

import { ConsoleTransport } from "../src/ConsoleTransport";
import { LoggerCore } from "../src/LoggerCore";
import { createDefaultLoggerFromEnv } from "../src/createDefaultLoggerFromEnv";
import { captureConsole } from "./helpers/captureConsole";

function withEnv<T>(
  patch: Partial<
    Record<
      | "LOG_LEVEL"
      | "LOG_CONSOLE_LEVEL"
      | "LOG_ALLOW_LEVEL"
      | "LOG_BLOCK_LEVEL"
      | "LOG_ALLOW_NAMESPACE"
      | "LOG_BLOCK_NAMESPACE"
      | "LOG_WITH_CONTEXT"
      | "NODE_ENV",
      string
    >
  >,
  run: () => T
): T {
  const backup = {
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_CONSOLE_LEVEL: process.env.LOG_CONSOLE_LEVEL,
    LOG_ALLOW_LEVEL: process.env.LOG_ALLOW_LEVEL,
    LOG_BLOCK_LEVEL: process.env.LOG_BLOCK_LEVEL,
    LOG_ALLOW_NAMESPACE: process.env.LOG_ALLOW_NAMESPACE,
    LOG_BLOCK_NAMESPACE: process.env.LOG_BLOCK_NAMESPACE,
    LOG_WITH_CONTEXT: process.env.LOG_WITH_CONTEXT,
    NODE_ENV: process.env.NODE_ENV,
  };
  try {
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
    return run();
  } finally {
    for (const [k, v] of Object.entries(backup)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  }
}

describe("createDefaultLoggerFromEnv", () => {
  test("預設會回傳 LoggerCore 並附加 ConsoleTransport", () => {
    withEnv(
      {
        LOG_LEVEL: undefined,
        LOG_CONSOLE_LEVEL: undefined,
        LOG_ALLOW_LEVEL: undefined,
        LOG_BLOCK_LEVEL: undefined,
        LOG_ALLOW_NAMESPACE: undefined,
        LOG_BLOCK_NAMESPACE: undefined,
        LOG_WITH_CONTEXT: undefined,
        NODE_ENV: "development",
      },
      () => {
        const logger = createDefaultLoggerFromEnv();

        expect(logger).toBeInstanceOf(LoggerCore);
        expect(logger.level).toBe("info");
        const transports = logger.listTransports();
        expect(transports).toHaveLength(1);
        expect(transports[0]).toBeInstanceOf(ConsoleTransport);
      }
    );
  });

  test("LOG_LEVEL=debug 且 LOG_CONSOLE_LEVEL=devlog 時，info 近似靜默但 devlog 會輸出", () => {
    withEnv(
      {
        LOG_LEVEL: "debug",
        LOG_CONSOLE_LEVEL: "devlog",
        LOG_ALLOW_LEVEL: undefined,
        LOG_BLOCK_LEVEL: undefined,
        LOG_ALLOW_NAMESPACE: undefined,
        LOG_BLOCK_NAMESPACE: undefined,
        LOG_WITH_CONTEXT: "inline",
        NODE_ENV: "development",
      },
      () => {
        const logger = createDefaultLoggerFromEnv();
        const { output } = captureConsole(() => {
          logger.info("info-message");
          logger.log("dev-message");
        });

        expect(output).not.toContain("info-message");
        expect(output).toContain("dev-message");
      }
    );
  });

  test("LOG_CONSOLE_LEVEL 非法值會回退到 debug", () => {
    withEnv(
      {
        LOG_LEVEL: "debug",
        LOG_CONSOLE_LEVEL: "invalid",
        LOG_ALLOW_LEVEL: undefined,
        LOG_BLOCK_LEVEL: undefined,
        LOG_ALLOW_NAMESPACE: undefined,
        LOG_BLOCK_NAMESPACE: undefined,
        NODE_ENV: "development",
      },
      () => {
        const { output } = captureConsole(() => {
          const logger = createDefaultLoggerFromEnv();
          logger.debug("debug-message");
        });

        expect(output).toContain("LOG_CONSOLE_LEVEL 設定無效");
        expect(output).toContain("debug-message");
      }
    );
  });

  test("namespace allow/block 與 level 組合可控制輸出", () => {
    withEnv(
      {
        LOG_LEVEL: "warn",
        LOG_CONSOLE_LEVEL: "debug",
        LOG_ALLOW_NAMESPACE: "ooo-service:",
        LOG_ALLOW_LEVEL: "info",
        LOG_BLOCK_NAMESPACE: "nats:",
        LOG_BLOCK_LEVEL: "warn",
        NODE_ENV: "development",
      },
      () => {
        const logger = createDefaultLoggerFromEnv();
        const allowed = logger.extend("ooo-service").extend("worker");
        const blocked = logger.extend("nats").extend("consume");

        const { output } = captureConsole(() => {
          allowed.info("allowed-info");
          blocked.info("blocked-info");
          logger.info("root-info-by-log-level");
        });

        expect(output).toContain("allowed-info");
        expect(output).not.toContain("blocked-info");
        expect(output).not.toContain("root-info-by-log-level");
      }
    );
  });

  test("namespace 未以冒號結尾時會 warning", () => {
    withEnv(
      {
        LOG_ALLOW_NAMESPACE: "svc",
        LOG_BLOCK_NAMESPACE: "sql",
        NODE_ENV: "development",
      },
      () => {
        const { output } = captureConsole(() => {
          createDefaultLoggerFromEnv();
        });
        expect(output).toContain("LOG_ALLOW_NAMESPACE 包含");
        expect(output).toContain("LOG_BLOCK_NAMESPACE 包含");
      }
    );
  });
});
