# @drsmile1001/logger

`@drsmile1001/logger` 提供以 `LoggerCore + Transport` 為核心的結構化日誌工具。

## 安裝

```bash
bun add @drsmile1001/logger
```

## 快速開始

```ts
import { ConsoleTransport, LoggerCore } from "@drsmile1001/logger";

const logger = new LoggerCore({ level: "info" });
logger.attachTransport(
  new ConsoleTransport({
    levelFloor: "debug",
    withEmoji: true,
    withColor: true,
    withContext: "inline",
  })
);

logger.info({ event: "start", userId: "u1" }, "啟動");
logger.extend("worker").warn("任務耗時偏高");
logger.error({ error: new Error("boom") }, "處理失敗");
```

## 核心概念

- `LoggerCore`：負責 level、namespace 與 context 判斷
- `LogTransport`：負責輸出，支援同時掛多個 transport
- `extend(namespace)`：建立子 logger，形成 `path` 階層
- `append(context)`：附加共用 context

## 常用 API

- `new LoggerCore(options)`
  - `level?: LogLevel`（預設 `"info"`）
  - `path?: string[]`
  - `context?: LoggerContext`
  - `allowNamespaces?: string[]`
  - `allowLevel?: LogLevel`（預設 `"info"`）
  - `blockNamespaces?: string[]`
  - `blockLevel?: LogLevel`（預設 `"warn"`）
- `logger.attachTransport(transport)`
- `logger.listTransports()`
- `await logger.flushTransports()`

## 預設 logger（讀取環境變數）

```ts
import { createDefaultLoggerFromEnv } from "@drsmile1001/logger";

const logger = createDefaultLoggerFromEnv();
logger.info("hello");
```

支援的 env：

- `LOG_LEVEL`：LoggerCore 全域門檻（預設 `info`）
- `LOG_CONSOLE_LEVEL`：ConsoleTransport 門檻（預設 `debug`）
- `LOG_ALLOW_NAMESPACE`：allow prefix 清單（`,` 分隔）
- `LOG_ALLOW_LEVEL`：allow 觸發門檻（預設 `info`）
- `LOG_BLOCK_NAMESPACE`：block prefix 清單（`,` 分隔）
- `LOG_BLOCK_LEVEL`：block 觸發門檻（預設 `warn`）
- `LOG_WITH_CONTEXT`：`inline` 或 `object`

## Namespace 過濾規則

- `allow` 優先於 `block`
- namespace 以 prefix 比對（不解析 `*`）
- 建議 prefix 以 `:` 結尾，例如：`"nats:"`、`"svc:worker:"`
- 若未以 `:` 結尾，初始化時會印出警告（避免匹配範圍過大）

## Breaking Change

主要破壞性變更是 `LoggerConsole` 移除，對外改為 `LoggerCore + Transport` 組合：

- `LoggerConsole` 不再 export
- `createDefaultLoggerFromEnv()` 回傳 `LoggerCore`（內部已附加 `ConsoleTransport`）
- 若原本直接 `new LoggerConsole(...)`，需改為 `new LoggerCore(...)` 並手動 `attachTransport(...)`

遷移範例：

```ts
// before
// import { LoggerConsole } from "@drsmile1001/logger";
// const logger = new LoggerConsole("info", [], {}, emojiMap, true, true, "inline");
// after
import { ConsoleTransport, LoggerCore } from "@drsmile1001/logger";

const logger = new LoggerCore({ level: "info" });
logger.attachTransport(
  new ConsoleTransport({
    levelFloor: "debug",
    withEmoji: true,
    withColor: true,
    withContext: "inline",
  })
);
```
