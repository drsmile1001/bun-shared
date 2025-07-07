import type { Logger } from "~shared/Logger";
import type { ServiceMap, ServiceResolver } from "~shared/ServiceContainer";
import type { Result } from "~shared/utils/Result";
import type { MaybePromise } from "~shared/utils/TypeHelper";

export interface PluginManager {
  load(type: string): Promise<void>;
  dispose(): Promise<void>;
}

export type LoadedPlugin = {
  name: string;
  dispose?: () => MaybePromise<void>;
};

export type PluginInitializer<TServices extends ServiceMap> = (
  logger: Logger,
  container: ServiceResolver<TServices>
) => MaybePromise<Result<LoadedPlugin, "SKIP" | "ERROR">>;
