import {
  ConsoleTransport,
  LoggerCore,
  emojiMapDefault,
} from "@drsmile1001/logger";

import { getTestConfig } from "./TestConfig";

export function buildTestLogger() {
  const { TEST_LOGGER_LEVEL, TEST_LOG_WITH_CONTEXT } = getTestConfig();
  const logger = new LoggerCore({ level: TEST_LOGGER_LEVEL });
  logger.attachTransport(
    new ConsoleTransport({
      levelFloor: "debug",
      emojiMap: emojiMapDefault,
      withEmoji: true,
      withColor: true,
      withContext: TEST_LOG_WITH_CONTEXT,
    })
  );
  return logger;
}
