# @drsmile/lib

Bun + TypeScript 的共享函式庫 monorepo（workspace: `packages/*`）。

## 開發環境

- Bun（建議使用最新穩定版）
- TypeScript strict mode

## 安裝

```bash
bun install
```

## 常用命令

```bash
# 全 repo 格式化
bun run format

# 全 repo 格式檢查
bun run format:check

# 全 workspace 型別檢查
bun run typecheck

# 全 repo 測試
bun test

# 指定 package 型別檢查
bun run --filter '@drsmile1001/service-map' typecheck

# 單一 package 測試
bun test packages/service-map/test

# 單一測試檔
bun test packages/service-map/test/ServiceMapBuilder.test.ts

# 升級第三方依賴
bun update
```

## 開發流程

- 本 monorepo 的格式化由 root 統一管理
- 修改 `packages/*` 任一檔案後，請回 root 執行：
  - `bun run format`
  - `bun run typecheck`
  - `bun test`（視改動範圍可先跑關鍵測試）

## 手動發佈流程

目前採用手動逐包發佈（不依賴 CI 自動 publish）。

- 發佈前，先在 root 執行：
  - `bun run format:check`
  - `bun run typecheck`
  - `bun test`
- 每個 package 發佈模板：
  - `cd packages/<package-dir>`
  - `npm pack --dry-run`
  - `npm publish --access public`
  - `npm view @drsmile1001/<package-name> version`

建議發佈順序（依內部相依）：

- 第一批：`utils`、`config-factory`、`logger`、`system-time`、`utils-ky`、`utils-typebox`
- 第二批：`app-info`、`utils-yaml`、`event-bus`、`scheduler-service`、`service-map`、`structured-interpreter`、`testkit`、`devkit-cli`
- 第三批：`dump-writer`、`event-bus-nats`、`plugin-loader`

OTP / MFA 實務：

- 可先使用同一組 OTP 連續嘗試。
- 若遇到 `EOTP`，更新 OTP 後重試當前 package 即可。

## 套件結構

- 所有套件位於 `packages/*`
- 每個 package 以 `index.ts` + `src/*` 為主
- 以原始 TypeScript 發佈（不預編譯打包）

## Agent 指南

請參考 `AGENTS.md` 取得完整開發規範、命令與驗證流程。
