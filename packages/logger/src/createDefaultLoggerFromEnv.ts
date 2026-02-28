import { ConsoleTransport } from "./ConsoleTransport";
import { type LogLevel, logLevelEnum } from "./Logger";
import { LoggerCore } from "./LoggerCore";

export function createDefaultLoggerFromEnv() {
  let LOG_LEVEL = process.env.LOG_LEVEL;
  let LOG_CONSOLE_LEVEL = process.env.LOG_CONSOLE_LEVEL;
  let LOG_ALLOW_LEVEL = process.env.LOG_ALLOW_LEVEL;
  let LOG_BLOCK_LEVEL = process.env.LOG_BLOCK_LEVEL;
  let LOG_ALLOW_NAMESPACE = process.env.LOG_ALLOW_NAMESPACE;
  let LOG_BLOCK_NAMESPACE = process.env.LOG_BLOCK_NAMESPACE;
  let LOG_WITH_CONTEXT = process.env.LOG_WITH_CONTEXT;

  if (!LOG_LEVEL) {
    LOG_LEVEL = "info";
  } else if (!logLevelEnum.includes(LOG_LEVEL as LogLevel)) {
    console.warn(`LOG_LEVEL 設定無效：${LOG_LEVEL}，改用預設值 "info"。`);
    LOG_LEVEL = "info";
  }

  if (LOG_WITH_CONTEXT) {
    if (LOG_WITH_CONTEXT !== "inline" && LOG_WITH_CONTEXT !== "object") {
      console.warn(
        `LOG_WITH_CONTEXT 設定無效：${LOG_WITH_CONTEXT}，改用預設值 "inline"。`
      );
      LOG_WITH_CONTEXT = "inline";
    }
  }

  if (!LOG_CONSOLE_LEVEL) {
    LOG_CONSOLE_LEVEL = "debug";
  } else if (!logLevelEnum.includes(LOG_CONSOLE_LEVEL as LogLevel)) {
    console.warn(
      `LOG_CONSOLE_LEVEL 設定無效：${LOG_CONSOLE_LEVEL}，改用預設值 "debug"。`
    );
    LOG_CONSOLE_LEVEL = "debug";
  }

  if (!LOG_ALLOW_LEVEL) {
    LOG_ALLOW_LEVEL = "info";
  } else if (!logLevelEnum.includes(LOG_ALLOW_LEVEL as LogLevel)) {
    console.warn(
      `LOG_ALLOW_LEVEL 設定無效：${LOG_ALLOW_LEVEL}，改用預設值 "info"。`
    );
    LOG_ALLOW_LEVEL = "info";
  }

  if (!LOG_BLOCK_LEVEL) {
    LOG_BLOCK_LEVEL = "warn";
  } else if (!logLevelEnum.includes(LOG_BLOCK_LEVEL as LogLevel)) {
    console.warn(
      `LOG_BLOCK_LEVEL 設定無效：${LOG_BLOCK_LEVEL}，改用預設值 "warn"。`
    );
    LOG_BLOCK_LEVEL = "warn";
  }

  const allowNamespaces = parseNamespaces(
    LOG_ALLOW_NAMESPACE,
    "LOG_ALLOW_NAMESPACE"
  );
  const blockNamespaces = parseNamespaces(
    LOG_BLOCK_NAMESPACE,
    "LOG_BLOCK_NAMESPACE"
  );

  const notProduction = process.env.NODE_ENV !== "production";
  const logger = new LoggerCore({
    level: LOG_LEVEL as LogLevel,
    allowNamespaces,
    blockNamespaces,
    allowLevel: LOG_ALLOW_LEVEL as LogLevel,
    blockLevel: LOG_BLOCK_LEVEL as LogLevel,
  });
  logger.attachTransport(
    new ConsoleTransport({
      levelFloor: LOG_CONSOLE_LEVEL as LogLevel,
      emojiMap: emojiMapDefault,
      withEmoji: notProduction,
      withColor: notProduction,
      withContext:
        (LOG_WITH_CONTEXT as "inline" | "object" | undefined) ?? false,
    })
  );
  return logger;
}

function parseNamespaces(raw: string | undefined, envName: string): string[] {
  if (!raw) return [];
  const out = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  for (const prefix of out) {
    if (!prefix.endsWith(":")) {
      console.warn(
        `${envName} 包含 "${prefix}"，但未以 ":" 結尾，prefix 比對範圍可能過大。`
      );
    }
  }

  return out;
}

export const emojiMapDefault: Record<string, string> = {
  start: "🏁",
  done: "✅",
  error: "❌",
  retry: "🔁",
  warn: "⚠️ ",
  info: "ℹ️ ",
  trace: "🔍",
  debug: "🐛",
};
