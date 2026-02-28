import { Type as t } from "@sinclair/typebox";

import type { Logger } from "@drsmile1001/logger";
import type { EmptyMap, ServiceMap } from "@drsmile1001/service-map";
import { type Result } from "@drsmile1001/utils/Result";
import type { MaybePromise } from "@drsmile1001/utils/TypeHelper";

export type Plugin<TServiceMap extends ServiceMap = EmptyMap> = {
  name: string;
  init: (
    logger: Logger,
    serviceMap: TServiceMap
  ) => MaybePromise<Result<void, "SKIP" | "ERROR">>;
  dispose?: () => MaybePromise<void>;
};

export function definePlugin<TServiceMap extends ServiceMap = EmptyMap>(
  plugin: Plugin<TServiceMap>
): Plugin<TServiceMap> {
  return plugin;
}

export const pluginSchema = t.Object({
  name: t.String(),
  init: t.Function([t.Optional(t.Any()), t.Optional(t.Any())], t.Any()),
  dispose: t.Optional(t.Function([], t.Any())),
});
