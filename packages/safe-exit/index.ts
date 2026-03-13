import type { Logger } from "@drsmile1001/logger";

export function safeExit(
  logger: Logger,
  beforeExit?: () => Promise<void> | void
) {
  let isShuttingDown = false;
  async function exit(signal: string) {
    if (isShuttingDown) {
      logger.warn(`已經在關閉中，忽略重複的 ${signal} 信號。`);
      return;
    }
    isShuttingDown = true;
    logger.info({
      event: "shutdown-start",
      emoji: "📲",
    })`收到關閉信號：${signal}`;
    if (beforeExit) {
      logger.info({
        event: "shutdown-tasks-start",
        emoji: "⏳",
      })`正在執行關閉前的任務...`;
      try {
        await beforeExit();
      } catch (error) {
        logger.error(
          {
            error,
          },
          "在執行關閉前的任務時發生錯誤"
        );
      }
      logger.info({
        event: "shutdown-tasks-complete",
        emoji: "✅",
      })`關閉前的任務已完成`;
    }
    logger.info({
      event: "shutdown-complete",
      emoji: "🛑",
    })`正在退出...`;
    try {
      await logger.flushTransports();
    } catch (error) {
      console.error("寫入日誌時發生錯誤，直接退出", error);
    }
    process.exit(0);
  }
  process.on("SIGINT", () => void exit("SIGINT"));
  process.on("SIGTERM", () => void exit("SIGTERM"));
}
