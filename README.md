# drsmile-bun-kit

`drsmile-bun-kit` 是一組以 Bun + TypeScript（strict）為核心的工具套件 monorepo。
所有套件都放在 `packages/*`，並以 `@drsmile1001/*` 發佈。

## 這裡有什麼工具

### 核心基礎

- `@drsmile1001/utils`：`Result`、`Disposable`、`AsyncLock` 等基礎工具
- `@drsmile1001/logger`：`LoggerCore + Transport` 結構化日誌
- `@drsmile1001/config-factory`：以 schema 驗證 env/config
- `@drsmile1001/system-time`：可替換的時間服務（真實/測試）

### 應用支援

- `@drsmile1001/service-map`：服務註冊與相依解析
- `@drsmile1001/event-bus`：事件匯流排抽象
- `@drsmile1001/event-bus-nats`：NATS 事件匯流排實作
- `@drsmile1001/plugin-loader`：插件掃描與載入
- `@drsmile1001/scheduler-service`：排程服務抽象與實作
- `@drsmile1001/structured-interpreter`：結構化流程/指令解譯
- `@drsmile1001/dump-writer`：除錯輸出與內容裁切
- `@drsmile1001/app-info`：應用程式 metadata 取得

### 第三方封裝與開發工具

- `@drsmile1001/utils-ky`：`ky` 的實務 helper
- `@drsmile1001/utils-typebox`：`typebox` 的實務 helper
- `@drsmile1001/utils-yaml`：YAML 檔案讀寫 helper
- `@drsmile1001/testkit`：測試輔助工具
- `@drsmile1001/devkit-cli`：開發與發佈流程 CLI

## 快速選型

- 要做日誌：用 `@drsmile1001/logger`（看 `packages/logger/README.md`）
- 要做依賴注入：用 `@drsmile1001/service-map`
- 要做事件發布/訂閱：用 `@drsmile1001/event-bus`
- 要做測試基礎設施：用 `@drsmile1001/testkit`
- 要處理 env schema：用 `@drsmile1001/config-factory`

## 開發命令

```bash
bun install
bun run format
bun run format:check
bun run typecheck
bun test
```

單一套件驗證範例：

```bash
bun run --filter '@drsmile1001/service-map' typecheck
bun test packages/service-map/test
```

## 開發與發佈規範

本 repo 的詳細開發流程、程式碼規範與手動發佈步驟，請看 `AGENTS.md`。

## License

MIT
