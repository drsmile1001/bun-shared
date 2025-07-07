import { exists, readdir } from "fs/promises";
import { join } from "path";

import type { Logger } from "~shared/Logger";
import type { ServiceMap, ServiceResolver } from "~shared/ServiceContainer";
import { isOk } from "~shared/utils/Result";

import type {
  LoadedPlugin,
  PluginInitializer,
  PluginManager,
} from "./PluginManager";

export class PluginManagerDefault<TServices extends ServiceMap>
  implements PluginManager
{
  private readonly plugins: LoadedPlugin[] = [];
  private readonly logger: Logger;
  private readonly pluginDir: string;
  private readonly resolver: ServiceResolver<TServices>;
  constructor(
    logger: Logger,
    resolver: ServiceResolver<TServices>,
    options: { pluginDir: string }
  ) {
    this.logger = logger.extend("PluginManagerDefault", {
      emoji: "🔌",
      pluginDir: options.pluginDir,
    });
    this.resolver = resolver;
    this.pluginDir = options.pluginDir;
  }

  async load(type: string): Promise<void> {
    const logger = this.logger.extend("load", {
      type,
    });
    const pluginDir = join(this.pluginDir, type);
    logger.info()`開始載入插件類型：${type}，目錄：${pluginDir}`;
    try {
      const dirExist = await exists(pluginDir);
      if (!dirExist) {
        logger.warn()`插件目錄 ${pluginDir} 不存在，跳過載入`;
        return;
      }
      const entries = await readdir(pluginDir, { withFileTypes: true });
      const plugins: LoadedPlugin[] = [];
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;

        const fileName = entry.name;
        const filePath = join(pluginDir, fileName);
        const fileLogger = logger.extend("pluginFile", {
          emoji: "📄",
          filePath,
          fileName,
        });
        fileLogger.info()`找到檔案：${fileName}，開始載入`;
        try {
          const mod = await import(filePath);

          if (typeof mod.initialize !== "function") {
            fileLogger.warn()`檔案 ${fileName} 沒有導出 initialize()，跳過`;
            continue;
          }
          fileLogger.info({
            event: "execute",
          })`執行 initialize() from ${fileName}`;
          const result = await (mod.initialize as PluginInitializer<TServices>)(
            this.logger,
            this.resolver
          );
          if (!result) {
            fileLogger.warn()`initialize() from ${fileName} 沒有返回任何東西，跳過`;
            continue;
          }
          if (isOk(result)) {
            plugins.push(result.value);
            fileLogger.info({
              event: "success",
            })`插件 ${fileName}:${result.value.name} 載入成功`;
          } else if (result.error === "SKIP") {
            fileLogger.info({
              event: "skip",
            })`插件 ${fileName} 被跳過`;
          } else {
            fileLogger.error()`插件 ${fileName} 載入失敗`;
          }
        } catch (error) {
          fileLogger.error({
            error,
          })`載入插件 ${fileName} 時發生錯誤`;
        }
      }

      logger.info({
        event: "done",
      })`從 ${pluginDir} 載入插件完成，共 ${plugins.length} 個插件`;
      this.plugins.push(...plugins);
    } catch (error) {
      logger.error({
        error,
      })`載入插件類型 ${type} 時發生錯誤`;
    }
  }

  async dispose(): Promise<void> {
    for (const plugin of this.plugins) {
      try {
        if (!plugin.dispose) continue;
        await plugin.dispose();
        this.logger.info({
          event: "dispose",
          plugin: plugin.name,
        })`釋放插件 ${plugin.name} 成功`;
      } catch (error) {
        this.logger.error({
          error,
        })`釋放插件 ${plugin.name} 時發生錯誤`;
      }
    }
  }
}
