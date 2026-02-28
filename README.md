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

## 套件結構

- 所有套件位於 `packages/*`
- 每個 package 以 `index.ts` + `src/*` 為主
- 以原始 TypeScript 發佈（不預編譯打包）

## Agent 指南

請參考 `AGENTS.md` 取得完整開發規範、命令與驗證流程。
