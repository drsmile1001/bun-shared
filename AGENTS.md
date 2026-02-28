# AGENTS.md

本文件提供給在此 repo 工作的 agent（例如 AI coding agents）。
目標是讓代理在不破壞既有慣例下，快速完成修改、驗證與交付。

## Repo 概覽

- 型態：Bun + TypeScript monorepo
- Workspace：`packages/*`
- 主要語言：TypeScript（strict）
- 測試工具：`bun test`
- 發佈策略：以原始碼 `.ts` 發佈，不先編譯打包
- 根目錄關鍵設定：`package.json`、`tsconfig.json`

## 規則檔狀態

目前未找到以下規則檔：

- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`

若未來新增，請把規則同步更新到本文件。

## 常用命令

## 安裝

- `bun install`

## 全域格式化

- `bun run format`

## 全域格式檢查

- `bun run format:check`

## 全域型別檢查

- `bun run typecheck`

說明：

- root script 使用 Bun workspace fan-out
- 各 package 的 `typecheck` 為 `bunx tsc -p tsconfig.json --noEmit`

## 全域測試

- `bun test`

說明：

- 會掃描整個 monorepo 的測試檔
- 不要求每個 package 有獨立 `test` script

## 單一 package 型別檢查

- `bun run --filter '@drsmile1001/<package-name>' typecheck`

例如：

- `bun run --filter '@drsmile1001/service-map' typecheck`
- `bun run --filter '@drsmile1001/plugin-loader' typecheck`

## 單一 package 測試

- `bun test packages/<package-dir>/test`

例如：

- `bun test packages/logger/test`
- `bun test packages/event-bus/test`

## 單一測試檔

- `bun test packages/<package-dir>/test/<name>.test.ts`

例如：

- `bun test packages/service-map/test/ServiceMapBuilder.test.ts`
- `bun test packages/logger/test/LoggerConsole.test.ts`

## 依賴更新

- `bun update`

建議流程：

1. `bun update`
2. `bun run format`
3. `bun run typecheck`
4. `bun test`
5. 再進行 commit

## 手動發佈流程

目前此 repo 採手動逐包發佈，不依賴 CI 自動 publish。

發佈前先在 root 執行：

1. `bun run format:check`
2. `bun run typecheck`
3. `bun test`

每個 package 發佈流程：

1. `cd packages/<package-dir>`
2. `npm pack --dry-run`
3. `npm publish --access public`
4. `npm view @drsmile1001/<package-name> version`

建議發佈順序（依內部相依）：

- 第一批：`utils`、`config-factory`、`logger`、`system-time`、`utils-ky`、`utils-typebox`
- 第二批：`app-info`、`utils-yaml`、`event-bus`、`scheduler-service`、`service-map`、`structured-interpreter`、`testkit`、`devkit-cli`
- 第三批：`dump-writer`、`event-bus-nats`、`plugin-loader`

OTP / MFA 注意事項：

- 可先嘗試同一組 OTP 連續發佈。
- 若遇到 `EOTP`，向使用者索取新 OTP，重試當前 package。
- 若遇到 `E403`（版本已存在），停止並改版號後再發佈。

## 程式碼風格

## 匯入與模組

- 優先使用 ESM import/export
- 型別請用 `import type`
- 內部 package 一律使用 `@drsmile1001/*`
- 同 package 內才用相對路徑 `./`、`../`
- import 分組建議：
  - Bun / 第三方
  - `node:` 內建
  - 內部 workspace package
  - 相對路徑

## 格式化與語法

- 使用雙引號 `"`
- 保留分號 `;`
- 多行結構使用 trailing comma
- 縮排 2 spaces
- 不新增無意義註解，僅在複雜邏輯補必要說明

## TypeScript 慣例

- 以 strict 為前提，避免隱式寬鬆型別
- 專案預設 `noEmit`，勿依賴編譯輸出
- 盡量避免 `any`，必要時縮小範圍
- 對 `undefined` / `null` 做顯式處理
- 可預期錯誤優先用 `Result<T, E>`（`ok/err/isErr`）

## 命名慣例

- 類別：`PascalCase`
- 函式與變數：`camelCase`
- 常數：`UPPER_SNAKE_CASE`（僅全域常數）
- 測試檔：`*.test.ts`
- 避免 typo 命名（例如 `Disposable` 而非 `Disposeable`）

## 錯誤處理與日誌

- 可預期錯誤：回傳 `Result`
- 不可恢復錯誤：`throw new Error(...)`
- 錯誤訊息需包含排查上下文
- 使用 `@drsmile1001/logger` 寫日誌
- 透過 `logger.extend("namespace")` 維持命名空間
- 錯誤日誌請帶 `error` 欄位以保留 stack

## 測試策略

修改單一 package 時，至少執行：

1. 該 package typecheck
2. 該 package 測試（至少關鍵測試檔）
3. 回 root 執行 `bun run format`

若改動公共 API 或核心工具，執行：

1. `bun run format`
2. `bun run typecheck`
3. `bun test`

整合測試注意：

- `packages/event-bus-nats/test/EventBusNats.test.ts` 為整合測試
- 可能因 env 設定被 skip
- 可參考 `packages/testkit/src/TestConfig.ts`

## 套件結構與 metadata

每個 package 原則上包含：

- `package.json`
- `tsconfig.json`
- `index.ts`
- `src/*`
- `test/*`（若有）

`package.json` 需維持：

- `name` 使用 `@drsmile1001/*`
- `exports` 至少包含 `"."`
- `types` 指向 `index.ts`
- `files` 包含 `index.ts` 與 `src`

## 提交與變更管理

- 單一 commit 聚焦單一目的
- commit message 優先描述動機（why）
- 依賴升級與功能改動建議分開提交
- 變更 public API 時，確認引用方是否需要同步調整

## Agent 執行守則

- 先讀現有風格，再做一致性修改
- 不自行引入新工具鏈，除非任務明確要求
- 優先使用 repo 既有命令完成驗證
- 交付前檢查：`bun run format`、`bun run typecheck`、`bun test`
